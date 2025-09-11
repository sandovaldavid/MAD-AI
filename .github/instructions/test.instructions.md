---
description: 'Comprehensive testing strategy for all architectural layers with specific coverage requirements'
applyTo: '**/*.spec.ts, **/*.test.ts, **/*.cy.ts'
---

# Testing Implementation Guidelines for MAD-AI

## Core Testing Philosophy

You WILL follow the testing pyramid strategy with these fundamental principles:

- You MUST test behavior, not implementation details
- You WILL prioritize fast, isolated unit tests at the base of the pyramid
- You MUST ensure each layer has appropriate test coverage and strategy
- You NEVER allow tests to depend on external systems without proper mocking

## Testing Pyramid Structure

You WILL implement testing following this hierarchy:

### Level 1: Unit Tests (Domain & Core) - Base of Pyramid

- **Coverage Requirement**: 100% for Domain entities and value objects
- **Speed**: Ultra-fast (< 5ms per test)
- **Isolation**: Complete - no external dependencies
- **Tools**: Jest only

### Level 2: Orchestration Tests (Application) - Fast Integration

- **Coverage Requirement**: 95% for use cases and facades
- **Speed**: Very fast (< 50ms per test)
- **Isolation**: Mock all external dependencies
- **Tools**: Jest with extensive mocking

### Level 3: Component Tests (Presentation) - UI Behavior

- **Coverage Requirement**: 85% for components and services
- **Speed**: Fast (< 200ms per test)
- **Isolation**: Mock all facades and external services
- **Tools**: Jest + TestBed

### Level 4: Integration Tests (Infrastructure) - External Contracts

- **Coverage Requirement**: 80% for repositories and mappers
- **Speed**: Medium (< 500ms per test)
- **Isolation**: Mock HTTP calls but test real mapping logic
- **Tools**: Jest + HttpClientTestingModule

### Level 5: E2E Tests - Complete User Flows

- **Coverage**: Critical user journeys only
- **Speed**: Slow (acceptable for CI/CD)
- **Isolation**: Mock API responses, test real UI flows
- **Tools**: Cypress

## Domain & Core Layer Testing Rules

### Domain Entities Testing

You MUST test all business logic in Domain entities:

```typescript
// ✅ CORRECT: Test business behavior
describe('User Entity', () => {
  it('should deactivate user and change status to inactive', () => {
    // Arrange
    const user = new User({
      id: new UserId('user-123'),
      email: new Email('test@example.com'),
      status: UserStatus.Active,
    });

    // Act
    user.deactivate();

    // Assert
    expect(user.properties.status).toBe(UserStatus.Inactive);
    expect(user.properties.deactivatedAt).toBeInstanceOf(Date);
  });

  it('should throw error when trying to deactivate already inactive user', () => {
    // Arrange
    const user = new User({ status: UserStatus.Inactive });

    // Act & Assert
    expect(() => user.deactivate()).toThrow('User is already inactive');
  });
});
```

### Value Objects Testing

You MUST verify validation logic and immutability:

```typescript
// ✅ CORRECT: Test validation and immutability
describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = new Email('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should throw error for invalid email format', () => {
    expect(() => new Email('invalid-email')).toThrow('Invalid email format');
  });

  it('should be immutable', () => {
    const email = new Email('test@example.com');
    expect(() => ((email as any).value = 'new@example.com')).toThrow();
  });
});
```

### Core Services Testing

You MUST test utility logic without dependencies:

```typescript
// ✅ CORRECT: Test pure utility functions
describe('DateTimeService', () => {
  it('should format date to ISO string', () => {
    const date = new Date('2023-01-01T10:00:00Z');
    const result = DateTimeService.formatToISO(date);
    expect(result).toBe('2023-01-01T10:00:00.000Z');
  });
});
```

## Application Layer Testing Rules

### Use Case Testing

You MUST test orchestration flow with complete mocking:

