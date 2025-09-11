---
description: 'Infrastructure Layer implementation guidelines using concrete technologies'
applyTo: '**/infrastructure/**/*.ts'
---

# Infrastructure Layer Implementation Instructions

## Core Principles

You WILL implement Infrastructure Layer components following these fundamental rules:

**CRITICAL**: The Infrastructure Layer is where abstraction meets reality. You MUST implement Domain contracts using concrete technologies like Angular HttpClient, localStorage, and external APIs.

You MUST follow this **Golden Rule**: If you change from REST API to GraphQL, or from localStorage to IndexedDB, Infrastructure should be the ONLY layer (besides dependency injection configuration) that requires significant changes.

You WILL ensure the Infrastructure Layer:

- **Implements Domain Contracts**: Every repository interface from Domain must have a concrete implementation here
- **Uses Real Technologies**: Angular HttpClient, browser APIs, external services, and concrete data sources
- **Isolates Technology Concerns**: Contains all knowledge about HTTP endpoints, data formats, and external service protocols
- **Serves as the Bridge**: Connects pure Domain abstractions with messy real-world implementations
- **Handles Technical Failures**: Manages network errors, API timeouts, and external service unavailability

**MANDATORY**: Infrastructure never defines business interfaces - it only implements interfaces defined in the Domain layer.

## Structural Requirements

### `/repositories` - Domain Contract Implementations

You WILL create repository implementations that:

- Implement Domain repository interfaces using concrete technologies
- Orchestrate HTTP clients, mappers, and configuration to fulfill Domain contracts
- Handle technical errors and convert them to Domain-appropriate exceptions
- Coordinate multiple infrastructure components to complete Domain operations

You MUST ensure repository implementations:

- Have names that clearly indicate their technology (e.g., `HttpUserRepository`, `LocalStorageTokenStore`)
- Implement exactly one Domain repository interface
- Never contain HTTP client logic directly - delegate to API clients
- Never contain mapping logic directly - delegate to mappers
- Never contain business rules or validation

**Example Repository Implementation:**

```typescript
// ✅ CORRECT - Repository implementing Domain contract
@Injectable()
export class HttpUserRepository implements IUserRepository {
  constructor(
    private readonly userApiClient: UserApiClient,
    private readonly userMapper: UserMapper,
    private readonly logger: ILogger
  ) {}

  async findUserByEmail(email: Email): Promise<User | null> {
    try {
      const userDto = await this.userApiClient.getUserByEmail(email.toString());
      return userDto ? this.userMapper.fromDto(userDto) : null;
    } catch (error) {
      this.logger.error('Failed to find user by email', error, { email: email.toString() });
      throw new InfrastructureError('User lookup failed', error);
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      const userDto = this.userMapper.toCreateDto(user);
      await this.userApiClient.createUser(userDto);
    } catch (error) {
      this.logger.error('Failed to save user', error, { userId: user.getId() });
      throw new InfrastructureError('User save failed', error);
    }
  }
}
```

### `/http` - API Communication Infrastructure

#### `/clients` - Specialized API Clients

You WILL create API clients that:

- Encapsulate all HTTP calls to specific API endpoints or service groups
- Know the exact URLs, HTTP methods, and request/response formats
- Use configuration from `/config` for endpoint URLs
- Return raw DTOs without any mapping or business logic
- Handle only HTTP-level concerns (headers, status codes, timeouts)

You MUST ensure API clients:

- Have focused responsibility for one logical API group (e.g., `AuthApiClient`, `UserApiClient`)
- Use dependency injection for HttpClient and configuration
- Include comprehensive error handling for HTTP-specific failures
- Log requests and responses for debugging purposes

**Example API Client:**

```typescript
// ✅ CORRECT - Focused API client
@Injectable()
export class UserApiClient {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_ENDPOINTS) private readonly apiEndpoints: ApiEndpoints,
    private readonly logger: ILogger
  ) {}

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const url = `${this.apiEndpoints.users}/by-email`;

    try {
      this.logger.debug('Fetching user by email', { email, url });

      const response = await this.http
        .get<UserResponseDto>(url, {
          params: { email },
        })
        .toPromise();

      return response ?? null;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw new HttpError('Failed to fetch user by email', error);
    }
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const url = this.apiEndpoints.users;

    try {
      this.logger.debug('Creating user', { url });

      return await this.http.post<UserResponseDto>(url, userData).toPromise();
    } catch (error) {
      throw new HttpError('Failed to create user', error);
    }
  }
}
```

#### `/interceptors` - Cross-Cutting HTTP Concerns

You WILL create interceptors for:

- Authentication token injection (`AuthInterceptor`)
- Global request/response logging
- Error handling that applies to all HTTP requests
- Request timing and performance monitoring
- API versioning headers

You MUST ensure interceptors:

- Handle truly cross-cutting concerns that apply to multiple API calls
- Are registered in the proper Angular HTTP interceptor chain
- Don't contain business logic or endpoint-specific behavior
- Include proper error recovery mechanisms

