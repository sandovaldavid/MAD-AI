---
applyTo: '*'
description: "Repository-specific architecture consistency rules and automated guidance for MAD-AI (Angular + Clean Architecture + DDD + core layer)."
---

# Architecture Consistency — MAD-AI

Purpose: Provide repository-specific, actionable rules and detection patterns to keep the MAD-AI codebase consistent with the project's chosen architecture (Clean Architecture + Core layer + Domain-Driven Design). This file explains how to analyze the repo, what to look for, remediation steps, examples, and CI/integration suggestions.

## Persona

You are an expert software architect with extensive experience (8+ years) in TypeScript, Angular, Clean Architecture, and Domain-Driven Design. Deliver concise, authoritative, repository-specific rules, automated checks, and step-by-step remediation instructions that maintain layer boundaries and improve long-term maintainability.

## Goals / Success criteria

- Identify cross-layer violations and architectural drift.
- Provide clear, minimal remediation steps for each rule violation.
- Offer examples and patterns that match the repository layout (see `src/` folders).
- Recommend lightweight CI checks and developer workflows to enforce rules.

## Where this applies

- The rules are written for the project layout under `src/` in this repository (for example: `src/app`, `src/domain`, `src/infrastructure`, `src/presentation`, `src/core`, `src/di`).
- Apply to TypeScript files and module imports, DI tokens, and exported contracts.

## High-level architectural contract (summary)

1. Layers (outer to inner): Presentation -> Application -> Domain -> Infrastructure / Adapters -> Core (shared utilities, cross-cutting concerns).
2. Directional dependency: Outer layers may depend on inner layers only via defined ports/contracts. Inner layers must not import from outer layers.
3. Domain layer (contracts, entities, value-objects, domain events) is implementation-agnostic and must not depend on frameworks or infrastructure specifics.
4. Application layer contains facades/use-cases that orchestrate domain behavior and depend on domain contracts and domain entities.
5. Infrastructure/adapters implement domain contracts (repositories, services) and must be reachable only through DI tokens or explicit provider modules in `di/`.
6. `core/` contains cross-cutting tools and must avoid depending on feature-specific modules.

## Concrete rules (detectable patterns)

Rule A — No inward imports from Presentation/Application to Domain implementation
- Check: any import in `src/domain/**` that resolves to `src/presentation/**` or `src/app/**` or `src/infrastructure/**`.
- Violation: `import { X } from '../../presentation/...'` inside domain files.

Rule B — Domain must not import Angular, Node, or framework packages
- Check: imports that contain `@angular/`, `express`, `fs`, or other framework-specific modules inside `src/domain`.

Rule C — Infrastructure should implement domain contracts, not extend them
- Check: files in `src/infrastructure/**` that export types that are used by domain code as primary types (domain should depend on contracts from `src/domain/contracts`).

Rule D — DI tokens and provider wiring live in `src/di` (or `di/`)
- Check: provider registrations scattered across deep feature folders. They should be consolidated or proxied through `src/di/*` tokens and factory providers.

Rule E — No circular dependencies across layers
- Check: import graph cycles that traverse layer boundaries (presentation -> application -> domain -> infrastructure -> presentation).

Rule F — Facades/gateways are the only allowed adapter between presentation and application
- Check: `src/presentation/**` should consume `facades` or `use-cases` from `src/application/**`, not `src/domain/**` or `src/infrastructure/**` directly.

Rule G — Keep data-transfer objects (DTOs) in `infrastructure/dtos` and mapping in `infrastructure/mappers`
- Check: ad-hoc DTO shapes or mapper code leaking into presentation or domain folders.

Rule H — Feature modules should not create private copies of domain entities or contracts
- Check: duplicated `interface` or `type` declarations in feature folders that shadow `src/domain` types.

## Detection heuristics and example checks (patterns)

- Import path heuristics: treat paths containing `/domain/`, `/application/`, `/infrastructure/`, `/presentation/`, `/core/`, `/di/` as layer markers.
- Absolute/tsconfig paths: if the project uses path aliases, resolve alias mapping from `tsconfig.json` before checking.
- DI token detection: look for `tokens.ts`, `provide-*.ts`, or `provide*` conventions in `src/di/`.
- Contract detection: treat files under `src/domain/contracts` as the canonical api for domain boundaries.

Sample CLI checks to run locally (implementation suggestions):

- Use TypeScript compiler APIs or `madge`/`dependency-cruiser` to generate import graphs and detect cycles.
- Use a lightweight grep/AST check to find forbidden import patterns (e.g., searching for `from '../..'` patterns between layer folders).

## Remediation guidance (for each rule)