```typescript
// ✅ CORRECT: Mock all dependencies, test flow
describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockNotificationService: jest.Mocked<INotificationService>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockNotificationService = {
      sendEmail: jest.fn(),
    } as jest.Mocked<INotificationService>;

    useCase = new DeactivateUserUseCase(mockUserRepository, mockNotificationService);
  });

  it('should deactivate user and send notification', async () => {
    // Arrange
    const mockUser = {
      deactivate: jest.fn(),
      properties: { email: { value: 'test@example.com' } },
    };
    mockUserRepository.findById.mockResolvedValue(mockUser as any);
    mockUserRepository.save.mockResolvedValue(undefined);

    // Act
    await useCase.execute('user-123');

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    expect(mockUser.deactivate).toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Account Deactivated'
    );
  });
});
```

### Facade Testing

You MUST test state management and use case coordination:

```typescript
// ✅ CORRECT: Test Signal updates and use case calls
describe('UsersFacade', () => {
  let facade: UsersFacade;
  let mockDeactivateUserUseCase: jest.Mocked<DeactivateUserUseCase>;

  beforeEach(() => {
    mockDeactivateUserUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<DeactivateUserUseCase>;

    facade = new UsersFacade(mockDeactivateUserUseCase);
  });

  it('should update loading state and call use case when deactivating user', async () => {
    // Arrange
    mockDeactivateUserUseCase.execute.mockResolvedValue(undefined);

    // Act
    await facade.deactivateUser('user-123');

    // Assert
    expect(mockDeactivateUserUseCase.execute).toHaveBeenCalledWith('user-123');
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });
});
```

## Infrastructure Layer Testing Rules

### Repository Testing

You MUST test HTTP integration with mocked responses:

```typescript
// ✅ CORRECT: Test HTTP calls and mapping
describe('HttpUserRepository', () => {
  let repository: HttpUserRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpUserRepository],
    });
    repository = TestBed.inject(HttpUserRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch user by ID and map to User entity', () => {
    // Arrange
    const userDto = {
      id: 'user-123',
      email: 'test@example.com',
      status: 'active',
    };

    // Act
    repository.findById('user-123').subscribe((user) => {
      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.properties.email.value).toBe('test@example.com');
      expect(user.properties.status).toBe(UserStatus.Active);
    });

    // Assert HTTP call
    const req = httpMock.expectOne('api/v1/users/user-123');
    expect(req.request.method).toBe('GET');
    req.flush(userDto);
  });
});
```

### Mapper Testing

You MUST test DTO to Entity transformation:

```typescript
// ✅ CORRECT: Test bidirectional mapping
describe('UserMapper', () => {
  it('should map UserDto to User entity', () => {
    // Arrange
    const dto: UserDto = {
      id: 'user-123',
      email: 'test@example.com',
      status: 'active',
    };

    // Act
    const user = UserMapper.toEntity(dto);

    // Assert
    expect(user).toBeInstanceOf(User);
    expect(user.properties.id.value).toBe('user-123');
    expect(user.properties.email.value).toBe('test@example.com');
  });

  it('should map User entity to UserDto', () => {
    // Arrange
    const user = new User({
      id: new UserId('user-123'),
      email: new Email('test@example.com'),
      status: UserStatus.Active,
    });

    // Act
    const dto = UserMapper.toDto(user);

    // Assert
    expect(dto.id).toBe('user-123');
    expect(dto.email).toBe('test@example.com');
    expect(dto.status).toBe('active');
  });
});
```

## Presentation Layer Testing Rules

### Smart Component Testing

You MUST test facade integration and user interactions:

```typescript
// ✅ CORRECT: Mock facades, test interactions
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUsersFacade: jest.Mocked<UsersFacade>;

  beforeEach(() => {
    mockUsersFacade = {
      users: jest.fn().mockReturnValue(signal([])),
      loading: jest.fn().mockReturnValue(signal(false)),
      loadUsers: jest.fn(),
      deactivateUser: jest.fn(),
    } as jest.Mocked<UsersFacade>;

    TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [{ provide: UsersFacade, useValue: mockUsersFacade }],
    });

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should call facade.deactivateUser when deactivate button is clicked', () => {
    // Act
    component.onDeactivateUser('user-123');

    // Assert
    expect(mockUsersFacade.deactivateUser).toHaveBeenCalledWith('user-123');
  });
});
```

### Dumb Component Testing

You MUST test input/output behavior without facades:

