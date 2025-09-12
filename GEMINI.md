# Project: MAD-AI

## Project Overview

This is a modern Angular application built with Clean Architecture and Domain-Driven Design principles. The project demonstrates enterprise-grade software development practices with a strict 5-layer architecture, comprehensive testing strategies, and maintainable code patterns.

**Key Technologies:**

- **Frontend Framework:** Angular 20.1.6 with Server-Side Rendering (SSR)
- **Programming Language:** TypeScript 5.8.2
- **Styling:** Tailwind CSS 4.1.11 with a custom design system
- **State Management:** RxJS 7.8.0 with reactive patterns (Facades)
- **Testing:** Karma, Jasmine, and Cypress
- **Build System:** Angular CLI
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

**Architecture:**

The project follows a strict 5-layer Clean Architecture:

1.  **Presentation Layer:** Angular Components, UI Services
2.  **Application Layer:** Use Cases, Facades, State Management
3.  **Domain Layer:** Entities, Value Objects, Business Rules
4.  **Infrastructure Layer:** API Clients, Repositories, External Services
5.  **Core Layer:** Framework-agnostic Utilities (Logger, DateTime)

The dependency rule is strict: inner layers cannot depend on outer layers. The `docs/info` directory contains detailed guides for each layer and is the primary source of truth for architecture and development.

## Project Guidelines and Reference

This section provides a summary of the project's architecture and conventions, based on the detailed guides in the `docs/info/` directory. Use this as a quick reference to understand where to find information and how to approach different tasks.

### Layer Responsibilities

- **`🧠 Domain`**: Contains the pure business logic (Entities, Value Objects). It is the core of the application and has no external dependencies.
  - **Guide:** `docs/info/guide-domain.md`
- **`🚀 Application`**: Orchestrates the business logic to execute application-specific use cases. It acts as a bridge between the UI and the Domain.
  - **Guide:** `docs/info/guide-application.md`
- **`🔌 Infrastructure`**: Implements the technical details for external concerns like API communication, database access, and local storage. It implements the interfaces defined in the Domain layer.
  - **Guide:** `docs/info/guide-infrastructure.md`
- **`🎨 Presentation`**: Responsible for the UI and user interaction. It is kept "dumb" and delegates all business logic to the Application layer.
  - **Guide:** `docs/info/guide-presentation.md`
- **`🛠️ Core`**: Contains framework-agnostic, reusable utilities that can be used by any other layer (e.g., a logger).
  - **Guide:** `docs/info/guide-core.md`

### Quick Reference: Where to find what

| If you need to...                                   | Then you should consult...                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| Understand the overall architecture and data flow   | `docs/info/diagramas-layers.md` and `docs/info/guide-implementation.md` |
| Add or modify a business rule                       | `docs/info/guide-domain.md`                                             |
| Create a new use case or orchestrate business logic | `docs/info/guide-application.md`                                        |
| Implement a new API endpoint or connect to a DB     | `docs/info/guide-infrastructure.md`                                     |
| Create a new UI component or page                   | `docs/info/guide-presentation.md`                                       |
| Apply styling and follow the design system          | `docs/info/guide-styles.md`                                             |
| Write or fix a test for any layer                   | `docs/info/guide-test-implementation.md`                                |
| Follow the step-by-step process for a new feature   | `docs/info/guide-implementation.md`                                     |

### **Important Note on Testing Framework**

There is a discrepancy in the project's documentation regarding the testing framework.

- The `docs/info/guide-test-implementation.md` file repeatedly mentions **Jest**.
- However, the project's configuration (`package.json`, `angular.json`, `tsconfig.spec.json`) and the behavior of the test runner (`npm test`) confirm that the project uses **Karma and Jasmine** for unit and integration tests.

**Conclusion for me (Gemini):** I must **always** write tests using **Jasmine** syntax, as the project is configured for it. I should ignore the references to Jest in the documentation to avoid test failures.

## Building and Running

The `package.json` file contains all the necessary scripts for building, running, and testing the application.

**Key Commands:**

- `npm install`: Install dependencies.
- `npm start`: Start the development server.
- `npm run build`: Build the application for production.
- `npm test`: Run unit and integration tests with Karma and Jasmine.
- `npm run test:ci`: Run tests in CI mode.
- `npm run lint`: Run ESLint for code quality.
- `npm run format`: Format code with Prettier.
- `npm run quality`: Run all quality checks (lint, format, test).
- `npm run serve:ssr`: Serve the SSR-enabled application.
- `npm run docker:test`: Run all tests in Docker.

## Development Conventions

- **Conventional Commits:** Commit messages must follow the conventional commit format.
- **Linting and Formatting:** The project uses ESLint and Prettier to enforce a consistent code style. Run `npm run quality:fix` to automatically fix linting and formatting issues.
- **Testing:** The project has a comprehensive testing strategy with different types of tests for each layer. The testing strategy is based on the Testing Pyramid.
  - **E2E Tests:** Cypress
  - **Component and Integration Tests:** Karma and Jasmine with `TestBed`.
  - **Unit Tests:** Karma and Jasmine.
- **Development Workflow:** A mandatory 6-step workflow for feature development is defined in `docs/info/guide-implementation.md`.
- **Dependency Injection:** The project uses Angular's dependency injection system extensively. Providers are defined in the `src/app/di` directory.
- **State Management:** The project uses a reactive approach to state management using RxJS and Facades in the Application Layer.
- **Styling:** The project uses Tailwind CSS with a custom design system. Key conventions from `docs/info/guide-styles.md` include:
  - Using custom colors defined in `/styles/colors.css`.
  - Grouping styles with `@apply` in component-specific CSS files.
  - Supporting dark mode using the `.dark` class and `dark:` variants.
- **CI/CD:** A CI pipeline is defined in `.github/workflows/ci.yml` that runs linting and tests on every push and pull request.

## Angular Interaction

To ensure all interactions with the Angular codebase are up-to-date with the project's version (Angular 20.1.6), you must use the Angular MCP tools. These tools provide access to the latest documentation and best practices.

- **`get_best_practices()`**: Always use this tool before creating, analyzing, or modifying any Angular code. It provides the official Angular Best Practices Guide, which is mandatory to follow.
- **`search_documentation(query: str)`**: Use this tool to get information about APIs, tutorials, and concepts for the specific Angular version used in this project. This is the preferred method over relying on pre-existing knowledge.
- **`list_projects()`**: Use this tool to understand the structure of the Angular workspace by listing all applications and libraries.
