---
description: 'Testing implementation guidelines for Clean Architecture layers'
applyTo: '**/*.spec.ts, **/*.test.ts'
---

# Testing Implementation Instructions

## Core Principles

You WILL implement comprehensive testing following these fundamental rules:

**CRITICAL**: Testing in Clean Architecture is NOT optional - it is MANDATORY for guaranteeing code robustness and maintainability. Each layer requires a different testing strategy following the testing pyramid.

You MUST follow this **Golden Rule**: Test the behavior, not the implementation. A test should verify WHAT the code does, not HOW it does it. This allows you to refactor internal method logic without breaking tests.

You WILL ensure your testing strategy:

- **Follows the Testing Pyramid**: Fast unit tests at the base, integration tests in the middle, E2E tests at the top
- **Tests Behavior**: Verify expected outcomes and side effects, not internal implementation details
- **Maintains Layer Isolation**: Each layer tests its own concerns without crossing architectural boundaries
- **Provides Fast Feedback**: Tests should run quickly and fail fast when behavior changes
- **Supports Refactoring**: Tests should remain stable when implementation details change

**MANDATORY**: Every feature MUST have comprehensive test coverage across all relevant layers before it can be considered complete.

## Structural Requirements

### Domain Layer Testing (CRITICAL - 100% Coverage Required)

You WILL implement Domain testing with these requirements:

**Strategy**: Pure unit tests - fast, zero external dependencies, zero mocks of classes
**Tools**: Jest only
**Coverage**: 100% - NON-NEGOTIABLE

You MUST test:

- **Entity Business Rules**: Call entity methods and verify state changes or `BusinessRuleError` exceptions
- **Value Object Validation**: Ensure VOs cannot be created with invalid values and equality works by value
- **Domain Errors**: Verify correct `ValidationError` and `BusinessRuleError` creation for each scenario
- **All Edge Cases**: Cover happy paths, boundary conditions, null values, format errors, rule violations

You WILL implement Domain tests by:

- Instantiating classes directly: `new User(...)`, `Email.create(...)`
- Testing without any mocks - pure object instantiation and method calls
- Covering every business rule path including violations
- Verifying proper error types and messages for all failure scenarios

**Example Domain Test:**

```typescript
// ✅ CORRECT - Pure unit test for business rule
describe('User Entity', () => {
  describe('deactivate', () => {
    it('should deactivate an active user', () => {
      // Arrange
      const user = User.create('user-123', 'test@example.com', 'John', 'Doe');

      // Act
      user.deactivate();

      // Assert
      expect(user.isActive()).toBe(false);
    });

    it('should throw BusinessRuleError when deactivating already inactive user', () => {
      // Arrange
      const user = User.create('user-123', 'test@example.com', 'John', 'Doe');
      user.deactivate(); // Already inactive

      // Act & Assert
      expect(() => user.deactivate()).toThrow(BusinessRuleError);
      expect(() => user.deactivate()).toThrow('User is already deactivated');
    });
  });

  describe('Email Value Object', () => {
    it('should create valid email', () => {
      // Act
      const email = Email.create('test@example.com');

      // Assert
      expect(email.toString()).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid email format', () => {
      // Act & Assert
      expect(() => Email.create('invalid-email')).toThrow(ValidationError);
      expect(() => Email.create('')).toThrow(ValidationError);
      expect(() => Email.create(null)).toThrow(ValidationError);
    });

    it('should compare emails by value', () => {
      // Arrange
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      // Assert
      expect(email1.equals(email2)).toBe(true);
    });
  });
});
```

### Infrastructure Layer Testing

You WILL implement Infrastructure testing with these requirements:

**Strategy**: Integration tests at the boundary - mock external endpoints, not internal classes
**Tools**: HttpClientTestingModule, HttpTestingController, jest.spyOn for browser APIs
**Focus**: Communication with external world and data mapping

You MUST test:

- **Repository HTTP Communication**: Correct URL construction, HTTP methods, request bodies, response handling
- **Mapper Data Transformation**: DTO to Domain entity conversion and vice versa with edge cases
- **Storage Services**: Proper interaction with browser APIs (localStorage, sessionStorage)
- **Error Handling**: Network failures, API errors, storage quota issues

You WILL implement Infrastructure tests by:

- Using HttpTestingController to mock API responses - NEVER make real network calls
- Creating example DTOs and verifying entity mapping correctness
- Using spyOn for browser APIs and verifying correct method calls
- Testing both success and failure scenarios for all external integrations

**Example Infrastructure Test:**

```typescript
// ✅ CORRECT - Integration test with mocked external dependencies
describe('HttpUserRepository', () => {
  let repository: HttpUserRepository;
  let httpTestingController: HttpTestingController;
  let userMapper: UserMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpUserRepository,
        UserMapper,
        { provide: API_ENDPOINTS, useValue: { users: '/api/users' } },
      ],
    });

    repository = TestBed.inject(HttpUserRepository);
    httpTestingController = TestBed.inject(HttpTestingController);
    userMapper = TestBed.inject(UserMapper);
  });

  describe('findUserByEmail', () => {
    it('should return user when API returns user data', async () => {
      // Arrange
      const email = Email.create('test@example.com');
      const mockUserDto: UserResponseDto = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
      };

      // Act
      const resultPromise = repository.findUserByEmail(email);

      // Assert
      const req = httpTestingController.expectOne('/api/users/by-email?email=test%40example.com');
      expect(req.request.method).toBe('GET');

      req.flush(mockUserDto);

      const result = await resultPromise;
      expect(result).toBeInstanceOf(User);
      expect(result.getEmail().toString()).toBe('test@example.com');
    });

    it('should return null when API returns 404', async () => {
      // Arrange
      const email = Email.create('notfound@example.com');

      // Act
      const resultPromise = repository.findUserByEmail(email);

      // Assert
      const req = httpTestingController.expectOne(
        '/api/users/by-email?email=notfound%40example.com'
      );
      req.flush('User not found', { status: 404, statusText: 'Not Found' });

      const result = await resultPromise;
      expect(result).toBeNull();
    });
  });
});

// ✅ CORRECT - Mapper unit test
describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  describe('fromDto', () => {
    it('should convert DTO to User entity', () => {
      // Arrange
      const dto: UserResponseDto = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
      };

      // Act
      const user = mapper.fromDto(dto);

      // Assert
      expect(user.getId()).toBe('user-123');
      expect(user.getEmail().toString()).toBe('test@example.com');
      expect(user.isActive()).toBe(true);
    });

    it('should throw MappingError for invalid DTO', () => {
      // Arrange
      const invalidDto = { id: '', email: 'invalid' } as UserResponseDto;

      // Act & Assert
      expect(() => mapper.fromDto(invalidDto)).toThrow(MappingError);
    });
  });
});
```

### Application Layer Testing

You WILL implement Application testing with these requirements:

**Strategy**: Orchestration tests - verify workflow and interaction between components
**Tools**: Jest with comprehensive mocking
**Focus**: Use case coordination and Facade state management

You MUST test:

- **Use Case Orchestration**: Correct method calls in expected order with proper parameters
- **Facade State Management**: Signal/Observable updates reflecting operation results
- **Error Handling**: Proper error transformation and state updates
- **Transaction Flow**: Multi-step operations and rollback scenarios

You WILL implement Application tests by:

- Mocking ALL dependencies using jest.fn() or createSpyFromClass
- Verifying mock method calls with expected parameters
- Testing both success and failure Result outcomes
- Verifying Facade state changes after operations

**Example Application Test:**

