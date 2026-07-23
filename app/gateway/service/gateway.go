package service

import (
	"app/gateway/config"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"pkg/api"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
	connectcors "connectrpc.com/cors"
	"connectrpc.com/grpcreflect"
	"connectrpc.com/vanguard"
	"github.com/rs/cors"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/reflect/protoregistry"
	"google.golang.org/protobuf/types/descriptorpb"

	apiv1 "pkg/api/gen/api/v1"
	"pkg/health"
	"pkg/rpg/store"
	"strings"
	"time"
)

type GatewayService interface {
	AddLocalService(svcPath string, handler http.Handler, opts ...vanguard.ServiceOption) error
	AddProxiedService(svcAddr, svcPath string, protected bool, opts ...vanguard.ServiceOption) error
	AddHandler(path string, h http.Handler)
	Interceptor() connect.UnaryInterceptorFunc

	Start(ctx context.Context) error
	Stop(ctx context.Context) error
}

type gatewayService struct {
	config      *config.Config
	srv         *http.Server
	svcMap      map[string]*vanguard.Service
	handlerMap  map[string]http.Handler
	interceptor *api.BaseInterceptor
	permissions store.PermissionStore
	log         *zap.Logger
	shutdowner  fx.Shutdowner
	live        bool
	ready       bool
}

type GatewayServiceProviderProps struct {
	fx.In

	Config          *config.Config
	PermissionStore store.PermissionStore
	Log             *zap.Logger
	HealthServer    *health.Server
	Shutdowner      fx.Shutdowner
}

func GatewayServiceProvider(lc fx.Lifecycle, props GatewayServiceProviderProps) (GatewayService, error) {
	s := &gatewayService{
		config:      props.Config,
		svcMap:      make(map[string]*vanguard.Service),
		handlerMap:  make(map[string]http.Handler),
		permissions: props.PermissionStore,
		log:         props.Log.Named("gateway-svc"),
		live:        true,
	}

	s.permissions.SetEnforce(props.Config.StoreConfig.Permissions)

	bi := api.NewBaseInterceptor()
	s.interceptor = bi

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			s.shutdowner = props.Shutdowner
			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	props.HealthServer.AddService(s)

	return s, nil
}

func (s *gatewayService) Start(_ context.Context) error {
	s.log.Info("Starting the gateway service", zap.String("address", s.config.Api.Address()))
	serveMux := http.NewServeMux()

	otelMux := otelhttp.NewHandler(serveMux, "gateway",
		otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
			return r.Method + " " + r.URL.Path
		}),
	)

	s.srv = &http.Server{
		Addr:              ":http",
		Handler:           h2c.NewHandler(otelMux, &http2.Server{}),
		ReadHeaderTimeout: 15 * time.Second,
	}

	listener, err := net.Listen("tcp", s.config.Api.Address())
	if err != nil {
		s.log.Error("error creating listener", zap.Error(err))
		return err
	}

	var svcPaths []string
	var services []*vanguard.Service
	for svcPath, svc := range s.svcMap {
		svcPaths = append(svcPaths, svcPath)
		services = append(services, svc)
	}

	if len(svcPaths) == 0 {
		return errors.New("no services to serve")
	}

	handler, err := vanguard.NewTranscoder(services)
	if err != nil {
		s.log.Error("error creating transcoder", zap.Error(err))
		return err
	}

	for path, h := range s.handlerMap {
		serveMux.Handle(path, h)
	}

	serveMux.Handle("/", handler)

	serveMux.Handle(grpcreflect.NewHandlerV1(grpcreflect.NewStaticReflector(svcPaths...)))

	errChan := make(chan error)
	go func(errChan chan error) {
		errChan <- s.srv.Serve(listener)
	}(errChan)

	select {
	case err := <-errChan:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			s.log.Error("error starting http server", zap.Error(err))
			return err
		}
	case <-time.After(100 * time.Millisecond):
		s.log.Info("http server started", zap.Any("addr", s.config.Api.Address()))
	}

	s.ready = true

	return nil
}

func (s *gatewayService) Stop(_ context.Context) error {
	s.log.Info("stopping service")

	s.live = false
	s.ready = false

	return s.srv.Close()
}

func (s *gatewayService) AddLocalService(svcPath string, handler http.Handler, opts ...vanguard.ServiceOption) error {
	svc := vanguard.NewService(
		svcPath,
		s.withCORS(handler),
		vanguard.WithTargetProtocols(vanguard.ProtocolConnect),
		//opts...,
		//connect.WithInterceptors(otelInterceptor),
	)

	s.svcMap[svcPath] = svc

	return nil
}

