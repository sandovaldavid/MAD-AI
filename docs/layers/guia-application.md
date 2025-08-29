# Guía Arquitectónica para Application Layer

## QUÉ ES Application

Application es la capa de **orquestación** que coordina Domain e Infrastructure para cumplir casos de uso específicos. Es el director de orquesta que ejecuta intenciones del usuario sin contener lógica de negocio.

## PRINCIPIO FUNDAMENTAL

Application **NO CONTIENE** lógica de negocio, la **ORQUESTA**. Application **NO DEFINE** contratos, los **USA**.

## REGLA DE DECISIÓN

**Pregunta clave:** "¿Este código coordina múltiples servicios/repositories/entidades para cumplir un caso de uso específico del usuario?"

- Si SÍ → Va en Application
- Si NO → Va en otra capa

## ESTRUCTURA OBLIGATORIA

### `/use-cases` - Casos de uso del sistema

**DEFINICIÓN:** Un use case representa UNA intención específica del usuario final.

**QUÉ VA:**

- Orquestación de Domain services y repositories
- Validaciones de autorización (no de negocio)
- Coordinación transaccional
- Publicación de domain events

**QUÉ NO VA:**

- Lógica de negocio (va en Domain)
- Llamadas HTTP directas (va en Infrastructure)
- Validaciones de formato (van en Domain)
- Lógica de presentación

**ESTRUCTURA REQUERIDA:**

```bash
use-cases/
  auth/
    login.usecase.ts
    register.usecase.ts
    logout.usecase.ts
  user-management/
    create-user.usecase.ts
    update-user.usecase.ts
    delete-user.usecase.ts
  role-management/
    assign-role.usecase.ts
    revoke-role.usecase.ts
```

**PATRÓN OBLIGATORIO:**

```typescript
@Injectable()
export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private sessionService: SessionService,
    private eventBus: DomainEventBus,
    private logger: Logger
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    // 1. Log del inicio
    this.logger.info('Login attempt', { email: command.email });

    // 2. Validar autorización/contexto (NO negocio)
    if (!command.email || !command.password) {
      throw ApplicationError.invalidInput('Email and password required');
    }

    // 3. Orquestar Domain (NO lógica propia)
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw ApplicationError.userNotFound();
    }

    // 4. Delegar lógica a Domain
    const isValidPassword = user.verifyPassword(command.password);
    if (!isValidPassword) {
      throw ApplicationError.invalidCredentials();
    }

    // 5. Coordinar efectos
    user.recordSuccessfulLogin(); // Domain method
    await this.userRepository.save(user);

    const session = await this.sessionService.createSession(user);

    // 6. Publicar eventos
    const events = user.getDomainEvents();
    await this.eventBus.publishAll(events);
    user.clearDomainEvents();

    // 7. Log del resultado
    this.logger.info('Login successful', { userId: user.id });

    return {
      sessionToken: session.token,
      user: this.mapUserToSummary(user),
    };
  }

  private mapUserToSummary(user: User): UserSummary {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.roleName,
    };
  }
}
```

**REGLAS PARA USE CASES:**

- Máximo 30-40 líneas por use case
- Una sola responsabilidad por use case
- NO lógica condicional compleja
- SIEMPRE delegar validaciones a Domain
- SIEMPRE manejar domain events

### `/facades` - Interfaces simplificadas para Presentation

**DEFINICIÓN:** Los facades agrupan use cases relacionados y proporcionan una API simplificada para la UI.

**QUÉ VA:**

- Coordinación de múltiples use cases
- Transformaciones específicas para UI
- Estados simples para componentes
- Mappers Application→Presentation

**QUÉ NO VA:**

- Lógica de negocio
- Dependencias de frameworks específicos
- Validaciones de dominio
- Lógica de componentes

**PATRÓN OBLIGATORIO:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  constructor(
    private loginUseCase: LoginUseCase,
    private logoutUseCase: LogoutUseCase,
    private registerUseCase: RegisterUseCase,
    private getCurrentUserUseCase: GetCurrentUserUseCase
  ) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const command: LoginCommand = {
      email: request.email.trim().toLowerCase(),
      password: request.password,
      rememberMe: request.rememberMe ?? false,
    };

    const result = await this.loginUseCase.execute(command);

    return {
      success: true,
      user: result.user,
      redirectUrl: this.determineRedirectUrl(result.user),
    };
  }

  async logout(): Promise<void> {
    await this.logoutUseCase.execute();
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return await this.getCurrentUserUseCase.execute();
  }

  isAuthenticated(): boolean {
    // Lógica simple, NO llamadas async
    return this.sessionService.hasActiveSession();
  }

  private determineRedirectUrl(user: UserSummary): string {
    // Lógica de coordinación para UI
    if (user.role === 'admin') return '/admin';
    if (user.role === 'manager') return '/dashboard';
    return '/projects';
  }
}
```

**REGLAS PARA FACADES:**

- Máximo 8-10 métodos públicos
- NO lógica de negocio
- Siempre mapear entre tipos Application y Presentation
- Métodos síncronos para consultas de estado simple

### `/types` - Contratos específicos de Application

**QUÉ VA:**

- Commands que reciben los use cases
- Results que retornan los use cases
- Tipos de coordinación entre use cases
- Interfaces específicas de Application

**QUÉ NO VA:**

- DTOs de Infrastructure
- Entidades de Domain
- Tipos específicos de UI

**EJEMPLOS CORRECTOS:**

```typescript
// auth.types.ts
export interface LoginCommand {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

export interface LoginResult {
  readonly sessionToken: string;
  readonly user: UserSummary;
  readonly expiresAt: Date;
}

export interface UserSummary {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: string;
  readonly permissions: string[];
}

// Tipos para coordinación
export interface AuthResponse {
  readonly success: boolean;
  readonly user?: UserSummary;
  readonly error?: string;
  readonly redirectUrl?: string;
}
```

### `/mappers` - Transformaciones de Application

**QUÉ VA:**

- Domain entities → Application types
- Application commands → Domain objects
- Transformaciones para facades

**QUÉ NO VA:**

- Infrastructure DTOs → Domain (va en Infrastructure)
- Application → Presentation (va en Presentation)

**EJEMPLO CORRECTO:**

```typescript
@Injectable()
export class AuthMapper {
  static toUserSummary(user: User): UserSummary {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.roleName,
      permissions: user.getPermissionsList(),
    };
  }