```typescript
// ✅ CORRECT - Use case orchestration test
describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    } as jest.Mocked<IAuthRepository>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as jest.Mocked<ILogger>;

    useCase = new LoginUseCase(mockAuthRepository, mockLogger);
  });

  describe('execute', () => {
    it('should return success result when login succeeds', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockSession = Session.create('user-123', 'token-456');
      mockAuthRepository.login.mockResolvedValue(Result.ok(mockSession));

      // Act
      const result = await useCase.execute(credentials);

      // Assert
      expect(mockAuthRepository.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged in successfully',
        expect.objectContaining({ userId: 'user-123', email: 'test@example.com' })
      );
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toBe(mockSession);
    });

    it('should return failure result when login fails', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      const loginError = new AuthenticationError('Invalid credentials');
      mockAuthRepository.login.mockResolvedValue(Result.fail(loginError));

      // Act
      const result = await useCase.execute(credentials);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('Login attempt failed', {
        email: 'test@example.com',
      });
      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe(loginError);
    });
  });
});

// ✅ CORRECT - Facade state management test
describe('AuthFacade', () => {
  let facade: AuthFacade;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(() => {
    mockLoginUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<LoginUseCase>;

    facade = new AuthFacade(mockLoginUseCase);
  });

  describe('login', () => {
    it('should update state correctly on successful login', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockUser = User.create('user-123', 'test@example.com', 'John', 'Doe');
      const mockSession = Session.create('user-123', 'token-456', mockUser);
      mockLoginUseCase.execute.mockResolvedValue(Result.ok(mockSession));

      // Act
      await facade.login(credentials);

      // Assert
      expect(facade.currentUser()).toBe(mockUser);
      expect(facade.isLoading()).toBe(false);
      expect(facade.error()).toBeNull();
      expect(facade.isAuthenticated()).toBe(true);
    });

    it('should update error state on failed login', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      const loginError = new AuthenticationError('Invalid credentials');
      mockLoginUseCase.execute.mockResolvedValue(Result.fail(loginError));

      // Act
      await facade.login(credentials);

      // Assert
      expect(facade.currentUser()).toBeNull();
      expect(facade.isLoading()).toBe(false);
      expect(facade.error()).toBe('Invalid credentials');
      expect(facade.isAuthenticated()).toBe(false);
    });
  });
});
```

### Presentation Layer Testing

You WILL implement Presentation testing with these requirements:

**Strategy**: Component tests - focus on user interaction and rendering
**Tools**: Angular TestBed and Jest
**Focus**: UI behavior and Facade integration

You MUST test:

- **Dumb Component Rendering**: Correct display based on @Input properties
- **Dumb Component Events**: Proper @Output emission on user interactions
- **Smart Component Integration**: Facade method calls and state subscription
- **User Interaction Flows**: Complete interaction scenarios

You WILL implement Presentation tests by:

- Using TestBed to configure isolated component testing
- Mocking ALL Facades and injectable services
- Testing DOM rendering with fixture.nativeElement
- Simulating user events and verifying component responses

**Example Presentation Test:**

