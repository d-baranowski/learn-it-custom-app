# Use an official Node.js base image
FROM --platform=$BUILDPLATFORM node:18 AS base

# Determine the architecture and download the appropriate Go binary
RUN apt-get update && apt-get install -y wget curl && \
    arch=$(uname -m) && \
    if [ "$arch" = "x86_64" ]; then \
        wget https://golang.org/dl/go1.22.5.linux-amd64.tar.gz && \
        tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz && \
        rm go1.22.5.linux-amd64.tar.gz; \
    elif [ "$arch" = "aarch64" ]; then \
        wget https://golang.org/dl/go1.22.5.linux-arm64.tar.gz && \
        tar -C /usr/local -xzf go1.22.5.linux-arm64.tar.gz && \
        rm go1.22.5.linux-arm64.tar.gz; \
    else \
        echo "Unsupported architecture: $arch"; exit 1; \
    fi

# Set up Go environment
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV PATH="${GOPATH}/bin:${PATH}"
ENV GO111MODULE=on

# Install pnpm version 8.14.1
RUN npm install -g pnpm@8.14.1

# Install buf based on architecture
RUN arch=$(uname -m) && \
    if [ "$arch" = "x86_64" ]; then \
        curl -sSL https://github.com/bufbuild/buf/releases/download/v1.39.0/buf-Linux-x86_64 -o /usr/local/bin/buf && \
        chmod +x /usr/local/bin/buf; \
    elif [ "$arch" = "aarch64" ]; then \
        curl -sSL https://github.com/bufbuild/buf/releases/download/v1.39.0/buf-Linux-arm64 -o /usr/local/bin/buf && \
        chmod +x /usr/local/bin/buf; \
    else \
        echo "Unsupported architecture: $arch"; exit 1; \
    fi

# Install Go dependencies
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest

# Set the working directory
WORKDIR /app

# Install project dependencies using pnpm
ENV PNPM_HOME=/usr/local/lib/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN pnpm install -g @bufbuild/buf@1.39.0
RUN pnpm install -g nx@v19.7.3

# Default command to keep the container running (or change as per your needs)
CMD ["bash"]