func (s *gatewayService) AddProxiedService(svcAddr string, svcPath string, protected bool, opts ...vanguard.ServiceOption) error {
	svcProxy := httputil.NewSingleHostReverseProxy(&url.URL{Scheme: "http", Host: svcAddr})

	svcProxy.Transport = otelhttp.NewTransport(h2cIfGRPCTransport{h2c: &http2.Transport{
		AllowHTTP: true,
		DialTLSContext: func(ctx context.Context, network, addr string, _ *tls.Config) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, network, addr)
		},
	}})

	//todo := vanguard.NewServiceWithSchema()

	var handler http.Handler
	if protected {
		//handler = s.withCORS(s.proxyInterceptor(svcPath, svcProxy))
		handler = s.proxyInterceptor(svcPath, svcProxy)
	} else {
		handler = s.withCORS(svcProxy)
	}

	svc := vanguard.NewService(
		svcPath,
		handler,
		vanguard.WithTargetProtocols(vanguard.ProtocolConnect),
		//opts,
	)

	s.svcMap[svcPath] = svc

	return nil
}

func (s *gatewayService) AddHandler(path string, h http.Handler) {
	s.handlerMap[path] = h
}

func (s *gatewayService) Interceptor() connect.UnaryInterceptorFunc {
	return s.interceptor.Interceptor()
}

func (s *gatewayService) interceptorCallback(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
	if !s.ready {
		return nil, connect.NewError(connect.CodeInternal, health.ErrNotReady)
	}

	if !req.Spec().IsClient {
		userID, _ := ctxHelpers.GetContextUserID(ctx)

		methodDescriptor, ok := req.Spec().Schema.(protoreflect.MethodDescriptor)
		if !ok {
			s.log.Error("failed to assert MethodDescriptor type")
			return nil, connect.NewError(connect.CodeInternal, errors.New("failed to assert MethodDescriptor type"))
		}

		methodName := methodDescriptor.FullName()
		s.log.Debug("method", zap.Any("method", methodName))

		serviceDescriptor := methodDescriptor.Parent().(protoreflect.MethodDescriptor)

		s.log.Debug("service", zap.Any("service", serviceDescriptor.FullName()))

		svcOpts := serviceDescriptor.Options().(*descriptorpb.ServiceOptions)

		var permKey string
		if proto.HasExtension(svcOpts, apiv1.E_PermissionKey) {
			ext, permGroupOk := proto.GetExtension(svcOpts, apiv1.E_PermissionKey).(string)
			if !permGroupOk {
				return nil, connect.NewError(connect.CodeInternal, errors.New("failed to assert permission key"))
			}
			permKey = ext
		}

		mOpts := methodDescriptor.Options().(*descriptorpb.MethodOptions)

		if proto.HasExtension(mOpts, apiv1.E_PermissionAllowAll) {
			allowAll, allowAllOk := proto.GetExtension(mOpts, apiv1.E_PermissionAllowAll).(bool)
			if !allowAllOk {
				return nil, connect.NewError(connect.CodeInternal, errors.New("failed to assert permission ability"))
			}
			if allowAll {
				return nil, nil
			}
		}

		var permAbility string
		if proto.HasExtension(mOpts, apiv1.E_PermissionAbility) {
			ext, abilityOk := proto.GetExtension(mOpts, apiv1.E_PermissionAbility).(string)
			if !abilityOk {
				return nil, connect.NewError(connect.CodeInternal, errors.New("failed to assert permission ability"))
			}
			permAbility = ext
		}

		s.log.Debug("permission required", zap.String("key", permKey), zap.Any("ability", permAbility))

		allowed := s.permissions.CheckUserPermissions(ctx, userID, permKey, permAbility)
		if !allowed {
			return nil, connect.NewError(connect.CodePermissionDenied, errors.New("permission denied"))
		}
	}

	return nil, nil
}

