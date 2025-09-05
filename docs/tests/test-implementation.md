# 📋 Guía de Testing por Capas - MAD-AI Project

## 🎯 Filosofía General de Testing

### Principios Fundamentales

El testing en Clean Architecture + DDD debe seguir la **Pirámide de Testing**, donde la base (tests unitarios) es más amplia que la cima (tests E2E). Cada capa tiene responsabilidades específicas y por tanto, estrategias de testing diferentes.

### Regla de Oro

**"Testea el comportamiento, no la implementación"** - Los tests deben verificar QUÉ hace el código, no CÓMO lo hace. Esto permite refactorizar sin romper tests.

---

## 🧠 Domain Layer Testing

### ¿Qué testear?

El Domain Layer contiene la **lógica de negocio pura**, por lo tanto debes testear:

- **Reglas de negocio** en las entidades
- **Invariantes** que deben mantenerse siempre
- **Validaciones** de creación y modificación
- **Cálculos** y transformaciones de datos
- **Estado** y transiciones válidas
- **Eventos de dominio** que se generan

### Estrategia de Testing

**Tests UNITARIOS puros** - Sin dependencias externas, sin mocks, sin frameworks. Son los tests más importantes porque protegen tu lógica de negocio.

### Cómo implementar

1. **Para Entidades**: Crea instancias directamente y verifica que las reglas de negocio se cumplan. Testea los casos límite, valores inválidos y transiciones de estado.

2. **Para Value Objects**: Verifica la inmutabilidad, la validación en creación y la igualdad por valor (no por referencia).

3. **Para Domain Services**: Testea la lógica que coordina múltiples entidades. Usa entidades reales, no mocks.

4. **Para Specifications**: Verifica que los criterios de aceptación funcionan correctamente con diferentes inputs.

### Qué EVITAR

- ❌ **NO uses mocks** en Domain - Si necesitas mocks, probablemente estás testeando en la capa incorrecta
- ❌ **NO dependas de infraestructura** - Nada de bases de datos, APIs, archivos
- ❌ **NO testees getters/setters simples** - Solo si contienen lógica
- ❌ **NO uses datos aleatorios** - Usa datos determinísticos y predecibles
- ❌ **NO ignores casos extremos** - Los edge cases revelan bugs en la lógica de negocio

### Señales de buenos tests de dominio

- ✅ Corren instantáneamente (< 1ms por test)
- ✅ No requieren setup complejo
- ✅ Los nombres describen reglas de negocio
- ✅ Fallan cuando cambias una regla de negocio
- ✅ No fallan cuando cambias la implementación técnica

---

## 🎮 Application Layer Testing

### ¿Qué testear?

El Application Layer **orquesta** el flujo de casos de uso, por lo tanto debes testear:

- **Flujo completo** del caso de uso
- **Coordinación** entre domain y infrastructure
- **Manejo de errores** y casos excepcionales
- **Transformación de datos** (mappers)
- **Validación de comandos** y queries
- **Emisión de eventos** después de operaciones

### Estrategia de Testing

**Tests UNITARIOS con MOCKS** - Mockea las dependencias (repositories, services) para testear la orquestación aisladamente.

### Cómo implementar

1. **Para Use Cases**:
   - Mockea todos los repositories y servicios externos
   - Verifica que se llamen en el orden correcto
   - Testea tanto el happy path como los casos de error
   - Asegúrate que los eventos de dominio se emitan

2. **Para Commands/Queries**:
   - Verifica validaciones de entrada
   - Testea que los datos inválidos lancen excepciones
   - No necesitas mockear nada aquí

3. **Para Mappers**:
   - Testea transformaciones bidireccionales
   - Verifica que no se pierdan datos en la transformación
   - Testea valores null y undefined

4. **Para Handlers**:
   - Similar a use cases pero más específicos
   - Verifica que el Result pattern funcione correctamente

### Qué EVITAR

- ❌ **NO testees lógica de negocio aquí** - Eso va en Domain
- ❌ **NO hagas tests de integración reales** - Usa mocks
- ❌ **NO ignores el manejo de errores** - Es crítico en esta capa
- ❌ **NO couples los tests a la implementación** - Testea comportamiento
- ❌ **NO olvides testear los mappers** - Son fuente común de bugs

### Señales de buenos tests de application

- ✅ Usan mocks para todas las dependencias externas
- ✅ Verifican la secuencia de operaciones
- ✅ Testean todos los caminos posibles del flujo
- ✅ Son rápidos pero no tanto como Domain
- ✅ Verifican que se emitan los eventos correctos

---

