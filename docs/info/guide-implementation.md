# MAD-AI Project Management System - Implementation Guide

## 📋 Tabla de Contenido

- [1. Introducción](#1-introducción)
- [2. Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
- [3. Estructura de Capas](#3-estructura-de-capas)
- [4. Reglas por Capa](#4-reglas-por-capa)
- [5. Patrones de Implementación](#5-patrones-de-implementación)
- [6. Convenciones de Naming](#6-convenciones-de-naming)
- [7. Flujo de Desarrollo](#7-flujo-de-desarrollo)
- [8. Testing Strategy](#8-testing-strategy)
- [9. Checklist de Implementación](#9-checklist-de-implementación)
- [10. Troubleshooting](#10-troubleshooting)

## 1. Introducción

### 📋 Información del Proyecto

- **Nombre**: MAD-AI Project Management System
- **Framework**: Angular 20.1.6
- **Arquitectura**: Clean Architecture + Domain-Driven Design (DDD)
- **Backend**: Django REST Framework API
- **Base de Datos**: PostgreSQL (via Django ORM)
- **Autenticación**: JWT Tokens
- **UI Framework**: TailwindCSS 4.1.11

### 🎯 Objetivos Arquitectónicos

1. **Separación de Responsabilidades**: Cada capa tiene una responsabilidad específica
2. **Independencia de Frameworks**: El dominio no depende de tecnologías externas
3. **Testabilidad**: Código fácil de testear con mocks e inyección de dependencias
4. **Mantenibilidad**: Código limpio, organizado y fácil de modificar
5. **Escalabilidad**: Arquitectura que crece con el proyecto

### 📊 Módulos del Sistema

Basado en el swagger.json, el sistema maneja:

#### Autenticación (`/auth/`)

- Login/Logout, Registro, Confirmación de email
- Gestión de roles y usuarios
- Refresh tokens y autorización

#### Gestión de Recursos (`/resource_management/`)

- **Recursos Humanos**: empleados, posiciones, habilidades, tarifas
- **Recursos Materiales**: inventario, stock, proveedores, garantías
- **Tipos de Recursos**: categorización y configuración
- **Ausencias**: vacaciones, permisos, mantenimiento
- **Disponibilidad**: capacidad, reservas, análisis de conflictos

#### Gestión de Equipos (`/team_management/`)

- Creación y administración de equipos
- Membresías y asignación de roles
- Analytics y métricas de desempeño

## 2. Arquitectura del Proyecto

### 🏗️ Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                          │
│  (Angular Components, Services, Guards, Interceptors)          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                APPLICATION LAYER                        │   │
│  │  (Use Cases, Commands, Queries, DTOs, Mappers)         │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                 DOMAIN LAYER                    │   │   │
│  │  │  (Entities, Value Objects, Aggregates,         │   │   │
│  │  │   Domain Services, Repository Interfaces)      │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    INFRASTRUCTURE LAYER                        │
│  (HTTP Clients, Repository Implementations, External APIs)     │
└─────────────────────────────────────────────────────────────────┘
```

### 🎯 Dependency Flow

- **Inward Only**: Las dependencias siempre apuntan hacia el centro (Domain)
- **Domain**: No tiene dependencias externas
- **Application**: Depende solo del Domain
- **Infrastructure**: Implementa interfaces del Domain
- **Presentation**: Usa Application y Domain a través de interfaces

## 3. Estructura de Capas

### 📁 Estructura de Carpetas

```
src/app/
├── core/                          # Core de Clean Architecture
│   ├── domain/                   # Domain Layer (DDD)
│   │   ├── entities/            # Entidades del dominio
│   │   │   ├── base.entity.ts
│   │   │   ├── resource.entity.ts
│   │   │   ├── team.entity.ts
│   │   │   └── user.entity.ts
│   │   ├── value-objects/       # Objetos de valor
│   │   │   ├── base.value-object.ts
│   │   │   ├── email.value-object.ts
│   │   │   └── money.value-object.ts
│   │   ├── aggregates/          # Agregados (Aggregate Roots)
│   │   │   ├── team.aggregate.ts
│   │   │   └── resource-allocation.aggregate.ts
│   │   ├── repositories/        # Interfaces de repositorios
│   │   │   ├── resource.repository.interface.ts
│   │   │   ├── team.repository.interface.ts
│   │   │   └── user.repository.interface.ts
│   │   ├── services/            # Servicios de dominio
│   │   │   ├── resource-allocation.service.ts
│   │   │   └── team-capacity.service.ts
│   │   └── events/              # Eventos de dominio
│   │       ├── base.domain-event.ts
│   │       ├── resource-assigned.event.ts
│   │       └── team-created.event.ts
│   ├── application/             # Application Layer
│   │   ├── use-cases/           # Casos de uso
│   │   │   ├── resources/
│   │   │   │   ├── get-resources.use-case.ts
│   │   │   │   ├── create-resource.use-case.ts
│   │   │   │   └── assign-resource-to-team.use-case.ts
│   │   │   ├── teams/
│   │   │   └── auth/
│   │   ├── commands/            # Commands (CQRS)
│   │   │   ├── create-resource.command.ts
│   │   │   └── assign-resource.command.ts
│   │   ├── queries/             # Queries (CQRS)
│   │   │   ├── get-resources.query.ts
│   │   │   └── get-team-members.query.ts
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── resource.dto.ts
│   │   │   ├── team.dto.ts
│   │   │   └── user.dto.ts
│   │   ├── mappers/             # Mappers Domain ↔ DTO
│   │   │   ├── resource.mapper.ts
│   │   │   └── team.mapper.ts
│   │   └── ports/               # Puertos (Interfaces)
│   │       ├── event-bus.port.ts
│   │       └── notification.port.ts
│   └── infrastructure/          # Infrastructure Layer
│       ├── repositories/        # Implementaciones de repositorios
│       │   ├── resource.repository.ts
│       │   └── team.repository.ts
│       ├── http/                # Clientes HTTP
│       │   ├── resource-api.service.ts
│       │   ├── team-api.service.ts
│       │   └── auth-api.service.ts
│       ├── adapters/            # Adaptadores externos
│       │   ├── event-bus.adapter.ts
│       │   └── notification.adapter.ts
│       └── persistence/         # Persistencia de datos
│           └── local-storage.service.ts
├── features/                     # Presentation Layer (Modules)
│   ├── auth/                    # Módulo de Autenticación
│   │   ├── components/
│   │   │   ├── login.component.ts
│   │   │   └── register.component.ts
│   │   ├── pages/
│   │   │   ├── login-page.component.ts
│   │   │   └── profile-page.component.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── auth.routes.ts
│   ├── resource-management/     # Módulo de Gestión de Recursos
│   │   ├── components/
│   │   │   ├── resource-list.component.ts
│   │   │   ├── resource-card.component.ts
│   │   │   └── resource-form.component.ts
│   │   ├── pages/
│   │   │   ├── resources-page.component.ts
│   │   │   └── resource-detail-page.component.ts
│   │   ├── services/
│   │   │   └── resource-store.service.ts
│   │   └── resource-management.routes.ts
│   ├── team-management/         # Módulo de Gestión de Equipos
│   ├── dashboard/               # Módulo Dashboard
│   └── reports/                 # Módulo de Reportes
└── shared/                      # Shared Kernel
    ├── components/              # Componentes reutilizables
    │   ├── ui/
    │   │   ├── button.component.ts
    │   │   ├── modal.component.ts
    │   │   └── data-table.component.ts
    │   └── layout/
    │       ├── header.component.ts
    │       └── sidebar.component.ts
    ├── directives/              # Directivas personalizadas
    │   └── auto-focus.directive.ts
    ├── pipes/                   # Pipes personalizados
    │   ├── safe-html.pipe.ts
    │   └── date-format.pipe.ts
    ├── validators/              # Validadores personalizados
    │   └── custom-validators.ts
    ├── utils/                   # Utilidades
    │   ├── result.ts
    │   ├── date-utils.ts
    │   └── validation-utils.ts
    ├── constants/               # Constantes
    │   ├── api-endpoints.ts
    │   └── app-constants.ts
    ├── types/                   # Tipos globales
    │   ├── common.types.ts
    │   └── api.types.ts
    ├── guards/                  # Guards globales
    │   └── role.guard.ts
    └── interceptors/            # Interceptors HTTP
        ├── auth.interceptor.ts
        ├── error.interceptor.ts
        └── loading.interceptor.ts
```

## 4. Reglas por Capa

### 🎯 Domain Layer (Núcleo del Sistema)

#### ✅ QUÉ HACER

1. **Entities (Entidades)**

   ```typescript
   // ✅ CORRECTO: Entidad con lógica de negocio
   export class Resource extends Entity<number> {
     constructor(
       id: number,
       private _name: string,
       private _type: ResourceType,
       private _status: AvailabilityStatus,
       private _workloadPercentage: number = 0
     ) {
       super(id);
       this.validate();
     }

     // Lógica de negocio en la entidad
     public assignToTeam(allocationPercentage: number): Result<void> {
       if (this._workloadPercentage + allocationPercentage > 100) {
         return Result.fail('Resource would be over-allocated');
       }

       this._workloadPercentage += allocationPercentage;
       this._status = AvailabilityStatus.Assigned;

       return Result.ok();
     }

     private validate(): void {
       if (!this._name || this._name.trim().length === 0) {
         throw new Error('Resource name cannot be empty');
       }
     }
   }
   ```

2. **Value Objects (Objetos de Valor)**

   ```typescript
   // ✅ CORRECTO: Value Object inmutable
   export class Email extends ValueObject<{ value: string }> {
     private constructor(value: string) {
       super({ value });
     }

     public static create(email: string): Result<Email> {
       if (!this.isValid(email)) {
         return Result.fail('Invalid email format');
       }
       return Result.ok(new Email(email));
     }

     public getValue(): string {
       return this.props.value;
     }

     private static isValid(email: string): boolean {
       const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       return regex.test(email);
     }

     protected validate(props: { value: string }): void {
       if (!props.value) {
         throw new Error('Email cannot be empty');
       }
     }
   }
   ```

3. **Repository Interfaces**
   ```typescript
   // ✅ CORRECTO: Interface en el dominio
   export abstract class IResourceRepository {
     abstract findById(id: number): Observable<Resource | null>;
     abstract findAll(): Observable<Resource[]>;
     abstract save(resource: Resource): Observable<Resource>;
     abstract delete(id: number): Observable<void>;
   }
   ```

#### ❌ QUÉ NO HACER

```typescript
// ❌ INCORRECTO: No importar frameworks externos en el dominio
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ❌ INCORRECTO: No hacer llamadas HTTP directas en entidades
export class Resource extends Entity<number> {
  constructor(private http: HttpClient) {
    // ❌ NO!
    super(1);
  }

  public save(): void {
    this.http.post('/api/resources', this); // ❌ NO!
  }
}

// ❌ INCORRECTO: No usar any o tipos débiles
export class Resource extends Entity<any> {
  // ❌ NO!
  public data: any; // ❌ NO!
}

// ❌ INCORRECTO: No hacer entidades mutables desde fuera
export class Resource extends Entity<number> {
  public name: string; // ❌ NO! Debería ser private con getter
  public workloadPercentage: number; // ❌ NO! Debería ser private
}
```

### 🔧 Application Layer (Casos de Uso)

#### ✅ QUÉ HACER

1. **Use Cases**

   ```typescript
   // ✅ CORRECTO: Use case con inyección de dependencias
   @Injectable({
     providedIn: 'root',
   })
   export class CreateResourceUseCase {
     constructor(
       private resourceRepository: IResourceRepository,
       private eventBus: IEventBus
     ) {}

     execute(command: CreateResourceCommand): Observable<Result<Resource>> {
       // Validar command
       const validationResult = this.validateCommand(command);
       if (validationResult.isFailure) {
         return of(validationResult);
       }

       // Crear entidad de dominio
       const resource = new Resource(
         0, // ID temporal
         command.name,
         command.resourceTypeId,
         AvailabilityStatus.Available
       );

       // Guardar usando repositorio
       return this.resourceRepository.save(resource).pipe(
         map((savedResource) => {
           // Emitir evento de dominio
           this.eventBus.emit(new ResourceCreatedEvent(savedResource.id));
           return Result.ok(savedResource);
         }),
         catchError((error) => of(Result.fail(error.message)))
       );
     }

     private validateCommand(command: CreateResourceCommand): Result<void> {
       if (!command.name || command.name.trim().length === 0) {
         return Result.fail('Resource name is required');
       }
       return Result.ok();
     }
   }
   ```

2. **Commands y Queries (CQRS)**

   ```typescript
   // ✅ CORRECTO: Command con validación
   export class CreateResourceCommand {
     constructor(
       public readonly name: string,
       public readonly resourceTypeId: number,
       public readonly location?: string
     ) {
       this.validate();
     }

     private validate(): void {
       if (!this.name || this.name.trim().length === 0) {
         throw new Error('Resource name is required');
       }
       if (this.resourceTypeId <= 0) {
         throw new Error('Valid resource type ID is required');
       }
     }
   }

   // ✅ CORRECTO: Query simple
   export class GetResourcesQuery {
     constructor(
       public readonly filters?: ResourceFilters,
       public readonly pagination?: PaginationOptions
     ) {}
   }
   ```

3. **DTOs y Mappers**

   ```typescript
   // ✅ CORRECTO: DTO para API
   export interface ResourceDto {
     id: number;
     name: string;
     resource_type: number;
     availability_status: string;
     workload_percentage: number;
     is_active: boolean;
   }

   // ✅ CORRECTO: Mapper bidireccional
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceMapper {
     toDomain(dto: ResourceDto): Resource {
       return new Resource(
         dto.id,
         dto.name,
         dto.resource_type,
         this.mapStatus(dto.availability_status),
         dto.workload_percentage
       );
     }

     toDto(domain: Resource): ResourceDto {
       return {
         id: domain.id,
         name: domain.name,
         resource_type: domain.resourceTypeId,
         availability_status: this.mapStatusToString(domain.status),
         workload_percentage: domain.workloadPercentage,
         is_active: domain.isActive,
       };
     }
   }
   ```

#### ❌ QUÉ NO HACER

```typescript
// ❌ INCORRECTO: Lógica de negocio en use case
export class CreateResourceUseCase {
  execute(command: CreateResourceCommand): Observable<Result<Resource>> {
    // ❌ NO! La lógica de negocio va en el dominio
    if (command.workloadPercentage > 100) {
      return of(Result.fail('Workload cannot exceed 100%'));
    }

    // ❌ NO! Esta validación debería estar en la entidad
    if (command.name.length < 3) {
      return of(Result.fail('Name too short'));
    }
  }
}

// ❌ INCORRECTO: Use case que retorna DTOs directamente
export class GetResourcesUseCase {
  execute(): Observable<ResourceDto[]> {
    // ❌ NO! Debería retornar entidades
    return this.resourceRepository.findAllDtos(); // ❌ NO!
  }
}
```

### 🏗️ Infrastructure Layer (Implementaciones)

#### ✅ QUÉ HACER

1. **Repository Implementations**

   ```typescript
   // ✅ CORRECTO: Implementación de repositorio
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceRepository implements IResourceRepository {
     constructor(
       private apiService: ResourceApiService,
       private mapper: ResourceMapper
     ) {}

     findById(id: number): Observable<Resource | null> {
       return this.apiService.getById(id).pipe(
         map((dto) => this.mapper.toDomain(dto)),
         catchError(() => of(null))
       );
     }

     save(resource: Resource): Observable<Resource> {
       const dto = this.mapper.toDto(resource);

       if (resource.id && resource.id > 0) {
         return this.apiService
           .update(resource.id, dto)
           .pipe(map((updatedDto) => this.mapper.toDomain(updatedDto)));
       } else {
         return this.apiService
           .create(dto)
           .pipe(map((createdDto) => this.mapper.toDomain(createdDto)));
       }
     }
   }
   ```

2. **HTTP Services**

   ```typescript
   // ✅ CORRECTO: Servicio HTTP específico para API
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceApiService {
     private readonly baseUrl = `${environment.apiUrl}/resource_management/resources`;

     constructor(private http: HttpClient) {}

     getById(id: number): Observable<ResourceDto> {
       return this.http.get<ResourceDto>(`${this.baseUrl}/${id}/`);
     }

     create(resource: CreateResourceDto): Observable<ResourceDto> {
       return this.http.post<ResourceDto>(`${this.baseUrl}/`, resource);
     }

     update(id: number, resource: UpdateResourceDto): Observable<ResourceDto> {
       return this.http.put<ResourceDto>(`${this.baseUrl}/${id}/`, resource);
     }
   }
   ```

#### ❌ QUÉ NO HACER

```typescript
// ❌ INCORRECTO: Repositorio con lógica de negocio
@Injectable()
export class ResourceRepository implements IResourceRepository {
  save(resource: Resource): Observable<Resource> {
    // ❌ NO! Lógica de negocio en infraestructura
    if (resource.workloadPercentage > 100) {
      throw new Error('Invalid workload');
    }

    return this.apiService.create(resource);
  }
}

// ❌ INCORRECTO: Acoplamiento directo con entidades de dominio en HTTP service
@Injectable()
export class ResourceApiService {
  // ❌ NO! El HTTP service debería trabajar solo con DTOs
  create(resource: Resource): Observable<Resource> {
    return this.http.post<Resource>('/api/resources', resource);
  }
}
```

### 🎨 Presentation Layer (Angular Components)

#### ✅ QUÉ HACER

1. **Standalone Components con Signals**

   ```typescript
   // ✅ CORRECTO: Component moderno Angular 20
   @Component({
     selector: 'app-resource-list',
     standalone: true,
     imports: [CommonModule, FormsModule, RouterModule],
     template: `
       <div class="resource-list-container">
         <header class="page-header">
           <h1 class="page-title">Resources</h1>
           <button (click)="createResource()" class="btn-primary" [disabled]="loading()">
             Add Resource
           </button>
         </header>

         @if (loading()) {
           <div class="loading-spinner"></div>
         } @else {
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             @for (resource of resources(); track resource.id) {
               <app-resource-card
                 [resource]="resource"
                 (edit)="editResource($event)"
                 (delete)="deleteResource($event)" />
             } @empty {
               <div class="empty-state">
                 <p class="empty-state-text">No resources found</p>
               </div>
             }
           </div>
         }

         @if (error()) {
           <div class="alert alert-error">
             {{ error() }}
           </div>
         }
       </div>
     `,
     changeDetection: ChangeDetectionStrategy.OnPush,
   })
   export class ResourceListComponent implements OnInit {
     // Signals para estado reactivo
     protected readonly resources = signal<Resource[]>([]);
     protected readonly loading = signal(false);
     protected readonly error = signal<string | null>(null);

     constructor(
       private getResourcesUseCase: GetResourcesUseCase,
       private router: Router
     ) {}

     ngOnInit(): void {
       this.loadResources();
     }

     protected loadResources(): void {
       this.loading.set(true);
       this.error.set(null);

       this.getResourcesUseCase.execute().subscribe({
         next: (result) => {
           if (result.isSuccess) {
             this.resources.set(result.getValue());
           } else {
             this.error.set(result.getError());
           }
           this.loading.set(false);
         },
         error: (error) => {
           this.error.set('Failed to load resources');
           this.loading.set(false);
         },
       });
     }
   }
   ```

2. **Store Services con Signals**

   ```typescript
   // ✅ CORRECTO: Store service para estado global
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceStore {
     private readonly _resources = signal<Resource[]>([]);
     private readonly _loading = signal(false);
     private readonly _error = signal<string | null>(null);

     // Read-only signals
     readonly resources = this._resources.asReadonly();
     readonly loading = this._loading.asReadonly();
     readonly error = this._error.asReadonly();

     // Computed signals
     readonly availableResources = computed(() => this._resources().filter((r) => r.isAvailable));

     readonly resourceCount = computed(() => this._resources().length);

     constructor(
       private getResourcesUseCase: GetResourcesUseCase,
       private createResourceUseCase: CreateResourceUseCase
     ) {}

     loadResources(): void {
       this._loading.set(true);
       this._error.set(null);

       this.getResourcesUseCase.execute().subscribe({
         next: (result) => {
           if (result.isSuccess) {
             this._resources.set(result.getValue());
           } else {
             this._error.set(result.getError());
           }
           this._loading.set(false);
         },
       });
     }
   }
   ```

#### ❌ QUÉ NO HACER

```typescript
// ❌ INCORRECTO: Component con lógica de negocio
@Component({...})
export class ResourceListComponent {
  resources: Resource[] = [];

  onAssignResource(resourceId: number, teamId: number): void {
    const resource = this.resources.find(r => r.id === resourceId);

    // ❌ NO! Lógica de negocio en component
    if (resource && resource.workloadPercentage + 50 > 100) {
      alert('Cannot assign - resource would be over-allocated');
      return;
    }

    // ❌ NO! Manipular entidad directamente
    resource!.workloadPercentage += 50;
  }
}

// ❌ INCORRECTO: Component acoplado a HTTP service
@Component({...})
export class ResourceListComponent {
  constructor(
    private resourceApiService: ResourceApiService // ❌ NO! Usar use case
  ) {}

  loadResources(): void {
    // ❌ NO! Component no debería conocer HTTP service
    this.resourceApiService.getAll().subscribe(dtos => {
      this.resources = dtos; // ❌ NO! Trabajar con entidades, no DTOs
    });
  }
}
```

## 5. Patrones de Implementación

### 🔄 Result Pattern (Manejo de Errores)

```typescript
// ✅ IMPLEMENTACIÓN OBLIGATORIA: Result Pattern
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _error?: string,
    private readonly _value?: T
  ) {}

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error(`Cannot get value from failed result: ${this._error}`);
    }
    return this._value!;
  }

  public getError(): string {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }
}

// ✅ USO EN USE CASES
export class CreateResourceUseCase {
  execute(command: CreateResourceCommand): Observable<Result<Resource>> {
    try {
      const resource = new Resource(/*...*/);
      return this.repository.save(resource).pipe(
        map((saved) => Result.ok(saved)),
        catchError((error) => of(Result.fail(error.message)))
      );
    } catch (error) {
      return of(Result.fail(error.message));
    }
  }
}
```

### 🎯 CQRS Pattern (Command Query Responsibility Segregation)

```typescript
// ✅ COMMANDS (Modifican estado)
export class CreateResourceCommand {
  constructor(
    public readonly name: string,
    public readonly resourceTypeId: number,
    public readonly location?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Name is required');
    }
    if (this.resourceTypeId <= 0) {
      throw new Error('Valid resource type ID required');
    }
  }
}

// ✅ QUERIES (Solo lectura)
export class GetResourcesQuery {
  constructor(
    public readonly filters?: {
      type?: number;
      status?: string;
      search?: string;
    },
    public readonly pagination?: {
      page: number;
      size: number;
    }
  ) {}
}

// ✅ COMMAND HANDLERS
@Injectable()
export class CreateResourceHandler {
  constructor(private resourceRepository: IResourceRepository) {}

  handle(command: CreateResourceCommand): Observable<Result<Resource>> {
    const resource = new Resource(
      0, // ID temporal
      command.name,
      command.resourceTypeId,
      AvailabilityStatus.Available
    );

    return this.resourceRepository.save(resource).pipe(
      map((saved) => Result.ok(saved)),
      catchError((error) => of(Result.fail(error.message)))
    );
  }
}
```

### 📡 Event-Driven Architecture

```typescript
// ✅ DOMAIN EVENTS
export abstract class DomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventId: string = crypto.randomUUID();

  abstract getEventName(): string;
  abstract getAggregateId(): string | number;
}

export class ResourceAssignedToTeamEvent extends DomainEvent {
  constructor(
    public readonly resourceId: number,
    public readonly teamId: number,
    public readonly allocationPercentage: number
  ) {
    super();
  }

  getEventName(): string {
    return 'ResourceAssignedToTeam';
  }

  getAggregateId(): number {
    return this.resourceId;
  }
}

// ✅ EVENT BUS INTERFACE (Domain)
export abstract class IEventBus {
  abstract emit(event: DomainEvent): void;
  abstract subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: (event: T) => void
  ): void;
}

// ✅ EVENT BUS IMPLEMENTATION (Infrastructure)
@Injectable({
  providedIn: 'root',
})
export class EventBusService implements IEventBus {
  private eventHandlers = new Map<string, ((event: DomainEvent) => void)[]>();

  emit(event: DomainEvent): void {
    const handlers = this.eventHandlers.get(event.getEventName()) || [];
    handlers.forEach((handler) => handler(event));
  }

  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: (event: T) => void
  ): void {
    const eventName = new eventType().getEventName();
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.push(handler as (event: DomainEvent) => void);
    this.eventHandlers.set(eventName, handlers);
  }
}
```

### 🔍 Repository Pattern

```typescript
// ✅ REPOSITORY INTERFACE (Domain Layer)
export abstract class IResourceRepository {
  // Queries básicas
  abstract findById(id: number): Observable<Resource | null>;
  abstract findAll(): Observable<Resource[]>;
  abstract exists(id: number): Observable<boolean>;

  // Queries específicas del dominio
  abstract findByType(typeId: number): Observable<Resource[]>;
  abstract findAvailable(): Observable<Resource[]>;
  abstract findByWorkloadRange(min: number, max: number): Observable<Resource[]>;

  // Commands
  abstract save(resource: Resource): Observable<Resource>;
  abstract delete(id: number): Observable<void>;

  // Queries complejas
  abstract findWithCapacityForAllocation(allocationPercentage: number): Observable<Resource[]>;
}

// ✅ REPOSITORY IMPLEMENTATION (Infrastructure Layer)
@Injectable({
  providedIn: 'root',
})
export class ResourceRepository implements IResourceRepository {
  constructor(
    private apiService: ResourceApiService,
    private mapper: ResourceMapper
  ) {}

  findById(id: number): Observable<Resource | null> {
    return this.apiService.getById(id).pipe(
      map((dto) => this.mapper.toDomain(dto)),
      catchError(() => of(null))
    );
  }

  save(resource: Resource): Observable<Resource> {
    // Emitir eventos de dominio después del guardado
    const domainEvents = resource.getDomainEvents();

    const dto = this.mapper.toDto(resource);
    const saveOperation =
      resource.id && resource.id > 0
        ? this.apiService.update(resource.id, dto)
        : this.apiService.create(dto);

    return saveOperation.pipe(
      map((savedDto) => {
        const savedResource = this.mapper.toDomain(savedDto);

        // Procesar eventos de dominio
        domainEvents.forEach((event) => {
          // Emitir eventos a través del event bus
          // this.eventBus.emit(event);
        });

        return savedResource;
      })
    );
  }
}
```

## 6. Convenciones de Naming

### 📁 Archivos y Carpetas

#### Estructura de Nombres

```typescript
// ✅ CORRECTO: Naming conventions

// Entities
resource.entity.ts
team.entity.ts
user.entity.ts

// Value Objects
email.value-object.ts
money.value-object.ts
resource-type.value-object.ts

// Repository Interfaces
resource.repository.interface.ts
team.repository.interface.ts

// Repository Implementations
resource.repository.ts
team.repository.ts

// Use Cases
get-resources.use-case.ts
create-resource.use-case.ts
assign-resource-to-team.use-case.ts

// Commands & Queries
create-resource.command.ts
update-resource.command.ts
get-resources.query.ts
get-team-members.query.ts

// DTOs
resource.dto.ts
team.dto.ts
user.dto.ts

// Mappers
resource.mapper.ts
team.mapper.ts

// API Services
resource-api.service.ts
team-api.service.ts
auth-api.service.ts

// Components
resource-list.component.ts
resource-card.component.ts
team-dashboard.component.ts

// Pages
resources-page.component.ts
resource-detail-page.component.ts

// Guards
auth.guard.ts
role.guard.ts

// Interceptors
auth.interceptor.ts
error.interceptor.ts

// Pipes
safe-html.pipe.ts
date-format.pipe.ts
```

### 🏷️ Clases e Interfaces

```typescript
// ✅ CORRECTO: PascalCase para clases
export class ResourceManagementService {}
export class AssignResourceToTeamUseCase {}
export class ResourceRepository {}
export class TeamMemberComponent {}

// ✅ CORRECTO: Interfaces con prefijo I (solo para abstracciones de dominio)
export abstract class IResourceRepository {}
export abstract class IEventBus {}
export abstract class INotificationService {}

// ✅ CORRECTO: DTOs con sufijo
export interface ResourceDto {}
export interface CreateResourceDto {}
export interface UpdateResourceDto {}

// ✅ CORRECTO: Commands y Queries con sufijo
export class CreateResourceCommand {}
export class AssignResourceToTeamCommand {}
export class GetResourcesQuery {}
export class GetTeamMembersQuery {}

// ✅ CORRECTO: Events con sufijo
export class ResourceCreatedEvent extends DomainEvent {}
export class ResourceAssignedToTeamEvent extends DomainEvent {}
export class TeamMemberRemovedEvent extends DomainEvent {}
```

### 🔧 Métodos y Propiedades

```typescript
// ✅ CORRECTO: camelCase para métodos y propiedades
export class Resource extends Entity<number> {
  // Propiedades privadas con underscore
  private _name: string;
  private _workloadPercentage: number;

  // Getters públicos sin underscore
  public get name(): string { return this._name; }
  public get workloadPercentage(): number { return this._workloadPercentage; }
  public get isAvailable(): boolean { return this._workloadPercentage < 100; }

  // Métodos públicos camelCase
  public assignToTeam(allocationPercentage: number): void { }
  public releaseFromTeam(allocationPercentage: number): void { }
  public calculateRemainingCapacity(): number { }

  // Métodos privados camelCase
  private validateWorkloadPercentage(percentage: number): void { }
  private emitDomainEvent(event: DomainEvent): void { }
}

// ✅ CORRECTO: Use Cases
export class GetAvailableResourcesUseCase {
  public execute(query: GetAvailableResourcesQuery): Observable<Result<Resource[]>> { }
  private validateQuery(query: GetAvailableResourcesQuery): Result<void> { }
  private applyFilters(resources: Resource[], filters: ResourceFilters): Resource[] { }
}

// ✅ CORRECTO: Angular Components
@Component({...})
export class ResourceListComponent {
  // Properties
  protected readonly resources = signal<Resource[]>([]);
  protected readonly loading = signal(false);

  // Event handlers con prefijo 'on'
  protected onCreateResource(): void { }
  protected onEditResource(resource: Resource): void { }
  protected onDeleteResource(resourceId: number): void { }

  // Helper methods
  protected loadResources(): void { }
  protected handleError(error: string): void { }
}
```

### 📂 Constantes y Enums

```typescript
// ✅ CORRECTO: UPPER_SNAKE_CASE para constantes
export const API_ENDPOINTS = {
  RESOURCES: '/api/v1/resource_management/resources',
  TEAMS: '/api/v1/team_management/teams',
  AUTH: '/api/v1/auth',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ✅ CORRECTO: PascalCase para Enums
export enum AvailabilityStatus {
  Available = 'available',
  Assigned = 'assigned',
  Maintenance = 'maintenance',
  Unavailable = 'unavailable',
}

export enum TeamType {
  Development = 'development',
  Testing = 'testing',
  Design = 'design',
  Operations = 'operations',
  CrossFunctional = 'cross_functional',
  Temporary = 'temporary',
}

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Employee = 'employee',
  Guest = 'guest',
}
```

## 7. Flujo de Desarrollo

### 🔄 Proceso de Implementación de Nueva Funcionalidad

#### Paso 1: Análisis del Dominio

1. **Identificar la Funcionalidad**
   - ¿Qué endpoint(s) del swagger.json usarás?
   - ¿Qué entidades de dominio están involucradas?
   - ¿Qué reglas de negocio aplican?

2. **Definir Casos de Uso**
   ```typescript
   // Ejemplo: "Asignar Recurso a Equipo"
   // - Input: ResourceId, TeamId, AllocationPercentage
   // - Output: Result<void>
   // - Reglas:
   //   * Recurso debe existir y estar disponible
   //   * Equipo debe existir y tener capacidad
   //   * Allocation no debe exceder capacidad restante del recurso
   ```

#### Paso 2: Domain First (DDD)

1. **Crear/Actualizar Entidades**

   ```bash
   # Ubicación: src/app/core/domain/entities/
   touch src/app/core/domain/entities/resource-assignment.entity.ts
   ```

   ```typescript
   // ✅ EJEMPLO: Entidad con lógica de negocio
   export class ResourceAssignment extends Entity<number> {
     constructor(
       id: number,
       private _resourceId: number,
       private _teamId: number,
       private _allocationPercentage: number,
       private _startDate: Date,
       private _endDate?: Date
     ) {
       super(id);
       this.validateAllocation();
       this.validateDateRange();
     }

     public get resourceId(): number {
       return this._resourceId;
     }
     public get teamId(): number {
       return this._teamId;
     }
     public get allocationPercentage(): number {
       return this._allocationPercentage;
     }

     public updateAllocation(newPercentage: number): void {
       if (newPercentage <= 0 || newPercentage > 100) {
         throw new Error('Allocation percentage must be between 1 and 100');
       }
       this._allocationPercentage = newPercentage;
     }

     public isActiveOn(date: Date): boolean {
       return date >= this._startDate && (!this._endDate || date <= this._endDate);
     }

     private validateAllocation(): void {
       if (this._allocationPercentage <= 0 || this._allocationPercentage > 100) {
         throw new Error('Invalid allocation percentage');
       }
     }
   }
   ```

2. **Crear Value Objects (si es necesario)**

   ```typescript
   // src/app/core/domain/value-objects/allocation-percentage.value-object.ts
   export class AllocationPercentage extends ValueObject<{ value: number }> {
     private constructor(value: number) {
       super({ value });
     }

     public static create(percentage: number): Result<AllocationPercentage> {
       if (percentage <= 0 || percentage > 100) {
         return Result.fail('Allocation percentage must be between 1 and 100');
       }
       return Result.ok(new AllocationPercentage(percentage));
     }

     public getValue(): number {
       return this.props.value;
     }

     protected validate(props: { value: number }): void {
       // Validation is done in create method
     }
   }
   ```

3. **Crear/Actualizar Repository Interfaces**
   ```typescript
   // src/app/core/domain/repositories/resource-assignment.repository.interface.ts
   export abstract class IResourceAssignmentRepository {
     abstract findById(id: number): Observable<ResourceAssignment | null>;
     abstract findByResource(resourceId: number): Observable<ResourceAssignment[]>;
     abstract findByTeam(teamId: number): Observable<ResourceAssignment[]>;
     abstract findActiveAssignments(date: Date): Observable<ResourceAssignment[]>;
     abstract save(assignment: ResourceAssignment): Observable<ResourceAssignment>;
     abstract delete(id: number): Observable<void>;
   }
   ```

#### Paso 3: Application Layer

1. **Crear Commands**

   ```typescript
   // src/app/core/application/commands/assign-resource-to-team.command.ts
   export class AssignResourceToTeamCommand {
     constructor(
       public readonly resourceId: number,
       public readonly teamId: number,
       public readonly allocationPercentage: number,
       public readonly startDate: Date,
       public readonly endDate?: Date,
       public readonly notes?: string
     ) {
       this.validate();
     }

     private validate(): void {
       if (this.resourceId <= 0) {
         throw new Error('Valid resource ID is required');
       }
       if (this.teamId <= 0) {
         throw new Error('Valid team ID is required');
       }
       if (this.allocationPercentage <= 0 || this.allocationPercentage > 100) {
         throw new Error('Allocation percentage must be between 1 and 100');
       }
       if (this.endDate && this.endDate <= this.startDate) {
         throw new Error('End date must be after start date');
       }
     }
   }
   ```

2. **Crear Use Cases**

   ```typescript
   // src/app/core/application/use-cases/assign-resource-to-team.use-case.ts
   @Injectable({
     providedIn: 'root',
   })
   export class AssignResourceToTeamUseCase {
     constructor(
       private resourceRepository: IResourceRepository,
       private teamRepository: ITeamRepository,
       private assignmentRepository: IResourceAssignmentRepository,
       private eventBus: IEventBus
     ) {}

     execute(command: AssignResourceToTeamCommand): Observable<Result<ResourceAssignment>> {
       return this.validateResourceExists(command.resourceId).pipe(
         switchMap((resourceResult) => {
           if (resourceResult.isFailure) {
             return of(Result.fail(resourceResult.getError()));
           }

           return this.validateTeamExists(command.teamId).pipe(
             switchMap((teamResult) => {
               if (teamResult.isFailure) {
                 return of(Result.fail(teamResult.getError()));
               }

               return this.validateResourceAvailability(
                 resourceResult.getValue(),
                 command.allocationPercentage
               ).pipe(
                 switchMap((availabilityResult) => {
                   if (availabilityResult.isFailure) {
                     return of(Result.fail(availabilityResult.getError()));
                   }

                   return this.createAssignment(command);
                 })
               );
             })
           );
         }),
         catchError((error) => of(Result.fail(error.message)))
       );
     }

     private validateResourceExists(resourceId: number): Observable<Result<Resource>> {
       return this.resourceRepository.findById(resourceId).pipe(
         map((resource) => {
           if (!resource) {
             return Result.fail('Resource not found');
           }
           return Result.ok(resource);
         })
       );
     }

     private createAssignment(
       command: AssignResourceToTeamCommand
     ): Observable<Result<ResourceAssignment>> {
       const assignment = new ResourceAssignment(
         0, // ID temporal
         command.resourceId,
         command.teamId,
         command.allocationPercentage,
         command.startDate,
         command.endDate
       );

       return this.assignmentRepository.save(assignment).pipe(
         map((savedAssignment) => {
           // Emitir evento de dominio
           this.eventBus.emit(
             new ResourceAssignedToTeamEvent(
               command.resourceId,
               command.teamId,
               command.allocationPercentage
             )
           );

           return Result.ok(savedAssignment);
         })
       );
     }
   }
   ```

3. **Crear DTOs**

   ```typescript
   // src/app/core/application/dto/resource-assignment.dto.ts
   export interface ResourceAssignmentDto {
     id: number;
     resource: number;
     team: number;
     allocation_percentage: number;
     start_date: string;
     end_date?: string;
     notes?: string;
     created_at: string;
     updated_at: string;
   }

   export interface CreateResourceAssignmentDto {
     resource: number;
     team: number;
     allocation_percentage: number;
     start_date: string;
     end_date?: string;
     notes?: string;
   }
   ```

4. **Crear Mappers**

   ```typescript
   // src/app/core/application/mappers/resource-assignment.mapper.ts
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceAssignmentMapper {
     toDomain(dto: ResourceAssignmentDto): ResourceAssignment {
       return new ResourceAssignment(
         dto.id,
         dto.resource,
         dto.team,
         dto.allocation_percentage,
         new Date(dto.start_date),
         dto.end_date ? new Date(dto.end_date) : undefined
       );
     }

     toCreateDto(command: AssignResourceToTeamCommand): CreateResourceAssignmentDto {
       return {
         resource: command.resourceId,
         team: command.teamId,
         allocation_percentage: command.allocationPercentage,
         start_date: command.startDate.toISOString().split('T')[0],
         end_date: command.endDate?.toISOString().split('T')[0],
         notes: command.notes,
       };
     }
   }
   ```

#### Paso 4: Infrastructure Layer

1. **Crear API Service**

   ```typescript
   // src/app/core/infrastructure/http/resource-assignment-api.service.ts
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceAssignmentApiService {
     private readonly baseUrl = `${environment.apiUrl}/resource_management/assignments`;

     constructor(private http: HttpClient) {}

     create(assignment: CreateResourceAssignmentDto): Observable<ResourceAssignmentDto> {
       return this.http.post<ResourceAssignmentDto>(`${this.baseUrl}/`, assignment);
     }

     getById(id: number): Observable<ResourceAssignmentDto> {
       return this.http.get<ResourceAssignmentDto>(`${this.baseUrl}/${id}/`);
     }

     getByResource(resourceId: number): Observable<ResourceAssignmentDto[]> {
       return this.http.get<ResourceAssignmentDto[]>(`${this.baseUrl}/?resource=${resourceId}`);
     }
   }
   ```

2. **Implementar Repository**

   ```typescript
   // src/app/core/infrastructure/repositories/resource-assignment.repository.ts
   @Injectable({
     providedIn: 'root',
   })
   export class ResourceAssignmentRepository implements IResourceAssignmentRepository {
     constructor(
       private apiService: ResourceAssignmentApiService,
       private mapper: ResourceAssignmentMapper
     ) {}

     findById(id: number): Observable<ResourceAssignment | null> {
       return this.apiService.getById(id).pipe(
         map((dto) => this.mapper.toDomain(dto)),
         catchError(() => of(null))
       );
     }

     save(assignment: ResourceAssignment): Observable<ResourceAssignment> {
       const createDto = this.mapper.toCreateDto(assignment);
       return this.apiService.create(createDto).pipe(map((dto) => this.mapper.toDomain(dto)));
     }
   }
   ```

#### Paso 5: Presentation Layer

1. **Crear Component**

   ```typescript
   // src/app/features/resource-management/components/assign-resource-form.component.ts
   @Component({
     selector: 'app-assign-resource-form',
     standalone: true,
     imports: [CommonModule, ReactiveFormsModule],
     template: `
       <form class="card" [formGroup]="assignmentForm" (ngSubmit)="onSubmit()">
         <div class="card-header">
           <h3 class="text-lg font-semibold">Assign Resource to Team</h3>
         </div>

         <div class="card-body space-y-6">
           <div>
             <label class="form-label">Resource</label>
             <select formControlName="resourceId" class="form-input">
               <option value="">Select Resource</option>
               @for (resource of availableResources(); track resource.id) {
                 <option [value]="resource.id">
                   {{ resource.name }} ({{ resource.remainingCapacity }}% available)
                 </option>
               }
             </select>
           </div>

           <div>
             <label class="form-label">Team</label>
             <select formControlName="teamId" class="form-input">
               <option value="">Select Team</option>
               @for (team of teams(); track team.id) {
                 <option [value]="team.id">{{ team.name }}</option>
               }
             </select>
           </div>

           <div>
             <label class="form-label">Allocation Percentage</label>
             <input
               type="number"
               formControlName="allocationPercentage"
               class="form-input"
               min="1"
               max="100"
               placeholder="Enter allocation percentage" />
           </div>

           <div>
             <label class="form-label">Start Date</label>
             <input type="date" formControlName="startDate" class="form-input" />
           </div>
         </div>

         <div class="card-footer">
           <button
             type="submit"
             class="btn-primary"
             [disabled]="assignmentForm.invalid || submitting()">
             @if (submitting()) {
               <span class="loading-spinner mr-2"></span>
             }
             Assign Resource
           </button>

           <button type="button" class="btn-outline ml-3" (click)="onCancel()">Cancel</button>
         </div>

         @if (error()) {
           <div class="alert alert-error mt-4">
             {{ error() }}
           </div>
         }
       </form>
     `,
     changeDetection: ChangeDetectionStrategy.OnPush,
   })
   export class AssignResourceFormComponent implements OnInit {
     protected readonly availableResources = signal<Resource[]>([]);
     protected readonly teams = signal<Team[]>([]);
     protected readonly submitting = signal(false);
     protected readonly error = signal<string | null>(null);

     protected assignmentForm = this.fb.nonNullable.group({
       resourceId: ['', [Validators.required]],
       teamId: ['', [Validators.required]],
       allocationPercentage: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
       startDate: ['', [Validators.required]],
     });

     constructor(
       private fb: FormBuilder,
       private assignResourceUseCase: AssignResourceToTeamUseCase,
       private getResourcesUseCase: GetResourcesUseCase,
       private getTeamsUseCase: GetTeamsUseCase,
       private router: Router
     ) {}

     ngOnInit(): void {
       this.loadAvailableResources();
       this.loadTeams();
     }

     protected onSubmit(): void {
       if (this.assignmentForm.valid) {
         const formValue = this.assignmentForm.getRawValue();

         const command = new AssignResourceToTeamCommand(
           +formValue.resourceId,
           +formValue.teamId,
           formValue.allocationPercentage,
           new Date(formValue.startDate)
         );

         this.submitting.set(true);
         this.error.set(null);

         this.assignResourceUseCase.execute(command).subscribe({
           next: (result) => {
             if (result.isSuccess) {
               this.router.navigate(['/resources']);
             } else {
               this.error.set(result.getError());
             }
             this.submitting.set(false);
           },
           error: (error) => {
             this.error.set('An unexpected error occurred');
             this.submitting.set(false);
           },
         });
       }
     }

     private loadAvailableResources(): void {
       this.getResourcesUseCase.executeAvailableOnly().subscribe({
         next: (result) => {
           if (result.isSuccess) {
             this.availableResources.set(result.getValue());
           }
         },
       });
     }
   }
   ```

#### Paso 6: Configurar Dependency Injection

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers

    // Repository implementations
    {
      provide: IResourceAssignmentRepository,
      useClass: ResourceAssignmentRepository,
    },

    // ... otros providers
  ],
};
```

#### Paso 7: Testing

```typescript
// src/app/core/domain/entities/resource-assignment.entity.spec.ts
describe('ResourceAssignment Entity', () => {
  describe('when creating an assignment', () => {
    it('should create successfully with valid data', () => {
      const assignment = new ResourceAssignment(1, 2, 3, 50, new Date('2024-01-01'));

      expect(assignment.resourceId).toBe(2);
      expect(assignment.teamId).toBe(3);
      expect(assignment.allocationPercentage).toBe(50);
    });

    it('should throw error with invalid allocation percentage', () => {
      expect(() => {
        new ResourceAssignment(1, 2, 3, 150, new Date('2024-01-01'));
      }).toThrowError('Invalid allocation percentage');
    });
  });
});

// src/app/core/application/use-cases/assign-resource-to-team.use-case.spec.ts
describe('AssignResourceToTeamUseCase', () => {
  let useCase: AssignResourceToTeamUseCase;
  let mockResourceRepo: jasmine.SpyObj<IResourceRepository>;
  let mockTeamRepo: jasmine.SpyObj<ITeamRepository>;

  beforeEach(() => {
    const resourceSpy = jasmine.createSpyObj('IResourceRepository', ['findById']);
    const teamSpy = jasmine.createSpyObj('ITeamRepository', ['findById']);

    TestBed.configureTestingModule({
      providers: [
        AssignResourceToTeamUseCase,
        { provide: IResourceRepository, useValue: resourceSpy },
        { provide: ITeamRepository, useValue: teamSpy },
      ],
    });

    useCase = TestBed.inject(AssignResourceToTeamUseCase);
    mockResourceRepo = TestBed.inject(IResourceRepository) as jasmine.SpyObj<IResourceRepository>;
  });

  it('should assign resource to team successfully', (done) => {
    // Given
    const command = new AssignResourceToTeamCommand(1, 2, 50, new Date());
    const resource = new Resource(1, 'John Doe', 1, AvailabilityStatus.Available, 30);

    mockResourceRepo.findById.and.returnValue(of(resource));

    // When
    useCase.execute(command).subscribe((result) => {
      // Then
      expect(result.isSuccess).toBe(true);
      done();
    });
  });
});
```

## 8. Testing Strategy

### 🧪 Niveles de Testing

#### Unit Tests (Obligatorios)

```typescript
// ✅ DOMAIN ENTITIES
describe('Resource Entity', () => {
  it('should assign to team when capacity allows', () => {
    // Given
    const resource = new Resource(1, 'John', 1, AvailabilityStatus.Available, 30);

    // When
    resource.assignToTeam(1, 40);

    // Then
    expect(resource.workloadPercentage).toBe(70);
    expect(resource.getDomainEvents()).toHaveLength(1);
  });
});

// ✅ USE CASES
describe('CreateResourceUseCase', () => {
  let useCase: CreateResourceUseCase;
  let mockRepository: MockResourceRepository;

  beforeEach(() => {
    mockRepository = new MockResourceRepository();
    useCase = new CreateResourceUseCase(mockRepository);
  });

  it('should create resource successfully', (done) => {
    const command = new CreateResourceCommand('Test Resource', 1);

    useCase.execute(command).subscribe((result) => {
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.getResourceCount()).toBe(1);
      done();
    });
  });
});

// ✅ VALUE OBJECTS
describe('Email ValueObject', () => {
  it('should create valid email', () => {
    const result = Email.create('test@example.com');
    expect(result.isSuccess).toBe(true);
  });

  it('should fail with invalid email', () => {
    const result = Email.create('invalid-email');
    expect(result.isFailure).toBe(true);
  });
});
```

#### Integration Tests

```typescript
// ✅ REPOSITORY IMPLEMENTATIONS
describe('ResourceRepository Integration', () => {
  let repository: ResourceRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourceRepository, ResourceApiService, ResourceMapper],
    });

    repository = TestBed.inject(ResourceRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch resource by id', () => {
    const mockDto: ResourceDto = {
      id: 1,
      name: 'Test Resource',
      resource_type: 1,
      availability_status: 'available',
      workload_percentage: 0,
      is_active: true,
    };

    repository.findById(1).subscribe((resource) => {
      expect(resource).toBeTruthy();
      expect(resource!.name).toBe('Test Resource');
    });

    const req = httpMock.expectOne('/api/v1/resource_management/resources/1/');
    expect(req.request.method).toBe('GET');
    req.flush(mockDto);
  });
});

// ✅ COMPONENT INTEGRATION
describe('ResourceListComponent Integration', () => {
  let component: ResourceListComponent;
  let fixture: ComponentFixture<ResourceListComponent>;
  let mockUseCase: jasmine.SpyObj<GetResourcesUseCase>;

  beforeEach(async () => {
    const useCaseSpy = jasmine.createSpyObj('GetResourcesUseCase', ['execute']);

    await TestBed.configureTestingModule({
      imports: [ResourceListComponent],
      providers: [{ provide: GetResourcesUseCase, useValue: useCaseSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceListComponent);
    component = fixture.componentInstance;
    mockUseCase = TestBed.inject(GetResourcesUseCase) as jasmine.SpyObj<GetResourcesUseCase>;
  });

  it('should display resources when loaded', () => {
    const mockResources = [new Resource(1, 'John', 1, AvailabilityStatus.Available, 0)];

    mockUseCase.execute.and.returnValue(of(Result.ok(mockResources)));

    fixture.detectChanges();

    expect(component.resources()).toHaveLength(1);
    expect(component.loading()).toBe(false);
  });
});
```

#### End-to-End Tests (Cypress)

```typescript
// cypress/e2e/resource-management.cy.ts
describe('Resource Management', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password123');
    cy.visit('/resources');
  });

  it('should create a new resource', () => {
    cy.get('[data-cy=create-resource-btn]').click();

    cy.get('[data-cy=resource-name-input]').type('New Resource');
    cy.get('[data-cy=resource-type-select]').select('Human');
    cy.get('[data-cy=submit-btn]').click();

    cy.contains('Resource created successfully').should('be.visible');
    cy.contains('New Resource').should('be.visible');
  });

  it('should assign resource to team', () => {
    cy.get('[data-cy=resource-card]:first').click();
    cy.get('[data-cy=assign-to-team-btn]').click();

    cy.get('[data-cy=team-select]').select('Frontend Team');
    cy.get('[data-cy=allocation-input]').type('50');
    cy.get('[data-cy=assign-btn]').click();

    cy.contains('Resource assigned successfully').should('be.visible');
  });
});
```

### 🎯 Mocks y Test Utilities

```typescript
// src/test/mocks/mock-repositories.ts
export class MockResourceRepository implements IResourceRepository {
  private resources: Resource[] = [];
  private nextId = 1;

  findById(id: number): Observable<Resource | null> {
    const resource = this.resources.find((r) => r.id === id);
    return of(resource || null);
  }

  save(resource: Resource): Observable<Resource> {
    if (resource.id && resource.id > 0) {
      const index = this.resources.findIndex((r) => r.id === resource.id);
      if (index >= 0) {
        this.resources[index] = resource;
      }
    } else {
      const newResource = new Resource(
        this.nextId++,
        resource.name,
        resource.resourceTypeId,
        resource.status,
        resource.workloadPercentage
      );
      this.resources.push(newResource);
      return of(newResource);
    }
    return of(resource);
  }

  // Helper methods for testing
  setResources(resources: Resource[]): void {
    this.resources = [...resources];
  }

  clear(): void {
    this.resources = [];
    this.nextId = 1;
  }
}

// src/test/factories/entity-factory.ts
export class ResourceFactory {
  static create(
    overrides: Partial<{
      id: number;
      name: string;
      resourceTypeId: number;
      status: AvailabilityStatus;
      workloadPercentage: number;
    }> = {}
  ): Resource {
    return new Resource(
      overrides.id || 1,
      overrides.name || 'Test Resource',
      overrides.resourceTypeId || 1,
      overrides.status || AvailabilityStatus.Available,
      overrides.workloadPercentage || 0
    );
  }

  static createMany(count: number): Resource[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        id: index + 1,
        name: `Resource ${index + 1}`,
      })
    );
  }
}
```

## 9. Checklist de Implementación

### ✅ Pre-Desarrollo

- [ ] Analizar endpoint(s) del swagger.json que usarás
- [ ] Identificar entidades de dominio involucradas
- [ ] Definir reglas de negocio claramente
- [ ] Planificar casos de uso (commands/queries)
- [ ] Revisar si necesitas nuevos value objects

### ✅ Domain Layer

- [ ] ✅ Entidades creadas con lógica de negocio
- [ ] ✅ Value objects inmutables implementados
- [ ] ✅ Repository interfaces definidas (solo interfaces)
- [ ] ✅ Domain events creados si es necesario
- [ ] ✅ Validaciones en constructores de entidades
- [ ] ✅ Métodos de negocio retornan Result<T> o void
- [ ] ❌ NO hay imports de Angular/HTTP en domain
- [ ] ❌ NO hay lógica de persistencia en entities

### ✅ Application Layer

- [ ] ✅ Commands/Queries con validación
- [ ] ✅ Use cases que orquestan el flujo
- [ ] ✅ DTOs para comunicación con API
- [ ] ✅ Mappers bidireccionales (Domain ↔ DTO)
- [ ] ✅ Use cases retornan Observable<Result<T>>
- [ ] ✅ Manejo de errores con Result pattern
- [ ] ❌ NO hay lógica de negocio en use cases
- [ ] ❌ NO hay llamadas HTTP directas en use cases

### ✅ Infrastructure Layer

- [ ] ✅ Repository implementations con HTTP calls
- [ ] ✅ API services que usan DTOs exclusivamente
- [ ] ✅ Mappers integrados en repositories
- [ ] ✅ Error handling apropiado
- [ ] ✅ Configuración de dependency injection
- [ ] ❌ NO hay lógica de negocio en repositories
- [ ] ❌ NO hay manipulación directa de entidades en HTTP services

### ✅ Presentation Layer

- [ ] ✅ Components standalone con signals
- [ ] ✅ Uso de nueva sintaxis de control flow (@if, @for)
- [ ] ✅ OnPush change detection strategy
- [ ] ✅ Inyección de use cases (no repositories directos)
- [ ] ✅ Manejo de Result pattern en components
- [ ] ✅ TailwindCSS classes apropiadas
- [ ] ❌ NO hay lógica de negocio en components
- [ ] ❌ NO hay llamadas HTTP directas en components

### ✅ Testing

- [ ] ✅ Unit tests para entities con business logic
- [ ] ✅ Unit tests para use cases con mocks
- [ ] ✅ Integration tests para repositories
- [ ] ✅ Component tests con TestBed
- [ ] ✅ Mocks apropiados para dependencies
- [ ] ✅ Test coverage > 80% en domain/application layers

### ✅ Naming Conventions

- [ ] ✅ Archivos siguen convención kebab-case
- [ ] ✅ Clases en PascalCase
- [ ] ✅ Métodos/propiedades en camelCase
- [ ] ✅ Constantes en UPPER_SNAKE_CASE
- [ ] ✅ Interfaces de dominio con prefijo I
- [ ] ✅ DTOs con sufijo Dto
- [ ] ✅ Commands/Queries con sufijo apropiado
- [ ] ✅ Events con sufijo Event

## 10. Troubleshooting

### ❗ Problemas Comunes y Soluciones

#### 🔴 Error: "Cannot resolve dependencies"

**Síntoma**: Errores de inyección de dependencias

```typescript
// ❌ PROBLEMA: Interface no está registrada
constructor(private repo: IResourceRepository) {}
```

**✅ SOLUCIÓN**: Registrar implementation en app.config.ts

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [{ provide: IResourceRepository, useClass: ResourceRepository }],
};
```

#### 🔴 Error: "Circular dependency detected"

**Síntoma**: Dependencias circulares entre módulos

```typescript
// ❌ PROBLEMA: Imports circulares
// resource.service.ts
import { TeamService } from './team.service';

// team.service.ts
import { ResourceService } from './resource.service';
```

**✅ SOLUCIÓN**: Usar interfaces y event bus

```typescript
// Usar eventos de dominio en lugar de dependencias directas
export class ResourceAssignedToTeamEvent extends DomainEvent {
  constructor(
    public readonly resourceId: number,
    public readonly teamId: number
  ) {
    super();
  }
}
```

#### 🔴 Error: "Entity validation failed"

**Síntoma**: Errores al crear entidades

```typescript
// ❌ PROBLEMA: Datos inválidos desde API
const resource = new Resource(dto.id, dto.name, dto.type, dto.status);
// Throws: "Resource name cannot be empty"
```

**✅ SOLUCIÓN**: Validar en mapper antes de crear entidad

```typescript
export class ResourceMapper {
  toDomain(dto: ResourceDto): Resource {
    // Validar DTO antes de crear entidad
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Invalid DTO: name is required');
    }

    return new Resource(dto.id, dto.name.trim(), dto.type, dto.status);
  }
}
```

#### 🔴 Error: "Cannot read property of undefined"

**Síntoma**: Errores al acceder propiedades en templates

```html
<!-- ❌ PROBLEMA: Resource puede ser undefined -->
<div>{{ resource.name }}</div>
```

**✅ SOLUCIÓN**: Usar guards en template

```html
<!-- ✅ CORRECTO: Con guard -->
@if (resource()) {
<div>{{ resource()!.name }}</div>
}

