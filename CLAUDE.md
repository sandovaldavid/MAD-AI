# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Common Development Commands

### Development Workflow
```bash
npm start                    # Run development server (port 4200)
npm run build               # Build for production with SSR
npm run watch               # Build with watch mode for development
npm run serve:ssr           # Serve SSR build locally
```

### Testing Commands
```bash
npm test                    # Run all tests with watch mode
npm run test:ci             # Run all tests once (for CI)
npm run test:domain         # Run domain layer tests only
npm run test:core           # Run core layer tests only
npm run test:application    # Run application layer tests only
npm run test:infrastructure # Run infrastructure layer tests only
npm run test:presentation   # Run presentation layer tests only

# Run specific test file
npm test -- --include="**/filename.spec.ts" --watch=false
```

### Code Quality
```bash
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint issues automatically
npm run format              # Format code with Prettier
npm run format:check        # Check formatting without changes
npm run quality             # Run full quality suite (lint + format + icons + test)
npm run quality:fix         # Fix all quality issues automatically

# Lint specific files or directories
npx eslint [path-from-src]  # Lint specific file or directory
# Examples:
npx eslint src/app/domain/entities/user.entity.ts    # Lint specific file
npx eslint src/app/domain/entities/                  # Lint entire directory
npx eslint src/app/application/                      # Lint application layer
```

### Icon Management
```bash
npm run icons:lint          # Lint icon usage
npm run icons:fix           # Fix icon issues
npm run icons:dry           # Preview icon fixes without applying
```

### Git Hooks
- `precommit`: Automatically runs `quality:fix`
- `prepush`: Automatically runs `test:ci`

## 🏗️ Architecture Overview

This is a **Clean Architecture** Angular application with **Domain-Driven Design** principles, implementing strict layer separation and dependency inversion.

### Layer Structure
```
src/app/
├── domain/           # Business entities, value objects, repository contracts
├── application/      # Use cases, facades, services, mappers
├── infrastructure/   # External integrations, HTTP clients, data persistence
├── presentation/     # Components, pages, UI services, guards
├── core/            # Framework-specific shared utilities
├── di/              # Dependency injection configuration
```

### Key Architectural Patterns

#### 1. Clean Architecture Layers
- **Domain**: Pure business logic, no external dependencies
- **Application**: Use cases and business workflows
- **Infrastructure**: External services, HTTP, storage
- **Presentation**: Angular components and UI logic

#### 2. Repository Pattern
- Domain defines repository contracts/interfaces
- Infrastructure implements concrete repositories
- Application layer uses repositories through contracts

#### 3. Use Case Pattern
- Each business operation is a separate use case class
- Located in `application/use-cases/`
- Example: `LoginUseCase`, `CreateUserUseCase`

#### 4. Facade Pattern
- Application facades expose simplified APIs to presentation layer
- Located in `application/facades/`
- Example: `AuthFacade`, `UsersFacade`, `RolesFacade`

### TypeScript Path Aliases
- `@domain/*` → `src/app/domain/*`
- `@application/*` → `src/app/application/*`
- `@infrastructure/*` → `src/app/infrastructure/*`
- `@presentation/*` → `src/app/presentation/*`
- `@core/*` → `src/app/core/*`
- `@di/*` → `src/app/di/*`
- `@components/*` → `src/app/presentation/shared/components/*`

## 🎨 UI and Styling

### Tailwind CSS v4.1
- **MANDATORY**: Only use colors defined in `src/styles/colors.css`
- **NEVER** use direct hex codes or default Tailwind colors
- Use `@apply` directive for reusable component styles
- Support both light and dark themes

### Color Palette Usage
```css
/* ✅ CORRECT */
.btn-primary { @apply bg-primary-500 text-white hover:bg-primary-700; }

/* ❌ INCORRECT */
.btn-wrong { background-color: #3b82f6; }
.btn-wrong { @apply bg-blue-500; }
```

### Component CSS Structure
```css
@reference '../../../../styles.css';

.component-name {
    @apply base-utilities display-utilities spacing-utilities;
}
```

## 🧪 Testing Strategy

### Layer-Specific Testing Approach

#### Domain Layer Tests
- **Type**: Pure unit tests (no mocks, no frameworks)
- **Coverage Target**: 100% (mandatory for business logic)
- **Focus**: Business rules, entity behavior, value object validation
- **Framework**: Karma + Jasmine (no external dependencies)

#### Application Layer Tests  
- **Type**: Unit tests with spies and mocks
- **Coverage Target**: 95% (use case orchestration)
- **Focus**: Use case workflows, service orchestration, error handling
- **Framework**: Karma + Jasmine with extensive mocking

