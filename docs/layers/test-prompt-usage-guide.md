# 📖 Guía de Uso del Prompt de Testing MAD-AI

## 🎯 Cómo usar el prompt para generar tests

### Paso 1: Identifica tu archivo

```bash
# Ejemplo de archivos en el proyecto
src/app/domain/entities/user.entity.ts          # → Domain Layer
src/app/application/use-cases/create-user.ts    # → Application Layer  
src/app/infrastructure/repositories/user.repo.ts # → Infrastructure Layer
src/app/presentation/pages/user-list.ts         # → Presentation Layer
src/app/core/services/logger.service.ts         # → Core Layer
```

### Paso 2: Aplica el prompt correspondiente

#### Para Domain Layer:
```
Genera tests para src/app/domain/entities/user.entity.ts siguiendo las reglas de Domain Layer del prompt MAD-AI:

- Tests unitarios puros (sin mocks)
- Validar reglas de negocio
- Testear value objects si existen
- Verificar domain events
- Coverage objetivo: 95-100%

[Pega aquí tu código del entity]
```

#### Para Application Layer:
```
Genera tests para src/app/application/use-cases/create-user.usecase.ts siguiendo las reglas de Application Layer del prompt MAD-AI:

- Tests unitarios con mocks
- Verificar orquestación entre Domain e Infrastructure
- Testear manejo de errores
- Validar mappers si existen
- Coverage objetivo: 85-95%

[Pega aquí tu código del use case]
```

#### Para Infrastructure Layer:
```
Genera tests para src/app/infrastructure/repositories/user.repository.ts siguiendo las reglas de Infrastructure Layer del prompt MAD-AI:

- Tests de integración con HttpClientTestingModule
- Verificar transformación DTOs ↔ Entities
- Testear manejo de errores HTTP
- Validar llamadas a APIs
- Coverage objetivo: 75-85%

[Pega aquí tu código del repository]
```

#### Para Presentation Layer:
```
Genera tests para src/app/presentation/pages/user-list.component.ts siguiendo las reglas de Presentation Layer del prompt MAD-AI:

- Tests de componentes con TestBed
- Verificar interacción usuario
- Testear formularios y validaciones
- Validar estados loading/error
- Coverage objetivo: 70-80%

[Pega aquí tu código del component]
```

#### Para Core Layer:
```
Genera tests para src/app/core/services/logger.service.ts siguiendo las reglas de Core Layer del prompt MAD-AI:

- Tests unitarios independientes de framework
- Verificar funcionalidad transversal
- Testear que sea útil para múltiples dominios
- Coverage objetivo: 90-95%

[Pega aquí tu código del service]
```

## 🔍 Checklist de Validación

Después de generar los tests, verifica:

### ✅ Estructura correcta:
- [ ] El archivo test está en la misma carpeta que el archivo original
- [ ] Nombre sigue convención: `{filename}.spec.ts`
- [ ] Imports correctos según la capa
- [ ] Setup apropiado para el tipo de test

### ✅ Contenido por capa:

#### Domain:
- [ ] NO hay mocks
- [ ] Tests de reglas de negocio
- [ ] Validaciones de invariantes
- [ ] Tests de domain events si aplica
- [ ] Tests de value objects si aplica

#### Application:
- [ ] Mocks de repositories e interfaces
- [ ] Tests de orquestación (secuencia de llamadas)
- [ ] Tests de manejo de errores
- [ ] Tests de mappers si existen
- [ ] Verificación de publicación de eventos

#### Infrastructure:
- [ ] HttpClientTestingModule configurado
- [ ] Tests de transformación DTO ↔ Entity
- [ ] Tests de códigos de error HTTP
- [ ] Verificación de URLs y headers
- [ ] NO hay lógica de negocio en los tests

#### Presentation:
- [ ] TestBed configurado con mocks
- [ ] Tests de interacción usuario (clicks, inputs)
- [ ] Tests de formularios y validación
- [ ] Tests de estados (loading, error, success)
- [ ] Uso de facades (NO repositories directos)

#### Core:
- [ ] Independiente de Angular/frameworks
- [ ] Tests de funcionalidad transversal
- [ ] Útil para múltiples dominios
- [ ] NO dependencias específicas de UI

### ✅ Calidad:
- [ ] Nombres descriptivos de tests
- [ ] Patrón Given-When-Then
- [ ] Tests de casos felices y errores
- [ ] Tests de edge cases
- [ ] Assertions específicas y claras

## 🚨 Señales de Alerta

Si ves esto en tus tests generados, necesitas corrección:

### ❌ En Domain:
- Imports de Angular, HTTP, etc.
- Mocks o spies
- Tests que dependen de APIs
- Tests que no validan reglas de negocio

### ❌ En Application:
- Lógica de negocio en los tests
- Tests sin mocks de dependencias
- Tests que llaman APIs reales
- Validaciones de UI

### ❌ En Infrastructure:
- Tests sin HttpClientTestingModule
- Lógica de negocio en repository tests
- Tests que no verifican transformación de datos
- Llamadas reales a APIs

### ❌ En Presentation:
- Tests con lógica de negocio
- Referencias directas a repositories
- Tests frágiles dependientes de CSS
- Tests que no usan facades

### ❌ En Core:
- Dependencias de Angular/frameworks específicos
- Tests específicos de un solo dominio
- Referencias a UI o presentación

## 🎯 Ejemplos de Prompts Específicos

### Para un Entity complejo:
```
Genera tests completos para src/app/domain/entities/role.entity.ts siguiendo Domain Layer del prompt MAD-AI.

El entity tiene estos métodos de negocio:
- assignToUser(user: User): Result<void>
- revokeFromUser(user: User): Result<void>  
- canManageRole(otherRole: Role): boolean
- calculatePermissions(): Permission[]

Debe testear:
1. Reglas de asignación de roles
2. Jerarquía entre roles  
3. Cálculo de permisos
4. Emisión de domain events
5. Casos límite y validaciones

[Tu código aquí]
```

### Para un Use Case con lógica compleja:
```
Genera tests para src/app/application/use-cases/assign-role-to-user.usecase.ts siguiendo Application Layer del prompt MAD-AI.

El use case coordina:
- UserRepository.findById()
- RoleRepository.findById() 
- User.assignRole() [domain method]
- UserRepository.save()
- DomainEventBus.publish()

Testear:
1. Happy path completo
2. User no encontrado
3. Role no encontrado  
4. Reglas de negocio que fallan
5. Errores de repository
6. Verificar secuencia de operaciones

[Tu código aquí]
```

## 💡 Tips para mejores tests

1. **Usa datos determinísticos**: Siempre los mismos valores para tests predecibles
2. **Un concepto por test**: Cada test debe validar una sola cosa
3. **Nombres descriptivos**: `should reject invalid email format` mejor que `should fail with bad input`
4. **Arrange-Act-Assert**: Estructura clara Given-When-Then
5. **Tests independientes**: Cada test debe poder ejecutarse solo

## 🔧 Comandos útiles

```bash
# Ejecutar tests por capa
npm test -- --testPathPattern=domain
npm test -- --testPathPattern=application  
npm test -- --testPathPattern=infrastructure
npm test -- --testPathPattern=presentation

# Coverage por carpeta
npm run test:coverage -- --testPathPattern=domain

# Test específico
npm test user.entity.spec.ts
```

¡Usa este prompt como tu compañero de testing y mantén la arquitectura limpia en cada test!