# SeventySix

A full-stack web application showcasing modern development practices with Angular 20 and .NET 10. Features a clean architecture, comprehensive testing, and production-ready infrastructure.

## 🏗️ Architecture Overview

### Frontend (Angular 20)

-   **Framework**: Angular 20.3 with zoneless change detection
-   **State Management**: Signals and computed values
-   **Routing**: Standalone components with lazy loading
-   **Styling**: SCSS with modular component styles
-   **HTTP**: Typed REST API client with error handling
-   **Security**: XSS prevention, input sanitization, JWT token storage

### Backend (.NET 10)

-   **Framework**: ASP.NET Core 10 Web API
-   **Architecture**: Clean Architecture (Domain, Application, Infrastructure, API)
-   **Validation**: FluentValidation for request validation
-   **Logging**: Serilog with structured logging
-   **API Documentation**: Scalar for interactive API reference
-   **Performance**: Response compression (Brotli/Gzip), caching, rate limiting

### Key Features

-   🔒 Security headers and CORS configuration
-   📊 Comprehensive error handling and logging
-   🧪 85%+ test coverage (unit, integration, E2E)
-   🚀 Performance optimizations (caching, compression)
-   📝 FluentValidation for business rules
-   🎨 Clean, maintainable code structure

## 📋 Prerequisites

