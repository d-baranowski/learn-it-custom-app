ARG APP_NAME

# Pin the builder to the native arch of whatever host is running buildx
# ($BUILDPLATFORM) instead of the target arch. Combined with the
# GOOS/GOARCH args below, Go cross-compiles straight from amd64 to the
# target platform — no QEMU emulation, no 5-10 min arm64 penalty.
# CGO_ENABLED=0 keeps the output statically-linked so the tiny alpine
# runtime stage below can exec it without a libc loader mismatch.
FROM --platform=$BUILDPLATFORM golang:1.24.13-alpine AS builder
ARG APP_NAME
ARG TARGETOS
ARG TARGETARCH
COPY . /build
WORKDIR /build
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -o ./dist/app/${APP_NAME} ./app/${APP_NAME}/cmd/

FROM alpine:3.20.1
LABEL org.opencontainers.image.source=https://github.com/inspiration-particle/utro
RUN apk add --no-cache tzdata
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
COPY --from=builder /build/dist/app/${APP_NAME} /app/${APP_NAME}
ENTRYPOINT ["/bin/sh", "-c", "/app/${APP_NAME}"]