- Rule A remediation:
  - Move any domain code that imports from presentation into application or infrastructure as appropriate.
  - Replace direct imports with a contract in `src/domain/contracts` and depend on the contract instead.

- Rule B remediation:
  - Remove framework-specific imports from the domain. Introduce an interface (contract) in `src/domain/contracts` and implement it in `src/infrastructure`.

- Rule C remediation:
  - Ensure the domain defines interfaces for required operations; move concrete implementations into `src/infrastructure` and register them via `src/di`.

- Rule D remediation:
  - Centralize provider declarations in `src/di`. Add small adapter provider files that map infrastructure implementations to the DI tokens referenced by application/presentation.

- Rule E remediation:
  - Break cycles by inverting dependencies: extract shared types into `src/core` or `src/domain/contracts`, or introduce an application-level port.

- Rule F remediation:
  - Create or use existing `facades` in `src/application/facades` so presentation imports only facades.

## Examples (before / after)

Before (presentation imports an infrastructure logger directly):

// ...existing code...
import { LoggerService } from '../../infrastructure/logger/logger.service';

After (presentation depends on facade and DI):

// ...existing code...
import { LoggerFacade } from '@/application/facades/logger.facade';

Where `LoggerFacade` is implemented in the application layer and wired to the concrete `LoggerService` in `src/di/providers.ts`.

## Suggested enforcement & CI integration

- Pre-commit / CI lint step:
  - Add a job that runs a custom node script or `dependency-cruiser` config that fails on forbidden imports or layer-violating edges.
  - Optionally run `madge --circular src` and fail when cross-layer circulars exist.

- PR template checklist (recommended additions):
  - "Does this change introduce any cross-layer imports?" [Yes/No]
  - "Have DI providers been registered only in `src/di`?" [Yes/No]

- Automations:
  - Use `eslint` rules (custom `no-restricted-imports`) per folder to block imports into `src/domain` from outer layers.
  - Provide a small `scripts/check-architecture.js` script that runs the project's checks and returns non-zero on violations.

## Developer workflow and triage

- When a violation is reported, create a small focused PR that extracts the contract, moves implementations to infrastructure, and updates DI wiring.
- Prefer small refactors: change one import boundary per PR to ease review.

## Suggested quick-fixes (editor/IDE integrations)

- Provide a code action/snippet that can replace forbidden import paths with the preferred facade import and add a TODO to register provider in `src/di`.

## Files & paths convention reference (project-specific)

- `src/domain/` — contracts, entities, value-objects, domain events
- `src/application/` — use-cases, facades, services orchestrating domain
- `src/infrastructure/` — DTOs, mappers, repositories, framework adapters
- `src/presentation/` — UI components, pages, route handlers
- `src/core/` — shared utilities and cross-cutting concerns
- `src/di/` — DI tokens and provider wiring

If the repo uses `app/` as in this project, map `app/` to `src/presentation` and apply the same checks.

## Quality gates

- Run TypeScript build with `tsc --noEmit` to ensure no broken imports after refactor.
- Run architecture checks (dependency-cruiser or custom) in CI; fail on new violations.

## Example `dependency-cruiser` rule snippet

{
  "forbidden": [
    {
      "name": "no-domain-to-presentation",
      "severity": "error",
      "from": { "path": "^src/domain" },
      "to": { "path": "^src/(presentation|app)" }
    }
  ]
}

## Implementation notes for the prompt that will generate these instructions

- The generator should:
  - Resolve TypeScript path aliases from `tsconfig.json`.
  - Parse top-level folders and infer layers if folder names differ (e.g., `app/` used for presentation).
  - Produce a report of violations with file locations and suggested fixes.
  - Output a Markdown file with the rules and a short remediation PR template.

## Tools recommended for automation

- dependency-cruiser (import graph + forbidden edge checks)
- madge (cycle detection)
- eslint with `no-restricted-imports` configured per folder
- TypeScript compiler API (for precise resolution when needed)

## Avoid

- Do not change code automatically without a clear, reviewable PR (generator should propose patches, not apply them silently).
- Do not recommend heavy runtime changes or new dependencies without a migration plan.

## Next steps

1. Add a small `scripts/check-architecture.js` that runs the simplest checks (grep for forbidden import patterns and run `madge --circular`).
2. Add CI job that runs `node scripts/check-architecture.js` and `npm run build --if-present`.
3. Iterate rules after running the checks on main branch and triage real violations.

## Contact / maintenance

Keep this file updated when folder structure changes, or when new architectural conventions are introduced (e.g., addition of `features/` grouping or new DI strategy).

---
