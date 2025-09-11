---
description: 'Master coordination file for MAD-AI Clean Architecture development patterns and workflow guidance'
applyTo: '**'
---

# MAD-AI Master Copilot Instructions

## Architecture Overview

You WILL follow MAD-AI's Clean Architecture implementation with these 5 layers:

- **🎨 Presentation**: Angular UI components, layouts, and user interaction
- **🚀 Application**: Use case orchestration and state management through Facades
- **🧠 Domain**: Pure business logic, entities, value objects, and repository contracts
- **🔌 Infrastructure**: Concrete implementations using Angular HttpClient, localStorage, and external APIs
- **🛠️ Core**: Framework-agnostic utilities and services (Logger, DateTime, etc.)

## Layer-Specific Instructions

You MUST refer to these specific instruction files based on the code you're working with:

- **Domain Layer**: Follow [domain.instructions.md](instructions/domain.instructions.md) for entities, value objects, and business logic
- **Core Layer**: Follow [core.instructions.md](instructions/core.instructions.md) for framework-agnostic utilities
- **Infrastructure Layer**: Follow [infrastructure.instructions.md](instructions/infrastructure.instructions.md) for concrete technology implementations
- **Application Layer**: Follow [application.instructions.md](instructions/application.instructions.md) for use cases and facades
- **Presentation Layer**: Follow [presentation.instructions.md](instructions/presentation.instructions.md) for Angular components and UI
- **Testing Strategy**: Follow [test.instructions.md](instructions/test.instructions.md) for comprehensive testing across all layers
- **Styling Guidelines**: Follow [style-guide.instructions.md](instructions/style-guide.instructions.md) for Tailwind CSS v4.1 and design system

## Development Workflow for New Features

You WILL follow this mandatory workflow when implementing any new feature:

### Step 1: Domain Contract Definition

- Define or verify business entities and their methods exist in `/domain/entities`
- Create value objects for data validation in `/domain/value-objects`
- Define repository interfaces in `/domain/repositories` if data persistence is needed
- NEVER implement business logic outside of Domain entities

### Step 2: Infrastructure Implementation (If Needed)

- Implement repository interfaces in `/infrastructure/repositories` using concrete technologies
- Create DTOs in `/infrastructure/dtos` matching external API contracts
- Add API clients in `/infrastructure/http/clients` for external service communication
- Create mappers in `/infrastructure/mappers` to convert between DTOs and Domain entities

### Step 3: Application Orchestration

- Create use cases in `/application/use-cases` that orchestrate Domain entities and Infrastructure repositories
- Update facades in `/application/facades` to expose use cases and manage application state
- NEVER implement business rules in Application layer - only orchestration logic

### Step 4: Presentation Implementation

- Create or update Smart Components (pages) that inject Facades and manage UI state
- Create or update Dumb Components (UI elements) that use only @Input/@Output for communication
- Follow the Smart/Dumb component pattern religiously
- NEVER inject Domain or Infrastructure services directly in Presentation components

### Step 5: Testing Implementation

- Unit tests for Domain entities and value objects (100% coverage required)
- Orchestration tests for Application use cases and facades (95% coverage required)
- Component tests for Presentation layer (85% coverage required)
- Integration tests for Infrastructure implementations (80% coverage required)

## Architectural Rules Enforcement

You MUST enforce these dependency rules:

- **Domain**: ZERO dependencies on other layers - completely pure business logic
- **Core**: Framework-agnostic utilities with no dependencies on other application layers
- **Application**: Depends only on Domain and Core - orchestrates through interfaces
- **Infrastructure**: Implements Domain contracts and may use Core utilities
- **Presentation**: Depends only on Application (through Facades) - no Domain or Infrastructure imports

## Quality Standards

You WILL ensure:

- All business logic is contained within Domain entities and value objects
- All use cases are pure orchestration without business rules
- All components follow Smart/Dumb pattern with clear separation of concerns
- All external dependencies are abstracted through Domain interfaces
- All code follows the principle of single responsibility
- All error handling uses Domain-specific errors for business failures

**CRITICAL**: If you're uncertain about any architectural decision, refer to the specific layer instruction files for detailed guidance. These instructions must be followed consistently across all development work.
