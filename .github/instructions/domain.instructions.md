---
description: 'Domain Layer implementation guidelines following Clean Architecture principles'
applyTo: '**/domain/**/*.ts'
---

# Domain Layer Implementation Instructions

## Core Principles

You WILL implement Domain Layer components following these fundamental rules:

**CRITICAL**: The Domain Layer MUST contain only pure business logic and rules, completely independent of any external technology or framework.

You MUST follow this **Golden Rule**: If you can explain a piece of code to a business expert who doesn't know programming, and they understand it, that logic belongs in the Domain.

You WILL ensure the Domain Layer is:

- The heart of the software containing business logic and rules
- Completely independent of frameworks, databases, and UI technologies
- Stable and focused on business concepts rather than technical implementations
- The center of your Clean Architecture with no dependencies on other layers

## Structural Requirements

### `/entities` - Business Objects with Identity and Lifecycle

You WILL create entities that:

- Represent core business concepts with unique identity and lifecycle (e.g., `User`, `Role`, `Session`)
- Encapsulate business rules and state transitions through methods (`user.deactivate()`, `role.changeName()`)
- Protect invariants (rules that must always be true) through their methods
- Maintain their own state consistency and integrity

You MUST ensure entities:

- Operate only on their own data
- Never expose internal state directly - use methods instead
- Validate all state changes through business rules

### `/value-objects` - Immutable Domain Attributes

You WILL implement value objects that:

- Describe characteristics without having identity (e.g., `Email`, `Username`, `ISODateTime`, `LocalTokens`)
- Are completely **immutable** - once created, they cannot be modified
- Self-validate during creation - invalid value objects MUST throw `ValidationError`
- Compare by value using `equals()` method, never by reference

You MUST ensure value objects:

- Create new instances for any changes rather than modifying existing ones
- Fail fast with clear validation errors if constructed with invalid data
- Have no setter methods or mutable properties

### `/repositories` - Persistence Contracts (Interfaces Only)

You WILL define repository interfaces that:

- Specify persistence operations from the domain perspective
- Use domain language in method names (`findUserByEmail`, `getActiveRoles`)
- Are completely technology-agnostic (no HTTP, SQL, or database references)
- Define contracts that Infrastructure Layer will implement

You MUST ensure repository interfaces:

- Contain NO implementations - only interface definitions
- Use domain entities and value objects as parameters and return types
- Express operations in business terms, not technical terms

**Example:**

```typescript
// ✅ CORRECT
interface IUserRepository {
  findUserByEmail(email: Email): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  getActiveUsers(): Promise<User[]>;
}

// ❌ WRONG
interface IUserRepository {
  getUsersFromEndpointX(): Promise<any>;
  saveUserToHttp(user: User): Promise<Response>;
}
```

### `/enums` - Fixed Business Classifications

You WILL create enums for:

- Fixed, known sets of values representing business classifications
- Constants that prevent magic strings or numbers in code
- Values that are stable and defined by business rules

You MUST ensure enums:

- Represent truly fixed classifications that won't change dynamically
- Are used for business concepts, not technical configurations
- Contain no complex logic - only classification values

### `/errors` - Domain-Specific Exceptions

You WILL define domain errors for:

- `ValidationError`: When value object creation fails due to invalid format
- `BusinessRuleError`: When entity operations violate business rules
- Domain-specific failures that represent business problems

You MUST ensure domain errors:

- Represent business problems, not technical failures
- Provide clear, business-meaningful error messages
- Are thrown from appropriate domain objects (entities, value objects)

### `/services` - Cross-Entity Domain Logic (Use Sparingly)

You WILL create domain services ONLY when:

- Logic coordinates multiple entities or aggregates
- The operation doesn't naturally fit within any single entity
- The service remains stateless and focused on domain concerns

You MUST ensure domain services:

- Are stateless and contain no instance variables
- Operate only on domain objects passed as parameters
- Don't orchestrate repositories - that's Application Layer responsibility

## Implementation Standards

### Dependency Rules (MANDATORY)

You WILL ensure the Domain Layer:

- Has ZERO dependencies on other layers (Application, Infrastructure, Presentation)
- Never imports anything from `@angular/*`
- Never uses `HttpClient` or makes API calls
- Never accesses browser APIs (`localStorage`, `sessionStorage`, etc.)
- Never defines UI presentation logic