```typescript
// ✅ CORRECT: Test pure component behavior
describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserCardComponent],
    });
    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should emit userDeactivated when deactivate button is clicked', () => {
    // Arrange
    const user = { id: 'user-123', email: 'test@example.com' };
    component.user = user;
    spyOn(component.userDeactivated, 'emit');

    // Act
    const button = fixture.nativeElement.querySelector('.deactivate-btn');
    button.click();

    // Assert
    expect(component.userDeactivated.emit).toHaveBeenCalledWith('user-123');
  });
});
```

## E2E Testing Rules

### Critical User Journey Testing

You MUST test complete user flows with mocked API responses:

```typescript
// ✅ CORRECT: Test real user interactions
describe('User Management Flow', () => {
  it('should allow admin to deactivate a user', () => {
    // Arrange: Mock API responses
    cy.intercept('GET', '/api/v1/users', {
      statusCode: 200,
      body: [{ id: 'user-123', email: 'test@example.com', status: 'active' }],
    }).as('getUsers');

    cy.intercept('PUT', '/api/v1/users/user-123/deactivate', {
      statusCode: 200,
      body: { id: 'user-123', status: 'inactive' },
    }).as('deactivateUser');

    // Act
    cy.visit('/users');
    cy.wait('@getUsers');
    cy.get('[data-testid="user-card-user-123"]').should('be.visible');
    cy.get('[data-testid="deactivate-btn-user-123"]').click();
    cy.get('[data-testid="confirm-deactivate"]').click();

    // Assert
    cy.wait('@deactivateUser');
    cy.get('[data-testid="user-status-user-123"]').should('contain', 'Inactive');
  });
});
```

## Coverage Requirements and Quality Gates

### Mandatory Coverage Thresholds

You MUST maintain these minimum coverage percentages:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "src/app/domain/**/*.ts": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    },
    "src/app/application/**/*.ts": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### Test Quality Standards

You MUST ensure all tests follow these standards:

- You WILL use descriptive test names that explain the behavior being tested
- You MUST follow AAA pattern (Arrange, Act, Assert) in all tests
- You WILL use meaningful assertions that verify the actual behavior
- You NEVER test implementation details, only public behavior
- You MUST clean up any test data or side effects in afterEach hooks

## Anti-Patterns to Avoid

### ❌ NEVER Mock What You Don't Own

```typescript
// ❌ WRONG: Don't mock Angular framework classes
const mockHttpClient = {
  get: jest.fn(),
};

// ✅ CORRECT: Use Angular's testing utilities
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
});
```

### ❌ NEVER Test Implementation Details

```typescript
// ❌ WRONG: Testing private methods
expect(component['privateMethod']).toHaveBeenCalled();

// ✅ CORRECT: Test public behavior
expect(component.userDeactivated.emit).toHaveBeenCalledWith('user-123');
```

### ❌ NEVER Use Real Dependencies in Unit Tests

```typescript
// ❌ WRONG: Real dependency injection
const useCase = new DeactivateUserUseCase(new HttpUserRepository());

// ✅ CORRECT: Mocked dependencies
const mockRepo = { findById: jest.fn() } as jest.Mocked<IUserRepository>;
const useCase = new DeactivateUserUseCase(mockRepo);
```

## Test Organization and Structure

### File Naming Conventions

You MUST follow these naming patterns:

- Unit tests: `*.spec.ts` (e.g., `user.entity.spec.ts`)
- Integration tests: `*.integration.spec.ts`
- E2E tests: `*.cy.ts` (e.g., `user-management.cy.ts`)

### Test File Location

You WILL place test files:

- Next to the source file being tested (same directory)
- In a `__tests__` folder for complex test suites
- In `cypress/e2e/` for E2E tests

### Test Suite Organization

You MUST organize test suites using this structure:

```typescript
describe('ComponentName', () => {
  describe('Method/Feature Name', () => {
    it('should do something when condition is met', () => {
      // Test implementation
    });
  });
});
```

CRITICAL: You WILL run tests in CI/CD pipeline and fail builds when coverage thresholds are not met or when any test fails. Tests are not optional documentation—they are executable specifications that ensure code quality and prevent regressions.
