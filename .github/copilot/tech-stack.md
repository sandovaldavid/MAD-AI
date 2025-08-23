# Technology Stack Blueprint: MAD-AI

**Generated:** August 22, 2025

---

## 1. Technology Identification Phase

-   **Primary Technology:** Angular 20.1.6 (core, forms, router, SSR, CLI, build, compiler)
-   **Programming Language:** TypeScript (ES2022, strict mode)
-   **Reactive Library:** RxJS 7.8.0
-   **SSR:** Express 5.1.0
-   **Styling:** Tailwind CSS 4.1.11
-   **Visualization:** Chart.js 4.5.0, ng2-charts 8.0.0
-   **Testing:** Jasmine ~5.7.0, Karma ~6.4.0
-   **Other:** Zone.js, FontAwesome, PostCSS
-   **Build Tooling:** Angular CLI 20.0.2, PostCSS 8.5.6
-   **Transpiler:** TypeScript 5.8.2

**Version Information:**

-   All versions extracted from `package.json` and config files

---

## 2. Core Technologies Analysis

### Angular Stack

-   **Framework:** Angular 20.1.6
-   **Modules:** Feature-based, layered (Presentation, Application, Domain, Infrastructure, Core, Shared)
-   **SSR:** Express integration via `@angular/platform-server` and custom server.ts
-   **Routing:** Angular Router
-   **State Management:** RxJS signals, facades
-   **Styling:** Tailwind CSS, modular CSS files
-   **Testing:** Jasmine, Karma, Puppeteer
-   **Build:** Angular CLI, PostCSS

### TypeScript

-   **Version:** 5.8.2
-   **Config:** Strict mode, ES2022 target, path aliases for modular imports

### Express

-   **Version:** 5.1.0
-   **Usage:** SSR server, API integration

### Chart.js & ng2-charts

-   **Version:** Chart.js 4.5.0, ng2-charts 8.0.0
-   **Usage:** Dashboard and data visualization

### RxJS

-   **Version:** 7.8.0
-   **Usage:** Reactive state, async flows

### Tailwind CSS

-   **Version:** 4.1.11
-   **Usage:** Utility-first styling, custom color palette

### Jasmine & Karma

-   **Version:** Jasmine ~5.7.0, Karma ~6.4.0
-   **Usage:** Unit and integration testing

---

## 3. Implementation Patterns & Conventions

### Naming Conventions

-   **Classes/Types:** PascalCase (e.g., `UserEntity`, `AuthFacade`)
-   **Methods/Functions:** camelCase (e.g., `getUser`, `refreshProfile`)
-   **Variables:** camelCase
-   **Files:** kebab-case for assets/styles, PascalCase for components
-   **Interfaces:** Prefix `I` or suffix `Contract` (e.g., `UserContract`)

### Code Organization

-   **Folder Hierarchy:** Layered (Presentation, Application, Domain, Infrastructure, Core, Shared)
-   **Feature Grouping:** Features in `presentation/features/`, logic in corresponding layer
-   **Component Boundaries:** Standalone/shared components in `shared/components/`
-   **Separation of Concerns:** UI, business logic, domain, data access, cross-cutting concerns

### Common Patterns

-   **Error Handling:** ApplicationErrorTransformer, try/catch in use cases and repositories
-   **Logging:** NotificationsFacade, error reporting
-   **Configuration:** Environment files in `src/env/`, DI tokens/providers
-   **Authentication:** AuthFacade, guards, session entity
-   **Validation:** Use case and entity factory validation
-   **Testing:** Co-located unit tests, output test folder, mocks for HTTP

---

## 4. Usage Examples

### API Implementation Example

```typescript
// Facade
@Injectable({ providedIn: 'root' })
export class AuthFacade {
    async login(data: LoginRequest): Promise<Session> {
        return await this.loginUC.execute(data);
    }
}
// Use Case
@Injectable({ providedIn: 'root' })
export class LoginWithCredentials {
    async execute(data: LoginRequest): Promise<Session> {
        // Validate, call repository, handle errors
    }
}
// Repository
@Injectable()
export class HttpAuthRepository {
    async login(data: LoginRequest): Promise<Session> {
        // HTTP POST, error handling
    }
}
```

