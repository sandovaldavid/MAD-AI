# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project.
2. **Context Files**: Prioritize patterns and standards defined in the instructions directory.
3. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns.
4. **Architectural Consistency**: Maintain the Clean Architecture style and established boundaries.
5. **Code Quality**: Prioritize maintainability, performance, security, accessibility, and testability in all generated code.

## Technology Version Detection

Before generating code, scan the codebase to identify:

-   **Language Versions**: Use TypeScript strict mode as configured in tsconfig.json.
-   **Framework Versions**: Use the Angular version specified in package.json (latest Angular, standalone components by default).
-   **Library Versions**: Use only the versions of Angular Material, RxJS, Tailwind CSS, and other dependencies as specified in package.json.

## Context Files

Prioritize the following files in instructions:

-   angular.instructions.md: Angular coding standards, signals, state management, and best practices.
-   project-structure.instructions.md: Clean Architecture, folder structure, and naming conventions.
-   styles.instructions.md: Tailwind CSS v4.1 usage, color palette, and accessibility rules.

## Codebase Scanning Instructions

When context files don't provide specific guidance:

1. Identify similar files to the one being modified or created.
2. Analyze patterns for:
    - Naming conventions (kebab-case for files, PascalCase for classes/interfaces/enums).
    - Code organization by feature and layer.
    - Error handling with RxJS and Angular best practices.
    - Documentation style (JSDoc for components/services).
    - Testing patterns (Jasmine, Karma, Angular TestBed).
3. Follow the most consistent patterns found in the codebase.
4. When conflicting patterns exist, prioritize patterns in newer files or files with higher test coverage.
5. Never introduce patterns not found in the existing codebase.

## Code Quality Standards

### Maintainability

-   Write self-documenting code with clear naming.
-   Follow the naming and organization conventions evident in the codebase.
-   Keep functions focused on single responsibilities.
-   Limit function complexity and length to match existing patterns.

### Performance

-   Use Angular's OnPush change detection and signals for reactivity.
-   Implement lazy loading for feature modules.
-   Use trackBy in `ngFor` loops.
-   Optimize observable usage with RxJS operators.

### Security

-   Use Angular's built-in sanitization.
-   Implement route guards and HTTP interceptors for authentication.
-   Validate form inputs with Angular's reactive forms and custom validators.

### Accessibility

-   Follow accessibility rules from styles.instructions.md.
-   Use ARIA attributes and semantic HTML.
-   Ensure color contrast and keyboard navigation.

### Testability

-   Write unit tests for all components, services, and pipes.
-   Use Angular's TestBed and HttpClientTestingModule.
-   Mock dependencies and HTTP requests as in existing tests.

## Documentation Requirements

-   Follow the JSDoc style and completeness of existing comments.
-   Document parameters, returns, and exceptions in the same style.
-   Match class-level documentation style and content.

## Testing Approach

### Unit Testing

-   Match the exact structure and style of existing unit tests.
-   Use the same assertion and mocking patterns.

### Integration Testing

-   Follow the same integration test patterns found in the codebase.

### End-to-End Testing

-   Match the existing E2E test structure and patterns (if present).

## Angular Guidelines

-   Use standalone components unless modules are explicitly required.
-   Use Angular Signals for state management.
-   Use `inject()` for dependency injection.
-   Use typed forms and RxJS for data flow.
-   Follow Clean Architecture: domain, application, infrastructure, presentation, shared, core.

## Tailwind CSS Guidelines

-   Use only colors defined in `/styles/colors.css`.
-   Group styles with `@apply` in component `.css` files.
-   Reference `styles.css` in each component's `.css`.
-   Implement dark mode with the `.dark` class.
-   Ensure accessibility and contrast as per styles.instructions.md.

## Version Control Guidelines

-   Follow Semantic Versioning as applied in the codebase.
-   Match existing patterns for documenting breaking changes.

## General Best Practices

-   Follow naming conventions exactly as they appear in existing code.
-   Match code organization patterns from similar files.
-   Apply error handling consistent with existing patterns.
-   Follow the same approach to testing as seen in the codebase.
-   Use the same approach to configuration as seen in the codebase.

## Project-Specific Guidance

-   Scan the codebase thoroughly before generating any code.
-   Respect existing architectural boundaries without exception.
-   Match the style and patterns of surrounding code.
-   When in doubt, prioritize consistency with existing code over external best practices.
