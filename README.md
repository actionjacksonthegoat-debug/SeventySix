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

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git
cd SeventySix
```

### 2. Setup Frontend (Angular Client)

```bash
cd SeventySix.Client
npm install
npm start
```

The client will be available at `http://localhost:4200`

### 3. Setup Backend (.NET API)

```bash
cd SeventySix.Server
dotnet restore
dotnet run --project SeventySix.Api
```

The API will be available at `https://localhost:7074`

### 4. Access API Documentation

With the API running, visit:

-   **Scalar UI**: `https://localhost:7074/scalar/v1`
-   **OpenAPI Spec**: `https://localhost:7074/openapi/v1.json`

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
