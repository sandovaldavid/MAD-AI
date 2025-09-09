---
description: ' Guía completa para testear Value Objects en la Domain Layer, asegurando integridad y consistencia de datos.'
applyTo: '**/value-objects/**.spec.ts'
---

# 📘 Guía de Testing para Value Objects en Domain Layer

## 🎯 Filosofía de Testing para Value Objects

### Principio Fundamental

Los Value Objects son **guardianes de la integridad de datos** en tu dominio. Sus tests no verifican comportamiento complejo, sino que **garantizan que solo datos válidos y bien formateados entren al sistema**. Cada test es una especificación de qué constituye un valor válido en el contexto del negocio.

### Mentalidad Correcta

Piensa en los tests de Value Objects como **contratos inmutables** que definen:

- Qué formatos son aceptables
- Qué rangos son válidos
- Qué transformaciones se aplican
- Qué invariantes se mantienen

---

## 📋 Estructura de Testing por Categorías

### 1. **Tests de Construcción y Validación**

#### Qué testear

Verifica que el Value Object **solo pueda crearse con valores válidos** según las reglas del dominio. Cada regla de validación debe tener al menos un test que la verifique.

#### Cómo organizarlo

Agrupa los tests en dos categorías principales:

- **Casos válidos**: Todos los formatos y valores que SÍ deben aceptarse
- **Casos inválidos**: Todos los formatos y valores que NO deben aceptarse

#### Estrategia de implementación

- Empieza con el **"camino feliz"** - el caso más común y correcto
- Luego añade **variaciones válidas** que podrían ser menos obvias
- Después testea cada **regla de rechazo** individualmente
- Finalmente cubre los **casos límite** en los bordes del rango válido

#### Qué evitar

- No testees la implementación interna de la validación
- No hagas tests redundantes que prueben lo mismo
- No uses datos aleatorios - usa casos específicos y determinísticos

---

### 2. **Tests de Inmutabilidad**

#### Qué testear

Verifica que el Value Object **nunca pueda ser modificado** después de su creación. Esto es fundamental para mantener la consistencia en el dominio.

#### Cómo organizarlo

- Tests que verifiquen que no hay setters públicos
- Tests que confirmen que las operaciones retornan nuevas instancias
- Tests que validen que el estado interno no es accesible

#### Estrategia de implementación

- Intenta modificar el valor y verifica que no cambie
- Si hay operaciones, verifica que el original permanece intacto
- Confirma que getters no exponen referencias mutables

#### Qué evitar

- No dependas de verificar freeze/seal de JavaScript específicamente
- No asumas inmutabilidad - debes probarla explícitamente

---

### 3. **Tests de Igualdad por Valor**

#### Qué testear

Los Value Objects deben ser **iguales cuando sus valores son iguales**, independientemente de ser instancias diferentes. Esto es lo que los diferencia de las Entities.

#### Cómo organizarlo

- Tests de igualdad con valores idénticos
- Tests de desigualdad con valores diferentes
- Tests de casos especiales según el tipo de valor

#### Estrategia de implementación

- Crea dos instancias con el mismo valor y verifica que son iguales
- Crea instancias con valores ligeramente diferentes y verifica que no son iguales
- Testea igualdad después de transformaciones si aplica
- Verifica manejo de mayúsculas/minúsculas si es relevante

#### Qué evitar

- No uses comparación por referencia (===) sin también probar equals()
- No olvides casos como espacios en blanco o capitalización

---

### 4. **Tests de Operaciones de Dominio**

#### Qué testear

Si el Value Object tiene **operaciones matemáticas o lógicas**, cada una debe testearse exhaustivamente manteniendo las invariantes del dominio.

#### Cómo organizarlo

Por cada operación:

- Tests del comportamiento esperado normal
- Tests de casos límite de la operación
- Tests de prevención de estados inválidos
- Tests de mantenimiento de invariantes

#### Estrategia de implementación

- Testea la operación con valores típicos primero
- Luego con valores en los extremos del rango
- Verifica que las operaciones no violen reglas del dominio
- Confirma que el resultado es también un Value Object válido

#### Qué evitar

- No testees operaciones que no existen
- No añadas operaciones solo porque "podrían ser útiles"
- No permitas operaciones que rompan invariantes

---

### 5. **Tests de Transformación y Formato**

#### Qué testear

Verifica las **transformaciones automáticas** que aplica el Value Object (normalización, formateo, sanitización).

#### Cómo organizarlo

- Tests de normalización en la creación
- Tests de formateo para display
- Tests de serialización si aplica
- Tests de parsing desde diferentes formatos

#### Estrategia de implementación

- Verifica que los valores se normalizan consistentemente
- Testea que el formato de salida es el esperado
- Confirma que transformaciones son idempotentes
- Valida que no se pierde información en transformaciones

