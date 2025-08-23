# Build Tools Analysis

## Angular CLI Configuration

### Project Structure
- **Schema Version**: Angular CLI schema (latest)
- **CLI Version**: 20.0.2
- **Project Type**: application
- **Component Prefix**: "app"
- **Source Root**: "src"

### Build Configuration

#### Application Builder
- **Builder**: @angular/build:application (new Angular builder)
- **Browser Entry**: src/main.ts
- **Server Entry**: src/main.server.ts
- **Polyfills**: ["zone.js"]
- **TypeScript Config**: tsconfig.app.json

#### Server-Side Rendering (SSR)
- **Output Mode**: server
- **SSR Entry**: src/server.ts
- **SSR Support**: Enabled with Angular Universal

#### Asset Management
- **Public Directory**: "public" folder for static assets
- **Asset Glob**: Includes all files from public directory
- **Styles Entry**: src/styles.css (global styles)

## NPM Scripts Analysis

### Development Scripts
```json
"ng": "ng"                          // Angular CLI access
"start": "ng serve"                 // Development server
"watch": "ng build --watch --configuration development" // Watch mode
```

### Production Scripts
```json
"build": "ng build"                 // Production build
"serve:ssr:MAD-AI-NEW": "node dist/MAD-AI-NEW/server/server.mjs" // SSR server
```

### Testing Scripts
```json
"test": "ng test"                   // Unit tests with Karma
```

### Code Quality Scripts
```json
"lint:icons": "node scripts/lint-icons.cjs"        // Icon validation
"fix:icons": "node scripts/lint-icons.cjs --fix"   // Icon auto-fix
"fix:icons:dry": "node scripts/lint-icons.cjs --fix --dry" // Dry run
"prebuild": "npm run lint:icons"                   // Pre-build validation
```

## Build Tool Versions

### Core Build Tools
- **Angular CLI**: 20.0.2
- **Angular Build**: 20.0.2 (new application builder)
- **Angular Compiler CLI**: 20.1.6

### Runtime Dependencies
- **Node.js**: Compatible with version 20.x (based on @types/node)
- **Express**: 5.1.0 (for SSR server)

## Custom Build Scripts

### Icon Linting System
- **Script Location**: scripts/lint-icons.cjs
- **Purpose**: Validates icon usage and consistency
- **Integration**: Runs before build (prebuild hook)
- **Modes**: Lint, fix, and dry-run modes available

## Build Optimization Features

### Modern Angular Builder
- **New Application Builder**: Uses @angular/build:application
- **Enhanced Performance**: Improved build times and optimization
- **Native SSR Support**: Built-in server-side rendering

### Development Optimizations
- **Watch Mode**: Incremental compilation
- **Development Configuration**: Optimized for development speed
- **Hot Module Replacement**: Available through ng serve

### Production Optimizations
- **Tree Shaking**: Automatic dead code elimination
- **Minification**: Built-in code minification
- **Bundle Optimization**: Automatic code splitting

## Key Patterns for Copilot Instructions

### Build Command Usage
1. **Development**: Use `ng serve` for local development
2. **Production**: Use `ng build` for production builds
3. **SSR**: Use `ng build && npm run serve:ssr:MAD-AI-NEW` for SSR testing

### Asset Management
1. **Static Assets**: Place in `public/` directory
2. **Global Styles**: Import in `src/styles.css`
3. **Component Styles**: Co-locate with components

### Code Quality Integration
1. **Pre-build Validation**: Icon linting runs automatically
2. **Custom Scripts**: Use Node.js scripts for custom validation
3. **Fix Commands**: Provide both fix and dry-run modes

### SSR Configuration
1. **Server Entry**: src/server.ts for SSR setup
2. **Main Server**: src/main.server.ts for application bootstrap
3. **Output**: Server-rendered application in dist/

## Critical Build Requirements

1. **Angular CLI 20.0.2**: Use CLI commands and schematics from this version
2. **New Application Builder**: Leverage new build system features
3. **SSR Support**: All code must be SSR-compatible
4. **Icon Validation**: Custom icons must pass validation scripts
5. **TypeScript Compilation**: Must compile with tsconfig.app.json settings

## Development Workflow

### Standard Development Flow
1. `npm start` - Start development server
2. `npm test` - Run unit tests
3. `npm run build` - Create production build
4. `npm run serve:ssr:MAD-AI-NEW` - Test SSR build

### Code Quality Flow
1. `npm run lint:icons` - Validate icons
2. `npm run fix:icons` - Auto-fix icon issues
3. Build process automatically validates icons via prebuild hook