  static toLoginCommand(request: LoginRequest): LoginCommand {
    return {
      email: request.email.trim().toLowerCase(),
      password: request.password,
      rememberMe: request.rememberMe ?? false,
    };
  }
}
```

### `/errors` - Manejo de errores de Application

**ESTRUCTURA OBLIGATORIA:**

```typescript
errors/
  application-error.ts        # Clase principal
  error-codes.enum.ts         # Códigos por feature
```

**IMPLEMENTACIÓN REQUERIDA:**

```typescript
// application-error.ts
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly context?: Record<string, any>;
  public readonly suggestedAction?: string;
  public readonly timestamp: Date;

  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    super(technicalMessage);
    this.name = 'ApplicationError';
    this.code = code;
    this.userMessage = userMessage;
    this.context = context;
    this.suggestedAction = suggestedAction;
    this.timestamp = new Date();
  }

  // Factory methods por feature
  static authenticationFailed(): ApplicationError {
    return new ApplicationError(
      'AUTH_FAILED',
      'User authentication failed',
      'Invalid email or password',
      undefined,
      'Please check your credentials and try again'
    );
  }

  static userNotFound(email?: string): ApplicationError {
    return new ApplicationError(
      'USER_NOT_FOUND',
      'User not found in system',
      'No account found with this email',
      { email },
      'Please check the email address or register a new account'
    );
  }

  static sessionExpired(): ApplicationError {
    return new ApplicationError(
      'SESSION_EXPIRED',
      'User session has expired',
      'Your session has expired for security reasons',
      undefined,
      'Please log in again to continue'
    );
  }

  static insufficientPermissions(requiredRole: string): ApplicationError {
    return new ApplicationError(
      'INSUFFICIENT_PERMISSIONS',
      'User lacks required permissions',
      'You do not have permission to perform this action',
      { requiredRole },
      'Contact your administrator if you need additional permissions'
    );
  }
}
```

## INTEGRACIÓN CON DOMAIN EVENTS

**PATRÓN REQUERIDO EN USE CASES:**

```typescript
async execute(command: Command): Promise<Result> {
  // 1. Lógica de orquestación
  const entity = await this.repository.findById(command.id);
  entity.performBusinessOperation(command.data);
  await this.repository.save(entity);

  // 2. Publicar eventos (automático con decorator)
  const events = entity.getDomainEvents();
  await this.eventBus.publishAll(events);
  entity.clearDomainEvents();

  return result;
}
```

## MANEJO DE ERRORES ENTRE CAPAS

**PATRÓN DE TRANSFORMACIÓN:**

```typescript
async execute(command: Command): Promise<Result> {
  try {
    // Lógica del use case
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      // Pasar errores de Domain directamente
      throw error;
    }

    if (error instanceof InfrastructureError) {
      // Transformar errores técnicos
      throw ApplicationError.systemUnavailable(
        'Service temporarily unavailable',
        { originalError: error.code }
      );
    }

    // Error inesperado
    throw ApplicationError.unexpectedError();
  }
}
```

## REGLAS DE DEPENDENCIAS

**Application PUEDE usar:**

- Domain (interfaces, entidades, services)
- Core (logging, event bus, configuration)
- Sus propios use cases (facade → use case)

**Application NO PUEDE usar:**

- Infrastructure concreta (solo interfaces)
- Presentation
- Frameworks específicos (Angular/React)

## PROHIBICIONES ABSOLUTAS

**NUNCA hagas esto en Application:**

- Validaciones de reglas de negocio
- Algoritmos o cálculos complejos
- Llamadas HTTP directas
- Manejo de estado de UI
- Lógica condicional compleja sobre entidades

**NUNCA importes:**

- Clases concretas de Infrastructure
- Componentes de Presentation
- HttpClient u otros servicios específicos de Angular

## SEÑALES DE ALARMA

Si encuentras esto, está mal ubicado:

- Use cases con más de 50 líneas
- Lógica if/else compleja sobre propiedades de entidades
- Cálculos matemáticos o algoritmos
- Referencias directas a APIs externas
- Manejo de formularios o validaciones de UI

## TEST DE VALIDACIÓN

**Pregunta final:** "¿Este código podría ejecutarse en una aplicación de consola, una API REST, y una app móvil con los mismos resultados de negocio?"

- Si SÍ → Está correctamente en Application
- Si NO → Contiene lógica específica de alguna capa

**Application debe ser agnóstico del mecanismo de delivery (web, mobile, API, consola).**