```typescript
// ✅ CORRECT - Dumb component test
describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ButtonComponent],
    });

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should display button text from content projection', () => {
      // Arrange
      fixture.nativeElement.innerHTML = '<app-button>Save Changes</app-button>';

      // Act
      fixture.detectChanges();

      // Assert
      expect(fixture.nativeElement.textContent.trim()).toBe('Save Changes');
    });

    it('should apply correct CSS classes based on variant', () => {
      // Arrange
      component.variant = 'primary';
      component.size = 'large';

      // Act
      fixture.detectChanges();

      // Assert
      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList).toContain('btn--primary');
      expect(button.classList).toContain('btn--large');
    });

    it('should disable button when loading', () => {
      // Arrange
      component.loading = true;

      // Act
      fixture.detectChanges();

      // Assert
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('user interaction', () => {
    it('should emit clicked event when button is clicked', () => {
      // Arrange
      spyOn(component.clicked, 'emit');

      // Act
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Assert
      expect(component.clicked.emit).toHaveBeenCalled();
    });

    it('should not emit clicked event when disabled', () => {
      // Arrange
      component.disabled = true;
      fixture.detectChanges();
      spyOn(component.clicked, 'emit');

      // Act
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Assert
      expect(component.clicked.emit).not.toHaveBeenCalled();
    });
  });
});

// ✅ CORRECT - Smart component test
describe('UserManagementPageComponent', () => {
  let component: UserManagementPageComponent;
  let fixture: ComponentFixture<UserManagementPageComponent>;
  let mockUsersFacade: jest.Mocked<UsersFacade>;

  beforeEach(() => {
    mockUsersFacade = {
      users: signal([]),
      isLoading: signal(false),
      error: signal(null),
      loadUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      declarations: [UserManagementPageComponent],
      providers: [{ provide: UsersFacade, useValue: mockUsersFacade }],
    });

    fixture = TestBed.createComponent(UserManagementPageComponent);
    component = fixture.componentInstance;
  });

  describe('facade integration', () => {
    it('should call facade.loadUsers on component init', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockUsersFacade.loadUsers).toHaveBeenCalled();
    });

    it('should call facade.createUser when handleCreateUser is called', () => {
      // Arrange
      const userData = { email: 'new@example.com', name: 'New User' };

      // Act
      component.handleCreateUser(userData);

      // Assert
      expect(mockUsersFacade.createUser).toHaveBeenCalledWith(userData);
    });
  });

  describe('state subscription', () => {
    it('should display users from facade state', () => {
      // Arrange
      const mockUsers = [
        User.create('1', 'user1@example.com', 'John', 'Doe'),
        User.create('2', 'user2@example.com', 'Jane', 'Smith'),
      ];
      mockUsersFacade.users.set(mockUsers);

      // Act
      fixture.detectChanges();

      // Assert
      const userElements = fixture.nativeElement.querySelectorAll('.user-item');
      expect(userElements.length).toBe(2);
    });

    it('should show loading spinner when isLoading is true', () => {
      // Arrange
      mockUsersFacade.isLoading.set(true);

      // Act
      fixture.detectChanges();

      // Assert
      const spinner = fixture.nativeElement.querySelector('app-spinner');
      expect(spinner).toBeTruthy();
    });
  });
});
```

## Implementation Standards

### Testing Tools and Configuration

You MUST use these tools for testing:

- **Jest**: Primary testing framework for all unit and integration tests
- **Angular TestBed**: For component testing and Angular service testing
- **HttpClientTestingModule**: For testing HTTP interactions
- **cypress**: For end-to-end testing (when required)

### Coverage Requirements

You WILL maintain these coverage standards:

- **Domain Layer**: 100% coverage - NON-NEGOTIABLE
- **Infrastructure Layer**: 90%+ coverage focusing on integration points
- **Application Layer**: 95%+ coverage focusing on orchestration paths
- **Presentation Layer**: 80%+ coverage focusing on user interactions

### Test Organization

You MUST organize tests following these patterns:

- One test file per source file with `.spec.ts` extension
- Describe blocks for each public method or major functionality
- Clear test names following "should [expected behavior] when [condition]" pattern
- Arrange-Act-Assert pattern for all test implementations
- Proper setup and teardown in beforeEach/afterEach blocks

## Integration Guidelines

### Cross-Layer Testing Strategy

You WILL ensure proper integration testing by:

- Testing each layer in isolation with mocked dependencies
- Verifying contract compliance between layers
- Testing error propagation and transformation across layers
- Maintaining clear test boundaries that respect architectural layers

### Mock Strategy

You MUST implement mocking consistently:

- **Domain Layer**: No mocks - pure object testing
- **Infrastructure Layer**: Mock external endpoints and browser APIs only
- **Application Layer**: Mock all injected dependencies
- **Presentation Layer**: Mock all Facades and Angular services

### Test Data Management

You WILL manage test data by:

- Creating factory functions for consistent test object creation
- Using realistic test data that matches actual usage patterns
- Centralizing common test fixtures and utilities
- Ensuring test data independence between test cases

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Test implementation details instead of behavior
- Create tests that break when refactoring internal logic
- Mock classes or methods within the same architectural layer
- Write tests that depend on external services or databases
- Create tests that require specific execution order
- Test multiple architectural layers in a single test
- Use real HTTP calls or external dependencies in tests