<!-- ✅ O con optional chaining en component -->
<div>{{ resourceName() }}</div>
```

```typescript
// Component
protected readonly resourceName = computed(() => this.resource()?.name ?? 'Unknown');
```

#### 🔴 Error: "HTTP 401 Unauthorized"

**Síntoma**: API calls fallan con 401

```typescript
// ❌ PROBLEMA: Token no se envía correctamente
```

**✅ SOLUCIÓN**: Verificar auth interceptor

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token && !req.url.includes('/auth/login')) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  return next(req);
};
```

#### 🔴 Error: "ExpressionChangedAfterItHasBeenCheckedError"

**Síntoma**: Error de Angular en desarrollo

```typescript
// ❌ PROBLEMA: Modificar state durante change detection
ngAfterViewInit() {
  this.loading.set(false); // Cambia state después de check
}
```

**✅ SOLUCIÓN**: Usar OnPush y async updates

```typescript
// ✅ CORRECTO: Usar async para cambios de state
ngAfterViewInit() {
  setTimeout(() => {
    this.loading.set(false);
  }, 0);

  // O mejor, usar OnPush change detection
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

#### 🔴 Error: "Test timeout exceeded"

**Síntoma**: Tests fallan por timeout

```typescript
// ❌ PROBLEMA: Observable no completa en test
it('should create resource', () => {
  useCase.execute(command).subscribe((result) => {
    expect(result.isSuccess).toBe(true);
  });
});
```

**✅ SOLUCIÓN**: Usar done callback o async/await

```typescript
// ✅ CORRECTO: Con done callback
it('should create resource', (done) => {
  useCase.execute(command).subscribe((result) => {
    expect(result.isSuccess).toBe(true);
    done();
  });
});

