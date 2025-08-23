# Technology Versions Analysis

## Core Framework Versions

### Angular Framework
- **Angular Core**: 20.1.6
- **Angular Common**: 20.1.6
- **Angular Compiler**: 20.1.6
- **Angular Forms**: 20.1.6
- **Angular Router**: 20.1.6
- **Angular Platform Browser**: 20.1.6
- **Angular Platform Server**: 20.1.6
- **Angular SSR**: 20.0.2
- **Angular Animations**: 20.1.6

### TypeScript & JavaScript Runtime
- **TypeScript**: 5.8.2
- **Zone.js**: 0.15.0
- **RxJS**: 7.8.0
- **TSLib**: 2.3.0

### Build Tools & CLI
- **Angular CLI**: 20.0.2
- **Angular Build**: 20.0.2
- **Angular Compiler CLI**: 20.1.6

## Styling & UI Dependencies

### CSS Framework
- **TailwindCSS**: 4.1.11
- **PostCSS**: 8.5.6
- **@tailwindcss/postcss**: 4.1.11

### Charts & Visualization
- **Chart.js**: 4.5.0
- **ng2-charts**: 8.0.0

## Backend & Server Dependencies

### Server Runtime
- **Express**: 5.1.0
- **@types/express**: 5.0.1

## Document Processing

### PDF Generation
- **jsPDF**: 3.0.1
- **jsPDF-AutoTable**: 5.0.2

### CSV Processing
- **PapaParse**: 5.5.3
- **@types/papaparse**: 5.3.16

## Testing Framework

### Core Testing
- **Jasmine Core**: 5.7.0
- **@types/jasmine**: 5.1.0

### Test Runners & Utilities
- **Karma**: 6.4.0
- **Karma Chrome Launcher**: 3.2.0
- **Karma Coverage**: 2.2.0
- **Karma Jasmine**: 5.1.0
- **Karma Jasmine HTML Reporter**: 2.1.0

### E2E Testing
- **Puppeteer**: 24.16.1

## Development Tools

### Code Quality & Linting
- **External Editor**: 3.1.0
- **@inquirer/editor**: 4.2.15
- **@inquirer/prompts**: 7.8.0

### Node.js Types
- **@types/node**: 20.17.19

## Version Compatibility Requirements

### Angular Version Constraints
- All Angular packages are on version 20.x.x
- Angular SSR is slightly behind at 20.0.2
- Angular CLI and Build tools are on 20.0.2

### TypeScript Compatibility
- TypeScript 5.8.2 is compatible with Angular 20.x
- Target: ES2022 (confirmed in tsconfig.json)

### Node.js Requirements
- Node.js types indicate version 20.x compatibility
- Express 5.x requires Node.js 18.x or higher

## Critical Dependencies for Copilot Instructions

1. **Angular 20.1.6**: Use latest Angular features including signals, standalone components, and new control flow
2. **TypeScript 5.8.2**: Use TypeScript 5.8 features but not newer experimental features
3. **TailwindCSS 4.1.11**: Use Tailwind v4 syntax and features
4. **RxJS 7.8.0**: Use RxJS v7 operators and patterns, not v8 features
5. **Zone.js 0.15.0**: Use Zone.js 0.15 patterns for change detection

## Deprecated or Legacy Concerns
- All dependencies are relatively modern
- No deprecated Angular features detected
- SSR implementation is using latest Angular Universal approach
