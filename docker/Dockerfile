# syntax=docker/dockerfile:1.9
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
WORKDIR /build
# Dependency layer: copy ONLY the module manifests, then download modules. Cached (and
# exported to ECR via buildx mode=max) independently of source — re-runs only when a
# go.work/go.mod/go.sum changes, so source-only edits skip the module re-download.
# (No --mount=type=cache here: cache mounts aren't exported across ephemeral CI agents,
# and would hide the modules baked into this layer.)
COPY --parents go.work go.work.sum **/go.mod **/go.sum ./
RUN for d in $(go list -m -f '{{.Dir}}'); do (cd "$d" && go mod download) || true; done
# Source copy busts only the build layer below, not the cached deps above.
COPY . /build
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -o ./dist/app/${APP_NAME} ./app/${APP_NAME}/cmd/

FROM alpine:3.20.1
LABEL org.opencontainers.image.source=https://github.com/inspiration-particle/utro
RUN apk add --no-cache tzdata
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
COPY --from=builder /build/dist/app/${APP_NAME} /app/${APP_NAME}
ENTRYPOINT ["/bin/sh", "-c", "/app/${APP_NAME}"]
