## Flujo de Testing, CI/CD y Husky en MAD-AI

### 1. Testing: Unitario, Integración y E2E

- **Unitario/Integración:** Usar Jest en Docker (`Dockerfile.jest`). Pruebas para lógica, servicios, facades, entidades, value objects.
- **E2E/UI:** Usar Cypress en Docker (`Dockerfile.cypress`). Pruebas para flujos completos y accesibilidad en la capa presentation.
- **Alternativas:** Playwright para E2E avanzado, Vitest para proyectos Vite.

### 2. Integración de Tests en Docker

- Crear `Dockerfile.jest` y `Dockerfile.cypress` para ejecutar los tests en contenedores.
- Usar `docker-compose` para orquestar ambos servicios si es necesario.
- Ejecutar los tests en Docker tanto en hooks de Husky como en CI/CD.
- Ejemplo de comandos:
  - `docker build -f Dockerfile.jest . && docker run ...`
  - `docker build -f Dockerfile.cypress . && docker run ...`

### 3. Pipeline CI/CD con GitHub Actions

- Workflows en `.github/workflows/`:
  - `lint`: Ejecuta ESLint y Prettier.
  - `test`: Ejecuta Jest y Cypress en Docker.
  - `deploy`: Despliega si los jobs anteriores son exitosos.
- Validar accesibilidad y calidad de código.
- Ejemplo de job:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -f Dockerfile.jest .
      - run: docker run ...
      - run: docker build -f Dockerfile.cypress .
      - run: docker run ...
  deploy:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Desplegando..."
```

### 4. Husky: Pre-commit y Pre-push

- **Pre-commit:** Ejecuta Prettier, ESLint y linter de íconos.
- **Pre-push:** Ejecuta tests (Jest y Cypress en Docker).
- Solo se permite subir código si todo pasa correctamente.

### 5. Configuración de Dockerfiles y docker-compose

- `Dockerfile.jest`: Instala dependencias y ejecuta `npm run test`.
- `Dockerfile.cypress`: Instala dependencias y ejecuta Cypress.
- `docker-compose.yml`: Orquesta ambos servicios para testing simultáneo.

### 6. Integración en Hooks y Pipeline

- Los tests se ejecutan en Docker tanto en los hooks de Husky como en el pipeline CI/CD.
- Ejemplo de hook pre-push:

```bash
#!/bin/sh
npm run lint && docker build -f Dockerfile.jest . && docker run ... && docker build -f Dockerfile.cypress . && docker run ...
```

### 7. Buenas Prácticas y Troubleshooting

- Mantener los Dockerfiles actualizados y ligeros.
- Usar `.dockerignore` para evitar archivos innecesarios.
- Validar que los tests pasen localmente antes de hacer push.
- Revisar logs de GitHub Actions y Docker para troubleshooting.

### 8. Recomendaciones

- Documentar cambios y flujos en este archivo.
- Actualizar los ejemplos y comandos según evolucione el proyecto.
- Mantener la calidad y reproducibilidad en todo el flujo de trabajo.
