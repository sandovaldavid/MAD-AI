# MAD-AI Angular Project

> **A scalable, maintainable, and extensible Angular application built with Clean Architecture.**

---

## 🚀 Overview

MAD-AI is a comprehensive solution built with Angular 20 and Django Rest Framework, designed to deliver robust business
logic, advanced UI, and server-side rendering (SSR). It applies Clean Architecture principles to ensure modularity,
testability, and long-term maintainability.

The application covers the full lifecycle of IT project management: planning, task monitoring, and implementation,
featuring interactive dashboards and visualizations with Chart.js and ng2-charts. It also includes AI-powered modules
using neural networks for requirement time estimation and resource allocation optimization. Its layered, feature-based
structure makes it easy to extend the system and onboard new developers efficiently.

---

## 🛠️ Technology Stack

- **Angular** v20.1.6 (core, forms, router, SSR, CLI, build, compiler)
- **TypeScript** ES2022 (strict mode)
- **RxJS** v7.8.0
- **Zone.js** v0.15.0
- **FontAwesome** v2.0.1 (Angular wrapper), v6.7.2 (icons)
- **Tailwind CSS** v4.1.11
- **Chart.js** v4.5.0, **ng2-charts** v8.0.0
- **Express** v5.1.0 (SSR)
- **Angular CLI** v20.0.2
- **PostCSS** v8.5.6
- **Jasmine** ~5.7.0, **Karma** ~6.4.0

---

## 🏗️ Architecture

- **Pattern:** Clean Architecture (layered, dependency inversion, separation of concerns)
- **Layers:** Presentation → Application → Domain → Infrastructure
- **Principles:** Separation of concerns, testability, extensibility

```
Presentation Layer (src/app/presentation)
  ↓
Application Layer (src/app/application)
  ↓
Domain Layer (src/app/domain)
  ↓
Infrastructure Layer (src/app/infrastructure)
```

For more details, see [docs/clean-architecture.md](docs/clean-architecture.md).

---

## 📦 Project Structure

- **Layered separation:** domain, application, infrastructure, presentation, core, shared
- **Feature-based grouping:** Each feature (auth, user, resource-management, etc.) has its own subfolders
- **Cross-cutting concerns:** Centralized in `core` (services, guards, interceptors)
- **Reusable components:** Located in `shared`

See [docs/clean-architecture.md](docs/clean-architecture.md) and [docs/api/index.md](docs/api/index.md) for a full
directory visualization.

---

## ✨ Key Features

- Modular, scalable architecture
- SSR support via Express
- Advanced UI with Tailwind CSS and FontAwesome
- Feature-based business logic and use cases
- Comprehensive error handling and validation
- High-quality code exemplars for all layers
- Automated testing with Jasmine and Karma

---

## ⚡ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the application:**
   ```bash
   npm start
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **SSR setup:**
   See [docs/clean-architecture.md](docs/clean-architecture.md) for SSR details.

---

## 🧑‍💻 Development Workflow

- Feature development follows Clean Architecture:
  UI → Service → Use Case → Repository → API
- See [docs/project_workflow_documentation.md](docs/project_workflow_documentation.md) for workflow templates and
  sequence diagrams.
- Branching and contribution guidelines are documented in [docs/exemplars.md](docs/exemplars.md)
  and [docs/clean-architecture.md](docs/clean-architecture.md).

---

## 📝 Coding Standards

- Strict TypeScript typing and ES2022 features
- Consistent naming conventions (PascalCase for classes, kebab-case for components)
- Comprehensive documentation and code comments
- See [docs/exemplars.md](docs/exemplars.md) for code examples and conventions

---

## 🧪 Testing

- Unit tests for all layers using Jasmine and Karma
- Mocking and test isolation patterns
- See [docs/clean-architecture.md](docs/clean-architecture.md) and [docs/exemplars.md](docs/exemplars.md) for testing
  guidelines

---

> [!NOTE]
> For more details, see the documentation in the `docs/` directory. If you have questions or want to contribute, review
> the code exemplars and workflow documentation for guidance.
