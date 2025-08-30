# GitHub Copilot Instructions - MAD-AI Architecture

## 📋 **Instrucciones Generales para Copilot**

*Estas instrucciones deben ser seguidas en TODAS las interacciones con el proyecto MAD-AI. Representan los principios arquitectónicos fundamentales basados en Clean Architecture y Domain-Driven Design.*

---

## 🏗️ **1. PRINCIPIOS ARQUITECTÓNICOS FUNDAMENTALES**

### **Separación de Capas (Clean Architecture)**
- **Presentation Layer**: Únicamente maneja la interfaz de usuario y delega toda lógica a Application
- **Application Layer**: Coordina Domain e Infrastructure sin contener lógica de negocio
- **Domain Layer**: Contiene lógica de negocio pura, independiente de tecnología
- **Core Layer**: Servicios transversales independientes del framework
- **Infrastructure Layer**: Implementa contratos de Domain y maneja concerns técnicos

### **Reglas de Dependencia**
```
Presentation → Application → Domain ← Core ← Infrastructure
```

**NUNCA** permita dependencias inversas o saltos de capas.

### **Pregunta Decisiva para Ubicación de Código**
- **¿Es lógica de negocio que un experto entendería?** → Domain
- **¿Coordina múltiples servicios para un caso de uso?** → Application
- **¿Es específico de UI/interacción usuario?** → Presentation
- **¿Es servicio transversal independiente del framework?** → Core
- **¿Implementa contratos técnicos externos?** → Infrastructure

---

## 🎨 **2. PRESENTATION LAYER - "Solo Presenta"**

### **Responsabilidades**
- Mostrar información al usuario
- Capturar acciones del usuario
- Delegar TODA lógica a Application Layer
- Gestionar estado de UI (no de negocio)

### **Estructura Obligatoria**
```
presentation/
├── shared/           # Componentes UI reutilizables
├── pages/            # Páginas principales
├── layouts/          # Estructuras de layout
├── guards/           # Guards de routing específicos
├── pipes/            # Transformaciones para templates
├── services/         # Servicios específicos de UI
└── mappers/          # Transformadores Application→UI
```

### **QUÉ VA AQUÍ**
✅ Componentes de UI sin lógica de negocio
✅ Formularios y validaciones de UI
✅ Pipes de formato para display
✅ Servicios de tema/styling
✅ Guards de navegación
✅ Mappers de datos para UI

### **QUÉ NO VA AQUÍ**
❌ Lógica de negocio
❌ Llamadas directas a APIs
❌ Validaciones de dominio
❌ Servicios de negocio
❌ Repositories

### **Ejemplo Correcto**
```typescript
// ✅ Correcto - Solo presenta
@Component({...})
export class UserProfileComponent {
  constructor(private userFacade: UserFacade) {}

  onSaveProfile(profileData: any) {
    this.userFacade.updateProfile(profileData);
  }
}
```

---

## 🚀 **3. APPLICATION LAYER - "Orquesta, No Contiene"**

### **Responsabilidades**
- Coordinar Domain e Infrastructure
- Ejecutar casos de uso específicos
- Gestionar transacciones
- Publicar domain events
- Validar autorizaciones (no de negocio)

### **Estructura Obligatoria**
```
application/
├── facades/          # Fachadas para Presentation
├── use-cases/        # Casos de uso del sistema
├── types/            # Tipos específicos de Application
├── mappers/          # Transformadores entre capas
└── errors/           # Errores de Application
```

### **QUÉ VA AQUÍ**
✅ Orquestación de servicios
✅ Coordinación transaccional
✅ Validaciones de autorización
✅ Publicación de events
✅ Fachadas para UI
✅ Casos de uso específicos

### **QUÉ NO VA AQUÍ**
❌ Lógica de negocio pura
❌ Llamadas HTTP directas
❌ Validaciones de formato
❌ Servicios técnicos
❌ Interfaces de repositorios

### **Ejemplo Correcto**
```typescript
// ✅ Correcto - Orquesta
@Injectable()
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: DomainEventBus
  ) {}

  async execute(userData: CreateUserDto): Promise<User> {
    // Validar autorización
    // Coordinar repository
    // Publicar events
  }
}
```