## 🔧 Infrastructure Layer Testing

### ¿Qué testear?

Infrastructure implementa los **contratos técnicos**, por lo tanto debes testear:

- **Integración con APIs** externas (Django)
- **Transformación de DTOs** a entidades
- **Manejo de errores HTTP**
- **Persistencia y recuperación** de datos
- **Autenticación y autorización**
- **Interceptors y guards**

### Estrategia de Testing

**Tests de INTEGRACIÓN con MOCKS de HTTP** - Usa HttpClientTestingModule para simular respuestas del servidor.

### Cómo implementar

1. **Para Repositories**:
   - Mockea las respuestas HTTP pero mantén la lógica real
   - Testea transformación DTO ↔ Entity
   - Verifica manejo de errores 404, 500, etc.
   - Testea paginación y filtros

2. **Para API Services**:
   - Verifica que las URLs sean correctas
   - Testea que los headers se envíen (Auth, Content-Type)
   - Verifica estructura de request/response
   - Testea reintentos y timeouts

3. **Para Interceptors**:
   - Verifica que modifiquen requests correctamente
   - Testea manejo de tokens expirados
   - Verifica logging de errores

4. **Para Guards**:
   - Testea protección de rutas
   - Verifica redirecciones
   - Testea diferentes roles y permisos

### Qué EVITAR

- ❌ **NO hagas llamadas reales a APIs** - Usa HttpClientTestingModule
- ❌ **NO testees la lógica de Django** - Solo tu integración
- ❌ **NO ignores códigos de error HTTP** - Cada uno debe manejarse
- ❌ **NO hardcodees URLs** - Usa configuración
- ❌ **NO olvides testear edge cases** - Tokens expirados, sin conexión, etc.

### Señales de buenos tests de infrastructure

- ✅ Simulan todas las respuestas posibles del servidor
- ✅ Verifican transformación correcta de datos
- ✅ Testean todos los códigos de error HTTP
- ✅ Son determinísticos (no dependen de servicios externos)
- ✅ Verifican que se respeten los contratos de la API

---

## 🎨 Presentation Layer Testing

### ¿Qué testear?

Presentation maneja la **interacción con el usuario**, por lo tanto debes testear:

- **Renderizado condicional** basado en estado
- **Manejo de eventos** del usuario
- **Validación de formularios**
- **Navegación y routing**
- **Estados de loading y error**
- **Transformación de datos para mostrar**

### Estrategia de Testing

**Tests de COMPONENTES con TestBed** - Usa Angular Testing Utilities para testear componentes aislados.

### Cómo implementar

1. **Para Components**:
   - Testea que rendericen correctamente según el estado
   - Verifica que los eventos se emitan
   - Testea interacciones del usuario (clicks, inputs)
   - Verifica estados loading/error/empty
   - Testea que se llamen los use cases correctos

2. **Para Pipes**:
   - Testea transformaciones con diferentes inputs
   - Verifica manejo de nulls y undefined
   - Testea formatos de fecha, moneda, etc.

3. **Para Directives**:
   - Verifica que modifiquen el DOM correctamente
   - Testea diferentes configuraciones
   - Verifica cleanup en destroy

4. **Para Guards**:
   - Testea protección de rutas
   - Verifica redirecciones según permisos
   - Testea integración con auth service

5. **Para Services de UI**:
   - Testea estado compartido entre componentes
   - Verifica notificaciones y toasts
   - Testea theme switching

### Qué EVITAR

- ❌ **NO testees lógica de negocio** - Solo presentación
- ❌ **NO hagas tests frágiles** - No dependas de CSS específico
- ❌ **NO testees framework de Angular** - Solo tu código
- ❌ **NO ignores accesibilidad** - Testea ARIA labels
- ❌ **NO uses datos reales** - Crea fixtures específicos

### Señales de buenos tests de presentation

- ✅ Testean interacción del usuario, no implementación
- ✅ Verifican que la información se muestre correctamente
- ✅ Son resistentes a cambios de estilo
- ✅ Testean todos los estados posibles del componente
- ✅ Usan data-cy attributes para selectores

---

## 🚀 E2E Testing

### ¿Qué testear?

E2E tests verifican **flujos completos de usuario**, por lo tanto debes testear:

- **User journeys críticos** (login → crear recurso → asignar → logout)
- **Flujos de negocio importantes**
- **Integraciones entre módulos**
- **Comportamiento cross-browser**
- **Responsive design** en diferentes viewports

### Estrategia de Testing

**Tests E2E con Cypress** - Simula un usuario real interactuando con la aplicación completa.

