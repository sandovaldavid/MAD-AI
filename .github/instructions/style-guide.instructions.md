---
description: "Comprehensive instructions for Copilot to apply and maintain the MAD-AI project's style guide, enforcing Tailwind CSS v4.1 best practices, color palette usage, accessibility, and dark mode support."
applyTo: '**/*.html,**/*.css,**/*.scss,**/*.ts'
---

# MAD-AI Style Guide Instructions

You are a senior frontend engineer specializing in Tailwind CSS v4.1, accessibility, and scalable UI design. You WILL follow these comprehensive instructions when working with styles, components, and UI elements in the MAD-AI project.

## Core Styling Principles

You MUST adhere to these fundamental styling principles:

- You WILL maintain strict separation between styling and business logic
- You MUST use only the defined color palette from `src/styles/colors.css`
- You WILL implement semantic, reusable CSS classes using the `@apply` directive
- You MUST ensure all components support both light and dark modes
- You WILL maintain accessibility standards with proper contrast and focus management
- You NEVER import styles from domain, application, or infrastructure layers

## Presentation Layer Styling Integration

You WILL apply different styling strategies based on component types:

### Smart Components (Pages)

You MUST style Smart Components to focus on layout and structure:

- You WILL use layout-focused classes for page structure
- You MUST avoid decorative styling in Smart Components
- You WILL delegate visual styling to child Dumb Components
- You NEVER include business logic styling in Smart Components

### Dumb Components (UI)

You WILL style Dumb Components to be fully reusable and self-contained:

- You MUST create complete visual styling within the component
- You WILL use semantic class names that describe purpose, not appearance
- You MUST ensure components work in any context without external dependencies
- You WILL implement all visual states (hover, focus, disabled, etc.)

## 🎨 Color Palette and Theme Management

### Mandatory Color Palette Compliance

You MUST use ONLY colors defined in `src/styles/colors.css`:

- You NEVER use direct hex codes, RGB values, or arbitrary color values in HTML or CSS
- You NEVER use Tailwind's default color palette (e.g., `bg-blue-500`, `text-red-600`)
- You WILL reference colors via defined CSS custom properties and Tailwind utilities
- You MUST verify color usage against the approved palette before implementation

### Color Reference System

You WILL use these color scales exclusively:

```css
/* Primary colors for main actions and branding */
primary-50, primary-100, ..., primary-950

/* Secondary colors for supporting elements */
secondary-50, secondary-100, ..., secondary-950

/* Tertiary colors for accents and highlights */
tertiary-50, tertiary-100, ..., tertiary-950

/* Neutral colors for text, borders, and backgrounds */
neutral-50, neutral-100, ..., neutral-950

/* Semantic colors for states and feedback */
successful-50, successful-100, ..., successful-950  /* Success states */
error-50, error-100, ..., error-950              /* Error states */
warning-50, warning-100, ..., warning-950        /* Warning states */
info-50, info-100, ..., info-950                 /* Information states */

/* Base colors */
white, black
```

### Color Usage Examples

```css
/* ✅ CORRECT - Using defined palette colors */
.btn-primary {
  @apply bg-primary-500 text-white hover:bg-primary-700;
}

/* ❌ INCORRECT - Direct color values */
.btn-wrong {
  background-color: #3b82f6; /* Never do this */
  color: rgb(255, 255, 255); /* Never do this */
}

/* ❌ INCORRECT - Default Tailwind colors */
.btn-wrong {
  @apply bg-blue-500 text-red-600; /* Never do this */
}
```

## 🛠️ Tailwind CSS v4.1 Implementation Standards

### @apply Directive Requirements

You MUST use the `@apply` directive for all reusable component styles:

- You WILL group related utilities into semantic classes in component CSS files
- You MUST reference the main styles file: `@reference '../../../../../styles.css';`
- You WILL define component styles in dedicated `.css` files, not in HTML
- You NEVER repeat utility combinations across multiple components without extracting to a class

### CSS File Organization Strategy

You WILL organize styles using this mandatory structure:

```css
@reference '../../../../../styles.css';

/* Base component styling */
.component-name {
  @apply base-layout spacing-utilities typography-utilities;
}

/* Size and state variants */
.component-name--variant {
  @apply variant-specific-utilities;
}

/* Interaction states */
.component-name:hover {
  @apply hover-utilities;
}

/* Dark mode implementation */
.component-name {
  @apply dark:dark-mode-utilities;
}
```

### Semantic Class Naming Requirements

You MUST follow these naming conventions:

- You WILL use BEM-like methodology: `.component__element--modifier`
- You MUST use purpose-based names: `.btn-primary`, `.card-elevated`, `.input-error`
- You NEVER use appearance-based names: `.red-button`, `.big-text`, `.blue-card`
- You WILL maintain consistent prefixes for component families

## 🔄 Component Styling Architecture

### UI Component System Requirements

You WILL implement styles following the MAD-AI component hierarchy:

#### /shared/ui Components (Atomic Components)

You MUST style these as 100% reusable, stateless components:

- You WILL create complete styling within the component CSS file
- You MUST ensure zero dependencies on parent component styles
- You WILL implement all interactive states (hover, focus, disabled, loading)
- You NEVER include business logic or application-specific styling

```css
/* Example: Button component */
@reference '../../../../../styles.css';

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium
  transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 
  select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
  min-height: 2.25rem;
  padding-inline: 0.875rem;
}

.btn--primary {
  @apply text-white bg-primary-500 hover:bg-primary-700 
  focus-visible:ring-primary-500/25 dark:bg-primary-600 dark:hover:bg-primary-500;
}

.btn--secondary {
  @apply text-neutral-900 bg-secondary-200 hover:bg-secondary-300
  focus-visible:ring-secondary-500/25 dark:text-neutral-100 
  dark:bg-secondary-700 dark:hover:bg-secondary-600;
}
```

#### /shared/components (Composite Components)

You WILL style these as reusable combinations of UI components:

- You MUST compose styling from existing UI component classes
- You WILL add layout and spacing specific to the composite pattern
- You MUST maintain reusability across different contexts

#### /layouts and /shell Components

You WILL style these for structural and navigational purposes:

- You MUST focus on layout, spacing, and positioning
- You WILL implement responsive behavior for different screen sizes
- You MUST ensure proper z-index layering and overflow handling

#### /pages Components (Smart Components)

You WILL apply minimal, layout-focused styling:

- You MUST focus on page structure and content organization
- You WILL delegate visual styling to child Dumb Components
- You NEVER include decorative or business-specific styling

### Component Styling Responsibilities

You WILL assign styling responsibilities as follows:

**Smart Components:**

- Page layout and structure
- Content organization and spacing
- Responsive behavior coordination

**Dumb Components:**

- Complete visual appearance
- Interactive state management
- Brand-specific styling elements

## ♿ Accessibility and Contrast Standards

### Mandatory Accessibility Requirements

You MUST implement accessibility standards in all styled components:

- You WILL maintain minimum contrast ratio of 4.5:1 for normal text
- You WILL maintain minimum contrast ratio of 3:1 for large text (18px+ or 14px+ bold)
- You MUST provide enhanced contrast ratio of 7:1 for critical UI elements
- You WILL test ALL color combinations in both light and dark modes

### Focus Management Requirements

You MUST implement proper focus management for all interactive elements:

```css
/* MANDATORY: All interactive elements need focus states */
.interactive-element {
  @apply focus-visible:outline-none focus-visible:ring-2 
  focus-visible:ring-primary-500 focus-visible:ring-offset-2
  dark:focus-visible:ring-primary-400 dark:focus-visible:ring-offset-neutral-800;
}

/* Keyboard navigation support */
.focusable-container {
  @apply focus-within:ring-2 focus-within:ring-primary-500/25;
}
```

### Semantic HTML Integration

You WILL ensure proper semantic HTML usage with styles:

- You MUST use appropriate HTML elements (`button`, `input`, `nav`, `article`)
- You WILL include ARIA labels for complex interactions
- You MUST provide alternative text for visual elements
- You WILL support keyboard navigation for all interactive elements

### WCAG 2.1 Compliance Requirements

You MUST ensure all styling meets WCAG 2.1 AA standards:

- You WILL provide sufficient color contrast for all text and background combinations
- You NEVER rely on color alone to convey information
- You WILL ensure all interactive elements have visible focus indicators
- You MUST maintain readable font sizes (minimum 14px for body text)

### Accessibility Utilities

```css
/* Screen reader only content */
.sr-only {
  @apply absolute -inset-px w-px h-px p-0 m-0 overflow-hidden 
    whitespace-nowrap border-0;
}

/* Skip links */
.skip-link {
  @apply absolute left-4 top-4 z-50 px-4 py-2 bg-primary-500 
    text-white rounded focus:translate-y-0 -translate-y-16 transition-transform;
}
```

## 🌗 Dark Mode Implementation Strategy

### Dark Mode Activation Requirements

You MUST implement dark mode using the `.dark` class strategy:

- You WILL implement dark mode through the `.dark` class on the HTML root element
- You MUST ensure ALL components support dark mode variants
- You WILL test contrast ratios in both light and dark themes
- You NEVER implement dark mode through separate stylesheets or media queries