// ✅ O con async/await
it('should create resource', async () => {
  const result = await firstValueFrom(useCase.execute(command));
  expect(result.isSuccess).toBe(true);
});
```

### 🔧 Debugging Tips

#### 1. Domain Layer Issues

```typescript
// Debug entities
console.log('Domain Events:', resource.getDomainEvents());
console.log('Entity State:', {
  id: resource.id,
  name: resource.name,
  status: resource.status,
});
```

#### 2. Use Case Issues

```typescript
// Debug use case flow
execute(command: CreateResourceCommand): Observable<Result<Resource>> {
  console.log('Executing command:', command);

  return this.repository.save(resource).pipe(
    tap(result => console.log('Repository result:', result)),
    map(savedResource => {
      console.log('Saved resource:', savedResource);
      return Result.ok(savedResource);
    })
  );
}
```

#### 3. HTTP Issues

```typescript
// Debug HTTP calls
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('HTTP Request:', req.url, req.body);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        console.log('HTTP Response:', event.status, event.body);
      }
    })
  );
};
```

### 📚 Referencias Útiles

#### Documentación Oficial

- [Angular 20 Documentation](https://angular.io/docs)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [TailwindCSS Classes](https://tailwindcss.com/docs)

#### Clean Architecture Resources

- [Clean Architecture by Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

#### Angular Patterns

- [Angular Architecture Patterns](https://angular.io/guide/architecture)
- [State Management with Signals](https://angular.io/guide/signals)

---

## 📝 Notas Finales

### ⚠️ Reglas Críticas (NO NEGOCIABLES)

1. **NUNCA** poner lógica de negocio fuera del Domain Layer
2. **SIEMPRE** usar Result Pattern para manejo de errores
3. **NUNCA** hacer imports de Angular/HTTP en Domain Layer
4. **SIEMPRE** usar interfaces para dependencies del Domain
5. **NUNCA** manipular entidades directamente desde Components
6. **SIEMPRE** escribir tests para business logic
7. **NUNCA** usar `any` type en código de producción
8. **SIEMPRE** seguir naming conventions establecidas

### 🎯 Objetivos de Calidad

- **Cobertura de Tests**: Mínimo 80% en Domain/Application layers
- **Complejidad Ciclomática**: Máximo 10 por método
- **Líneas por Método**: Máximo 30 líneas
- **Parámetros por Método**: Máximo 5 parámetros
- **Dependencias por Clase**: Máximo 7 dependencias

### 📈 Métricas de Success

- ✅ Lógica de negocio centralizada en Domain
- ✅ Componentes sin lógica de negocio
- ✅ Tests que cubren business rules
- ✅ Código fácil de mantener y extender
- ✅ API integration limpia y robusta

---

**¡Esta guía es tu referencia principal para implementar funcionalidades siguiendo Clean Architecture + DDD en el proyecto MAD-AI!**
