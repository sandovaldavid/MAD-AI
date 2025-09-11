# 🗺️ Diagramas de Arquitectura del Proyecto MAD-AI

**Última actualización:** 10 de septiembre de 2025

Este documento proporciona una representación visual de la arquitectura de 5 capas del proyecto, siguiendo los principios de Clean Architecture y Domain-Driven Design.

## 1. Diagrama de Arquitectura de Alto Nivel

Este diagrama muestra la estructura general de las 5 capas y la **regla de dependencia**: las flechas apuntan desde la capa que depende hacia su dependencia. Las capas externas dependen de las internas, pero nunca al revés.

```mermaid
graph TD
    subgraph " "
        direction TB
        P[<b style='font-size:1.1em'>🎨 Presentation</b><br>Angular Components, Layouts, UI Services<br><i>Responsable de la UI/UX</i>]
        A[<b style='font-size:1.1em'>🚀 Application</b><br>Use Cases & Facades<br><i>Orquesta los casos de uso</i>]
        D[<b style='font-size:1.1em'>🧠 Domain</b><br>Entities, VOs, Repositories, Errors<br><i>Contiene la lógica de negocio pura</i>]
        I[<b style='font-size:1.1em'>🔌 Infrastructure</b><br>API Clients, LocalStorage<br><i>Implementa la tecnología externa</i>]
        C[<b style='font-size:1.1em'>🛠️ Core</b><br>Logger, DateTime Service<br><i>Utilidades agnósticas y transversales</i>]
    end

    %% --- Flujo de Dependencias Principal ---
    P --> A
    A --> D
    I -- implementa --> D
    A --> C
    I --> C

    %% --- Estilos de las Capas ---
    classDef presentation fill:#e1f5fe,stroke:#333
    classDef application fill:#f3e5f5,stroke:#333
    classDef domain fill:#e8f5e8,stroke:#333
    classDef core fill:#fff3e0,stroke:#333
    classDef infrastructure fill:#fce4ec,stroke:#333

    class P presentation
    class A application
    class D domain
    class C core
    class I infrastructure
```

## 2. Diagrama Detallado de Componentes y Dependencias

Este diagrama desglosa cada capa en sus carpetas y componentes principales, mostrando las interacciones clave y las reglas de dependencia de forma más granular. Las líneas continuas (`-->`) representan una dependencia directa, mientras que las punteadas (`-.->`) indican la implementación de una interfaz.

```mermaid
graph LR
    subgraph "🎨 Presentation"
        direction TB
        P_Pages["Pages / Components"]
        P_Layouts["Layouts / Shell"]
        P_Shared["Shared UI\n(Botones, Inputs)"]
        P_Services["UI Services\n(Theme, Layout)"]
    end

    subgraph "🚀 Application"
        direction TB
        A_Facades["Facades\n(Punto de entrada para la UI)"]
        A_UseCases["Use Cases\n(Orquestadores de lógica)"]
        A_Errors["Application Errors"]
        A_Facades --> A_UseCases
    end

    subgraph "🧠 Domain"
        direction TB
        D_Entities["Entities"]
        D_VOs["Value Objects"]
        D_Repos["Repository Interfaces"]
        D_Errors["Domain Errors"]
        D_Enums["Enums"]
        D_Entities --> D_VOs
    end

    subgraph "🔌 Infrastructure"
        direction TB
        I_Repos["Repository Impls"]
        I_Mappers["Mappers\n(DTO ↔ Entity)"]
        I_Http["HTTP Clients / DTOs"]
        I_Services["Tech Services\n(LocalStorage, Clock)"]
        I_Repos --> I_Mappers
        I_Repos --> I_Http
    end

    subgraph "🛠️ Core"
        direction TB
        C_Services["Core Services\n(Logger)"]
        C_Interfaces["Core Interfaces\n(ILogger)"]
        C_Services -.->|implementa| C_Interfaces
    end

    %% --- DEPENDENCIAS PERMITIDAS ENTRE CAPAS ---
    P_Pages --> A_Facades
    A_UseCases --> D_Repos
    A_UseCases --> D_Entities
    A_UseCases --> C_Interfaces

    I_Repos -.->|implementa| D_Repos
    I_Services --> C_Interfaces

    %% --- ESTILOS ---
    classDef presentation fill:#e1f5fe,stroke:#333
    classDef application fill:#f3e5f5,stroke:#333
    classDef domain fill:#e8f5e8,stroke:#333
    classDef core fill:#fff3e0,stroke:#333
    classDef infrastructure fill:#fce4ec,stroke:#333

    class P_Pages,P_Layouts,P_Shared,P_Services presentation
    class A_Facades,A_UseCases,A_Errors application
    class D_Entities,D_VOs,D_Repos,D_Errors,D_Enums domain
    class C_Services,C_Interfaces core
    class I_Repos,I_Mappers,I_Http,I_Services infrastructure

```

### Reglas Clave Visualizadas:

- **Aislamiento del Dominio:** La capa `Domain` no tiene flechas que salgan de ella, confirmando que no depende de ninguna otra capa.
- **Punto de Entrada Único:** `Presentation` solo se comunica con la capa `Application` a través de los `Facades`.
- **Inversión de Dependencia:** `Infrastructure` implementa (`-.->`) las interfaces definidas en `Domain`, pero `Domain` no sabe nada de `Infrastructure`.
- **Utilidades Compartidas:** Tanto `Application` como `Infrastructure` pueden depender de las interfaces de `Core` para servicios transversales como el logging.