### Data Access Example

```typescript
@Injectable()
export class HttpUserRepository {
    async create(userData: CreateUserContract): Promise<User> {
        // HTTP POST, error handling, DTO mapping
    }
}
```

### Service Layer Example

```typescript
@Injectable({ providedIn: 'root' })
export class CreateUser {
    async execute(userData: CreateUserContract): Promise<User> {
        // Validate, call repository, handle side effects
    }
}
```

### UI Component Example

```typescript
@Component({ ... })
export class Dashboard {
  async ngOnInit() {
    await this.authFacade.refreshProfile();
  }
}
```

---

## 5. Technology Stack Map

### Core Framework Usage

-   **Angular:** Feature-based, layered, SSR, RxJS signals, modular CSS
-   **TypeScript:** Strict, ES2022, path aliases
-   **Express:** SSR server, API integration
-   **Chart.js/ng2-charts:** Visualization
-   **Tailwind CSS:** Utility-first styling
-   **Jasmine/Karma:** Testing

### Integration Points

-   **SSR:** Angular + Express
-   **State:** RxJS signals, facades
-   **Data:** HTTP repositories, DTO mapping
-   **Testing:** Jasmine/Karma, Puppeteer

### Development Tooling

-   **IDE:** VS Code (settings, tasks)
-   **Linters/Formatters:** Angular CLI, Prettier
-   **Build/Deploy:** Angular CLI, PostCSS, npm scripts
-   **Testing:** Jasmine, Karma, Puppeteer

### Infrastructure

-   **Deployment:** Output in `dist/`, SSR server
-   **Containerization:** (Recommended) Docker
-   **Cloud Services:** (Recommended) for scaling
-   **Monitoring/Logging:** (Recommended) via external services

---

## 6. Technology-Specific Implementation Details

### Angular Implementation Details

-   **Dependency Injection:** Providers/tokens in `di/`, injectable services
-   **Component Patterns:** Standalone/shared, OnPush change detection
-   **Routing:** Angular Router, route guards
-   **State Management:** RxJS signals, facades
-   **Error Handling:** ApplicationErrorTransformer, notifications
-   **Testing:** Jasmine/Karma, co-located tests

### TypeScript Implementation Details

-   **Strict Mode:** Enforced in `tsconfig.json`
-   **Path Aliases:** Modular imports
-   **Target:** ES2022

### Express Implementation Details

-   **SSR Server:** Custom server.ts, integration with Angular

---

## 7. Technology Relationship Diagrams

### Stack Diagram

```
+-------------------+
|   Angular (UI)    |
+-------------------+
          ↓
+-------------------+
|   RxJS Signals    |
+-------------------+
          ↓
+-------------------+
|   Facades/UseCases|
+-------------------+
          ↓
+-------------------+
|   Repositories    |
+-------------------+
          ↓
+-------------------+
|   Express (SSR)   |
+-------------------+
```

### Dependency Flow

```
Angular UI → Facades → Use Cases → Repositories → Express SSR → Backend API
```

### Component Relationships

-   UI components depend on facades for state/actions
-   Facades orchestrate use cases
-   Use cases validate and call repositories
-   Repositories handle HTTP/data access
-   SSR server integrates Angular and Express

### Data Flow

-   User input → UI → Facade → Use Case → Repository → Backend → Response → UI

---

## 8. Technology Decision Context

-   **Angular:** Chosen for robust ecosystem, SSR, modularity
-   **TypeScript:** Strict typing, maintainability
-   **Express:** SSR integration
-   **RxJS:** Reactive state management
-   **Tailwind CSS:** Rapid UI development
-   **Jasmine/Karma:** Testing standards
-   **Chart.js/ng2-charts:** Visualization needs
-   **Containerization/Cloud:** Recommended for scaling and deployment
-   **Upgrade Paths:** Keep Angular, TypeScript, and dependencies up to date for security and features

---

**Format:** Markdown, categorized by Technology Type

**Maintain this blueprint as technologies evolve. Last updated: August 22, 2025.**
