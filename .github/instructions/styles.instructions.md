# 🧠 Prompt para GitHub Copilot – Buenas prácticas Tailwind CSS v4.1 en mi aplicación

Estoy desarrollando una aplicación web y deseo seguir **buenas prácticas de estilo usando Tailwind CSS v4.1**. Para lograr una implementación escalable, accesible y coherente, Copilot debe seguir estas instrucciones siempre que genere componentes de UI o clases CSS:

## 🎨 Paleta de colores personalizada

Toda la aplicación debe usar exclusivamente los colores definidos en el archivo `/styles/colos.css` y no utilizar colores directos en el HTML o CSS. Los colores deben referenciarse mediante clases extendidas de Tailwind.

## 🎯 Estilos con clases reutilizables

los estilos deben ser definidos en el componente dentro de su archivo .css correspondiente, utilizando la directiva `@apply` de Tailwind CSS. Esto permite agrupar utilidades de Tailwind en clases semánticas reutilizables, mejorando la legibilidad y mantenibilidad del código.

Para poder usar los estilos definidos en los archivos .css deber hacer uina referencia al archivo `styles.css` en el archivo .css del componente. Por ejemplo:

```css
@reference '../../../../../styles.css';
```

Ejemplos:

```css
.btn-primary {
    @apply bg-primary-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors;
}

.input-base {
    @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-4 py-2 rounded-md focus:ring-2 focus:ring-primary-500;
}
```

Estas clases deben usarse en lugar de repetir utilidades dentro del HTML.

## 🌗 Soporte para modo claro y oscuro

La implementación del **modo oscuro** debe activarse mediante la clase `.dark` en el HTML root. Todos los estilos y componentes deben:

-   Aplicar condicionales de Tailwind como `dark:bg-background`, `dark:text-dark`

Ejemplo:

```html
<input class="input-base dark:input-base" />
```

## ✅ Accesibilidad y contraste

Todos los componentes deben garantizar:

-   Contraste mínimo de 4.5:1 entre texto y fondo
-   Uso de `focus:ring-*` para accesibilidad con teclado
-   Estados visuales bien definidos (`hover`, `active`, `disabled`)

Botones deshabilitados deben tener colores derivados de la paleta, pero con saturación o opacidad reducida. Evitar usar `opacity-50` si afecta la legibilidad del texto.

## 📌 Resumen de reglas que debe seguir Copilot:

1. Usar **solo colores definidos** en `_colors.css`.
2. No usar colores directos (`bg-[#...]`, `text-[#...]`), siempre referirse a clases extendidas como `bg-primary-500`.
3. Agrupar estilos con `@apply` en `_utilities.css`.
4. Aplicar `dark:` para estilos oscuros.
5. Cumplir estándares de contraste y accesibilidad.
6. Reutilizar clases semánticas (`btn-primary`, `input-base`, etc.).
