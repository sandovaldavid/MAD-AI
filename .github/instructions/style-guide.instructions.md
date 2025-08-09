---
description: "Instructions for Copilot to apply and maintain the MAD-AI project's style guide, enforcing Tailwind CSS v4.1, color palette, accessibility, and dark mode."
---

# MAD-AI Style Guide Instructions

## Color Usage

-   Use only colors defined in the project's color palette (see `styles/colors.css`).
-   Never use direct hex, rgb, or named colors in components or styles.
-   Reference colors via Tailwind CSS utility classes or custom variables.
-   For custom classes, use the `@apply` directive with palette-based Tailwind utilities.

## Tailwind CSS v4.1 Best Practices

-   Use Tailwind utility classes for layout, spacing, typography, and color.
-   Prefer semantic, composable utility classes over inline styles.
-   Use the `@apply` directive in CSS for reusable class patterns.
-   Avoid repeating utility classes inline; extract to shared CSS classes in `styles/components.css`.
-   Do not override Tailwind defaults unless required for design consistency.

## Reusable Classes

-   Define shared, reusable classes for common UI patterns (buttons, forms, cards) in `styles/components.css`.
-   Use descriptive, semantic class names (e.g., `.btn-primary`, `.card`, `.input-group`).
-   Apply these classes via `@apply` with Tailwind utilities and palette colors.
-   Document reusable classes in the style guide for team reference.

## Accessibility

-   Use semantic HTML elements for all UI components.
-   Ensure sufficient color contrast (WCAG AA minimum) for text, icons, and backgrounds.
-   Use Tailwind's accessibility utilities (e.g., `focus-visible`, `sr-only`).
-   Support keyboard navigation and screen readers in all interactive components.
-   Avoid using color alone to convey information; use icons, text, or ARIA attributes.

## Dark Mode Support

-   Implement dark mode using Tailwind's `dark:` variant and CSS variables.
-   Ensure all palette colors have appropriate dark mode variants.
-   Test contrast and accessibility in both light and dark modes.
-   Use Tailwind's `dark:bg-...`, `dark:text-...` utilities for conditional styling.

## Examples

```css
/* Example: Button class using @apply and palette colors */
.btn-primary {
    @apply px-4 py-2 rounded font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary;
}

/* Example: Card class */
.card {
    @apply p-6 rounded-lg shadow bg-surface text-on-surface dark:bg-surface-dark dark:text-on-surface-dark;
}
```

## Troubleshooting & Error Handling

-   **Direct color usage**: Refactor to use palette-based Tailwind classes or CSS variables.
-   **Inline utility repetition**: Extract repeated patterns to reusable classes.
-   **Poor contrast**: Adjust palette or use Tailwind contrast utilities.
-   **Non-semantic classes**: Rename for clarity and accessibility.
-   **Accessibility issues**: Test with screen readers and keyboard navigation; fix ARIA and semantic markup.

## References

-   See `styles_guide.md` for full style guide and palette.
-   See `styles/colors.css` and `styles/components.css` for implementation.
-   See Tailwind CSS v4.1 documentation for advanced usage.

---

**Always validate styles for consistency, accessibility, and palette compliance before merging.**