func (s *gatewayService) proxyInterceptor(servicePath string, proxy *httputil.ReverseProxy) http.Handler {
	serviceName := strings.TrimSuffix(strings.TrimPrefix(servicePath, "/"), "/")

	desc, err := protoregistry.GlobalFiles.FindDescriptorByName(protoreflect.FullName(serviceName))
	if err != nil {
		panic(fmt.Errorf("could not resolve schema for service at path %q: %w", servicePath, err))
	}

	svcDesc, ok := desc.(protoreflect.ServiceDescriptor)
	if !ok {
		panic(fmt.Errorf("could not assert %T to ServiceDescriptor", desc))
	}

	svcOpts, ok := svcDesc.Options().(*descriptorpb.ServiceOptions)
	if !ok {
		panic(fmt.Errorf("could not assert %T to ServiceOptions", svcDesc.Options()))
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.ready {
			http.Error(w, health.ErrNotReady.Error(), http.StatusServiceUnavailable)
			return
		}

		r.Header.Del(ctxHelpers.XRequestMode)

		userID := r.Header.Get(ctxHelpers.XUserID)
		if userID == "" {
			http.Error(w, "missing user ID", http.StatusUnauthorized)
			return
		}
		s.log.Debug("user ID", zap.String("userID", userID))
		s.log.Debug("url", zap.String("url", r.URL.Path))

		if !s.config.StoreConfig.Permissions {
			proxy.ServeHTTP(w, r)
			return
		}

		var permKey = string(svcDesc.Name())
		if proto.HasExtension(svcOpts, apiv1.E_PermissionKey) {
			ext, permGroupOk := proto.GetExtension(svcOpts, apiv1.E_PermissionKey).(string)
			if permGroupOk {
				permKey = ext
			}
		}

		// get the method which is the last part of the url after /
		urlParts := strings.Split(r.URL.Path, "/")

		// method name is the last url part
		methodName := urlParts[len(urlParts)-1]
		s.log.Debug("method", zap.String("method", methodName))

		// get service descriptor from desc by the method name
		methodDescriptor := svcDesc.Methods().ByName(protoreflect.Name(methodName))

		mOpts := methodDescriptor.Options().(*descriptorpb.MethodOptions)

		if proto.HasExtension(mOpts, apiv1.E_PermissionAllowAll) {
			allowAll, allowAllOk := proto.GetExtension(mOpts, apiv1.E_PermissionAllowAll).(bool)
			if !allowAllOk {
				http.Error(w, "failed to assert permission all", http.StatusInternalServerError)
			}
			if allowAll {
				proxy.ServeHTTP(w, r)
				return
			}
		}

		var permAbility = methodName
		if proto.HasExtension(mOpts, apiv1.E_PermissionAbility) {
			ext, abilityOk := proto.GetExtension(mOpts, apiv1.E_PermissionAbility).(string)
			if abilityOk {
				permAbility = ext
			}
		}

		s.log.Debug("permission required", zap.String("group", permKey), zap.String("ability", permAbility))

		allowed := s.permissions.CheckUserPermissions(r.Context(), userID, permKey, permAbility)
		if !allowed {
			http.Error(w, "permission denied", http.StatusForbidden)
			return
		}

		proxy.ServeHTTP(w, r)
	})
}

// withCORS adds CORS support to a Connect HTTP handler.
func (s *gatewayService) withCORS(connectHandler http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: connectcors.AllowedMethods(),
		AllowedHeaders: connectcors.AllowedHeaders(),
		ExposedHeaders: connectcors.ExposedHeaders(),
		MaxAge:         7200, // 2 hours in seconds
	})
	return c.Handler(connectHandler)
}

func (s *gatewayService) LiveCheck() error {
	if !s.live {
		return health.ErrNotLive
	}
	return nil
}

func (s *gatewayService) ReadyCheck() error {
	if !s.ready {
		return health.ErrNotReady
	}
	return nil
}

// h2cIfGRPCTransport is a round tripper that will use its configured
// h2c transport for requests in the gRPC protocol. It will use
// http.DefaultTransport for other requests.
type h2cIfGRPCTransport struct {
	h2c http.RoundTripper
}

func (h h2cIfGRPCTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	zap.L().Debug("proxy outbound", zap.String("url", request.URL.String()), zap.String("traceparent", request.Header.Get("traceparent")), zap.String("content-type", request.Header.Get("Content-Type")))
	if request.Header.Get("Content-Type") == "application/grpc" ||
		strings.HasPrefix(request.Header.Get("Content-Type"), "application/grpc+") {
		// For gRPC, we must use HTTP/2.
		return h.h2c.RoundTrip(request)
	}
	// Otherwise, we can use HTTP 1.1.
	return http.DefaultTransport.RoundTrip(request)
}
