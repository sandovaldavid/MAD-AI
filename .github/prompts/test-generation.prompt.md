---
description: 'test generation prompt tailored for MAD-AI project, ensuring adherence to Clean Architecture + DDD principles across Domain, Application, Infrastructure, Presentation, and Core layers. Provides specific testing strategies, patterns, and architectural validation rules for each layer to maintain code quality and consistency.'
mode: 'agent'
---

# 🧪 MAD-AI Test Generation Prompt

Esta es tu guía integral para generar tests que cumplan con la arquitectura Clean Architecture + DDD del proyecto MAD-AI. Cada capa tiene estrategias de testing específicas y reglas arquitectónicas que DEBES seguir.

## 📋 Instrucciones Generales

**ANTES DE GENERAR CUALQUIER TEST:**

1. **Identifica la capa** del archivo que vas a testear
2. **Aplica la estrategia** específica de testing para esa capa
3. **Verifica las reglas arquitectónicas** que debe cumplir la capa
4. **Usa los patrones** establecidos en la guía de testing
5. **Sigue las convenciones** de naming del proyecto

---

## 🎯 Estrategias de Testing por Capa

### 🧠 DOMAIN LAYER - Tests Unitarios Puros

**UBICACIÓN:** `src/app/domain/`

**TIPO DE TEST:** Unitarios puros (sin mocks, sin dependencias externas)

**QUÉ TESTEAR:**
- Reglas de negocio en entidades
- Invariantes que deben mantenerse siempre
- Validaciones de creación y modificación
- Cálculos y transformaciones de datos
- Estado y transiciones válidas
- Eventos de dominio que se generan

**REGLAS ARQUITECTÓNICAS A VALIDAR:**
- ✅ Entidades contienen lógica de negocio pura
- ✅ Value Objects son inmutables
- ✅ NO dependencias de frameworks externos
- ✅ NO llamadas HTTP o base de datos
- ✅ Interfaces de repositorios están definidas (no implementaciones)

**PATRÓN DE TEST:**

```typescript
describe('User Entity - Domain Tests', () => {
  describe('Business Rules', () => {
    it('should allow role change when user has permission', () => {
      // Given - Datos determinísticos
      const user = new User({
        id: 1,
        username: 'testuser',
        role: Role.MANAGER,
        permissions: [Permission.MANAGE_ROLES]
      });

      // When - Invocar lógica de negocio
      const result = user.changeRole(Role.ADMIN);

      // Then - Validar regla de negocio
      expect(result.isSuccess).toBe(true);
      expect(user.role).toBe(Role.ADMIN);
      expect(user.getDomainEvents()).toHaveLength(1);
      expect(user.getDomainEvents()[0]).toBeInstanceOf(UserRoleChangedEvent);
    });

    it('should reject role change when user lacks permission', () => {
      // Given
      const user = new User({
        id: 1,
        username: 'testuser',
        role: Role.USER,
        permissions: []
      });

      // When
      const result = user.changeRole(Role.ADMIN);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('insufficient permissions');
      expect(user.role).toBe(Role.USER); // Estado no cambió
    });
  });

  describe('Value Object Creation', () => {
    it('should create valid email value object', () => {
      const result = Email.create('test@example.com');
      
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const result = Email.create('invalid-email');
      
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('invalid email format');
    });
  });

  describe('Domain Events', () => {
    it('should emit domain event when business operation occurs', () => {
      const user = new User(validUserData);
      
      user.activateAccount();
      
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserAccountActivatedEvent);
      expect(events[0].aggregateId).toBe(user.id);
    });
  });
});
```

**SEÑALES DE ALARMA - NUNCA HAGAS ESTO:**
- ❌ NO uses mocks en tests de Domain
- ❌ NO testees getters/setters simples sin lógica
- ❌ NO uses datos aleatorios (usa datos determinísticos)
- ❌ NO ignores casos extremos y edge cases
- ❌ NO dependas de infraestructura (BD, APIs, archivos)

---

### 🚀 APPLICATION LAYER - Tests Unitarios con Mocks

**UBICACIÓN:** `src/app/application/`

**TIPO DE TEST:** Unitarios con mocks de dependencias

**QUÉ TESTEAR:**
- Flujo completo del caso de uso
- Coordinación entre domain e infrastructure
- Manejo de errores y casos excepcionales
- Transformación de datos (mappers)
- Validación de comandos y queries
- Emisión de eventos después de operaciones

**REGLAS ARQUITECTÓNICAS A VALIDAR:**
- ✅ Use cases orquestan sin contener lógica de negocio
- ✅ Commands/Queries tienen validación básica
- ✅ Mappers transforman correctamente entre capas
- ✅ NO hay llamadas HTTP directas
- ✅ Se delega lógica de negocio a Domain