#### Infrastructure Layer Tests
- **Type**: Integration tests with HTTP mocking
- **Coverage Target**: 85% (API integration and mappers)
- **Focus**: API integration, data transformation, error handling
- **Framework**: Karma + Jasmine + HttpClientTestingModule

#### Presentation Layer Tests
- **Type**: Component tests with Karma + Jasmine + TestBed
- **Coverage Target**: 80% (updated from project requirements)
- **Focus**: User interactions, rendering, navigation

### Testing Framework Configuration
- **Unit/Integration Tests**: Karma + Jasmine (configured in angular.json)
- **E2E Tests**: Cypress
- **Test Runner**: `npm test` (uses Karma)
- **CI Tests**: `npm run test:ci` (single run mode)

### Coverage Requirements by Layer
- **Domain Layer**: 100% (mandatory - pure business logic)
- **Application Layer**: 95% (use cases and facades orchestration)
- **Infrastructure Layer**: 85% (API integration and data transformation)
- **Presentation Layer**: 80% (component behavior and user interactions)

### Running Specific Test Suites
```bash
# Test specific architectural layers
npm run test:domain         # Domain layer tests (100% coverage target)
npm run test:core           # Core layer tests 
npm run test:application    # Application layer tests (95% coverage target)
npm run test:infrastructure # Infrastructure layer tests (85% coverage target)  
npm run test:presentation   # Presentation layer tests (80% coverage target)

# Test specific files
npm test -- --include="**/user.entity.spec.ts" --watch=false
npm test -- --include="**/auth.facade.spec.ts" --watch=false

# Test specific patterns or directories
npm test -- --include="src/app/application/**/*.spec.ts" --watch=false
npm test -- --include="src/app/domain/entities/**/*.spec.ts" --watch=false
```

## 📁 Directory Patterns and Conventions

### Domain Layer Structure
```
domain/
├── entities/           # Business entities with behavior
├── value-objects/      # Immutable values with validation  
├── repositories/       # Repository contracts/interfaces
├── errors/            # Domain-specific errors
├── enums/             # Business enums and constants
```

### Application Layer Structure
```
application/
├── use-cases/         # Business use case implementations
├── facades/           # Simplified APIs for presentation
├── services/          # Application services and coordination
├── mappers/           # Data transformation between layers
├── types/             # Application-specific types
```

### Presentation Layer Structure
```
presentation/
├── pages/             # Route components and page layouts
├── shared/
│   ├── components/    # Reusable UI components
│   └── icons/         # Icon components
├── services/          # UI-specific services (theme, layout)
├── guards/            # Route guards
└── mappers/           # Presentation-specific data transformation
```

## 🔧 Development Guidelines

### Clean Architecture Rules
1. **Dependency Direction**: Outer layers depend on inner layers, never reverse
2. **Domain Purity**: Domain layer has NO external dependencies
3. **Interface Segregation**: Use specific contracts, not generic ones
4. **Business Logic Location**: All business rules belong in Domain layer

### Code Quality Standards
- **ESLint + Prettier**: Mandatory formatting and linting
- **Strict TypeScript**: All `strict` compiler options enabled
- **No `any` types**: Use proper typing throughout
- **Accessibility**: Follow WCAG guidelines, test contrast ratios

### Development Best Practices
- **Lint after editing**: Always run `npx eslint [file-path]` after modifying files
- **Quality gates**: Code must pass `npm run quality` before committing
- **Test coverage**: Maintain layer-specific coverage requirements
- **Architectural compliance**: Use `clean-architecture-guardian` for validation

### Naming Conventions
- **Components**: PascalCase (`UserListComponent`)
- **Files**: kebab-case (`user-list.component.ts`)
- **Classes**: PascalCase (`UserEntity`, `LoginUseCase`)
- **Interfaces**: PascalCase with descriptive names (`UserRepository`)
- **CSS Classes**: BEM-like methodology (`.btn--primary`)

## 🔄 Angular-Specific Patterns

### Dependency Injection Configuration
- DI providers are organized in `src/app/di/` directory
- Each feature has its own provider function
- Example: `provideAuth()`, `provideUsers()`, `provideRoles()`

### Routing Structure
- Public routes in `app.routes.ts`
- Protected routes in `presentation/pages/secured.routes.ts`
- Route guards protect sensitive areas

### HTTP Interceptors
- Authentication interceptor automatically adds bearer tokens
- Located in `infrastructure/http/interceptors/`

## 📚 Documentation and Implementation Guides