---

## 🧠 **4. DOMAIN LAYER - "Lógica de Negocio Pura"**

### **Responsabilidades**
- Contener lógica de negocio independiente de tecnología
- Definir contratos (interfaces) para Infrastructure
- Representar conceptos del negocio
- Validar reglas de negocio

### **Estructura Obligatoria**
```
domain/
├── entities/         # Objetos con identidad
├── value-objects/    # Objetos inmutables
├── repositories/     # Contratos de persistencia
├── services/         # Servicios de dominio
├── specifications/   # Especificaciones de negocio
├── events/           # Eventos de dominio
└── errors/           # Errores de dominio
```

### **QUÉ VA AQUÍ**
✅ Entidades con comportamiento
✅ Value Objects con validación
✅ Interfaces de repositories
✅ Servicios de dominio
✅ Reglas de negocio
✅ Eventos de dominio

### **QUÉ NO VA AQUÍ**
❌ Llamadas a base de datos
❌ Lógica de presentación
❌ Dependencias de frameworks
❌ Servicios técnicos
❌ DTOs de APIs externas

### **Ejemplo Correcto**
```typescript
// ✅ Correcto - Lógica de negocio pura
export class User extends Entity {
  changeRole(newRole: Role): void {
    if (!this.canChangeToRole(newRole)) {
      throw new DomainError('Cannot change to this role');
    }
    this.role = newRole;
    this.addDomainEvent(new UserRoleChangedEvent(this.id, newRole));
  }

  private canChangeToRole(role: Role): boolean {
    // Regla de negocio pura
    return this.role.canTransitionTo(role);
  }
}
```

---

## ⚙️ **5. CORE LAYER - "Servicios Transversales"**

### **Responsabilidades**
- Proporcionar servicios técnicos independientes del framework
- Abstraer concerns transversales
- Ser reutilizables en cualquier tipo de aplicación

### **Estructura Obligatoria**
```
core/
├── services/         # Servicios transversales (4-6 máximo)
├── decorators/       # Decoradores técnicos
└── interfaces/       # Contratos para extensibilidad
```

### **QUÉ VA AQUÍ**
✅ Logger service
✅ Configuration service
✅ Date/Time service
✅ Domain Event Bus
✅ Error handling global
✅ Servicios de notificaciones

### **QUÉ NO VA AQUÍ**
❌ Servicios específicos de dominio
❌ Dependencias de Angular/React
❌ Servicios de presentación
❌ Llamadas a APIs específicas

### **Criterios de Admisión (TODOS obligatorios)**
1. Lo necesitan múltiples bounded contexts
2. Es independiente del framework
3. Es fundamental para toda la app
4. Sería útil en web/mobile/desktop

---

## 🔧 **6. INFRASTRUCTURE LAYER - "Implementa Contratos"**

### **Responsabilidades**
- Implementar contratos definidos por Domain
- Manejar concerns técnicos externos
- Adaptar tecnologías específicas al dominio

### **Estructura Obligatoria**
```
infrastructure/
├── repositories/     # Implementaciones de repositories
├── http/            # Clientes HTTP
├── mappers/         # Mappers DTO ↔ Domain
├── dtos/            # Data Transfer Objects
├── guards/          # Guards técnicos
├── services/        # Servicios técnicos
└── errors/          # Errores técnicos
```

### **QUÉ VA AQUÍ**
✅ Implementaciones de repositories
✅ Clientes HTTP/API
✅ Mappers de datos
✅ Configuraciones técnicas
✅ Servicios de autenticación técnica
✅ Manejo de conexiones

### **QUÉ NO VA AQUÍ**
❌ Interfaces (van en Domain)
❌ Lógica de negocio
❌ Validaciones de dominio
❌ Servicios de UI

### **Ejemplo Correcto**
```typescript
// ✅ Correcto - Implementa contrato
@Injectable()
export class HttpUserRepository implements IUserRepository {
  constructor(private httpClient: HttpClient) {}

  async findById(id: UserId): Promise<User | null> {
    const dto = await this.httpClient.get<UserDto>(`/users/${id}`);
    return this.mapper.toDomain(dto);
  }
}
```

---

## 🚫 **7. ANTI-PATRONES A EVITAR**