#### Qué evitar

- No mezcles lógica de presentación con lógica de dominio
- No hagas transformaciones que cambien el significado del valor

---

## 🎨 Patrones de Organización

### Estructura de Describes Anidados

```
[NombreValueObject] Value Object
├── Creación y Validación
│   ├── Con valores válidos
│   │   ├── Valores típicos
│   │   ├── Valores mínimos permitidos
│   │   └── Valores máximos permitidos
│   └── Con valores inválidos
│       ├── Valores nulos o indefinidos
│       ├── Valores fuera de rango
│       ├── Formatos incorrectos
│       └── Valores que violan reglas de negocio
├── Inmutabilidad
│   ├── Estado interno protegido
│   └── Operaciones retornan nuevas instancias
├── Igualdad
│   ├── Por valor, no por referencia
│   └── Casos especiales del dominio
├── Operaciones (si aplica)
│   ├── Operación específica 1
│   └── Operación específica 2
└── Transformaciones
    ├── Normalización
    └── Formateo
```

---

## 📊 Estrategia de Cobertura

### Priorización de Tests

**Prioridad 1 - CRÍTICO (100% coverage)**

- Validación de creación con valores inválidos
- Reglas de negocio fundamentales
- Invariantes que nunca deben romperse

**Prioridad 2 - IMPORTANTE (95% coverage)**

- Casos válidos comunes
- Operaciones básicas del dominio
- Igualdad y comparación

**Prioridad 3 - DESEABLE (90% coverage)**

- Edge cases poco frecuentes
- Optimizaciones de formato
- Mensajes de error específicos

### Técnica de Boundary Testing

Para cada rango o límite en tu Value Object:

1. **Testea el valor justo dentro del límite** (válido)
2. **Testea el valor exactamente en el límite** (según regla)
3. **Testea el valor justo fuera del límite** (inválido)

Ejemplo conceptual para un porcentaje:

- -0.01 → debe rechazar
- 0 → debe aceptar
- 50 → debe aceptar
- 100 → debe aceptar
- 100.01 → debe rechazar

---

## 🚀 Proceso de Implementación

### Paso 1: Identificar las Reglas

Antes de escribir tests, **documenta todas las reglas** que debe cumplir el Value Object:

- Formato esperado
- Rango de valores
- Transformaciones automáticas
- Invariantes del dominio

### Paso 2: Escribir Tests de Rechazo

Empieza por los tests que **deben fallar**. Esto te asegura que las validaciones funcionan.

### Paso 3: Escribir Tests de Aceptación

Luego escribe tests para valores que **deben aceptarse**, cubriendo variaciones válidas.

### Paso 4: Agregar Tests de Invariantes

Verifica que las propiedades fundamentales **se mantienen siempre**.

### Paso 5: Cubrir Operaciones

Si existen operaciones, testea que **preservan la validez** del Value Object.

---

## ⚠️ Señales de Alerta

### Tests Insuficientes

- Solo testeas el "camino feliz"
- No hay tests para valores límite
- Faltan tests de inmutabilidad
- No verificas transformaciones

### Tests Excesivos

- Testeas detalles de implementación
- Tests duplicados con diferentes nombres
- Testeas getters triviales sin lógica
- Tests de framework o lenguaje

### Tests Mal Diseñados

- Usan datos aleatorios no determinísticos
- Dependen del orden de ejecución
- No tienen nombres descriptivos
- Mezclan múltiples concerns en un test

---

## ✅ Checklist de Validación

Antes de considerar completos los tests de un Value Object:

- [ ] ¿Todos los valores inválidos son rechazados?
- [ ] ¿Todos los valores válidos son aceptados?
- [ ] ¿La inmutabilidad está garantizada?
- [ ] ¿La igualdad por valor funciona correctamente?
- [ ] ¿Las operaciones mantienen invariantes?
- [ ] ¿Las transformaciones son consistentes?
- [ ] ¿Los casos límite están cubiertos?
- [ ] ¿Los tests son determinísticos?
- [ ] ¿Los nombres de tests documentan las reglas?
- [ ] ¿El coverage es >= 95%?

---

## 🎯 Resultado Esperado

Tests de Value Objects bien implementados deben:

1. **Ejecutar en microsegundos** - Son puros y sin dependencias
2. **Documentar las reglas** - El nombre del test explica la regla
3. **Prevenir regresiones** - Cambios que rompen reglas fallan inmediatamente
4. **Ser determinísticos** - Siempre el mismo resultado
5. **Cubrir todos los casos** - No dejar "agujeros" en la validación

Los Value Objects son la **primera línea de defensa** de tu dominio. Sus tests son tu garantía de que solo datos válidos y bien formateados pueden existir en tu sistema.
