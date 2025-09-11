# MAD-AI

> Modern Angular application built with Clean Architecture principles, Domain-Driven Design, and comprehensive testing strategies.

[![Angular](https://img.shields.io/badge/Angular-20.1.6-red?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest)](https://jestjs.io/)
[![Cypress](https://img.shields.io/badge/Cypress-E2E%20Testing-17202C?logo=cypress)](https://www.cypress.io/)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture-brightgreen)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🚀 Project Overview

MAD-AI is a modern Angular application implementing Clean Architecture and Domain-Driven Design principles. The project demonstrates enterprise-grade software development practices with a strict 5-layer architecture, comprehensive testing strategies, and maintainable code patterns.

### Key Features

- **🏗️ Clean Architecture Implementation**: 5-layer architecture with strict dependency rules
- **🧠 Domain-Driven Design**: Pure business logic isolated from technical concerns
- **🎨 Modern UI/UX**: Angular with Tailwind CSS v4.1 and dark mode support
- **🧪 Comprehensive Testing**: 100% coverage for domain layer, 95% for application layer
- **📊 Data Visualization**: Integrated with ECharts for rich data presentation
- **📄 Report Generation**: PDF export capabilities with jsPDF
- **🔄 Reactive State Management**: Observable-based state management through Facades
- **♿ Accessibility First**: WCAG 2.1 AA compliant with proper contrast and focus management

## 🛠️ Technology Stack

### Core Technologies

- **Frontend Framework**: Angular 20.1.6 with Server-Side Rendering (SSR)
- **Programming Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS 4.1.11 with custom design system
- **State Management**: RxJS 7.8.0 with reactive patterns
- **Build System**: Angular CLI with custom webpack configuration

### Development & Testing

- **Testing Framework**: Jest/Jasmine with Karma
- **Code Quality**: ESLint, Prettier, and Angular ESLint
- **Documentation**: Comprehensive architectural guides and coding standards
- **Version Control**: Git with conventional commit messages

### Libraries & Utilities

- **Charts & Visualization**: ECharts via ngx-echarts
- **PDF Generation**: jsPDF with autotable support
- **CSV Processing**: PapaParse for data import/export
- **HTTP Client**: Angular HttpClient with custom interceptors

## 🏗️ Architecture Overview

MAD-AI follows Clean Architecture principles with a strict 5-layer structure:

```
🎨 Presentation Layer    ←  Angular Components, UI Services
     ↓ depends on
🚀 Application Layer     ←  Use Cases, Facades, State Management
     ↓ depends on
🧠 Domain Layer          ←  Entities, Value Objects, Business Rules
     ↑ implemented by
🔌 Infrastructure Layer  ←  API Clients, Repositories, External Services
     ↓ uses
🛠️ Core Layer            ←  Framework-agnostic Utilities (Logger, DateTime)
```

### Layer Responsibilities

| Layer              | Responsibility          | Key Components                                 |
| ------------------ | ----------------------- | ---------------------------------------------- |
| **Presentation**   | UI/UX, user interaction | Components, Pages, Layouts, UI Services        |
| **Application**    | Use case orchestration  | Use Cases, Facades, State Management           |
| **Domain**         | Pure business logic     | Entities, Value Objects, Repository Interfaces |
| **Infrastructure** | External integrations   | API Clients, Mappers, DTOs                     |
| **Core**           | Technical utilities     | Logger, DateTime, Validation Services          |

### Dependency Rules

- **Domain Layer**: Zero dependencies on other layers (pure business logic)
- **Core Layer**: Framework-agnostic utilities with no application dependencies
- **Application Layer**: Depends only on Domain and Core layers
- **Infrastructure Layer**: Implements Domain contracts, uses Core utilities
- **Presentation Layer**: Depends only on Application layer (through Facades)

## 📁 Project Structure

```
src/
├── app/
│   ├── application/          # Use Cases, Facades, Application Services
│   │   ├── facades/         # State management and UI interaction
│   │   ├── use-cases/       # Business use case orchestration
│   │   ├── services/        # Application-specific services
│   │   └── mappers/         # Domain to Application transformations
│   ├── domain/              # Pure business logic (framework-independent)
│   │   ├── entities/        # Business entities with identity
│   │   ├── value-objects/   # Immutable domain attributes
│   │   ├── repositories/    # Persistence contracts (interfaces)
│   │   ├── enums/          # Business classifications
│   │   └── errors/         # Domain-specific exceptions
│   ├── infrastructure/      # External integrations and concrete implementations
│   │   ├── http/           # API clients and HTTP interceptors
│   │   ├── repositories/   # Repository implementations
│   │   ├── dtos/           # Data Transfer Objects
│   │   ├── mappers/        # DTO ↔ Domain transformations
│   │   └── services/       # Technical service implementations
│   ├── presentation/        # UI components and user interaction
│   │   ├── pages/          # Smart Components (route components)
│   │   ├── shared/         # Reusable UI components
│   │   ├── layouts/        # Page layouts and shell components
│   │   └── services/       # UI-specific services
│   ├── core/               # Framework-agnostic utilities
│   │   ├── services/       # Technical utilities (Logger, DateTime)
│   │   └── interfaces/     # Core service contracts
│   └── di/                 # Dependency injection configuration
└── styles/                 # Global styles and design system
    ├── colors.css          # Custom color palette
    ├── components.css      # Reusable component styles
    └── globals.css         # Global CSS utilities
```

## 🚦 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sandovaldavid/MAD-AI.git
   cd MAD-AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Development Scripts

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `npm start`         | Start development server with hot reload    |
| `npm run build`     | Build the application for production        |
| `npm test`          | Run unit tests with Jest                    |
| `npm run test:ci`   | Run tests in CI mode (headless)             |
| `npm run lint`      | Run ESLint for code quality                 |
| `npm run format`    | Format code with Prettier                   |
| `npm run quality`   | Run all quality checks (lint, format, test) |
| `npm run serve:ssr` | Serve the SSR-enabled application           |

### Testing Commands

```bash
# Run all tests
npm test

# Run domain layer tests only
npm run test:domain

# Run infrastructure tests only
npm run test:infrastructure

# Run tests in CI mode
npm run test:ci

# Run tests with Docker
npm run docker:test
```

## 🧪 Testing Strategy

MAD-AI implements a comprehensive testing pyramid with specific coverage requirements:

### Testing Layers

| Layer                   | Coverage       | Tools                          | Speed      | Focus          |
| ----------------------- | -------------- | ------------------------------ | ---------- | -------------- |
| **E2E Tests**           | Critical paths | Cypress                        | Slow       | User workflows |
| **Component Tests**     | 85%            | Jest + TestBed                 | Fast       | UI behavior    |
| **Integration Tests**   | 80%            | Jest + HttpClientTestingModule | Medium     | API contracts  |
| **Orchestration Tests** | 95%            | Jest + Mocks                   | Very fast  | Use case logic |
| **Unit Tests**          | 100%           | Jest                           | Ultra-fast | Business logic |

### Testing Philosophy

- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Fast Feedback Loop**: Prioritize fast, isolated tests at the pyramid base
- **No External Dependencies**: Use mocking for all external systems
- **Layer-Appropriate Testing**: Each layer has specific testing strategies

## 🎨 Development Workflow

### Feature Development Process

When implementing new features, follow this mandatory 5-step workflow:

#### 1. Domain Contract Definition

- Define business entities and their methods in `/domain/entities`
- Create value objects for validation in `/domain/value-objects`
- Define repository interfaces if persistence is needed
- ⚠️ **Never implement business logic outside Domain entities**

#### 2. Infrastructure Implementation

- Implement repository interfaces using concrete technologies
- Create DTOs matching external API contracts
- Add API clients for external service communication
- Create mappers for DTO ↔ Domain transformations

#### 3. Application Orchestration

- Create use cases that orchestrate Domain entities
- Update facades for state management and UI interaction
- ⚠️ **Never implement business rules in Application layer**

#### 4. Presentation Implementation

- Create/update Smart Components (pages) that inject Facades
- Create/update Dumb Components using only @Input/@Output
- Follow Smart/Dumb component pattern religiously
- ⚠️ **Never inject Domain/Infrastructure services in Presentation**

#### 5. Testing Implementation

- Unit tests for Domain (100% coverage required)
- Orchestration tests for Application (95% coverage)
- Component tests for Presentation (85% coverage)
- Integration tests for Infrastructure (80% coverage)

### Code Quality Standards

- **Clean Code Principles**: Single responsibility, meaningful names, small functions
- **SOLID Principles**: Applied at component and service levels
- **DRY Principle**: Eliminate code duplication through proper abstractions
- **TypeScript Best Practices**: Strong typing, interface segregation
- **Angular Conventions**: OnPush change detection, reactive patterns

## 🎨 Styling Guidelines

### Design System

- **Color Palette**: Custom color system defined in `src/styles/colors.css`
- **Component Library**: Atomic design with reusable UI components
- **Dark Mode**: Full dark mode support with automatic theme switching
- **Accessibility**: WCAG 2.1 AA compliance with proper contrast ratios
- **Typography**: Consistent type scale and spacing system

### Tailwind CSS Implementation

- **Semantic Classes**: Use `@apply` directive for reusable component styles
- **Custom Color Palette**: Never use default Tailwind colors
- **Responsive Design**: Mobile-first approach with breakpoint consistency
- **Performance**: Purged CSS for optimal bundle size

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Standards

1. **Architecture Compliance**: Follow Clean Architecture principles strictly
2. **Code Quality**: All code must pass linting and formatting checks
3. **Testing Requirements**: Maintain coverage requirements for each layer
4. **Documentation**: Update documentation for architectural changes

### Pull Request Process

1. **Branch Naming**: Use conventional branch names (`feature/`, `bugfix/`, `hotfix/`)
2. **Commit Messages**: Follow conventional commit format
3. **Quality Checks**: Ensure all quality gates pass
4. **Code Review**: Undergo architectural review for layer compliance
5. **Testing**: Verify all tests pass and coverage requirements are met

### Code Review Checklist

- [ ] **No Architecture Violations**: Verify proper layer dependencies
- [ ] **Clean Code**: Meaningful names and single responsibility
- [ ] **Tests Implemented**: Appropriate tests for each layer
- [ ] **Reactive Patterns**: Proper state management through Facades
- [ ] **Error Handling**: Domain-specific error handling

### Getting Help

- **Architecture Questions**: Refer to [instruction files](.github/instructions/) for layer-specific guidance
- **Code Examples**: Check existing code for implementation patterns
- **Issue Reporting**: Use GitHub issues with proper labels and descriptions

## 📚 Documentation

### Architecture Documentation

- **[Domain Layer Guide](.github/instructions/domain.instructions.md)**: Entities, value objects, and business logic
- **[Application Layer Guide](.github/instructions/application.instructions.md)**: Use cases and facades
- **[Infrastructure Layer Guide](.github/instructions/infrastructure.instructions.md)**: External integrations
- **[Presentation Layer Guide](.github/instructions/presentation.instructions.md)**: Angular components and UI
- **[Testing Strategy Guide](.github/instructions/test.instructions.md)**: Comprehensive testing approach
- **[Style Guide](.github/instructions/style-guide.instructions.md)**: Tailwind CSS and design system

### Development Resources

- **[Master Copilot Instructions](.github/copilot-instructions.md)**: Complete development workflow
- **[API Documentation](docs/api/)**: Backend API specifications
- **[Implementation Guides](docs/info/)**: Detailed implementation guidance

## 🔧 Configuration

### Environment Setup

The application supports multiple environments with different configurations:

- **Development**: Hot reload, detailed error messages, development tools
- **Production**: Optimized builds, error tracking, performance monitoring
- **Testing**: Mocked services, controlled data, isolated test environment

### Docker Support

```bash
# Build and run unit tests
npm run docker:test:unit

# Build and run e2e tests
npm run docker:test:e2e

# Run all tests in Docker
npm run docker:test
```

## 📝 License

This project is part of an academic thesis and is intended for educational and research purposes. Please refer to the institution's guidelines for usage and distribution.

---

## 🏆 Architecture Excellence

This project demonstrates enterprise-grade Angular development with:

- ✅ **Clean Architecture**: Strict layer separation with zero business logic leakage
- ✅ **Domain-Driven Design**: Rich domain models with encapsulated business logic
- ✅ **Comprehensive Testing**: Full testing pyramid with appropriate coverage
- ✅ **Code Quality**: Automated linting, formatting, and quality gates
- ✅ **Accessibility**: WCAG 2.1 AA compliant with inclusive design
- ✅ **Performance**: Optimized builds with SSR and lazy loading
- ✅ **Maintainability**: Clear architectural boundaries and documentation

---

**Built with ❤️ by [sandovaldavid](https://github.com/sandovaldavid) using Clean Architecture principles**
