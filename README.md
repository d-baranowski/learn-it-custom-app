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
2. Node and npm installed: https://deb.nodesource.com/
3. Golang: https://go.dev/doc/install
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

# Getting Started
1. To spin up the database and redis run
```shell
# Might need to check WSL integration in Docker if using WSL Windows
docker compose up -d
```

You can connect to local postgres using credentials:
```shell
USER=postgres;
PASSWORD=password;
```

2. Install pnpm package manager by following the instructions https://pnpm.io/installation.
   Check out the https://pnpm.io/motivation to understand why we use pnpm over good old npm.
```shell
sudo npm install -g pnpm
```
3. Install all various mono repo utilities golang required packages and libraries:
```shell
pnpm i
pnpm add --global nx@latest
# Runs go mod tidy in all relevant projects and fetches the go dependencies
nx run-many -t tidy --skip-nx-cache
```

4. Generate the gen folders with various generated code. Contents of those folders should not be manually edited
```shell
# Might need to be ran twice to succeed 
nx run-many -t generate --skip-nx-cache
```

<!-- delete this point -->
<!-- 5. Install GoLang dependencies for all projects 
```shell
# make sure you're in the root of the repo or it will fail
nx run-many -t tidy --skip-nx-cache
``` -->

6. Use the migrate command to run the sql migrations in all the applications and set up the database tables.
```shell
# Might need to be ran twice to succeed 
nx run-many -t migrate --skip-nx-cache
```


7. Use bootstrap app to insert generic data into the database for timezones, currencies, countries etc as well as to create the initial admin user.
```shell
DB_USER=postgres go run ./app/bootstrap/cmd/main.go 
```

8. Running the project
```shell
# Entire Stack using Tmux + Go hot reload (Air)
# Prereq: go install github.com/air-verse/air@v1.52.3
./run-stack.sh

# Same, without hot reload
./run-stack.sh --disable-hot

# Gateway (no hot reload)
ENV_FILE=./app/gateway/.env.dev go run app/gateway/cmd/main.go
# Core Api (no hot reload)
USER=postgres ENV_FILE=app/core/.env.dev go run app/core/cmd/main.go

# Gateway (hot reload)
nx run gateway:dev
# Core Api (hot reload)
nx run core:dev

# UI
cd app/ui 
pnpm install
pnpm run dev
```
10. Stopping the stack
```shell
# To detach tmux session press Ctrl-b + d
# (Or maybe type "exit" in terminal)
./stop-stack.sh
```

# Important Libraries and tools
- https://connectrpc.com/ - Connect RPC is used for the API. At the end of the day the data between UI and BFF is transmitted in JSON format and you can just use Postman to play with the API but everything is strongly typed and documented in protobuf. !**Important!** You might sometimes notice a strange behaviour where in your chrome network tab a field you’re expecting is transmitted but the UI seems to ignore it. You’ll need to run buf generate in the UI folder to ensure that the client libraries are not updated when making any changes to the backend protobuf. !**Important!**
- https://github.com/uber-go/fx - Uber fx library is used for dependency injection.
- https://github.com/pressly/goose - Goose as migrations library for the database
- https://bun.uptrace.dev/ - Alternative to Gorm is the ORM library of chosen for this project
- https://buf.build/docs/installation - Buf cli used for code generation

