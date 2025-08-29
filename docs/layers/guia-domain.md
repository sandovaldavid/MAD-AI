# Guía Arquitectónica para Domain Layer

## QUÉ ES Domain

Domain contiene la **lógica de negocio pura** de tu aplicación. Representa conceptos que existen independientemente de la tecnología.

## REGLA DE ORO

**Pregunta decisiva:** "Si esta lógica fuera explicada a un experto del negocio (sin conocimiento técnico), ¿la entendería y validaría como correcta?"

- Si SÍ → Puede ir en Domain
- Si NO → Va en otra capa

## ESTRUCTURA OBLIGATORIA

### `/entities` - Objetos con identidad

**QUÉ VA:**

- Agregados principales del negocio (User, Role, Project)
- Lógica que modifica el estado de la entidad
- Métodos que expresan comportamientos del negocio

**QUÉ NO VA:**

- Entidades que solo son DTOs sin comportamiento
- Entidades con lógica de presentación
- Entidades que dependen de frameworks

**Ejemplo correcto:** `User.changeRole()`, `User.canLeadProjects()`
**Ejemplo incorrecto:** `User.formatDisplayName()`, `User.toJSON()`

### `/value-objects` - Objetos inmutables sin identidad

**QUÉ VA:**

- Conceptos del dominio que se validan (Email, Username)
- Objetos que encapsulan validaciones técnicas básicas
- Tipos que el negocio trata como unidades

**QUÉ NO VA:**

- Value Objects que solo formatean
- Objetos que dependen de configuración externa
- Wrappers innecesarios de tipos primitivos

**Ejemplo correcto:** `Email.create()`, `Money.add()`
**Ejemplo incorrecto:** `FormattedDate.toDisplay()`, `ColorTheme.getCssClass()`

### `/repositories` - Contratos de persistencia

**QUÉ VA:**

- Interfaces que expresan necesidades del dominio
- Métodos que reflejan operaciones de negocio
- Contratos independientes de la tecnología de storage

**QUÉ NO VA:**

- Implementaciones concretas
- Métodos específicos de SQL o NoSQL
- Contratos que filtran por criterios de UI

**Ejemplo correcto:** `findActiveUsersByRole()`, `getUsersWithExpiredSessions()`
**Ejemplo incorrecto:** `findUsersForDropdown()`, `getUsersByPaginationAndSort()`

### `/services` - Lógica que no pertenece a una entidad

**QUÉ VA MÁXIMO 3-5 SERVICIOS:**

- Lógica que coordina múltiples entidades
- Algoritmos complejos del dominio
- Reglas que no pueden vivir en una entidad específica

**QUÉ NO VA:**

- Servicios de formateo o transformación
- Servicios con más de una responsabilidad
- Servicios que llaman a APIs externas

**Ejemplo correcto:** `UserRoleAssignmentService.canAssignRole(user, role)`
**Ejemplo incorrecto:** `UserFormattingService.formatName()`, `EmailSenderService.send()`

### `/specifications` - Reglas de negocio complejas

**QUÉ VA:**

- Reglas que determinan si algo cumple criterios del negocio
- Lógica condicional compleja y reutilizable
- Especificaciones que pueden combinarse

**QUÉ NO VA:**

- Validaciones técnicas simples
- Lógica específica de una sola entidad
- Reglas de presentación

**Ejemplo correcto:** `CanApproveAbsenceSpec`, `IsEligibleForPromotionSpec`
**Ejemplo incorrecto:** `ValidEmailFormatSpec`, `ButtonShouldBeDisabledSpec`

### `/events` - Hechos que ocurrieron en el negocio

**QUÉ VA:**

- Eventos que representan cambios importantes
- Eventos que otros bounded contexts necesitan conocer
- Eventos que disparan procesos de negocio

**QUÉ NO VA:**

- Eventos técnicos (clicks, navegación)
- Eventos de logging
- Eventos específicos de UI

### `/errors` - Errores del dominio

**QUÉ VA:**

- ValidationError (formato, requeridos)
- BusinessRuleError (reglas de negocio violadas)
- Errores que el experto de negocio reconocería

**QUÉ NO VA:**

- Errores HTTP o de red
- Errores de frameworks
- Errores de presentación

## PROHIBICIONES ABSOLUTAS EN DOMAIN

- Importar librerías externas (excepto tipos básicos)
- Conocer Angular/React/Vue
- Hacer llamadas HTTP
- Acceder a localStorage/sessionStorage
- Formatear para mostrar en UI
- Loggear (puede generar eventos para que otros loggeen)
