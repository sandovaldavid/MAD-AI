# 📘 Guía de carpetas de dominio

### 🔹 `/values-objects`

- Contienen **objetos inmutables** con validaciones de dominio.
- Reglas:
  - Siempre inmutables.
  - Validación en constructor (throw ValidationError).
  - Nunca deben contener lógica de negocio.

- Ejemplo: `Email`, `AccessLevel`, `PhoneNumber`.

---

### 🔹 `/entities`

- Representan **agregados o entidades de negocio**.
- Contienen identidad (`id`) y lógica de negocio relacionada a sí mismas.
- Ejemplo: `User`, `Role`, `Session`.

---

### 🔹 `/services`

- **Domain Services**: lógica de negocio que no encaja en una entidad.
- Reglas:
  - Puras funciones de dominio.
  - Trabajan con Entities y VOs.

- Ejemplo: `PermissionService`, `PasswordPolicyService`.

---

### 🔹 `/enums`

- Enumeraciones del dominio.
- Ejemplo: `RoleName`, `AccessLevel`.
- Aquí también puedes centralizar constantes de dominio (en vez de `utils`).

---

### 🔹 `/errors`

- Entidades + tipos de errores de dominio.
- Ejemplo:
  - `validation-error.entity.ts`
  - `business-rule-error.entity.ts`
  - `domain-error-type.enum.ts`

---

### 🔹 `/events`

- Eventos que ocurren dentro del dominio.
- Ejemplo:
  - `user-registered.event.ts`
  - `password-changed.event.ts`

---

### 🔹 `/repositories`

- Interfaces de Repositorios y contratos de repositorios(types que reciben las interfaces de las funciones en los repositories de domain)
- Ejemplo:
  - `user.repository.ts` -> interfaces de las funciones
  - `user.contract.ts` -> types que usan las interfaces de las funciones

---

### 🔹 `/specifications`

- Expresan **reglas de negocio reutilizables** que pueden ser evaluadas sin duplicar lógica.
- Ejemplo:
  - `UserMustBeAdult.spec.ts`
  - `RoleMustHaveValidPermissions.spec.ts`

---

# ✅ Recomendaciones para Value Objects

1. **Inmutables**: no exponer setters.
2. **Validación en constructor**: nunca se construye inválido.
3. **Solo dominio, no negocio**:
   - ✔️ Correcto: validar que un Email tenga formato válido.
   - ❌ Incorrecto: decidir si un usuario puede loguearse según su Email.

4. **Throw ValidationError** al romper invariantes.
5. **Tests unitarios cercanos** (`.spec.ts` junto al VO).
