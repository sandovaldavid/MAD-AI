# Technology Stack Blueprint

**Generated:** August 8, 2025

---

## 1. Technology Identification Phase

- **Primary Technology:** Angular (TypeScript)
- **Programming Languages:** TypeScript, HTML, CSS
- **Dependencies (from package.json):**
  - Angular 20.x (core, forms, router, SSR)
  - RxJS ~7.8.0
  - Express ^5.1.0 (SSR)
  - TailwindCSS ^4.1.11
  - PostCSS ^8.5.6
  - Zone.js ~0.15.0
  - Jasmine/Karma (testing)
- **Build Tooling:** Angular CLI, TypeScript
- **Version Information:**
  - Angular: ^20.0.0
  - RxJS: ~7.8.0
  - Express: ^5.1.0
  - TailwindCSS: ^4.1.11
  - TypeScript: ~5.8.2

---

## 2. Core Technologies Analysis

### Angular Stack Analysis
- **Framework:** Angular 20.x
- **SSR:** Express integration via @angular/ssr
- **State Management:** RxJS, Angular signals
- **Routing:** Angular Router
- **Styling:** TailwindCSS, PostCSS
- **Testing:** Jasmine, Karma
- **Build:** Angular CLI, TypeScript

---

## 3. Implementation Patterns & Conventions

### Naming Conventions
- Classes: PascalCase (e.g., `UserEntity`)
- Methods/Functions: camelCase
- Variables: camelCase
- Files: kebab-case for components, PascalCase for classes
- Interfaces/Abstract Classes: Prefix with `I` or use descriptive names

### Code Organization
- Feature-based folder structure (domain, application, infrastructure, presentation, shared)
- Separation of concerns: domain logic, use-cases, infrastructure, UI
- Repositories/interfaces in domain, implementations in infrastructure
- Shared components in `shared/components`

### Common Patterns
- Error handling: RxJS operators, Angular error boundaries
- Logging: Not detected (recommend integration)
- Configuration: Environment files, DI tokens
- Authentication: AuthService, guards, interceptors
- Validation: DTOs, entity constructors
- Testing: Jasmine unit tests, Karma integration tests

---

## 4. Usage Examples

### API Implementation Example
```typescript
// Domain repository interface
export abstract class UserRepository {
  abstract getUsers(): Observable<UserEntity[]>;
}
// Infrastructure implementation
@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl extends UserRepository {
  // ...implementation...
}
```

### Data Access Example
```typescript
// API client usage in repository
this.userApi.getUsers().pipe(
  map(users => users.map(user => new UserEntity({ ...user })))
);
```

### Service Layer Example
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // ...inject use-cases and token service...
  login(request: LoginRequest): Observable<UserInfo> {
    return this.loginUseCase.execute(request);
  }
}
```

### UI Component Example
```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = 'MAD-AI-NEW';
}
```

---

## 5. Technology Stack Map

### Core Framework Usage
- **Angular:** Component-based UI, routing, DI, SSR
- **RxJS:** Reactive programming, state management
- **Express:** SSR server for Angular
- **TailwindCSS:** Utility-first CSS framework
- **TypeScript:** Strong typing, interfaces, generics

### Integration Points
- **API Communication:** Infrastructure layer uses API clients to communicate with backend
- **Authentication Flow:** AuthService, guards, interceptors
- **Data Flow:** UI → Application (use-cases) → Domain (entities/repositories) → Infrastructure (API)
- **Third-party Integration:** TailwindCSS for styling

### Development Tooling
- **IDE:** VS Code recommended
- **Linters/Formatters:** TypeScript, Angular CLI
- **Build/Deploy:** Angular CLI, SSR with Express
- **Testing:** Jasmine, Karma

### Infrastructure
- **Deployment:** SSR with Express, environment configs
- **Containerization:** Not detected
- **Cloud Services:** Not detected
- **Monitoring/Logging:** Not detected (recommend integration)

---

## 6. Technology-Specific Implementation Details

### Angular Implementation Details
- **Dependency Injection:** `@Injectable`, DI tokens, providedIn: 'root'
- **Component Patterns:** OnPush change detection, feature-based modules
- **Service Patterns:** Injectable services, use-case orchestration
- **Repository Patterns:** Abstract interfaces, API client implementations
- **Routing:** Route modules, guards
- **State Management:** Signals, computed properties, RxJS
- **Styling:** TailwindCSS, PostCSS

---

## 7. Technology Relationship Diagrams

### Stack Diagram (Textual)
- Angular (UI, routing, DI)
- RxJS (state management)
- Express (SSR)
- TailwindCSS (styling)
- TypeScript (language)
- Jasmine/Karma (testing)

### Dependency Flow
- UI Components → Services → Use-Cases → Domain Entities/Repositories → Infrastructure API Clients

### Component Relationships
- Presentation (UI) depends on Application (use-cases)
- Application depends on Domain (entities/repositories)
- Domain interfaces implemented by Infrastructure

### Data Flow
- User action → UI Component → Service → Use-Case → Repository → API → Response → UI Update

---

## 8. Technology Decision Context
- **Angular chosen** for modern, scalable, maintainable UI
- **TypeScript** for strong typing and maintainability
- **RxJS** for reactive state management
- **Express** for SSR and improved SEO/performance
- **TailwindCSS** for rapid, consistent styling
- **Jasmine/Karma** for robust testing
- **No legacy/deprecated technologies detected**
- **Upgrade paths:** Keep Angular, RxJS, TypeScript, and TailwindCSS up to date for security and features

---

**This blueprint should be updated as the technology stack evolves.**

