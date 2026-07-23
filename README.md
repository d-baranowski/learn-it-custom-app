# Naming Convention

Folder:

- Folders should be named using param-case

File:

- Files should be named using snake_case

# RPG

React
Postgres
Golang

# Prerequisite

1. OS: Linux (recommended), or WSL (for Windows)
2. Node and npm installed: <https://deb.nodesource.com/>
3. Golang: <https://go.dev/doc/install>
4. Install dependency for proto generating:

```shell
pnpm install @bufbuild/buf
go install github.com/pressly/goose/v3/cmd/goose@v3.26.0
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.10
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@v1.19.0
# might need to export PATH env for go if the command for those above libs not found
# copy to relevant .rc file (like .bashrc)
# echo 'export PATH=$PATH:$(go env GOPATH)/bin'  
cd tools/wasm/form-validator && GOOS=js GOARCH=wasm go build -o dist/form-validator.wasm
# might need to export PATH env for go if the command for those above libs not found
```

# AI Assistants

Please keep all implementation nodes in ./ai-assistant/notes folder
