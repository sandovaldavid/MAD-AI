# Project Folders Structure Blueprint

**Document Version:** 1.0  
**Generated:** December 2024  
**Project:** MAD-AI (Angular + Clean Architecture + DDD)  
**Purpose:** Comprehensive folder structure documentation and organizational guidelines

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Structure Overview](#project-structure-overview)
3. [Root Directory Structure](#root-directory-structure)
4. [Source Code Organization](#source-code-organization)
5. [Clean Architecture Layer Mapping](#clean-architecture-layer-mapping)
6. [Feature Organization Patterns](#feature-organization-patterns)
7. [File Naming Conventions](#file-naming-conventions)
8. [Directory Guidelines](#directory-guidelines)
9. [Shared Resources Organization](#shared-resources-organization)
10. [Infrastructure and Tooling](#infrastructure-and-tooling)
11. [Documentation Structure](#documentation-structure)
12. [Templates and Examples](#templates-and-examples)

---

## Executive Summary

The MAD-AI project follows a meticulously organized folder structure that enforces Clean Architecture principles with Domain-Driven Design (DDD) patterns. The structure promotes maintainability, scalability, and clear separation of concerns across **124 directories** containing **364 source files** (TypeScript, HTML, CSS).

### Key Architectural Principles
- **Layer Separation**: Clear boundaries between domain, application, infrastructure, and presentation layers
- **Feature-First Organization**: Business capabilities organized as self-contained feature modules
- **Shared Resource Management**: Centralized UI components, utilities, and cross-cutting concerns
- **Convention-Based Structure**: Consistent naming and organization patterns throughout the codebase

---

## Project Structure Overview

```
MAD-AI/
├── 📁 .github/                    # GitHub workflows and templates
├── 📁 .angular/                   # Angular CLI cache and build artifacts
├── 📁 docs/                       # Project documentation
├── 📁 public/                     # Static assets and resources
├── 📁 scripts/                    # Build scripts and tooling
├── 📁 src/                        # Source code (main application)
├── 📄 angular.json                # Angular CLI configuration
├── 📄 package.json                # Dependencies and scripts
├── 📄 tsconfig.json               # TypeScript configuration
└── 📄 README.md                   # Project overview
```

### Statistics
- **Total Directories**: 124
- **Source Files**: 364 (TS/HTML/CSS)
- **Architecture Layers**: 7 main layers
- **Feature Modules**: 4 business domains
- **Shared Components**: 6 UI component families

---

## Root Directory Structure

### Development Infrastructure
```
├── 📁 .github/
│   ├── instructions/              # Copilot AI instructions
│   └── workflows/                 # CI/CD pipeline definitions
├── 📁 .angular/                   # Angular CLI generated files
├── 📁 scripts/
│   └── lint-icons.cjs             # Custom SVG icon linting
```

### Documentation and Assets
```
├── 📁 docs/
│   ├── styles_guide.md            # UI/UX style guidelines
│   └── workflow.md                # Development workflow
├── 📁 public/
│   ├── bg-placeholder.webp        # Static images
│   └── favicon.ico                # Browser icon
```

### Configuration Files
```
├── 📄 angular.json                # Angular workspace configuration
├── 📄 karma.conf.cjs              # Testing framework config
├── 📄 package.json                # NPM dependencies
├── 📄 tsconfig.json               # TypeScript compiler config
├── 📄 tsconfig.app.json           # App-specific TS config
└── 📄 tsconfig.spec.json          # Test-specific TS config
```

---

## Source Code Organization

### Primary Source Structure
```
src/
├── 📄 index.html                  # Main HTML template
├── 📄 main.ts                     # Application bootstrap
├── 📄 main.server.ts              # SSR bootstrap
├── 📄 server.ts                   # Express server setup
├── 📄 styles.css                  # Global styles
├── 📁 app/                        # Main application code
├── 📁 env/                        # Environment configurations
├── 📁 styles/                     # CSS architecture
└── 📁 types/                      # Global type definitions
```

### Application Architecture (`src/app/`)
```
app/
├── 📄 app.ts                      # Root component
├── 📄 app.html                    # Root template
├── 📄 app.css                     # Root styles
├── 📄 app.config.ts               # Application configuration
├── 📄 app.routes.ts               # Routing configuration
├── 📁 application/                # Application layer (Clean Architecture)
├── 📁 core/                       # Cross-cutting concerns
├── 📁 di/                         # Dependency injection setup
├── 📁 domain/                     # Domain layer (business logic)
├── 📁 infrastructure/             # Infrastructure layer (external concerns)
├── 📁 presentation/               # Presentation layer (UI)
└── 📁 shared/                     # Shared resources and utilities
```

---

## Clean Architecture Layer Mapping

### Layer 1: Domain (`src/app/domain/`)
**Purpose**: Core business logic and rules, framework-agnostic

```
domain/
├── contracts/                     # Interfaces and ports
│   ├── auth.contract.ts
│   ├── role.contract.ts
│   ├── user.contract.ts
│   ├── export.port.ts
│   └── session-store.contract.ts
├── entities/                      # Business entities
│   ├── notification.entity.ts
│   ├── role.entity.ts
│   └── user.entity.ts
├── enums/                         # Domain enumerations
├── errors/                        # Domain-specific errors
├── events/                        # Domain events
├── repositories/                  # Repository interfaces
└── value-objects/                 # Value objects
```

### Layer 2: Application (`src/app/application/`)
**Purpose**: Application services and use cases orchestration

```
application/
├── facades/                       # Application service facades
│   ├── auth.facade.ts
│   ├── notifications.facade.ts
│   ├── roles.facade.ts
│   └── users.facade.ts
├── services/                      # Application services
│   ├── domain-event-processor.service.ts
│   └── role-export.service.ts
├── types/                         # Application-layer types
│   ├── auth.types.ts
│   ├── facade-opts.ts
│   ├── notifications.types.ts
│   └── user.types.ts
├── use-cases/                     # Business use case implementations
│   ├── auth/
│   ├── notifications/
│   ├── roles/
│   └── users/
└── errors/                        # Application error handling
    ├── application-error.ts
    ├── application-error.transformer.ts
    └── feature-handlers/
```

### Layer 3: Infrastructure (`src/app/infrastructure/`)
**Purpose**: External systems integration and technical implementations

```
infrastructure/
├── dtos/                          # Data transfer objects
├── errors/                        # Infrastructure error handling
├── http/                          # HTTP client implementations
├── mappers/                       # Data mapping utilities
├── repositories/                  # Repository implementations
└── services/                      # External service integrations
```

### Layer 4: Presentation (`src/app/presentation/`)
**Purpose**: User interface and presentation logic

```
presentation/
├── features/                      # Feature-specific UI modules
│   ├── auth/                      # Authentication UI
│   ├── dashboard/                 # Dashboard UI
│   ├── not-found/                 # 404 error page
│   ├── roles/                     # Role management UI
│   └── secured.routes.ts          # Protected routing
├── layouts/                       # Page layout components
├── navigation/                    # Navigation components
└── shell/                         # Application shell
```

---

## Feature Organization Patterns

### Feature Module Structure
Each feature follows a consistent internal organization:

```
feature-name/
├── components/                    # Feature-specific components
│   ├── feature-list/
│   ├── feature-form/
│   └── feature-detail/
├── pages/                         # Route-level page components
│   ├── feature-list.page.ts
│   ├── feature-create.page.ts
│   └── feature-edit.page.ts
├── services/                      # Feature-specific services
├── types/                         # Feature-specific types
└── feature.routes.ts              # Feature routing configuration
```

### Example: Authentication Feature
```
auth/
├── components/
│   ├── login-form/
│   ├── register-form/
│   └── password-reset/
├── pages/
│   ├── login.page.ts
│   ├── register.page.ts
│   └── password-reset.page.ts
└── auth.routes.ts
```

---

## File Naming Conventions

### Component Files
```
component-name/
├── component-name.ts              # Component class
├── component-name.html            # Template
├── component-name.css             # Styles
├── component-name.spec.ts         # Unit tests
└── index.ts                       # Barrel export
```

### Service and Utility Files
```
service-name.service.ts            # Angular services
utility-name.util.ts               # Utility functions
helper-name.helper.ts              # Helper functions
mapper-name.mapper.ts              # Data mappers
contract-name.contract.ts          # Domain contracts
entity-name.entity.ts              # Domain entities
```

### Route and Configuration Files
```
feature-name.routes.ts             # Routing configuration
feature-name.config.ts             # Feature configuration
feature-name.types.ts              # Type definitions
feature-name.constants.ts          # Constants
```

---

## Directory Guidelines

### Core Principles

1. **Layer Separation**: Never import from higher layers to lower layers
2. **Feature Cohesion**: Keep related functionality grouped together
3. **Shared Resources**: Centralize reusable components and utilities
4. **Clear Boundaries**: Use index.ts files for controlled exports

### Naming Rules

| Type | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `user-management/` |
| Components | PascalCase files | `UserCard.ts` |
| Services | camelCase + .service | `userAuth.service.ts` |
| Types | camelCase + .types | `userAuth.types.ts` |
| Constants | UPPER_CASE | `API_ENDPOINTS.ts` |

### Directory Structure Rules

#### ✅ Correct Patterns
```
# Feature-first organization
presentation/features/auth/components/login-form/

# Clear layer separation
domain/entities/user.entity.ts
application/facades/user.facade.ts
infrastructure/repositories/user.repository.ts

# Shared resource centralization
shared/ui/button/
shared/components/error-view/
```

#### ❌ Avoid These Patterns
```
# Cross-layer imports
domain/entities/importing-from-infrastructure.ts

# Scattered utilities
random-util-in-feature-folder.ts

# Deep nesting without purpose
deep/nested/structure/without/clear/purpose/
```

---

## Shared Resources Organization

### UI Components (`src/app/shared/ui/`)
**Purpose**: Reusable UI building blocks

```
ui/
├── button/                        # Button variations
├── form-field/                    # Form input components
├── icon/                          # Icon system
├── input/                         # Input field variants
├── theme-toggle/                  # Dark/light mode toggle
└── bulk-actions-toolbar/          # Bulk action controls
```

### Shared Components (`src/app/shared/components/`)
**Purpose**: Complex reusable components

```
components/
├── toast/                         # Notification system
│   ├── types/                     # Toast type definitions
│   ├── services/                  # Toast service
│   ├── mappers/                   # Data mapping
│   ├── enums/                     # Toast enumerations
│   ├── models/                    # Toast models
│   ├── toast-item/                # Individual toast component
│   └── toast-container/           # Toast container
├── error-view/                    # Error display components
│   ├── components/
│   │   ├── error-icon/
│   │   ├── error-actions/
│   │   └── error-details/
│   └── error-display/
├── page-header/                   # Page header component
└── optimized-image/               # Image optimization component
```

### Assets (`src/app/shared/assets/`)
**Purpose**: Static resources and icons

```
assets/
└── icons/
    ├── outline/                   # Outline icon variants
    └── filled/                    # Filled icon variants
```

---

## Infrastructure and Tooling

### Cross-Cutting Concerns (`src/app/core/`)
```
core/
├── cross-cutting/                 # Shared utilities
│   ├── http/                      # HTTP utilities
│   ├── ui-state/                  # UI state management
│   └── utilities/                 # General utilities
├── guards/                        # Route guards
│   ├── auth.guard.ts
│   ├── email-confirmed.guard.ts
│   ├── matchers.guard.ts
│   └── role.guard.ts
└── interceptors/                  # HTTP interceptors
    ├── error.interceptor.ts
    └── http-error.interceptor.ts
```

### Dependency Injection (`src/app/di/`)
**Purpose**: Centralized DI configuration

```
di/
├── provide-auth.ts                # Authentication providers
├── provide-domain-events.ts       # Domain event providers
├── provide-export.ts              # Export service providers
├── provide-icons.ts               # Icon system providers
├── provide-notifications.ts       # Notification providers
├── provide-roles.ts               # Role management providers
├── provide-users.ts               # User management providers
└── tokens.ts                      # DI tokens
```

---

## Documentation Structure

### Project Documentation (`docs/`)
```
docs/
├── styles_guide.md                # UI/UX guidelines
└── workflow.md                    # Development workflow
```

### Generated Documentation
```
# Auto-generated during build
Project_Architecture_Blueprint.md
Technology_Stack_Blueprint.md
Project_Folders_Structure_Blueprint.md
```

---

## Templates and Examples

### New Feature Template
When creating a new feature, follow this structure:

```bash
# Create feature structure
mkdir -p src/app/presentation/features/new-feature/{components,pages,services,types}
mkdir -p src/app/application/use-cases/new-feature
mkdir -p src/app/domain/entities
mkdir -p src/app/infrastructure/repositories

# Create core files
touch src/app/presentation/features/new-feature/new-feature.routes.ts
touch src/app/application/facades/new-feature.facade.ts
touch src/app/domain/contracts/new-feature.contract.ts
touch src/app/infrastructure/repositories/new-feature.repository.ts
touch src/app/di/provide-new-feature.ts
```

### Component Template
```typescript
// src/app/shared/ui/new-component/new-component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-new-component',
  templateUrl: './new-component.html',
  styleUrls: ['./new-component.css'],
  standalone: true
})
export class NewComponent {
  @Input() data: any;
  @Output() action = new EventEmitter<any>();
}
```

### Service Template
```typescript
// src/app/application/services/new-service.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewService {
  // Service implementation
}
```

### Folder Creation Checklist

When adding new functionality:

- [ ] Create feature folder in appropriate layer
- [ ] Add barrel exports (`index.ts`)
- [ ] Update DI providers if needed
- [ ] Add to routing configuration
- [ ] Create corresponding test files
- [ ] Update documentation

---

## Best Practices Summary

### Organizational Principles
1. **Layer Separation**: Maintain clean boundaries between architectural layers
2. **Feature Cohesion**: Group related functionality together
3. **Shared Resources**: Centralize reusable components and utilities
4. **Clear Exports**: Use barrel files for controlled module exports

### Maintenance Guidelines
1. **Regular Cleanup**: Remove unused files and directories
2. **Consistent Naming**: Follow established naming conventions
3. **Documentation**: Keep folder structure documentation updated
4. **Architecture Compliance**: Validate layer dependencies regularly

### Development Workflow
1. **Plan Structure**: Design folder organization before implementation
2. **Follow Templates**: Use established patterns for new features
3. **Review Changes**: Validate structural changes against architecture
4. **Update Documentation**: Keep structure documentation current

---

**Last Updated**: December 2024  
**Next Review**: Quarterly or when major structural changes occur