-   **Docker Desktop** - For containerized deployment
-   **Node.js 20+** - For Angular development
-   **.NET 10 SDK** - For backend development
-   **VS Code** - Recommended IDE for frontend
-   **Visual Studio 2026** - Recommended IDE for backend
-   **Git** - For version control
-   **OpenWeather API Key** - Free API key from [OpenWeather](https://openweathermap.org/api)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git
cd SeventySix
```

### 2. Configure User Secrets

**⚠️ IMPORTANT**: Before running the application, you must configure your sensitive settings using User Secrets.

See **[USER_SECRETS_SETUP.md](USER_SECRETS_SETUP.md)** for detailed instructions.

**Quick Setup**:

```bash
cd SeventySix.Server/SeventySix.Api

# OpenWeather API Key (REQUIRED)
dotnet user-secrets set "OpenWeather:ApiKey" "YOUR_OPENWEATHER_API_KEY_HERE"

# Database Connection (for local development)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seventysix_dev;Username=postgres;Password=TestPassword;Pooling=true;Minimum Pool Size=1;Maximum Pool Size=20;Include Error Detail=true"

# Default Coordinates (New York City)
dotnet user-secrets set "OpenWeather:DefaultLatitude" "40.7128"
dotnet user-secrets set "OpenWeather:DefaultLongitude" "-74.0060"
```

**Note**: User secrets are automatically used by the application when running locally with `dotnet run` or from Visual Studio. Docker containers use environment variables defined in `docker-compose.yml`.

### 3. Running the Application

#### Option 1: Full Docker Container (Recommended for Client-Side Development)

**⚠️ First-Time Setup**: Before running the Docker container with HTTPS, you must generate a development certificate:

```powershell
# Generate development HTTPS certificate (one-time setup)
dotnet dev-certs https -ep "$env:USERPROFILE\.aspnet\https\aspnetapp.pfx" -p password
dotnet dev-certs https --trust
```

**What this does**:

-   Creates a self-signed certificate at `~/.aspnet/https/aspnetapp.pfx` with password `password`
-   Trusts the certificate on your local machine (Windows Certificate Store)
-   Allows the Docker container to use HTTPS via volume mount: `~/.aspnet/https:/https:ro`
-   The container uses these environment variables:
    -   `ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx`
    -   `ASPNETCORE_Kestrel__Certificates__Default__Password=password`

**Note**: You may still need to accept the certificate warning in your browser on first access to `https://localhost:7074`.

For running a full Docker container environment, use:

```powershell
npm run start:all
```

This will:

-   Start Docker Desktop (if not already running)
-   Launch PostgreSQL, Jaeger, and Prometheus containers
-   Start the API in a Docker container with HTTPS on port 7074
-   Launch the Angular client

**Access**: http://localhost:4200

**When finished**:

```powershell
npm run stop:all
```

This will clean up and stop all background resources. This setup is best for client-side development and simulating deployed environments.

#### Option 2: API Debugging (For Backend Development)

For debugging the API in Visual Studio 2022:

1. **Start infrastructure**:

    ```powershell
    npm run start:api-debug
    ```

2. **Open Visual Studio 2022**:

    - Open `SeventySix.Server\SeventySix.Server.sln`
    - Set `SeventySix.Api` as the startup project
    - Select the **"https"** profile (NOT Container)
    - Press **F5** to start debugging

**When finished**, stop the infrastructure:

```powershell
npm run stop:api-debug
```

---

### Alternative: Manual Start (Individual Commands)

### Alternative: Manual Start (Individual Commands)

**1. Start Infrastructure**:

```powershell
npm run start:api-debug
```

**2. Start API** (in Visual Studio or via command line):

```powershell
npm run start:api
```

**3. Start Client** (in new terminal):

```powershell
npm run start:client
```

**Stop Infrastructure**:

```powershell
npm run stop:api-debug
```

---

### Access the Application

-   **Application**: http://localhost:4200
-   **Admin Dashboard**: http://localhost:4200/admin/dashboard
-   **Log Management**: http://localhost:4200/admin/logs
-   **API Documentation (Scalar)**: https://localhost:7074/scalar/v1
-   **Jaeger Tracing**: http://localhost:16686
-   **Prometheus Metrics**: http://localhost:9090

---

## 🛑 Stopping Services

**Stop Full Stack** (if using `npm run start:all`):

```powershell
npm run stop:all
```

**Stop Infrastructure Only** (if using `npm run start:api-debug`):

```powershell
npm run stop:api-debug
```

## 🧪 Testing

### Frontend Tests

#### Unit Tests (Jasmine + Karma)

```bash
cd SeventySix.Client
npm test                    # Run tests in watch mode
npm test -- --no-watch      # Single run
npm test -- --code-coverage # With coverage report
```

**Current Coverage**: 85.54% lines, 83.78% branches, 81.81% functions

#### E2E Tests (Playwright)

```bash
cd SeventySix.Client
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Run with UI mode
npm run test:e2e:headed     # Run in headed mode
```

### Backend Tests

#### Unit Tests (xUnit)

```bash
cd SeventySix.Server
dotnet test                                    # Run all tests
dotnet test SeventySix.Api.Tests              # API controller tests
dotnet test SeventySix.Application.Tests      # Service tests
```

**Tests**: 24 unit tests, 12 integration tests (all passing)

#### Integration Tests

```bash
cd SeventySix.Server
dotnet test --filter "FullyQualifiedName~Integration"
```

#### Code Coverage

```bash
cd SeventySix.Server
dotnet test --collect:"XPlat Code Coverage"
```

## 📁 Project Structure

```
SeventySix/
├── SeventySix.Client/          # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   ├── features/      # Feature modules (game, sandbox)
│   │   │   └── shared/        # Shared components, pipes, directives
│   │   └── environments/      # Environment configurations
│   ├── e2e/                   # Playwright E2E tests
│   └── karma.conf.js          # Test configuration
│
└── SeventySix.Server/          # .NET backend
    ├── SeventySix.Api/        # Web API layer
    ├── SeventySix.Application/ # Business logic
    ├── SeventySix.Domain/     # Domain entities
    ├── SeventySix.Infrastructure/ # Data access
    ├── SeventySix.Api.Tests/  # API tests
    └── SeventySix.Application.Tests/ # Service tests
```

## 🔧 Development Tools

### Code Quality

#### Frontend

```bash
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix ESLint issues
npm run format            # Prettier format
npm run format:check      # Check formatting
npm run cleanup           # Lint + format
```

#### Backend

-   Code analysis with .NET analyzers
-   StyleCop for code style enforcement
-   EditorConfig for consistent formatting

### VS Code Extensions (Recommended)

-   Angular Language Service (`angular.ng-template`)
-   ESLint (`dbaeumer.vscode-eslint`)
-   Prettier (`esbenp.prettier-vscode`)
-   EditorConfig (`editorconfig.editorconfig`)
-   GitHub Copilot (`github.copilot`)
-   C# Dev Kit (`ms-dotnettools.csdevkit`)
-   Docker (`ms-azuretools.vscode-docker`)
-   PowerShell (`ms-vscode.powershell`)

## 🐳 Docker Deployment

### Using Docker Compose

```bash
cd SeventySix.Server
docker-compose up -d
```

This starts the API in a containerized environment with all dependencies.

## 🔐 Security Features

### Frontend

-   JWT token secure storage (localStorage with encryption)
-   XSS prevention via DomSanitizer
-   Input validation and sanitization
-   CSRF protection
-   Secure HTTP-only communication

### Backend

-   Security headers (X-Frame-Options, CSP, etc.)
-   CORS with whitelist
-   Rate limiting middleware
-   Global exception handling
-   Request validation with FluentValidation
-   HTTPS enforcement

## 📊 Performance Optimizations

### Frontend

-   Zoneless change detection
-   Lazy loading routes
-   OnPush change detection strategy
-   Standalone components (smaller bundles)
-   Signal-based reactivity

### Backend

-   Response caching (60s TTL)
-   Response compression (Brotli/Gzip)
-   Async/await throughout
-   Efficient repository patterns
-   Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

-   Follow the .editorconfig settings
-   Maintain >80% test coverage
-   Document public APIs with XML comments
-   Use meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE.txt file for details.

## 👥 Authors

-   **ActionJackson** - _Initial work_

## 🙏 Acknowledgments

-   Angular team for the amazing framework
-   .NET team for ASP.NET Core
-   Community contributors

---

## 📚 Additional Resources

-   [Angular Documentation](https://angular.dev)
-   [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
-   [Playwright Documentation](https://playwright.dev)
-   [FluentValidation Documentation](https://docs.fluentvalidation.net)

## 🔗 Quick Links

-   **API Docs**: https://localhost:7074/scalar/v1
-   **Client**: http://localhost:4200
-   **GitHub Issues**: https://github.com/actionjacksonthegoat-debug/SeventySix/issues
