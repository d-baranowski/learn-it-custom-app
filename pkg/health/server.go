package health

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"net/http"
	"time"
)

type ServiceInterface interface {
	LiveCheck() error
	ReadyCheck() error
}

type Check struct {
	ErrCheck    func() error
	HttpHandler func(w http.ResponseWriter, r *http.Request)
}

type Server struct {
	addr          string
	advertiseAddr string
	srv           *http.Server
	checks        map[string][]*Check
	log           *zap.Logger
	name          string
	version       string
}

func NewHealthServer(lc fx.Lifecycle, config *Config, log *zap.Logger, name, version string) (*Server, error) {
	s := &Server{
		addr:    fmt.Sprintf("%s:%d", config.Addr, config.Port),
		checks:  make(map[string][]*Check),
		log:     log,
		name:    name,
		version: version,
	}

	// if AdvertiseAddr is set, use it, it must be host:port or ip:port
	// else we'll use the hostname and configured port
	if config.AdvertiseAddr != "" {
		s.advertiseAddr = config.AdvertiseAddr
	} else {
		hostname, err := GetHostname()
		if err != nil {
			return nil, err
		}
		s.advertiseAddr = fmt.Sprintf("%s:%d", hostname, config.Port)
	}

	s.srv = &http.Server{
		Addr:    s.addr,
		Handler: s,
	}

	s.AddHttpCheck("/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"name":    s.name,
			"version": s.version,
		})
	})

	s.AddLivenessCheck(func() error { return nil })
	s.AddReadinessCheck(func() error { return nil })

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			log.Info("starting health server")
			errChan := make(chan error)
			go s.Start(errChan)

			select {
			case err := <-errChan:
				if err != nil && err != http.ErrServerClosed {
					s.log.Error("error starting health server", zap.Error(err))
				}
			case <-time.After(100 * time.Millisecond):
				s.log.Info("health server started", zap.String("addr", s.addr))
			}
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Info("stopping health server")
			return s.Stop()
		},
	})

	return s, nil
}

func (s *Server) Start(errChan chan error) {
	errChan <- s.srv.ListenAndServe()
}

func (s *Server) Stop() error {
	err := s.srv.Shutdown(context.Background())
	if err != nil {
		s.log.Error("error shutting down health server", zap.Error(err))
		return err
	}
	return nil
}

func (s *Server) AddErrorCheck(path string, check func() error) {
	if _, ok := s.checks[path]; !ok {
		s.checks[path] = make([]*Check, 0)
	}

	s.checks[path] = append(s.checks[path], &Check{
		ErrCheck: check,
	})
}

func (s *Server) AddHttpCheck(path string, handler func(w http.ResponseWriter, r *http.Request)) {
	if _, ok := s.checks[path]; !ok {
		s.checks[path] = make([]*Check, 0)
	}

	s.checks[path] = append(s.checks[path], &Check{
		HttpHandler: handler,
	})
}

func (s *Server) GetHttpCheckUrl(path string) (string, bool) {
	if _, ok := s.checks[path]; !ok {
		return "", false
	}

	return fmt.Sprintf("http://%s%s", s.advertiseAddr, path), true
}

func (s *Server) DeleteCheck(path string) {
	delete(s.checks, path)
}

// AddReadinessCheck adds an error check for /ready
func (s *Server) AddReadinessCheck(check func() error) {
	path := "/ready"

	if _, ok := s.checks[path]; !ok {
		s.checks[path] = make([]*Check, 0)
	}

	s.checks[path] = append(s.checks[path], &Check{
		ErrCheck: check,
	})
}

// AddLivenessCheck adds an error check for /live
func (s *Server) AddLivenessCheck(check func() error) {
	path := "/live"

	if _, ok := s.checks[path]; !ok {
		s.checks[path] = make([]*Check, 0)
	}

	s.checks[path] = append(s.checks[path], &Check{
		ErrCheck: check,
	})
}

func (s *Server) AddService(svc ServiceInterface) {
	s.AddLivenessCheck(svc.LiveCheck)
	s.AddReadinessCheck(svc.ReadyCheck)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if checks, ok := s.checks[r.URL.Path]; ok {
		for _, check := range checks {
			if check.ErrCheck != nil {
				err := check.ErrCheck()
				if err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					_, _ = w.Write([]byte(err.Error()))
					return
				}

				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("OK"))
				return
			}

			if check.HttpHandler != nil {
				check.HttpHandler(w, r)
				return
			}
		}
	}

	http.Error(w, "Unsupported path", http.StatusNotFound)
}
