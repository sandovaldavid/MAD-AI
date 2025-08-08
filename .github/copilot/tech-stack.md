# Technology Stack Blueprint: MAD-AI Angular Project

**Generated:** August 8, 2025

---

## 1. Technology Identification Phase

### Technology Type: Frontend Framework

- **Angular**: v20.1.6 (core, forms, router, SSR, CLI, build, compiler)
- **TypeScript**: Target ES2022, strict mode
- **RxJS**: v7.8.0
- **Zone.js**: v0.15.0

### Technology Type: UI Libraries

- **FontAwesome**: v2.0.1 (Angular wrapper), v6.7.2 (icons)
- **Tailwind CSS**: v4.1.11 (with PostCSS v8.5.6)
- **Chart.js**: v4.5.0
- **ng2-charts**: v8.0.0

### Technology Type: Server/SSR

- **Express**: v5.1.0

### Technology Type: Build & Tooling

- **Angular CLI**: v20.0.2
- **PostCSS**: v8.5.6

### Technology Type: Testing

- **Jasmine**: ~5.7.0
- **Karma**: ~6.4.0

---

## 2. Core Technologies Analysis

### Angular

- Modular architecture with strict type safety
- SSR enabled via Express
- Path aliases for maintainable imports
- Feature-based folder structure (`domain`, `application`, `infrastructure`, `presentation`, `core`, `shared`)

### TypeScript

- Strict compiler options for reliability
- ES2022 target for modern language features

### UI Libraries

- FontAwesome for icons
- Tailwind CSS for utility-first styling
- Chart.js/ng2-charts for data visualization

### Testing

- Jasmine and Karma for unit/integration testing

---

## 3. Implementation Patterns & Conventions

### Naming Conventions

- **Classes/Types:** PascalCase (e.g., `AuthService`, `UserEntity`)
- **Methods/Functions:** camelCase (e.g., `loginUser`, `getRole`)
- **Variables:** camelCase
- **Files:** kebab-case for components, PascalCase for models/entities
- **Interfaces:** Prefix with `I` or use descriptive names (e.g., `AuthRepository`)

### Code Organization

- **Folder Hierarchy:**
    - `domain/` (entities, models, repositories, enums, UI abstractions)
    - `application/` (use-cases)
    - `infrastructure/` (API, DTOs, repo implementations)
    - `presentation/` (UI components, routing)
    - `core/` (guards, interceptors, services)
    - `shared/` (reusable components)
- **Component Boundaries:** Feature-based, maintainable, and extensible
- **Separation of Concerns:** Enforced via interfaces and DI

### Common Patterns

- **Error Handling:** Interceptors, service-level try/catch
- **Logging:** Extendable via services/interceptors
- **Configuration Access:** Environment files, config services
- **Authentication/Authorization:** Guards, services, JWT/token management
- **Validation:** Domain models, service-level validation
- **Testing:** Spec files, mocks, factories

---

## 4. Usage Examples

### API Implementation Example

```typescript
// infrastructure/api/auth.api.ts
@Injectable()
export class AuthApi {
    login(dto: LoginDto): Observable<User> {
        return this.http.post<User>(`/api/auth/login`, dto);
    }
}
```

### Data Access Example

```typescript
// domain/repositories/auth.repository.ts
export interface AuthRepository {
    login(username: string, password: string): Observable<User>;
}

// infrastructure/repositories/auth.repository.impl.ts
@Injectable()
export class AuthRepositoryImpl implements AuthRepository {
    constructor(private api: AuthApi) {
    }

    login(username: string, password: string): Observable<User> {
        return this.api.login({ username, password });
    }
}
```

### Service Layer Example

```typescript
// core/services/auth.service.ts
@Injectable()
export class AuthService {
    constructor(private repo: AuthRepository) {
    }

    login(username: string, password: string) {
        return this.repo.login(username, password);
    }
}
```

### UI Component Example

```typescript
// presentation/auth/login.component.ts
@Component({ selector: 'app-login', ... })
export class LoginComponent {
    loginForm = this.fb.group({ username: '', password: '' });

    constructor(private auth: AuthService) {
    }

    onSubmit() {
        this.auth.login(this.loginForm.value.username, this.loginForm.value.password).subscribe();
    }
}
```

---

## 5. Technology Stack Map

### Core Framework Usage

- **Angular:** Modular, SSR, strict DI, feature-based structure
- **TypeScript:** Modern, strict, maintainable
- **Tailwind CSS:** Utility-first styling
- **FontAwesome:** Icon library
- **Chart.js/ng2-charts:** Data visualization

### Integration Points

- **Authentication:** AuthService, AuthGuard, JWT/token
- **Data Flow:** API services → repositories → use-cases → UI components
- **Third-party Integration:** FontAwesome, Chart.js

### Development Tooling

- **IDE:** VS Code recommended
- **Linters/Formatters:** TSLint/ESLint, Prettier
- **Build Pipeline:** Angular CLI, SSR build scripts
- **Testing:** Jasmine, Karma

### Infrastructure

- **Deployment:** SSR, environment configs
- **Containerization:** Extendable (Docker)
- **Cloud Services:** Extendable
- **Monitoring/Logging:** Extendable via services/interceptors

---

## 6. Technology-Specific Implementation Details

### Angular Implementation Details

- **Dependency Injection:** Angular DI, service tokens, repository pattern
- **Component Structure:** Feature-based, reusable, maintainable
- **Routing:** Angular Router, route guards
- **Styling:** Tailwind CSS, global/component styles
- **Testing:** Spec files, mocks, factories

---

## 7. Technology Relationship Diagrams

### Stack Diagram

```
[Angular (TypeScript)]
   ↓
[RxJS, Zone.js]
   ↓
[UI Libraries: FontAwesome, Tailwind CSS, Chart.js]
   ↓
[Express (SSR)]
   ↓
[Testing: Jasmine, Karma]
```

### Dependency Flow

```
[UI Components] → [Services] → [Repositories] → [API Services] → [Express Server]
```

### Component Relationships

```
[LoginComponent] → [AuthService] → [AuthRepository] → [AuthApi]
```

### Data Flow

```
[User Input] → [UI Component] → [Service] → [Repository] → [API] → [Backend]
```

---

## 8. Technology Decision Context

- **Angular chosen** for robust SPA/SSR support, modularity, and maintainability
- **TypeScript** for type safety and modern features
- **Tailwind CSS** for rapid, utility-first styling
- **FontAwesome/Chart.js** for rich UI/visualization
- **Express** for SSR and scalable deployment
- **Testing stack** for reliability and coverage
- **Constraints:** Strict type safety, modular architecture, extensibility
- **Upgrade Paths:** Angular CLI for upgrades, npm for dependency management

---

**Recommendation:** Update this blueprint as technologies evolve, especially when upgrading Angular, TypeScript, or
major libraries.