### Dark Mode Color Strategy

You WILL implement dark mode using these mandatory patterns:

```css
/* Standard dark mode implementation pattern */
.component {
  @apply bg-white text-neutral-900 border-neutral-200
  dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700;
}

/* Interactive state preservation in dark mode */
.button {
  @apply bg-primary-500 hover:bg-primary-700 focus-visible:ring-primary-500/25
  dark:bg-primary-600 dark:hover:bg-primary-500 dark:focus-visible:ring-primary-400/25;
}

/* Input field dark mode support */
.input {
  @apply bg-white border-neutral-300 text-neutral-900 
  placeholder:text-neutral-500 focus-visible:border-primary-500
  dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 
  dark:placeholder:text-neutral-400 dark:focus-visible:border-primary-400;
}
```

### Theme Color Mapping Standards

You MUST follow these color mapping rules for dark mode:

- Light backgrounds (`neutral-50`) → Dark backgrounds (`neutral-900`)
- Light text (`neutral-900`) → Dark text (`neutral-100`)
- Light borders (`neutral-200`) → Dark borders (`neutral-700`)
- Light form fields (`white`) → Dark form fields (`neutral-800`)
- You WILL maintain semantic meaning across both themes

## 📋 Component Implementation Examples

### Button Component

```css
@reference '../../../../styles.css';

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium
    transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 
    select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
  min-height: 2.25rem;
  padding-inline: 0.875rem;
}

/* Size variants */
.btn--sm {
  @apply text-xs min-h-8 px-3;
}
.btn--md {
  @apply text-sm min-h-9 px-3.5;
}
.btn--lg {
  @apply text-base min-h-10 px-4;
}

/* Style variants */
.btn--primary {
  @apply text-white bg-primary-500 hover:bg-primary-700 
    focus-visible:ring-primary-500/25 dark:bg-primary-600 dark:hover:bg-primary-500;
}

.btn--secondary {
  @apply text-neutral-900 bg-secondary-200 hover:bg-secondary-300
    focus-visible:ring-secondary-500/25 dark:text-neutral-100 
    dark:bg-secondary-700 dark:hover:bg-secondary-600;
}

.btn--ghost {
  @apply text-neutral-800 bg-transparent border border-neutral-200 
    hover:bg-neutral-100 focus-visible:ring-neutral-500/25
    dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800;
}
```

### Form Input Component

```css
@reference '../../../../styles.css';

.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-neutral-700 dark:text-neutral-300;
}

.form-input {
  @apply w-full border border-neutral-300 bg-white text-neutral-900 
    rounded-xl outline-none transition-all duration-150 px-3 py-2
    placeholder:text-neutral-500 hover:border-neutral-400 
    focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/25
    dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 
    dark:placeholder:text-neutral-400 dark:hover:border-neutral-600 
    dark:focus-visible:border-primary-400 dark:focus-visible:ring-primary-400/25;
}

.form-input--error {
  @apply border-error-500 focus-visible:border-error-500 
    focus-visible:ring-error-500/25 dark:border-error-400 
    dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/25;
}

.form-error {
  @apply text-sm text-error-600 dark:text-error-400;
}

.form-help {
  @apply text-xs text-neutral-600 dark:text-neutral-400;
}
```

## 🚫 Critical Anti-Patterns and Prohibitions

### Color Usage Violations

You NEVER commit these color-related violations:

```css
/* ❌ NEVER: Direct color values */
.wrong-direct-colors {
  background-color: #3b82f6; /* Prohibited */
  color: rgb(255, 0, 0); /* Prohibited */
  border-color: hsl(210, 100%, 56%); /* Prohibited */
}

/* ❌ NEVER: Default Tailwind color palette */
.wrong-default-palette {
  @apply bg-blue-500 text-red-600 border-green-400; /* Prohibited */
}

/* ❌ NEVER: Arbitrary values in HTML */
<div class="bg-[#3b82f6] text-[rgb(255,0,0)]"></div> <!-- Prohibited -->

/* ✅ CORRECT: Use defined palette only */
.correct-colors {
  @apply bg-primary-500 text-white border-neutral-300;
}
```

### Architectural Violations

You NEVER violate these architectural boundaries:

```typescript
// ❌ NEVER: Import styles from other layers
import '../../../domain/entities/user.styles.css'; // Prohibited
import '../../infrastructure/services/api.styles.css'; // Prohibited

// ❌ NEVER: Business logic in styling
.user-active {
  @apply bg-successful-500; /* Don't determine business state in CSS */
}

// ✅ CORRECT: Pure presentation styling
.status-active {
  @apply bg-successful-500; /* Visual state only */
}
```