### Layer-Specific Implementation Guides (`docs/info/`)
- **[guide-domain.md](docs/info/guide-domain.md)**: Entities, value objects, business rules, domain services
- **[guide-application.md](docs/info/guide-application.md)**: Use cases, facades, application orchestration
- **[guide-infrastructure.md](docs/info/guide-infrastructure.md)**: Repositories, HTTP clients, mappers, external integrations
- **[guide-presentation.md](docs/info/guide-presentation.md)**: Angular components, Smart/Dumb patterns, UI services
- **[guide-core.md](docs/info/guide-core.md)**: Framework-agnostic utilities and cross-cutting concerns
- **[guide-test-implementation.md](docs/info/guide-test-implementation.md)**: Karma/Jasmine testing strategies by architectural layer
- **[guide-styles.md](docs/info/guide-styles.md)**: Tailwind CSS implementation and design system
- **[guide-implementation.md](docs/info/guide-implementation.md)**: General implementation patterns and best practices

### Architectural Implementation Rules (`.github/instructions/`)
- **[domain.instructions.md](.github/instructions/domain.instructions.md)**: Strict domain layer implementation rules
- **[application.instructions.md](.github/instructions/application.instructions.md)**: Application orchestration patterns
- **[infrastructure.instructions.md](.github/instructions/infrastructure.instructions.md)**: Infrastructure integration guidelines
- **[presentation.instructions.md](.github/instructions/presentation.instructions.md)**: Smart/Dumb component patterns and UI guidelines
- **[test.instructions.md](.github/instructions/test.instructions.md)**: Comprehensive testing requirements by layer
- **[style-guide.instructions.md](.github/instructions/style-guide.instructions.md)**: MAD-AI design system rules
- **[diagramas-layers.md](docs/info/diagramas-layers.md)**: Architecture diagrams and layer visualization

### API Documentation (`docs/api/`)
- **[users.api.md](docs/api/users.api.md)**: User management API specifications

## 🤖 Specialized Agents (`.claude/agents/`)

### When to Use Each Agent

#### `clean-architecture-guardian`
**Use when**: Validating architectural compliance, reviewing new code, refactoring
- Validates Clean Architecture principles and DDD patterns
- Ensures proper layer separation and dependency direction
- Reviews domain logic purity and framework independence
- Prevents over-engineering and unnecessary complexity

**Examples**:
```
// When creating new components
"I just created a UserService class that handles user registration"
→ Use clean-architecture-guardian to validate architectural compliance

// When refactoring
"I refactored the payment processing logic to separate concerns"
→ Use clean-architecture-guardian to ensure architectural standards
```

#### `test-implementer`
**Use when**: Implementing tests for any architectural layer
- Creates layer-appropriate testing strategies
- Implements comprehensive test suites with proper coverage
- Handles mocking and test isolation patterns
- Validates business logic through appropriate test types

**Examples**:
```
// Domain layer testing
"I created a UserEntity with validation rules, need tests"
→ Use test-implementer for pure unit tests focused on business logic

// Infrastructure layer testing
"I finished implementing the UserRepository, what tests should I write?"
→ Use test-implementer for integration tests with HTTP mocking
```

## 🔍 When Working with This Codebase

### Before Making Changes
1. **Identify the Layer**: Determine which architectural layer your change belongs to
2. **Consult Layer Guide**: Review the appropriate `docs/info/guide-*.md` for implementation patterns
3. **Check Dependencies**: Ensure you're not violating dependency rules using the architecture diagrams
4. **Review Instructions**: Check relevant `.github/instructions/` files for additional layer-specific guidance

### Development Workflow
1. **Domain First**: Always start with domain entities and business rules (`guide-domain.md`)
2. **Application Orchestration**: Create use cases and facades (`guide-application.md`)
3. **Infrastructure Integration**: Implement repositories and external services (`guide-infrastructure.md`)
4. **Presentation Layer**: Build UI components following Smart/Dumb patterns (`guide-presentation.md`)
5. **Comprehensive Testing**: Use layer-appropriate testing strategies (`guide-test-implementation.md`)

### Quality Gates
- All code must pass `npm run quality` before committing
- Tests must pass `npm run test:ci` before pushing
- **Mandatory**: Use `clean-architecture-guardian` agent for architectural validation
- **Recommended**: Use `test-implementer` agent for comprehensive test coverage
- Consult layer-specific guides in `docs/info/` for implementation details

### Quick Reference
- **New Feature**: `guide-implementation.md` → Domain → Application → Infrastructure → Presentation
- **Bug Fix**: Identify layer → Consult layer guide → Maintain architectural boundaries
- **Refactoring**: Use `clean-architecture-guardian` → Follow layer-specific patterns
- **Testing**: Use `test-implementer` → Follow `guide-test-implementation.md`
- **Styling**: Follow `guide-styles.md` and custom color palette in `src/styles/colors.css`

This codebase prioritizes maintainability, testability, and business logic clarity through strict architectural boundaries supported by comprehensive documentation and specialized agents.