### Cómo implementar

1. **Identifica flujos críticos**:
   - Login y authentication
   - CRUD operations principales
   - Flujos de aprobación
   - Reportes y exports

2. **Estructura los tests**:
   - Usa Page Object Pattern
   - Agrupa por features
   - Reutiliza comandos custom
   - Mantén tests independientes

3. **Maneja datos**:
   - Usa fixtures para datos de prueba
   - Limpia estado entre tests
   - Mockea servicios externos cuando sea necesario

4. **Verifica resultados**:
   - No solo que "funcione", sino que los datos sean correctos
   - Verifica en múltiples puntos del flujo
   - Testea que los cambios persistan

### Qué EVITAR

- ❌ **NO testees cada detalle** - E2E es para flujos críticos
- ❌ **NO hagas tests dependientes** - Cada test debe ser independiente
- ❌ **NO uses selectores frágiles** - Usa data-cy attributes
- ❌ **NO ignores el tiempo** - Usa comandos wait apropiadamente
- ❌ **NO testees terceros** - Solo tu aplicación

### Señales de buenos tests E2E

- ✅ Testean flujos completos de negocio
- ✅ Son independientes y pueden correr en cualquier orden
- ✅ Usan datos predecibles (fixtures)
- ✅ Son mantenibles y legibles
- ✅ Fallan por razones de negocio, no técnicas

---

## 📊 Métricas y Coverage

### Coverage Objetivo por Capa

| Capa               | Coverage Mínimo | Coverage Ideal   | Prioridad |
| ------------------ | --------------- | ---------------- | --------- |
| **Domain**         | 90%             | 100%             | CRÍTICA   |
| **Application**    | 80%             | 95%              | ALTA      |
| **Infrastructure** | 70%             | 85%              | MEDIA     |
| **Presentation**   | 60%             | 80%              | MEDIA     |
| **E2E**            | Flujos críticos | Todos los flujos | ALTA      |

### Qué medir además de coverage

- **Mutation Testing**: ¿Los tests detectan cambios en el código?
- **Test Execution Time**: ¿Son rápidos los tests?
- **Flakiness**: ¿Son determinísticos?
- **Maintainability**: ¿Es fácil actualizar los tests?

---

## 🔄 Proceso de Testing

### Durante el Desarrollo (TDD)

1. **Domain First**: Escribe tests de dominio antes del código
2. **Application Second**: Tests de use cases con mocks
3. **Infrastructure Third**: Tests de integración
4. **Presentation Last**: Tests de componentes
5. **E2E Final**: Solo para flujos completos

### En CI/CD Pipeline

1. **Pre-commit**: Unit tests de Domain
2. **Pre-push**: Todos los unit tests
3. **PR/MR**: Unit + Integration tests
4. **Pre-deploy**: Todos los tests incluido E2E
5. **Post-deploy**: Smoke tests en producción

---

## ⚠️ Anti-patterns Comunes

### Lo que NUNCA debes hacer

1. **Test Todo**: No testees getters/setters simples o código trivial
2. **Test Nada**: "No tengo tiempo" siempre resulta en más tiempo después
3. **Mock Todo**: Los mocks excesivos ocultan problemas de diseño
4. **No Mock Nada**: Tests lentos y frágiles
5. **Tests Acoplados**: Tests que dependen del orden de ejecución
6. **Tests No Determinísticos**: Que a veces pasan y a veces no
7. **Tests Sin Assert**: Tests que nunca fallan no sirven
8. **Ignorar Tests Rotos**: "Skip" es deuda técnica

---

## ✅ Checklist de Testing por Feature

Antes de considerar una feature completa:

- [ ] Domain tests cubren todas las reglas de negocio
- [ ] Application tests verifican el flujo completo
- [ ] Infrastructure tests verifican integración con API
- [ ] Component tests verifican renderizado y UX
- [ ] E2E test verifica el happy path
- [ ] Tests de error cases en todas las capas
- [ ] Coverage > mínimo establecido
- [ ] Tests corren en < 10 segundos (excepto E2E)
- [ ] Documentación actualizada
- [ ] No hay tests skippeados

---

## 🎯 Conclusión

El testing en Clean Architecture no es opcional, es **fundamental**. Cada capa tiene su estrategia específica que respeta sus responsabilidades. Los tests son tu red de seguridad para refactorizar con confianza y mantener la calidad del código.

**Recuerda**: Los tests no son para encontrar bugs (aunque lo hacen), son para **prevenir** que los bugs lleguen a producción y para **documentar** el comportamiento esperado del sistema.