### `/mappers` - Data Transformation Layer

You WILL create mappers that:

- Convert DTOs to Domain entities and value objects
- Convert Domain objects to DTOs for API requests
- Handle all data structure differences between API and Domain
- Perform data type conversions and formatting
- Validate data integrity during transformation

You MUST ensure mappers:

- Are stateless classes with pure transformation methods
- Handle null/undefined values gracefully
- Throw meaningful errors for invalid or incomplete data
- Use Domain factory methods when creating Domain objects
- Never contain business logic - only data transformation

**Example Mapper Implementation:**

```typescript
// ✅ CORRECT - Pure data transformation
@Injectable()
export class UserMapper {
  constructor(private readonly logger: ILogger) {}

  fromDto(dto: UserResponseDto): User {
    try {
      return User.create(
        dto.id,
        dto.email,
        dto.firstName,
        dto.lastName,
        this.mapStatus(dto.status),
        new Date(dto.createdAt)
      );
    } catch (error) {
      this.logger.error('Failed to map user from DTO', error, { dto });
      throw new MappingError('Invalid user data from API', error);
    }
  }

  toCreateDto(user: User): CreateUserDto {
    return {
      email: user.getEmail().toString(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      status: user.getStatus().toString(),
    };
  }

  private mapStatus(statusString: string): UserStatus {
    switch (statusString.toLowerCase()) {
      case 'active':
        return UserStatus.ACTIVE;
      case 'inactive':
        return UserStatus.INACTIVE;
      case 'suspended':
        return UserStatus.SUSPENDED;
      default:
        throw new MappingError(`Unknown user status: ${statusString}`);
    }
  }
}
```

### `/dtos` - API Data Contracts

You WILL define DTOs that:

- Represent the exact structure of JSON data from external APIs
- Are simple interfaces or types with no methods or logic
- Match the API specification exactly (from Swagger/OpenAPI documentation)
- Include all fields that may be present in API responses
- Use primitive TypeScript types that match JSON data types

You MUST ensure DTOs:

- Are organized by API endpoint or logical grouping
- Have clear, descriptive names that indicate their purpose
- Include optional properties for fields that may be absent
- Are kept in sync with actual API contracts
- Never include business logic or validation methods

**Example DTO Definitions:**

```typescript
// ✅ CORRECT - Pure data structures matching API
export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles?: string[];
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  status?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}
```

### `/services` - Technical Service Implementations

You WILL organize technical services by capability:

#### `/storage` - Browser Storage Implementations

- Implement storage contracts using localStorage, sessionStorage, or IndexedDB
- Handle storage quotas, serialization, and browser compatibility
- Provide fallback mechanisms for storage failures

#### `/export` - File Generation and Download Services

- Generate files (PDF, Excel, CSV) from application data
- Handle browser download mechanisms and file streaming
- Manage temporary file creation and cleanup

#### `/notification` - External Notification Gateways

- Integrate with push notification services
- Handle WebSocket connections for real-time notifications
- Manage notification queuing and retry mechanisms

#### `/system` - System-Level Service Implementations

- Implement system contracts using browser APIs
- Handle timezone detection, user agent parsing
- Provide access to browser capabilities and features

### `/errors` - Infrastructure Error Handling

You WILL create error types for:

- `InfrastructureError`: Base class for all infrastructure failures
- `HttpError`: HTTP-specific errors with status codes and response details
- `MappingError`: Data transformation failures with context
- `StorageError`: Browser storage failures and quota issues
- `ExternalServiceError`: Third-party service integration failures

You MUST ensure error classes:

- Include relevant technical context (URLs, status codes, timestamps)
- Preserve original error information for debugging
- Provide meaningful messages for different failure scenarios
- Support error categorization for monitoring and alerting

### `/config` - Infrastructure Configuration

You WILL create configuration objects for:

- API endpoint URLs organized by service
- HTTP timeout and retry settings
- Storage configuration and keys
- External service credentials and endpoints
- Environment-specific infrastructure settings

You MUST ensure configuration:

- Uses Angular dependency injection tokens for type safety
- Supports different environments (development, staging, production)
- Centralizes all infrastructure-specific constants
- Never includes business configuration or domain rules

## Implementation Standards

### Dependency Injection Integration

You WILL ensure Infrastructure services:

- Are properly decorated with `@Injectable()`
- Use constructor injection for all dependencies
- Implement Domain interfaces explicitly
- Are registered in Angular's dependency injection container
- Support easy mocking and testing through interface dependencies

### Error Handling Strategy

You MUST implement comprehensive error handling that:

- Catches all external service failures
- Converts technical errors to Domain-appropriate exceptions
- Logs sufficient context for debugging
- Provides fallback mechanisms where appropriate
- Never exposes internal technical details to upper layers

### Performance Considerations

You WILL optimize Infrastructure implementations by:

- Implementing appropriate caching strategies for API responses
- Using connection pooling and request batching where beneficial
- Monitoring and logging performance metrics
- Implementing timeouts and circuit breakers for external services
- Using lazy loading for non-critical external service connections

