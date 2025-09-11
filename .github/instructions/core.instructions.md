---
description: 'Core Layer implementation guidelines for framework-agnostic utilities'
applyTo: '**/core/**/*.ts'
---

# Core Layer Implementation Instructions

## Core Principles

You WILL implement Core Layer components following these fundamental rules:

**CRITICAL**: The Core Layer MUST contain only technically necessary code that is completely independent of any business domain and framework-specific implementations.

You MUST follow this **Golden Rule**: If your code could be published as a general NPM utility library for any TypeScript project (not necessarily Angular) and be used in both frontend and backend, then it belongs in Core.

You WILL ensure the Core Layer is:

- **Framework-Agnostic**: No knowledge of Angular, React, or any UI framework
- **Domain-Independent**: No knowledge of business entities, rules, or concepts
- **Technology-Neutral**: No HTTP clients, database connections, or external service dependencies
- **Reusable**: Utilities that could be used across different projects and contexts
- **Minimal**: Only essential cross-cutting technical services

**MANDATORY**: Core Layer must be the foundation that other layers depend on, but it NEVER depends on any other application layer.

## Structural Requirements

### `/services` - Cross-Cutting Technical Services

You WILL create services that:

- Provide essential technical functionality used by multiple layers
- Are completely stateless and side-effect free where possible
- Implement pure functions or very simple state management
- Focus on single technical responsibilities

**Approved Core Service Types:**

- **LoggerService**: Standardized logging interface for debugging and monitoring
- **DateTimeService**: Centralized date/time operations and formatting
- **ValidationService**: Generic validation utilities (not business rule validation)
- **CryptoService**: Cryptographic utilities and encoding/decoding functions
- **ConfigurationService**: Application configuration management (not business configuration)

You MUST ensure Core services:

- Can be instantiated without any external dependencies
- Don't know about business entities or domain concepts
- Work identically in different environments (browser, Node.js, etc.)
- Have clear, single-purpose interfaces

**Example Core Service:**

```typescript
// ✅ CORRECT - Framework-agnostic logger
export class LoggerService implements ILogger {
  private readonly logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog('INFO', message, context);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog('ERROR', message, { error: error?.message, ...context });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private writeLog(level: string, message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...context };
    console.log(JSON.stringify(logEntry));
  }
}
```

### `/interfaces` - Technical Service Contracts

You WILL define interfaces that:

- Specify contracts for Core services to enable easy substitution
- Use generic, technical terminology (not business language)
- Allow for multiple implementations across different environments
- Support dependency injection and testing strategies

You MUST ensure Core interfaces:

- Are completely technology-agnostic
- Use only TypeScript primitive types and standard library types
- Define minimal, focused contracts
- Enable substitution without breaking consuming code

**Example Core Interface:**

```typescript
// ✅ CORRECT - Generic logging contract
export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}

// ✅ CORRECT - Generic date/time contract
export interface IDateTimeService {
  now(): Date;
  format(date: Date, format: string): string;
  parseISO(dateString: string): Date;
  addDays(date: Date, days: number): Date;
  isValid(date: Date): boolean;
}
```

## Implementation Standards

### Dependency Rules (MANDATORY)

You WILL ensure the Core Layer:

- Has ZERO dependencies on any other application layers (Domain, Application, Infrastructure, Presentation)
- Never imports anything from `@angular/*` or any UI framework
- Never uses `HttpClient`, `fetch`, or makes network requests
- Never accesses browser APIs (`localStorage`, `sessionStorage`, `window`, `document`)
- Never includes business logic or domain knowledge
- Only depends on standard TypeScript/JavaScript libraries and well-established utility libraries

### Code Quality Standards

You MUST implement:

- **Pure Functions**: Prefer stateless, side-effect-free functions where possible
- **Strong Typing**: Use explicit TypeScript types for all parameters and return values
- **Error Handling**: Throw meaningful errors with clear messages for invalid inputs
- **Documentation**: Include JSDoc comments explaining the technical purpose and usage
- **Testing**: Comprehensive unit tests that don't require external dependencies

### Service Implementation Patterns

You WILL follow these patterns:

**Stateless Services (Preferred):**

```typescript
// ✅ CORRECT - Stateless utility service
export class ValidationService {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  }

  static isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }
}
```

**Stateful Services (When Necessary):**

```typescript
// ✅ CORRECT - Minimal state for configuration
export class ConfigurationService {
  private readonly config: Map<string, unknown> = new Map();

  set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.config.get(key) as T) ?? defaultValue;
  }

  has(key: string): boolean {
    return this.config.has(key);
  }
}
```