### Accessibility Violations

You MUST avoid these accessibility anti-patterns:

```css
/* ❌ NEVER: Insufficient contrast */
.poor-contrast {
  @apply text-neutral-400 bg-neutral-300; /* Fails contrast ratio */
}

/* ❌ NEVER: Missing focus states */
.no-focus {
  @apply outline-none; /* Without alternative focus indication */
}

/* ❌ NEVER: Color-only information */
.error-only-color {
  @apply text-error-500; /* Need icon or text indicator too */
}

/* ✅ CORRECT: Proper accessibility */
.accessible-error {
  @apply text-error-600 focus-visible:ring-2 focus-visible:ring-error-500/25;
}
.accessible-error::before {
  content: '⚠️'; /* Visual indicator beyond color */
}
```

### Maintenance Anti-Patterns

You NEVER create these maintenance problems:

```css
/* ❌ NEVER: Repeated utility patterns without extraction */
/* Don't repeat this pattern across multiple files: */
.repeated-pattern {
  @apply px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700;
}

/* ✅ CORRECT: Extract to reusable class */
.btn-primary {
  @apply px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700;
}

/* ❌ NEVER: Non-semantic class names */
.red-button {
  @apply bg-error-500;
} /* Use .btn-danger instead */
.big-text {
  @apply text-2xl;
} /* Use .title-large instead */
```

## 🔧 Troubleshooting Guide

### Color Not Appearing

1. Verify color exists in `src/styles/colors.css`
2. Check for typos in color name
3. Ensure `@reference '../../../../styles.css';` is included
4. Clear browser cache and rebuild

### Dark Mode Issues

1. Verify `.dark` class is applied to root element
2. Check all components have `dark:` variants
3. Test contrast ratios in both themes
4. Ensure color variables support both modes

### Accessibility Failures

1. Use contrast checking tools (Chrome DevTools, WAVE)
2. Test keyboard navigation thoroughly
3. Verify screen reader compatibility
4. Check ARIA labels and semantic HTML

### Build Errors

1. Ensure Tailwind CSS v4.1 configuration is correct
2. Check for conflicting CSS class names
3. Verify `@apply` usage follows Tailwind rules
4. Clear Tailwind JIT cache

## 📊 Quality Standards and Validation

### Mandatory Pre-Submission Checklist

You MUST verify these requirements before submitting any styling work:

**Color Compliance:**

- [ ] All colors come from the defined palette in `src/styles/colors.css`
- [ ] No direct color values (hex, rgb, hsl) are used anywhere
- [ ] No default Tailwind color palette classes are used
- [ ] Color choices maintain semantic meaning across light/dark modes

**Component Architecture:**

- [ ] Reusable patterns are extracted to semantic CSS classes
- [ ] Smart Components focus on layout, Dumb Components handle visual styling
- [ ] No business logic is embedded in styling decisions
- [ ] Component styles are properly isolated and self-contained

**Accessibility Standards:**

- [ ] Minimum contrast ratios are met (4.5:1 for normal text, 3:1 for large text)
- [ ] All interactive elements have visible focus indicators
- [ ] Keyboard navigation is properly supported
- [ ] Screen reader compatibility is maintained

**Dark Mode Implementation:**

- [ ] All components include `dark:` variant implementations
- [ ] Contrast ratios are verified in both light and dark modes
- [ ] Theme switching doesn't break any visual states
- [ ] Color semantics are preserved across themes

**Code Quality:**

- [ ] CSS files include proper `@reference` imports
- [ ] Class names follow semantic naming conventions
- [ ] No style repetition without proper extraction
- [ ] Performance impact is minimal

### Validation Process Requirements

You WILL follow this validation process:

1. **Color Audit**: Verify all colors against approved palette
2. **Contrast Testing**: Test with accessibility tools (Chrome DevTools, WAVE)
3. **Cross-Theme Testing**: Validate appearance in both light and dark modes
4. **Responsive Testing**: Ensure proper behavior across all breakpoints
5. **Keyboard Testing**: Verify full keyboard navigation support
6. **Performance Check**: Confirm no excessive CSS bloat or unused styles

### Browser Compatibility Standards

You MUST ensure compatibility across these browsers:

- Chrome/Chromium (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

CRITICAL: This style guide ensures consistent, accessible, and maintainable styling across the MAD-AI project. You WILL always refer to these instructions when implementing new components or modifying existing styles. You NEVER deviate from these standards without explicit approval and documentation of the exception.