# File structure overview
```
.
├── README.md
├── app                                                       # Where all the project applications live 
│   ├── core                                                  # Main API project 
│   │   ├── api                           
│   │   │   ├── fx.go
│   │   │   └── service                                       # Main API endpoint definitions 
│   │   ├── buf.gen.yaml                                      # Buf configuration for code generation from protobuf
│   │   ├── buf.lock
│   │   ├── buf.yaml
│   │   ├── clean-gen.sh
│   │   ├── cmd
│   │   │   └── main.go
│   │   ├── config
│   │   │   ├── config.go
│   │   │   └── fx.go
│   │   ├── db                                               # Database goose migrations 
│   │   │   ├── 20240612052727_base.sql
│   │   │   ├── 20240612052728_config.sql
│   │   │   ├── 20240612052729_user.sql
│   │   │   ├── 20240627114040_country.sql
│   │   │   ├── 20240627114041_organisation.sql
│   │   │   ├── 20240627114043_currency.sql
│   │   │   ├── 20240627144907_note.sql
│   │   │   ├── 20240701085522_timezone.sql
│   │   │   ├── migrate.go
│   │   │   └── up.sh
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── mapper
│   │   │   └── excel.go
│   │   ├── model                                           # Application data models 
│   │   │   ├── country.go
│   │   │   ├── currency.go
│   │   │   ├── note.go
│   │   │   ├── organisation.go
│   │   │   ├── permission.go
│   │   │   ├── role.go
│   │   │   ├── team.go
│   │   │   ├── timezone.go
│   │   │   ├── user.go
│   │   │   ├── user_bookmark.go
│   │   │   ├── user_lock.go
│   │   │   ├── user_notification.go
│   │   │   ├── user_permission.go
│   │   │   ├── user_role.go
│   │   │   ├── user_session.go
│   │   │   ├── user_settings.go
│   │   │   └── user_team.go
│   │   ├── project.json
│   │   ├── proto                                          # Protobuf API definitions
│   │   │   ├── api -> ../../../pkg/api/proto/api
│   │   │   └── core
│   │   ├── service                                        # Various long running services 
│   │   │   ├── fx.go
│   │   │   └── permission.go
│   │   └── store
│   │       ├── fx.go
│   │       ├── fx_rate.go
│   │       └── stores.go
│   ├── gateway                                           # API gateway responsible for proxying other apis for the UI 
│   │   ├── api
│   │   │   ├── fx.go
│   │   │   └── service
│   │   ├── cmd
│   │   │   └── main.go
│   │   ├── config
│   │   │   ├── config.go
│   │   │   └── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   └── service
│   │       ├── gateway.go
│   │       └── permission.go                            # It will check and enforce permissions 
│   └── ui                                               # NextJS UI App
│       ├── Dockerfile
│       ├── buf.gen.yaml
│       ├── buf.lock
│       ├── buf.plugins.gen.yaml
│       ├── buf.yaml
│       ├── cypress                                      # E2E Automations with Cypress 
│       │   ├── downloads
│       │   ├── e2e
│       │   ├── fixtures
│       │   ├── screenshots
│       │   └── support
│       ├── cypress.config.ts
│       ├── jest.config.ts
│       ├── next-env.d.ts
│       ├── next.d.ts
│       ├── package.json
│       ├── plugins                                      # Various code generation plugins 
│       │   ├── enum.ts
│       │   ├── factory.ts
│       │   ├── interface.ts
│       │   ├── permission.ts
│       │   ├── typemap.ts
│       │   ├── utils.ts
│       │   └── zod
│       ├── pnpm-lock.yaml
│       ├── project.json
│       ├── proto
│       │   ├── api
│       │   └── core -> ../../core/proto/core
│       ├── public
│       ├── src
│       │   ├── api-proxy.tsx
│       │   ├── auth
│       │   ├── components
│       │   ├── config.ts
│       │   ├── contexts
│       │   ├── environment.d.ts
│       │   ├── global.css
│       │   ├── hoc
│       │   ├── hooks
│       │   ├── icons
│       │   ├── index.ts
│       │   ├── layouts
│       │   ├── middleware.ts
│       │   ├── pages
│       │   ├── paths.ts
│       │   ├── providers
│       │   ├── request
│       │   ├── schema
│       │   ├── sections
│       │   ├── server
│       │   ├── store
│       │   ├── theme
│       │   ├── types
│       │   └── utils
│       ├── tsconfig.json
│       ├── tsconfig.lib.json
│       └── tsconfig.spec.json
├── clean-gen.sh
├── docker                                                 # Useful dockerfiles 
│   ├── Dockerfile
│   └── postgres
│       ├── Dockerfile
│       └── initdb.d
│           └── 00001.sql
├── docker-compose.yml                                     # Docker compose for spinning up backend dependencies 
├── go.work
├── go.work.sum
├── jest.config.ts
├── jest.preset.js
├── nx.json
├── package.json
├── pkg                                                    # Reusable golang libraries 
│   ├── api                                                # API model mapping and generic query building   
│   ├── base
│   ├── cdc                                                # Change data capture system for reacting to changes in the database in the event driven fashion 
│   ├── database                                           # Database support
│   │   ├── mysql
│   │   ├── postgres
│   │   └── sqlite
│   ├── datatable                                          # Python Pandas like tabular data helper library 
│   │   ├── README.md
│   │   ├── export.go
│   │   ├── import
│   │   │   └── csv
│   ├── decimal                                            # Save money implementation
│   ├── etcd                                               # ETCD support 
│   ├── excel                                              # Excel Parser and renderer
│   ├── flow
│   │   ├── config
│   │   │   └── config.go
│   │   ├── flow.go
│   │   ├── flow_test.go
│   │   ├── go.mod
│   │   ├── graph
│   │   │   ├── action.go
│   │   │   ├── compile.go
│   │   │   ├── compile_test.go
│   │   │   ├── decision.go
│   │   │   ├── payload
│   │   │   └── port.go
│   │   ├── model
│   │   │   ├── data
│   │   │   ├── field.go
│   │   │   ├── flow.go
│   │   │   ├── flow_binding.go
│   │   │   ├── flow_plugin.go
│   │   │   └── steps.go
│   │   ├── project.json
│   │   ├── rule
│   │   │   ├── env.go
│   │   │   └── env_test.go
│   │   ├── service
│   │   │   ├── flow.go
│   │   │   └── flow_action.go
│   │   └── store
│   │       ├── net.go
│   │       ├── plugin.go
│   │       ├── program.go
│   │       └── sm.go
│   ├── health
│   │   ├── config.go
│   │   ├── error.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   ├── server.go
│   │   └── util.go
│   ├── k8s
│   │   ├── client.go
│   │   ├── config.go
│   │   ├── config_map.go
│   │   ├── deployment.go
│   │   ├── election.go
│   │   ├── event.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── mocks
│   │   │   ├── Deployment.go
│   │   │   └── Election.go
│   │   ├── project.json
│   │   └── util.go
│   ├── logging
│   │   ├── asynq.go
│   │   ├── bun.go
│   │   ├── config.go
│   │   ├── context.go
│   │   ├── echo.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── pgx.go
│   │   ├── project.json
│   │   └── zap.go
│   ├── maps
│   │   ├── go.mod
│   │   ├── project.json
│   │   ├── safe_map.go
│   │   ├── safe_map_slice.go
│   │   ├── safe_multi_map.go
│   │   └── to_map.go
│   ├── mermaid
│   │   ├── examples
│   │   │   ├── classes
│   │   │   ├── simple-flowchart
│   │   │   └── subgraphs
│   │   ├── flowchart
│   │   │   ├── class.go
│   │   │   ├── class_test.go
│   │   │   ├── flowchart.go
│   │   │   ├── flowchart_test.go
│   │   │   ├── link.go
│   │   │   ├── link_test.go
│   │   │   ├── node.go
│   │   │   ├── node_test.go
│   │   │   ├── nodestyle.go
│   │   │   ├── nodestyle_test.go
│   │   │   ├── setup_test.go
│   │   │   ├── subgraph.go
│   │   │   └── subgraph_test.go
│   │   ├── go.mod
│   │   └── project.json
│   ├── openai
│   │   ├── chat.go
│   │   ├── client.go
│   │   ├── config.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   └── regex_from_messages.go
│   ├── queue
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── lua
│   │   │   ├── cancel.lua
│   │   │   ├── consume.lua
│   │   │   ├── drain.lua
│   │   │   └── exists.lua
│   │   ├── project.json
│   │   ├── service.go
│   │   └── service_test.go
│   ├── rabbitmq
│   │   ├── api.go
│   │   ├── config.go
│   │   ├── confirm_publishing.go
│   │   ├── connection.go
│   │   ├── connection_options.go
│   │   ├── connection_pool.go
│   │   ├── constant.go
│   │   ├── consume.go
│   │   ├── consumer_options.go
│   │   ├── declare.go
│   │   ├── examples
│   │   │   ├── consumer
│   │   │   ├── dmq
│   │   │   ├── multiconsumer
│   │   │   ├── multipublisher
│   │   │   ├── publisher
│   │   │   └── publisher_confirm
│   │   ├── exchange_options.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── internal
│   │   │   ├── channelmanager
│   │   │   ├── connectionmanager
│   │   │   ├── dispatcher
│   │   │   └── logger
│   │   ├── project.json
│   │   ├── publish.go
│   │   ├── publish_flow_block.go
│   │   ├── publish_options.go
│   │   ├── publisher_options.go
│   │   ├── queue
│   │   │   ├── delay_queue.go
│   │   │   ├── delay_queue_config.go
│   │   │   ├── delay_queue_v1.go
│   │   │   ├── delay_queue_v2.go
│   │   │   ├── manager.go
│   │   │   ├── message.go
│   │   │   ├── message_queue.go
│   │   │   └── var.go
│   │   ├── stream.go
│   │   ├── table.go
│   │   └── tracing.go
│   ├── randutil
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   ├── randutil.go
│   │   └── randutil_test.go
│   ├── redis
│   │   ├── client.go
│   │   ├── config.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   └── scripts.go
│   ├── redislock
│   │   ├── README.md
│   │   ├── example_test.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── obtain.lua
│   │   ├── project.json
│   │   ├── pttl.lua
│   │   ├── redislock.go
│   │   ├── redislock_test.go
│   │   ├── refresh.lua
│   │   ├── release.lua
│   │   └── retry_strategy_test.go
│   ├── repository
│   │   ├── error.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── mocks
│   │   │   ├── BunDeleteScope.go
│   │   │   ├── BunInsertScope.go
│   │   │   ├── BunModelScope.go
│   │   │   ├── BunQueryScope.go
│   │   │   ├── BunSelectScope.go
│   │   │   ├── BunUpdateScope.go
│   │   │   ├── PostgresRepository.go
│   │   │   └── SqliteRepository.go
│   │   ├── postgres.go
│   │   ├── project.json
│   │   ├── scope.go
│   │   └── sqlite.go
│   ├── scheduler
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── model
│   │   │   └── event.go
│   │   ├── project.json
│   │   └── service.go
│   ├── service
│   │   └── config
│   │       ├── fx.go
│   │       ├── go.mod
│   │       ├── go.sum
│   │       ├── key.go
│   │       ├── project.json
│   │       ├── service.go
│   │       └── service_test.go
│   ├── sqlcrypt
│   │   ├── README.md
│   │   ├── crypter.go
│   │   ├── crypter_test.go
│   │   ├── encrypted_bytes.go
│   │   ├── encrypted_bytes_test.go
│   │   ├── encrypted_string.go
│   │   ├── encrypted_string_test.go
│   │   ├── example
│   │   │   └── main.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   ├── providers
│   │   │   └── aesgcm
│   │   └── random.go
│   ├── str
│   │   ├── README.md
│   │   ├── acronyms.go
│   │   ├── camel.go
│   │   ├── camel_test.go
│   │   ├── concurrency_test.go
│   │   ├── doc.go
│   │   ├── go.mod
│   │   ├── pad.go
│   │   ├── project.json
│   │   ├── reverse.go
│   │   ├── snake.go
│   │   └── snake_test.go
│   ├── test
│   │   ├── bun.go
│   │   ├── container.go
│   │   ├── container_test.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── id.go
│   │   ├── logger.go
│   │   ├── project.json
│   │   └── wait.go
│   ├── timezone
│   │   ├── README.md
│   │   ├── example_test.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   ├── timezone.go
│   │   ├── timezone_test.go
│   │   ├── timezones.go
│   │   ├── tools
│   │   │   ├── gen-var-timezones.py
│   │   │   ├── gen-var-tzabbrinfos.py
│   │   │   └── gen-var-tzinfos.py
│   │   ├── tz_abbr_infos.go
│   │   ├── tz_infos.go
│   │   └── tzinfo.go
│   ├── tracing
│   │   ├── config.go
│   │   ├── fx.go
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── http.go
│   │   ├── project.json
│   │   └── stdout.go
│   ├── tree
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── path.go
│   │   ├── path_map.go
│   │   ├── path_map_test.go
│   │   ├── path_test.go
│   │   ├── project.json
│   │   ├── radix.go
│   │   ├── radix_test.go
│   │   └── tree_path.go
│   ├── rpg
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   └── request.go
│   ├── unix
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── project.json
│   │   └── timestamp.go
│   └── util
│       ├── as_json.go
│       ├── bcrypt.go
│       ├── contains.go
│       ├── deepcopy.go
│       ├── deepcopy_test.go
│       ├── env.go
│       ├── error.go
│       ├── go.mod
│       ├── go.sum
│       ├── idx_iter.go
│       ├── net.go
│       ├── pair.go
│       ├── path.go
│       ├── pointer.go
│       ├── project.json
│       └── sort.go
├── pnpm-lock.yaml
├── tools
│   └── bootstrap
│       ├── cmd
│       │   └── main.go
│       ├── config
│       │   ├── config.go
│       │   └── fx.go
│       ├── go.mod
│       └── service
│           └── bootstrap
└── tsconfig.base.jso
```

# AI Assistants
Please keep all implementation nodes in ./ai-assistant/notes folder