### Type Safety and Validation

You MUST implement:

- Strong TypeScript typing for all domain objects
- Validation in value object constructors that throws meaningful errors
- Business rule enforcement in entity methods
- Proper error handling that uses domain-specific error types

**Example:**

```typescript
// ✅ CORRECT Entity Implementation
export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private status: UserStatus
  ) {}

  static create(id: string, email: string): User {
    return new User(
      UserId.create(id),
      Email.create(email), // Validates email format
      UserStatus.ACTIVE
    );
  }

  deactivate(): void {
    if (this.status === UserStatus.DEACTIVATED) {
      throw new BusinessRuleError('User is already deactivated');
    }
    this.status = UserStatus.DEACTIVATED;
  }
}

// ✅ CORRECT Value Object Implementation
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static isValidEmail(email: string): boolean {
    // Email validation logic
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

## Integration Guidelines

### Communication with Other Layers

You WILL ensure:

- Domain objects can be used by Application Layer through dependency injection
- Repository interfaces are implemented by Infrastructure Layer
- Domain errors are caught and handled by Application Layer
- No direct communication with Presentation or Infrastructure layers

### Testing Strategy

You MUST implement:

- Unit tests for all entities, value objects, and domain services
- Tests that verify business rules and invariants
- Tests that ensure proper error throwing for invalid operations
- Tests that validate value object immutability and equality

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Import anything from `@angular/*` in domain files
- Use `HttpClient` or make HTTP requests
- Access browser APIs or global objects
- Include UI formatting logic (`getFullName()` for display)
- Depend on external frameworks or libraries (except for utilities like date libraries)
- Create mutable value objects or entities with public setters
- Put orchestration logic in domain services (that belongs in Application Layer)
- Include infrastructure concerns in domain code

### Common Mistakes to Avoid

You WILL NOT:

- Create "anemic" domain objects (objects with only getters/setters and no behavior)
- Put repository implementations in the domain layer
- Include technical error types (`HttpError`, `DatabaseError`) in domain
- Create value objects with identity or mutable state
- Use primitive types when value objects would be more expressive

**❌ WRONG - Anemic Entity:**

```typescript
export class User {
  public id: string;
  public email: string;
  public status: string;

  // Only getters and setters - no business logic
  getId(): string {
    return this.id;
  }
  setStatus(status: string): void {
    this.status = status;
  }
}
```

**✅ CORRECT - Rich Domain Entity:**

```typescript
export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private status: UserStatus
  ) {}

  deactivate(): void {
    if (this.status === UserStatus.DEACTIVATED) {
      throw new BusinessRuleError('Cannot deactivate an already deactivated user');
    }
    this.status = UserStatus.DEACTIVATED;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
```

## Validation Criteria

### Code Review Checklist

You MUST verify that domain code:

- [ ] Contains zero imports from Angular or other frameworks
- [ ] Uses only domain-specific types and interfaces
- [ ] Implements proper validation in value objects
- [ ] Enforces business rules in entity methods
- [ ] Throws appropriate domain errors for rule violations
- [ ] Has comprehensive unit tests covering business logic
- [ ] Uses immutable value objects with proper equality comparison
- [ ] Keeps entities focused on their own state and behavior
- [ ] Defines repository interfaces without implementations
- [ ] Uses meaningful business language in all method names

### Quality Gates

You WILL ensure:

- All domain objects are independently testable without mocks
- Business experts can understand the code structure and logic
- Domain logic can be extracted and used in different contexts
- No technical dependencies leak into business logic
- Error messages are business-meaningful, not technical

### Success Indicators

Your domain implementation is successful when:

- Business rules are clearly expressed in code
- Domain objects protect their invariants effectively
- The code reads like business documentation
- Changes to infrastructure don't affect domain logic
- Domain tests don't require complex setup or external dependencies

---

**Remember**: The Domain Layer is the crown jewel of your architecture. Keep it pure, focused, and independent. If you're unsure whether something belongs in the domain, ask: "Is this a business concept or a technical implementation detail?" Business concepts belong here; technical details belong elsewhere.