### **Violaciones Comunes**
❌ **Business Logic en Presentation**: No pongas validaciones de negocio en componentes
❌ **Direct Database Access**: Nunca accedas a BD desde Application o Presentation
❌ **Framework Coupling en Domain**: Domain debe ser independiente de Angular
❌ **God Classes**: Evita clases que hagan demasiadas cosas
❌ **Circular Dependencies**: Mantén el flujo de dependencias unidireccional
❌ **Service Locator Anti-pattern**: Usa inyección de dependencias, no localización

### **Ejemplos de Código Incorrecto**
```typescript
// ❌ MAL - Business logic en componente
@Component({...})
export class UserFormComponent {
  saveUser(userData: any) {
    // ❌ Validación de negocio en UI
    if (userData.age < 18) {
      throw new Error('User must be 18+');
    }
    // ❌ Llamada directa a API
    this.http.post('/users', userData).subscribe(...);
  }
}
```

---

## 📋 **8. CHECKLIST DE REVISIÓN ARQUITECTÓNICA**

### **Antes de Crear un Archivo**
- [ ] ¿Dónde debe ir este código según las reglas de capas?
- [ ] ¿Contiene lógica de negocio? → Domain
- [ ] ¿Coordina servicios? → Application
- [ ] ¿Es específico de UI? → Presentation
- [ ] ¿Es servicio transversal? → Core
- [ ] ¿Implementa contrato técnico? → Infrastructure

### **Antes de Hacer un Commit**
- [ ] ¿Las dependencias van en la dirección correcta?
- [ ] ¿No hay lógica de negocio en Presentation?
- [ ] ¿Domain no depende de frameworks?
- [ ] ¿Los nombres siguen las convenciones?
- [ ] ¿Los archivos están en las carpetas correctas?

### **Durante Code Review**
- [ ] ¿Se respetan los límites de cada capa?
- [ ] ¿Los contratos están en Domain, implementaciones en Infrastructure?
- [ ] ¿No hay saltos de capas?
- [ ] ¿Los tests están en la capa apropiada?

---

## 🎯 **9. DECISION TREE PARA UBICACIÓN DE CÓDIGO**

```
¿Es código nuevo?
├── Sí
│   ├── ¿Contiene lógica de negocio que un experto entendería?
│   │   ├── Sí → Domain Layer
│   │   └── No
│   │       ├── ¿Coordina múltiples servicios para un caso de uso?
│   │       │   ├── Sí → Application Layer
│   │       │   └── No
│   │           ├── ¿Es específico de UI/interacción usuario?
│   │           │   ├── Sí → Presentation Layer
│   │           │   └── No
│   │               ├── ¿Es servicio transversal independiente?
│   │               │   ├── Sí → Core Layer
│   │               │   └── No → Infrastructure Layer
│   └── No (refactor existente)
│       └── ¿Dónde está ahora? → Mover a la capa correcta
```

---

## 🔧 **10. HERRAMIENTAS Y CONVENCIONES**

### **Nombres de Archivos**
- `*.entity.ts` - Entidades de dominio
- `*.value-object.ts` - Value Objects
- `*.repository.ts` - Interfaces de repositorios
- `*.usecase.ts` - Casos de uso
- `*.facade.ts` - Fachadas
- `*.service.ts` - Servicios
- `*.component.ts` - Componentes UI

### **Imports y Dependencias**
```typescript
// ✅ Correcto - Imports siguiendo capas
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository';
import { CreateUserUseCase } from '@application/use-cases/create-user.usecase';
import { LoggerService } from '@core/services/logger.service';
```

### **Testing Strategy**
- **Domain**: Unit tests puros
- **Application**: Integration tests
- **Infrastructure**: Contract tests
- **Presentation**: E2E tests

---

## 📚 **REFERENCIAS**

- **Documentación Original**: `docs/layers/` folder
- **Principios**: Clean Architecture, DDD
- **Framework**: Angular con separación estricta de capas
- **Proyecto**: MAD-AI - Arquitectura modular y escalable

---

*Estas instrucciones deben ser aplicadas consistentemente en todas las interacciones para mantener la integridad arquitectónica del proyecto MAD-AI.*
