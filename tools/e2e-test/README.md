### Utro E2E Test Suite

This repository contains the end-to-end (E2E) test suite for the Utro project. The tests are designed to validate the functionality and performance of the Utro application across various scenarios.

### Getting Started

To start the backend application execute the following command in the terminal:

```bash
docker compose up
```

### Services

The docker compose runs the following services:

- **core**: The main backend api
- **gateway**: The api gateway for the UI to use
- **ui**: Next.js react application admin dashboard
- **bootstrap**: A service that bootraps the database with some initial data for testing purposes and then exists
- **migrate**: An instance of the core service that runs only the database migrations and then exits
- **bootstrap-api**: An instance of the bootstrap service that exposes an api to trigger the re-bootstrapping process on demand it will restart the database to it's initial state
- **postges**: The postgres database instance
- **pgadmin**: A web interface for managing the postgres database

### Architecture

```mermaid
graph TB
    subgraph "E2E Testing"
        Cypress[Cypress Tests]
    end

    subgraph "Frontend"
        UI[UI<br/>Next.js Admin Dashboard<br/>:3000]
    end

    subgraph "Backend Services"
        Gateway[Gateway<br/>API Gateway<br/>:9999]
        Core[Core<br/>Main Backend API<br/>:9102]
    end

    subgraph "Bootstrap Services"
        Bootstrap[Bootstrap<br/>Initial Data Seeding]
        BootstrapAPI[Bootstrap API<br/>Re-bootstrap Trigger]
    end

    subgraph "Data Layer"
        Postgres[(PostgreSQL<br/>Database<br/>:5432)]
        PgAdmin[PgAdmin<br/>DB Management<br/>:5050]
    end

    subgraph "Migration"
        Migrate[Migrate<br/>DB Migrations]
    end

    %% Test connections
    Cypress -.->|HTTP Requests| UI
    Cypress -.->|API Calls| BootstrapAPI

    %% Frontend to Backend
    UI -->|BFF Requests| Gateway

    %% Backend Service Communication
    Gateway -->|gRPC/API| Core

    %% Bootstrap API to Core
    BootstrapAPI -->|gRPC/API| Core

    %% Database connections
    Core -->|SQL| Postgres
    Bootstrap -->|Direct SQL<br/>Initial Seed| Postgres
    Migrate -->|Migrations| Postgres
    PgAdmin -->|Management| Postgres

    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef backend fill:#68a063,stroke:#333,stroke-width:2px,color:#fff
    classDef database fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    classDef testing fill:#17202c,stroke:#333,stroke-width:2px,color:#fff
    classDef bootstrap fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff

    class UI frontend
    class Gateway,Core backend
    class Postgres,PgAdmin database
    class Cypress testing
    class Bootstrap,BootstrapAPI,Migrate bootstrap
```

### Accessing the application

Open your browser and navigate to `http://localhost:3000` to access the Utro admin dashboard. You can use the following credentials to log in:

- **Username**: admin
- **Password**: Password1!

If you'd like to log in as non admin user you can use any other user from the `users` table with the same password

### Running Tests

To run the E2E tests, execute the following command in the terminal:

```bash
pnpm install
pnpm run test
```

### Contributing

We use a version of the page object pattern for the cypress except instead of focusing on pages we focus on components also.
Please ensure that you write component objects. Create reusable strongly typed typescript functions for interacting with the components in the tests. This will help maintain the readability and maintainability of the test suite.
Ensure that test flakiness is minimized. Do not use arbitrary waits in the tests.
Feel free to refactor and improve the existing tests and component objects as needed.
The example provided is not perfect, so I'm open to suggestions and improvements on the structure of the tests and the component objects.

Any hacky and hard to do locators should be flagged with a TODO comment
so that UI developers can later add better locators.

Any bugs found in the application should be reported in the issue tracker.
Any questions regarding the application behavior should be asked in the team chat.

**GL&HF!**
