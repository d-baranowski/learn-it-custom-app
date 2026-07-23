package api

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"pkg/health"
	"time"

	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type Server struct {
	config       *Config
	handlers     map[string]http.Handler
	srv          *http.Server
	Interceptors connect.Option
	log          *zap.Logger
	shutdowner   fx.Shutdowner
	ready        bool
	live         bool
}

type ServerProps struct {
	fx.In

	Config       *Config
	HealthServer *health.Server
	Log          *zap.Logger
}

func ServerProvider(lc fx.Lifecycle, props ServerProps) (*Server, error) {
	s, err := newServer(props)
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	return s, nil
}

func newServer(props ServerProps) (*Server, error) {
	s := &Server{
		config:   props.Config,
		handlers: make(map[string]http.Handler),
		log:      props.Log,
		live:     true,
	}

	otelInterceptor, err := otelconnect.NewInterceptor(otelconnect.WithTrustRemote())
	if err != nil {
		return nil, err
	}

	s.Interceptors = connect.WithInterceptors(otelInterceptor)

	props.HealthServer.AddService(s)

	return s, nil
}

func (s *Server) Start(_ context.Context) error {
	s.log.Info("starting service")

	serveMux := http.NewServeMux()

	s.srv = &http.Server{
		Addr:              ":http",
		Handler:           h2c.NewHandler(serveMux, &http2.Server{}),
		ReadHeaderTimeout: 15 * time.Second,
	}

	listenerAddr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)

	listener, err := net.Listen("tcp", listenerAddr)
	if err != nil {
		s.log.Error("error creating listener", zap.Error(err))
		return err
	}

	if len(s.handlers) == 0 {
		return errors.New("no handlers to serve")
	}

	for path, handler := range s.handlers {
		s.log.Info("adding handler", zap.String("path", path))
		serveMux.Handle(path, handler)
	}

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
		s.log.Info("http server started", zap.Any("addr", listenerAddr))
	}

	s.ready = true

	return nil
}

func (s *Server) Stop(_ context.Context) error {
	s.log.Info("stopping service")

	s.live = false
	s.ready = false

	return s.srv.Close()
}

func (s *Server) AddHandler(path string, h http.Handler) {
	s.handlers[path] = h
}

func (s *Server) wildcardPath(path string) string {
	return path + "*"
}

func (s *Server) LiveCheck() error {
	if !s.live {
		return health.ErrNotLive
	}
	return nil
}

func (s *Server) ReadyCheck() error {
	if !s.ready {
		return health.ErrNotReady
	}
	return nil
}