## Integration Guidelines

### Consumption by Other Layers

You WILL ensure Core services can be consumed by:

- **Application Layer**: Use Core logging and utilities in use cases and facades
- **Infrastructure Layer**: Use Core services for technical operations in repositories and external service adapters
- **Presentation Layer**: Use Core utilities for formatting and validation in components

### Dependency Injection Integration

You MUST design Core services to:

- Work with Angular's dependency injection system without being Angular-specific
- Be easily mocked and tested in isolation
- Support constructor injection through interfaces
- Allow runtime configuration without framework dependencies

**Example DI-Ready Service:**

```typescript
// ✅ CORRECT - Injectable but framework-agnostic
export class DateTimeService implements IDateTimeService {
  constructor(private readonly timezone: string = 'UTC') {}

  now(): Date {
    return new Date();
  }

  format(date: Date, format: string): string {
    // Implementation using standard date formatting
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      // ... format options
    }).format(date);
  }
}
```

### Testing Strategy

You MUST implement:

- **Unit Tests**: Test all public methods with various inputs and edge cases
- **Interface Tests**: Verify implementations satisfy their interface contracts
- **Isolation Tests**: Test without any external dependencies or mocks
- **Cross-Environment Tests**: Ensure services work in different JavaScript environments

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Import anything from `@angular/*` or any UI framework packages
- Include business logic, domain entities, or business rules
- Make HTTP requests or interact with external APIs
- Access browser-specific APIs or global objects
- Depend on other application layers (Domain, Application, Infrastructure, Presentation)
- Include UI-specific formatting or presentation logic
- Create services that only serve one specific layer or use case

### Common Mistakes to Avoid

**❌ WRONG - Framework-dependent service:**

```typescript
// Never do this in Core
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService {
  constructor(private http: HttpClient) {} // Framework dependency!

  getUsers() {
    return this.http.get('/api/users'); // HTTP call!
  }
}
```

**❌ WRONG - Business-aware service:**

```typescript
// Never do this in Core
export class BusinessRuleService {
  validateUserRole(user: User, role: Role): boolean {
    // Business concepts!
    return user.isActive() && role.isValidForUser(user); // Business logic!
  }
}
```

**❌ WRONG - Environment-specific service:**

```typescript
// Never do this in Core
export class StorageService {
  save(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value)); // Browser-specific!
  }
}
```

**✅ CORRECT - Generic, framework-agnostic service:**

```typescript
// This belongs in Core
export class SerializationService {
  serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  deserialize<T>(json: string): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to deserialize JSON: ${error.message}`);
    }
  }
}
```

## Validation Criteria

### Code Review Checklist

You MUST verify that Core code:

- [ ] Contains zero imports from Angular or any UI framework
- [ ] Has no knowledge of business entities or domain concepts
- [ ] Makes no HTTP requests or external API calls
- [ ] Accesses no browser-specific APIs or global objects
- [ ] Can be extracted and used in a Node.js environment
- [ ] Has comprehensive unit tests with no external dependencies
- [ ] Implements clear, focused interfaces
- [ ] Uses only standard TypeScript types and established utility libraries
- [ ] Follows consistent naming conventions using technical (not business) terminology
- [ ] Is thoroughly documented with JSDoc comments

### Quality Gates

You WILL ensure Core services:

- **Portability Test**: Can be copy-pasted into a different TypeScript project and work immediately
- **Environment Test**: Function identically in browser, Node.js, and test environments
- **Isolation Test**: Can be tested without mocks or external setup
- **Interface Test**: All implementations properly satisfy their interface contracts
- **Documentation Test**: Purpose and usage are clear from code and comments alone

### Success Indicators

Your Core implementation is successful when:

- Services are generic enough to be useful across multiple projects
- No business terminology appears in method names or parameters
- Tests run without any framework setup or external dependencies
- Code could be published as a standalone NPM package
- Other layers can consume Core services without knowing implementation details
- Changes to business requirements don't affect Core layer code

### Minimalism Principle

You MUST keep Core minimal by:

- Only adding services that are truly cross-cutting and reusable
- Questioning whether each new service could belong in a more specific layer
- Preferring composition of simple utilities over complex services
- Removing services that become business-specific over time

---

**Remember**: The Core Layer should be the smallest, most stable part of your application. If Core is growing rapidly or contains business logic, you're violating the separation of concerns. Keep it minimal, generic, and framework-agnostic.