## Integration Guidelines

### Serving the Application Layer

You WILL ensure Infrastructure provides:

- Complete implementations of all Domain repository interfaces
- Reliable error handling that doesn't crash the application
- Performance characteristics suitable for the Application Layer's needs
- Comprehensive logging for debugging and monitoring
- Configuration flexibility for different deployment environments

### Testing Strategy

You MUST implement:

- **Integration Tests**: Test actual API calls against test endpoints
- **Contract Tests**: Verify implementations satisfy Domain interface contracts
- **Error Scenario Tests**: Test failure modes and error handling
- **Performance Tests**: Validate response times and throughput
- **Mocking Support**: Provide test doubles for Application Layer testing

### Technology Isolation

You WILL ensure that:

- All Angular-specific code is contained within Infrastructure
- HTTP client details never leak to other layers
- External service protocols are abstracted behind Domain interfaces
- Technology changes can be made without affecting Domain or Application layers

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Define business interfaces or domain contracts (these belong in Domain)
- Include business logic or domain rules in Infrastructure implementations
- Communicate directly with the Presentation layer
- Expose technical implementation details to Application layer
- Mix different infrastructure concerns in the same class
- Hardcode URLs, credentials, or configuration values
- Create Infrastructure services that don't implement Domain contracts

### Common Mistakes to Avoid

**❌ WRONG - Repository with business logic:**

```typescript
// Never include business rules in Infrastructure
export class HttpUserRepository implements IUserRepository {
  async saveUser(user: User): Promise<void> {
    // ❌ Business validation doesn't belong here
    if (!user.isEligibleForSave()) {
      throw new Error('User not eligible for saving');
    }

    await this.userApiClient.createUser(this.userMapper.toDto(user));
  }
}
```

**❌ WRONG - API client with mapping logic:**

```typescript
// Never mix API calls with data transformation
export class UserApiClient {
  async getUser(id: string): Promise<User> {
    // ❌ Should return DTO
    const response = await this.http.get<UserResponseDto>(`/api/users/${id}`);
    // ❌ Mapping doesn't belong in API client
    return this.convertToUser(response);
  }
}
```

**❌ WRONG - Mapper with business validation:**

```typescript
// Never include business rules in mappers
export class UserMapper {
  fromDto(dto: UserResponseDto): User {
    const user = User.create(dto.id, dto.email, dto.firstName, dto.lastName);

    // ❌ Business validation doesn't belong in mappers
    if (!user.hasValidBusinessRules()) {
      throw new Error('User violates business rules');
    }

    return user;
  }
}
```

**✅ CORRECT - Clean separation of concerns:**

```typescript
// Repository orchestrates without business logic
export class HttpUserRepository implements IUserRepository {
  async saveUser(user: User): Promise<void> {
    try {
      const createDto = this.userMapper.toCreateDto(user);
      await this.userApiClient.createUser(createDto);
      this.logger.info('User saved successfully', { userId: user.getId() });
    } catch (error) {
      this.logger.error('Failed to save user', error);
      throw new InfrastructureError('User save operation failed', error);
    }
  }
}
```

## Validation Criteria

### Code Review Checklist

You MUST verify that Infrastructure code:

- [ ] Implements Domain interfaces without defining new business contracts
- [ ] Contains zero business logic or domain rules
- [ ] Uses proper dependency injection with Angular decorators
- [ ] Handles all external service failures gracefully
- [ ] Logs appropriate information for debugging and monitoring
- [ ] Uses configuration objects instead of hardcoded values
- [ ] Separates concerns properly across repositories, clients, mappers, and services
- [ ] Includes comprehensive error handling with meaningful error types
- [ ] Provides complete test coverage including error scenarios
- [ ] Never exposes technical implementation details to other layers

### Quality Gates

You WILL ensure Infrastructure implementations:

- **Contract Compliance**: All Domain repository interfaces have working implementations
- **Error Resilience**: External service failures don't crash the application
- **Performance Acceptable**: Response times meet application requirements
- **Technology Isolation**: Framework and API changes don't affect other layers
- **Configuration Driven**: Deployment environment differences are handled through configuration

### Success Indicators

Your Infrastructure implementation is successful when:

- Business logic changes don't require Infrastructure modifications
- External API changes only require updates to DTOs, mappers, and API clients
- The Application layer can be tested using Infrastructure mocks
- Infrastructure failures are handled gracefully with appropriate fallbacks
- Performance monitoring shows acceptable response times and error rates
- Different deployment environments work with configuration-only changes

### Integration Testing Requirements

You MUST implement tests that:

- Verify actual API integration using test environments
- Test error handling with various failure scenarios
- Validate data mapping between API formats and Domain objects
- Confirm proper dependency injection and Angular integration
- Test configuration loading and environment-specific behavior

---

**Remember**: Infrastructure is where the rubber meets the road. Keep it focused on technical implementation details while faithfully serving the contracts defined by your Domain layer. Every piece of technology-specific code belongs here, and business logic never does.
