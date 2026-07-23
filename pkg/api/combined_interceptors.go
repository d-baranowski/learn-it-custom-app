package api

import (
	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
)

func CombinedInterceptors() (connect.Option, error) {
	bi := NewBaseInterceptor(WithBaseInterceptorSID(true))
	hi := NewHeaderInterceptor()
	otelInterceptor, err := otelconnect.NewInterceptor(otelconnect.WithTrustRemote())
	if err != nil {
		return nil, err
	}

	return connect.WithInterceptors(bi.Interceptor(), hi.Interceptor(), otelInterceptor), nil
}
