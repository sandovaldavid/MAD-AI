# Guía Arquitectónica para Core Layer

## QUÉ ES Core

Core contiene **servicios técnicos transversales** que necesita toda la aplicación, pero son independientes del framework.

## REGLA DE ORO

**Pregunta decisiva:** "Si tuviera que distribuir mi lógica de negocio como librería NPM para web, mobile y desktop, ¿este servicio iría en la librería?"

- Si SÍ → Va en Core
- Si NO → Va en Infrastructure o Presentation

## CRITERIOS DE ADMISIÓN (TODOS OBLIGATORIOS)

1. Lo necesitan múltiples bounded contexts
2. Es independiente de Angular/React/frameworks
3. Es fundamental para el funcionamiento de toda la app
4. Sería útil en cualquier tipo de aplicación (web/mobile/desktop)

## ESTRUCTURA OBLIGATORIA

### `/services` - Máximo 4-6 servicios

**QUÉ VA:**

- `logger.service.ts` - Sistema de logging transversal
- `configuration.service.ts` - Configuraciones globales
- `date-time.service.ts` - Operaciones de fecha/tiempo de negocio
- `domain-event-bus.service.ts` - Comunicación entre bounded contexts

**QUÉ NO VA:**

- Servicios específicos de un dominio
- Servicios que dependan de Angular
- Servicios de presentación (theme, layout)
- Servicios que llamen APIs específicas

### `/interfaces` - Contratos para extensibilidad

**QUÉ VA:**

- Interfaces que permitan diferentes implementaciones
- Contratos que usen múltiples capas
- Definiciones que no cambien frecuentemente

**QUÉ NO VA:**

- Interfaces específicas de una sola implementación
- Contratos específicos de frameworks
- Interfaces que solo use una capa

### `/decorators` - Crosscutting concerns

**QUÉ VA:**

- Decoradores que agreguen funcionalidad transversal
- Aspectos que se apliquen a múltiples operaciones
- Lógica que no pertenezca a ninguna capa específica

**QUÉ NO VA:**

- Decoradores específicos de Angular
- Decoradores que solo use un módulo
- Lógica específica de presentación

## EJEMPLOS DE QUÉ SÍ VA EN CORE

```typescript
// logger.service.ts - Lo usan auth, resources, teams
logInfo(message: string, context?: any): void

// date-time.service.ts - Cálculos que usan múltiples dominios
calculateBusinessDaysBetween(start: Date, end: Date): number

// configuration.service.ts - Config que afecta toda la app
getDefaultTimeZone(): string
getBusinessDateFormat(): string
```

## EJEMPLOS DE QUÉ NO VA EN CORE

```typescript
// NO - Es específico de Angular
theme.service.ts con dependencia de Angular Material

// NO - Es específico de un dominio
user-notification.service.ts

// NO - Es presentación
layout.service.ts para manejar sidebar

// NO - Es infrastructure
http-client.service.ts para llamadas API
```

## SEÑALES DE ALARMA

Si encuentras esto en Core, está mal ubicado:

- Imports de Angular/React/Vue
- Referencias a componentes de UI
- Llamadas a APIs específicas
- Lógica específica de un solo módulo
- Dependencias de routing o navegación

## REGLA FINAL

**Máximo 6-8 archivos en toda la carpeta Core.** Si tienes más, algo está mal categorizado.

Si Core crece mucho, probablemente estás poniendo lógica que pertenece a Domain, Infrastructure o Presentation.
