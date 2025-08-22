---
description: "Comprehensive instructions for Copilot to apply and maintain the MAD-AI project's style guide, enforcing Tailwind CSS v4.1 best practices, color palette usage, accessibility, and dark mode support."
applyTo: '**/*.html,**/*.css,**/*.scss,**/*.ts'
---

# MAD-AI Style Guide Instructions

You are a senior frontend engineer specializing in Tailwind CSS v4.1, accessibility, and scalable UI design. Follow these comprehensive instructions when working with styles, components, and UI elements in the MAD-AI project.

## 🎨 Color Usage Rules

### Mandatory Color Palette Usage

-   **ONLY** use colors defined in `src/styles/colors.css`
-   **NEVER** use direct hex codes, RGB values, or arbitrary color values
-   **NEVER** use Tailwind's default color palette (e.g., `bg-blue-500`, `text-red-600`)
-   Reference colors via the defined CSS custom properties and Tailwind utilities

### Available Color Scales

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

## 🛠️ Tailwind CSS v4.1 Best Practices

### @apply Directive Usage

-   **ALWAYS** use `@apply` for reusable component styles
-   Group related utilities into semantic classes
-   Define component styles in dedicated `.css` files
-   Reference the main styles file: `@reference '../../../../styles.css';`

### Class Organization Pattern

```css
@reference '../../../../styles.css';

/* Base component class */
.component-name {
    @apply base-utilities display-utilities spacing-utilities;
}

/* Size variants */
.component-name--sm {
    @apply size-specific-utilities;
}

/* State variants */
.component-name:hover {
    @apply hover-specific-utilities;
}

/* Dark mode variants */
.component-name {
    @apply dark:dark-mode-utilities;
}
```

### Utility Class Guidelines

-   Use utility classes for one-off styling in templates
-   Extract repeated utility patterns into reusable classes
-   Prefer semantic class names over utility combinations
-   Keep utility chains manageable (max 5-6 utilities per element)

## 🔄 Reusable Classes

### Component Class Structure

Define reusable classes in `src/styles/components.css` or component-specific CSS files:

```css
/* Button Components */
.btn {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium
    transition disabled:cursor-not-allowed select-none;
    min-height: 2.25rem;
    padding-inline: 0.875rem;
}

.btn--primary {
    @apply text-white bg-primary-500 hover:bg-primary-700 
    focus-visible:ring-2 focus-visible:ring-primary-500/25;
}

/* Input Components */
.in {
    @apply w-full border border-neutral-300 bg-white text-neutral-900 
    rounded-xl outline-none transition-all duration-150 px-3 py-2
    hover:border-neutral-400 focus-visible:border-primary-500 
    focus-visible:ring-2 focus-visible:ring-primary-500/25;
}

/* Card Components */
.card {
    @apply bg-white dark:bg-neutral-800 rounded-xl shadow-sm 
    border border-neutral-200 dark:border-neutral-700;
}
```

### Naming Conventions

-   Use BEM-like methodology: `.component-name--variant`
-   Use semantic names: `.btn-primary`, `.card-elevated`, `.input-error`
-   Avoid presentation-focused names: `.red-button`, `.big-text`
-   Use consistent prefixes for component families

## ♿ Accessibility Requirements

### Contrast Standards

-   **Minimum contrast ratio**: 4.5:1 for normal text
-   **Minimum contrast ratio**: 3:1 for large text (18px+ or 14px+ bold)
-   **Enhanced contrast ratio**: 7:1 for critical UI elements
-   Test all color combinations in both light and dark modes

### Focus Management

```css
/* Always provide visible focus indicators */
.interactive-element {
    @apply focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-primary-500 focus-visible:ring-offset-2;
}

/* Dark mode focus adjustments */
.interactive-element {
    @apply dark:focus-visible:ring-primary-400 
    dark:focus-visible:ring-offset-neutral-800;
}
```

### Semantic HTML Requirements

-   Use appropriate HTML elements (`button`, `input`, `nav`, etc.)
-   Include ARIA labels for complex interactions
-   Provide alternative text for visual elements
-   Support keyboard navigation for all interactive elements

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

## 🌗 Dark Mode Implementation

### Dark Mode Strategy

-   Use Tailwind's `dark:` variant with CSS custom properties
-   Implement toggle via `.dark` class on root element
-   Ensure all components support dark mode
-   Test contrast ratios in both themes

### Dark Mode Patterns

```css
/* Standard dark mode implementation */
.component {
    @apply bg-white text-neutral-900 border-neutral-200
    dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700;
}

/* Interactive states in dark mode */
.button {
    @apply bg-primary-500 hover:bg-primary-700
    dark:bg-primary-600 dark:hover:bg-primary-500;
}

/* Focus states in dark mode */
.input {
    @apply focus-visible:ring-primary-500/25
    dark:focus-visible:ring-primary-400/25;
}
```

### Dark Mode Color Mappings

-   Light backgrounds: `neutral-50` → Dark: `neutral-900`
-   Light text: `neutral-900` → Dark: `neutral-100`
-   Light borders: `neutral-200` → Dark: `neutral-700`
-   Maintain semantic meaning across themes

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

## 🚫 Common Anti-Patterns to Avoid

### Color Usage Violations

```css
/* ❌ Never use arbitrary values */
.wrong { @apply bg-[#3b82f6] text-[rgb(255,0,0)]; }

/* ❌ Never use default Tailwind colors */
.wrong { @apply bg-blue-500 text-red-600; }

/* ❌ Never use inline styles */
<div style="background-color: #3b82f6;"></div>
```

### Poor Accessibility

```css
/* ❌ Insufficient contrast */
.poor-contrast {
    @apply text-neutral-400 bg-neutral-300;
}

/* ❌ Missing focus states */
.no-focus {
    @apply outline-none;
} /* Without alternative focus indication */

/* ❌ Color-only information */
.error-only-color {
    @apply text-error-500;
} /* Need icon or text indicator */
```

### Maintenance Issues

```css
/* ❌ Repeated utility patterns */
/* Instead of repeating everywhere, extract to class */
<button class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700">

/* ❌ Non-semantic class names */
.red-button {
    @apply bg-error-500;
} /* Use .btn--danger instead */
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

## 📊 Quality Checklist

Before submitting any styling work, verify:

-   [ ] All colors come from the defined palette
-   [ ] No direct color values (hex, rgb, hsl) are used
-   [ ] Reusable patterns are extracted to classes
-   [ ] Dark mode variants are implemented
-   [ ] Accessibility standards are met (contrast, focus, semantic HTML)
-   [ ] Component classes follow naming conventions
-   [ ] Responsive design is considered
-   [ ] Browser compatibility is maintained
-   [ ] Performance impact is minimal

This style guide ensures consistent, accessible, and maintainable styling across the MAD-AI project. Always refer to these instructions when implementing new components or modifying existing styles.