**PATRÓN DE TEST:**

```typescript
describe('CreateUserUseCase - Application Tests', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jasmine.SpyObj<IUserRepository>;
  let mockRoleRepository: jasmine.SpyObj<IRoleRepository>;
  let mockEventBus: jasmine.SpyObj<DomainEventBus>;

  beforeEach(() => {
    const userRepoSpy = jasmine.createSpyObj('IUserRepository', ['save', 'findByEmail']);
    const roleRepoSpy = jasmine.createSpyObj('IRoleRepository', ['findById']);
    const eventBusSpy = jasmine.createSpyObj('DomainEventBus', ['publish']);

    TestBed.configureTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: IUserRepository, useValue: userRepoSpy },
        { provide: IRoleRepository, useValue: roleRepoSpy },
        { provide: DomainEventBus, useValue: eventBusSpy }
      ]
    });

    useCase = TestBed.inject(CreateUserUseCase);
    mockUserRepository = TestBed.inject(IUserRepository) as jasmine.SpyObj<IUserRepository>;
    mockRoleRepository = TestBed.inject(IRoleRepository) as jasmine.SpyObj<IRoleRepository>;
    mockEventBus = TestBed.inject(DomainEventBus) as jasmine.SpyObj<DomainEventBus>;
  });

  describe('Happy Path', () => {
    it('should create user successfully when valid command provided', async () => {
      // Given - Mock setup
      const command = new CreateUserCommand('john@test.com', 'John Doe', 1);
      const role = new Role({ id: 1, name: 'User' });
      const savedUser = new User({ id: 1, email: 'john@test.com', role });

      mockRoleRepository.findById.and.returnValue(of(role));
      mockUserRepository.findByEmail.and.returnValue(of(null)); // No existe
      mockUserRepository.save.and.returnValue(of(savedUser));

      // When
      const result = await firstValueFrom(useCase.execute(command));

      // Then - Verificar orquestación
      expect(result.isSuccess).toBe(true);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@test.com');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should fail when user email already exists', async () => {
      // Given
      const command = new CreateUserCommand('existing@test.com', 'John Doe', 1);
      const existingUser = new User({ id: 1, email: 'existing@test.com' });

      mockUserRepository.findByEmail.and.returnValue(of(existingUser));

      // When
      const result = await firstValueFrom(useCase.execute(command));

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('email already exists');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Given
      const command = new CreateUserCommand('john@test.com', 'John Doe', 1);
      mockUserRepository.findByEmail.and.returnValue(throwError(() => new Error('DB Error')));

      // When
      const result = await firstValueFrom(useCase.execute(command));

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('failed to create user');
    });
  });

  describe('Mapper Tests', () => {
    it('should map command to domain entity correctly', () => {
      // Given
      const command = new CreateUserCommand('john@test.com', 'John Doe', 1);
      const mapper = new UserMapper();

      // When
      const userRequest = mapper.commandToDomainRequest(command);

      // Then
      expect(userRequest.email).toBe('john@test.com');
      expect(userRequest.name).toBe('John Doe');
      expect(userRequest.roleId).toBe(1);
    });
  });
});
```

**SEÑALES DE ALARMA - NUNCA HAGAS ESTO:**
- ❌ NO pongas lógica de negocio en use cases
- ❌ NO hagas tests de integración reales (usa mocks)
- ❌ NO ignores el manejo de errores
- ❌ NO olvides testear los mappers
- ❌ NO couples los tests a la implementación

---

### 🔧 INFRASTRUCTURE LAYER - Tests de Integración con Mocks HTTP

**UBICACIÓN:** `src/app/infrastructure/`

**TIPO DE TEST:** Integración con HttpClientTestingModule

**QUÉ TESTEAR:**
- Integración con APIs externas (Django)
- Transformación de DTOs a entidades
- Manejo de errores HTTP
- Persistencia y recuperación de datos
- Autenticación y autorización
- Interceptors y guards

**REGLAS ARQUITECTÓNICAS A VALIDAR:**
- ✅ Repositories implementan interfaces de Domain
- ✅ NO hay lógica de negocio en repositories
- ✅ Mappers transforman DTOs ↔ Entities correctamente
- ✅ Manejo apropiado de errores HTTP
- ✅ NO hay dependencias circulares

**PATRÓN DE TEST:**