### Common Testing Mistakes to Avoid

**❌ WRONG - Testing implementation details:**

```typescript
// Never test private methods or internal state
describe('UserService', () => {
  it('should call private validation method', () => {
    // ❌ Testing implementation, not behavior
    spyOn(service, 'validateUserData' as any);
    service.createUser(userData);
    expect(service.validateUserData).toHaveBeenCalled();
  });
});
```

**❌ WRONG - Mocking within the same layer:**

```typescript
// Never mock classes from the same architectural layer
describe('LoginUseCase', () => {
  it('should create user session', () => {
    // ❌ Don't mock domain entities in application tests
    const mockUser = jest.createMockFromModule<User>('./user.entity');

    // ✅ Create real domain objects instead
    const user = User.create('123', 'test@example.com', 'John', 'Doe');
  });
});
```

**❌ WRONG - Testing multiple layers:**

```typescript
// Never test across architectural boundaries
describe('UserManagementIntegration', () => {
  it('should save user to database and update UI', () => {
    // ❌ This test spans Domain, Infrastructure, and Presentation
    const user = createUser();
    const repository = new HttpUserRepository();
    const component = new UserListComponent();

    // This violates layer isolation
  });
});
```

**✅ CORRECT - Testing behavior with proper isolation:**

```typescript
// Test behavior outcomes, not implementation details
describe('LoginUseCase', () => {
  describe('execute', () => {
    it('should return success result with session when credentials are valid', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'validpass' };
      const expectedSession = Session.create('user-123', 'token-456');
      mockAuthRepository.login.mockResolvedValue(Result.ok(expectedSession));

      // Act
      const result = await useCase.execute(credentials);

      // Assert - Focus on behavior outcomes
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toBe(expectedSession);
      expect(mockAuthRepository.login).toHaveBeenCalledWith('test@example.com', 'validpass');
    });
  });
});
```

## Validation Criteria

### Feature Completion Checklist

You MUST complete this checklist before considering any feature done:

**Domain Layer Testing:**

- [ ] All new business rules covered by unit tests
- [ ] All entity state transitions tested
- [ ] All value object validations tested
- [ ] All domain errors tested with proper types and messages
- [ ] 100% code coverage maintained

**Infrastructure Layer Testing:**

- [ ] Repository implementations tested with mocked HTTP responses
- [ ] Data mappers tested with realistic DTO examples
- [ ] Storage services tested with mocked browser APIs
- [ ] Error handling tested for network and API failures
- [ ] 90%+ code coverage achieved

**Application Layer Testing:**

- [ ] Use case orchestration tested with mocked dependencies
- [ ] Facade state management tested for all scenarios
- [ ] Error transformation tested across layer boundaries
- [ ] Transaction handling tested for multi-step operations
- [ ] 95%+ code coverage achieved

**Presentation Layer Testing:**

- [ ] Dumb components tested in isolation
- [ ] Smart components tested with mocked Facades
- [ ] User interaction flows tested end-to-end
- [ ] Error state display tested
- [ ] 80%+ code coverage achieved

### Quality Gates

You WILL ensure all tests meet these criteria:

- **Fast Execution**: Unit tests complete in milliseconds, integration tests in seconds
- **Reliable**: Tests pass consistently and fail only when behavior changes
- **Independent**: Tests can run in any order without dependencies
- **Clear Failures**: Test failures provide specific, actionable information
- **Maintainable**: Tests remain stable during internal refactoring

### Success Indicators

Your testing implementation is successful when:

- All business rules are protected by fast, reliable tests
- Refactoring implementation details doesn't break tests
- New features can be developed with confidence in existing functionality
- Bug reports are accompanied by failing tests that reproduce the issue
- Test execution time remains reasonable as the codebase grows
- Coverage metrics accurately reflect actual testing quality

---

**Remember**: Testing is not about achieving high coverage numbers - it's about ensuring your code behaves correctly under all conditions. Write tests that protect your business logic, verify your integrations, and give you confidence to refactor and extend your application.