```typescript
describe('UserRepository Integration Tests', () => {
  let repository: UserRepository;
  let httpMock: HttpTestingController;
  let mapper: UserMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserRepository,
        UserApiService,
        UserMapper
      ]
    });

    repository = TestBed.inject(UserRepository);
    httpMock = TestBed.inject(HttpTestingController);
    mapper = TestBed.inject(UserMapper);
  });

  afterEach(() => {
    httpMock.verify(); // Verificar que no hay requests pendientes
  });

  describe('Repository Operations', () => {
    it('should fetch user by id and transform to domain entity', async () => {
      // Given
      const userId = 1;
      const mockDto: UserDTO = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 2,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      // When
      const userPromise = firstValueFrom(repository.findById(userId));

      // Then - Verificar HTTP call
      const req = httpMock.expectOne(`/api/users/${userId}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDto);

      const user = await userPromise;
      expect(user).toBeTruthy();
      expect(user!.email).toBe('test@example.com');
      expect(user!.fullName).toBe('John Doe');
    });

    it('should handle 404 error gracefully', async () => {
      // Given
      const userId = 999;

      // When
      const userPromise = firstValueFrom(repository.findById(userId));

      // Then
      const req = httpMock.expectOne(`/api/users/${userId}/`);
      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

      const user = await userPromise;
      expect(user).toBeNull();
    });

    it('should save new user and return saved entity', async () => {
      // Given
      const newUser = new User({
        id: 0, // New user
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: 1
      });

      const savedDto: UserDTO = {
        id: 5,
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      // When
      const savedUserPromise = firstValueFrom(repository.save(newUser));

      // Then
      const req = httpMock.expectOne('/api/users/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toBe('new@example.com');
      req.flush(savedDto);

      const savedUser = await savedUserPromise;
      expect(savedUser.id).toBe(5);
      expect(savedUser.email).toBe('new@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should transform HTTP errors to domain errors', async () => {
      // Given
      const userId = 1;

      // When & Then
      const userPromise = firstValueFrom(repository.findById(userId));

      const req = httpMock.expectOne(`/api/users/${userId}/`);
      req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      await expectAsync(userPromise).toBeRejectedWith(jasmine.any(InfrastructureError));
    });
  });

  describe('Data Transformation', () => {
    it('should map DTO to domain entity correctly', () => {
      // Given
      const dto: UserDTO = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 2,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      // When
      const user = mapper.toDomain(dto);

      // Then
      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.isActive).toBe(true);
    });

    it('should map domain entity to DTO correctly', () => {
      // Given
      const user = new User({
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 2,
        isActive: true
      });

      // When
      const dto = mapper.toDTO(user);

      // Then
      expect(dto.id).toBe(1);
      expect(dto.email).toBe('test@example.com');
      expect(dto.first_name).toBe('John');
      expect(dto.last_name).toBe('Doe');
      expect(dto.role).toBe(2);
      expect(dto.is_active).toBe(true);
    });
  });
});
```

**SEÑALES DE ALARMA - NUNCA HAGAS ESTO:**
- ❌ NO hagas llamadas reales a APIs (usa HttpClientTestingModule)
- ❌ NO testees la lógica de Django (solo tu integración)
- ❌ NO ignores códigos de error HTTP
- ❌ NO hardcodees URLs (usa configuración)
- ❌ NO pongas lógica de negocio en repositories

---

### 🎨 PRESENTATION LAYER - Tests de Componentes con TestBed

**UBICACIÓN:** `src/app/presentation/`

**TIPO DE TEST:** Tests de componentes con Angular Testing Utilities

**QUÉ TESTEAR:**
- Renderizado condicional basado en estado
- Manejo de eventos del usuario
- Validación de formularios
- Navegación y routing
- Estados de loading y error
- Transformación de datos para mostrar

**REGLAS ARQUITECTÓNICAS A VALIDAR:**
- ✅ Componentes NO contienen lógica de negocio
- ✅ Uso de facades de Application (no repositories directos)
- ✅ Manejo correcto de signals y estado reactivo
- ✅ NO hay llamadas directas a APIs
- ✅ Delegación correcta a Application layer

**PATRÓN DE TEST:**

```typescript
describe('CreateUserComponent - Presentation Tests', () => {
  let component: CreateUserComponent;
  let fixture: ComponentFixture<CreateUserComponent>;
  let mockUserFacade: jasmine.SpyObj<UserFacade>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const userFacadeSpy = jasmine.createSpyObj('UserFacade', ['createUser', 'getRoles']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateUserComponent, ReactiveFormsModule],
      providers: [
        { provide: UserFacade, useValue: userFacadeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserComponent);
    component = fixture.componentInstance;
    mockUserFacade = TestBed.inject(UserFacade) as jasmine.SpyObj<UserFacade>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    // Setup default returns
    mockUserFacade.getRoles.and.returnValue(of([]));
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      fixture.detectChanges();

      expect(component.userForm.get('email')?.value).toBe('');
      expect(component.userForm.get('firstName')?.value).toBe('');
      expect(component.userForm.get('lastName')?.value).toBe('');
      expect(component.userForm.get('roleId')?.value).toBe(null);
    });

    it('should load roles on init', () => {
      const mockRoles = [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'User' }
      ];
      mockUserFacade.getRoles.and.returnValue(of(mockRoles));

      fixture.detectChanges();

      expect(mockUserFacade.getRoles).toHaveBeenCalled();
      expect(component.roles()).toEqual(mockRoles);
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for invalid form', () => {
      fixture.detectChanges();
      
      // Submit empty form
      component.onSubmit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.error-message')).toBeTruthy();
      expect(mockUserFacade.createUser).not.toHaveBeenCalled();
    });

    it('should validate email format', () => {
      fixture.detectChanges();
      
      component.userForm.patchValue({ email: 'invalid-email' });
      component.userForm.get('email')?.markAsTouched();
      fixture.detectChanges();

      expect(component.userForm.get('email')?.invalid).toBe(true);
      expect(component.getEmailError()).toContain('invalid email format');
    });
  });

  describe('User Interaction', () => {
    it('should create user when form is valid', async () => {
      // Given
      const formData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1
      };
      
      mockUserFacade.createUser.and.returnValue(of({ success: true }));
      fixture.detectChanges();

      // When
      component.userForm.patchValue(formData);
      component.onSubmit();
      
      // Then
      expect(mockUserFacade.createUser).toHaveBeenCalledWith(jasmine.objectContaining({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1
      }));
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('User created successfully');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('should handle creation error', async () => {
      // Given
      const error = new ApplicationError('USER_EXISTS', 'Email already exists');
      mockUserFacade.createUser.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      component.userForm.patchValue({
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1
      });

      // When
      component.onSubmit();

      // Then
      expect(mockToastService.showError).toHaveBeenCalledWith('Email already exists');
      expect(component.error()).toBe('Email already exists');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during user creation', () => {
      // Given
      const createUserSubject = new Subject<any>();
      mockUserFacade.createUser.and.returnValue(createUserSubject.asObservable());
      fixture.detectChanges();

      component.userForm.patchValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1
      });

      // When
      component.onSubmit();
      fixture.detectChanges();

      // Then
      expect(component.loading()).toBe(true);
      const submitButton = fixture.nativeElement.querySelector('[data-cy=submit-button]');
      expect(submitButton.disabled).toBe(true);

      // Complete the observable
      createUserSubject.next({ success: true });
      createUserSubject.complete();
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should react to roles signal changes', () => {
      const rolesSignal = signal([{ id: 1, name: 'Admin' }]);
      component['_roles'] = rolesSignal;
      fixture.detectChanges();

      // Check initial state
      expect(component.roles()).toHaveLength(1);

      // Update signal
      rolesSignal.set([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'User' }
      ]);
      fixture.detectChanges();

      expect(component.roles()).toHaveLength(2);
    });
  });
});
```

**SEÑALES DE ALARMA - NUNCA HAGAS ESTO:**
- ❌ NO testees lógica de negocio en components
- ❌ NO hagas tests frágiles dependientes de CSS específico
- ❌ NO testees framework de Angular (solo tu código)
- ❌ NO ignores accesibilidad (testea ARIA labels)
- ❌ NO uses datos reales (crea fixtures específicos)

---

### ⚙️ CORE LAYER - Tests de Servicios Transversales

**UBICACIÓN:** `src/app/core/`

**TIPO DE TEST:** Tests unitarios de servicios independientes

**QUÉ TESTEAR:**
- Funcionalidad independiente del framework
- Servicios que usan múltiples bounded contexts
- Lógica transversal (logging, events, config)

**REGLAS ARQUITECTÓNICAS A VALIDAR:**
- ✅ Máximo 4-6 servicios en Core
- ✅ Independientes de Angular/frameworks
- ✅ Útiles para múltiples dominios
- ✅ NO dependencias específicas de UI

**PATRÓN DE TEST:**

```typescript
describe('DomainEventBus - Core Service Tests', () => {
  let eventBus: DomainEventBus;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    const loggerSpy = jasmine.createSpyObj('Logger', ['info', 'error']);
    
    TestBed.configureTestingModule({
      providers: [
        DomainEventBus,
        { provide: Logger, useValue: loggerSpy }
      ]
    });

    eventBus = TestBed.inject(DomainEventBus);
    mockLogger = TestBed.inject(Logger) as jasmine.SpyObj<Logger>;
  });

  it('should publish and handle domain events', () => {
    // Given
    const event = new UserCreatedEvent(1, 'john@example.com');
    let handledEvent: UserCreatedEvent | null = null;
    
    eventBus.subscribe(UserCreatedEvent, (e) => {
      handledEvent = e;
    });

    // When
    eventBus.publish(event);

    // Then
    expect(handledEvent).toBe(event);
    expect(mockLogger.info).toHaveBeenCalledWith('Domain event published', {
      eventType: 'UserCreatedEvent',
      aggregateId: 1
    });
  });
});
```

---

## 🎯 Criterios de Validación Arquitectónica

### Para CADA test generado, verifica:

**✅ DEPENDENCIAS CORRECTAS:**
- Domain: NO dependencias externas
- Application: Mocks de Domain e Infrastructure
- Infrastructure: HttpClientTestingModule para APIs
- Presentation: Mocks de Application facades
- Core: Independiente de framework

**✅ RESPONSABILIDADES CORRECTAS:**
- Domain: Testea reglas de negocio
- Application: Testea orquestación
- Infrastructure: Testea integración técnica
- Presentation: Testea interacción usuario
- Core: Testea servicios transversales

**✅ PATRONES CORRECTOS:**
- Result Pattern en Domain/Application
- Event handling en Domain
- Facade Pattern en Application→Presentation
- Repository Pattern en Infrastructure
- Signal Pattern en Presentation

---

## 📝 Template de Generación

### Al generar un test, usa este template:

```typescript
// {LAYER} Layer Test - {COMPONENT_NAME}
describe('{COMPONENT_NAME} - {LAYER} Tests', () => {
  // Setup según el patrón de la capa
  let component: {COMPONENT_TYPE};
  let mockDependencies: jasmine.SpyObj<Dependencies>[];

  beforeEach(() => {
    // Configuración específica de la capa
  });

  describe('Core Functionality', () => {
    it('should {BUSINESS_BEHAVIOR_DESCRIPTION}', () => {
      // Given - Datos de prueba
      // When - Acción a testear
      // Then - Verificación de comportamiento
    });
  });

  describe('Error Handling', () => {
    it('should handle {ERROR_SCENARIO}', () => {
      // Test manejo de errores específicos de la capa
    });
  });

  describe('Edge Cases', () => {
    it('should handle {EDGE_CASE}', () => {
      // Test casos límite
    });
  });

  // Secciones específicas según la capa:
  // - Domain: Business Rules, Value Objects, Domain Events
  // - Application: Use Case Flow, Command Validation, Mapper Tests
  // - Infrastructure: HTTP Integration, Data Transformation, Error Mapping
  // - Presentation: User Interaction, Form Validation, Loading States
  // - Core: Cross-cutting Concerns, Framework Independence
});
```

---

## 🚨 Reglas de Calidad

### COVERAGE MÍNIMO por capa:
- **Domain**: 95-100% (CRÍTICO)
- **Application**: 85-95% (ALTA)
- **Infrastructure**: 75-85% (MEDIA)
- **Presentation**: 70-80% (MEDIA)
- **Core**: 90-95% (ALTA)

### CONVENCIONES de naming:
- Archivos: `{component-name}.spec.ts`
- Test suites: `{ComponentName} - {Layer} Tests`
- Test cases: `should {expected_behavior} when {condition}`

### PROHIBICIONES ABSOLUTAS:
- ❌ NUNCA testear implementaciones internas
- ❌ NUNCA usar datos reales de APIs
- ❌ NUNCA saltarse el manejo de errores
- ❌ NUNCA ignorar los casos límite
- ❌ NUNCA violar las dependencias entre capas

---

## 🎯 Uso del Prompt

### Para generar un test:

1. **Identifica** el archivo y su capa
2. **Aplica** la estrategia de testing correspondiente
3. **Verifica** las reglas arquitectónicas
4. **Sigue** el patrón de test específico
5. **Valida** cobertura y calidad

**Ejemplo de uso:**
> "Genera tests para `src/app/domain/entities/user.entity.ts` siguiendo las reglas de Domain Layer"

**El prompt aplicará automáticamente:**
- Tests unitarios puros
- Validación de reglas de negocio
- Tests de value objects
- Verificación de domain events
- Sin mocks ni dependencias externas

¡Este prompt asegura que cada test cumpla con Clean Architecture y mantenga la integridad del diseño MAD-AI!