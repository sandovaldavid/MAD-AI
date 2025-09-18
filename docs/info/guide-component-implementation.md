# 🎯 Guía de Implementación de Componentes: Presentation Layer

**Última actualización:** 18 de septiembre de 2025

Esta guía define las reglas específicas y patrones de implementación para desarrollar componentes en la capa Presentation del proyecto MAD-AI, siguiendo los principios de Clean Architecture y el patrón Smart/Dumb Components.

## 📋 Tabla de Contenidos

1. [Reglas Generales de Implementación](#-reglas-generales-de-implementación)
2. [Smart Components: Reglas de Implementación](#-smart-components-reglas-de-implementación)
3. [Dumb Components: Reglas de Implementación](#-dumb-components-reglas-de-implementación)
4. [Reglas de Estilo y UI](#-reglas-de-estilo-y-ui)
5. [Patrones de Comunicación y Estado](#-patrones-de-comunicación-y-estado)
6. [Estructura de Archivos y Convenciones](#-estructura-de-archivos-y-convenciones)
7. [Checklist de Implementación](#-checklist-de-implementación)

---

## 🎯 Reglas Generales de Implementación

### ✅ Obligaciones Universales

- **SIEMPRE** usar `ChangeDetectionStrategy.OnPush` en todos los componentes
- **SIEMPRE** usar TypeScript strict mode sin excepciones
- **SIEMPRE** documentar interfaces y computed properties con JSDoc
- **SIEMPRE** implementar manejo de errores y estados de loading
- **SIEMPRE** seguir naming conventions consistentes
- **SIEMPRE** usar modern Angular signals en lugar de RxJS cuando sea posible

### ❌ Prohibiciones Universales

- **NUNCA** usar `any` type, siempre definir tipos específicos
- **NUNCA** importar directamente de `domain` o `infrastructure`
- **NUNCA** usar `HttpClient` o servicios de infraestructura directamente
- **NUNCA** implementar lógica de negocio en componentes
- **NUNCA** usar colores hardcodeados, solo la paleta personalizada
- **NUNCA** omitir accessibility attributes cuando sean requeridos

---

## 🧠 Smart Components: Reglas de Implementación

Los Smart Components son los **orquestadores** que conectan la UI con la lógica de aplicación a través de Facades.

### ✅ Qué DEBE hacer un Smart Component

#### **1. Inyección y Gestión de Facades**

```typescript
// ✅ CORRECTO: Inyectar facades específicos según la responsabilidad
private readonly authFacade = inject(AuthFacade);
private readonly usersFacade = inject(UsersFacade);
private readonly titleService = inject(TitleService);
```

#### **2. Estado Reactivo con Computed Properties**

```typescript
// ✅ CORRECTO: Transformar datos del facade para la UI
readonly user = computed(() => this.authFacade.user());
readonly isLoading = computed(() => this.usersFacade.loading());

readonly userDisplayData = computed(() => {
  const currentUser = this.user();
  return currentUser ? {
    displayName: `${currentUser.firstName} ${currentUser.lastName}`,
    roleLabel: currentUser.role || 'User',
    statusClass: `status-${currentUser.status?.toLowerCase() || 'active'}`
  } : null;
});
```

#### **3. Delegación de Operaciones de Negocio**

```typescript
// ✅ CORRECTO: Delegar al facade, manejar resultado
async updateUserProfile(data: UserUpdateData): Promise<void> {
  try {
    await this.usersFacade.updateProfile(data);
    // Opcionalmente mostrar feedback de éxito
  } catch (error) {
    // El facade ya maneja el error, opcionalmente mostrar UI feedback
    console.error('Profile update failed:', error);
  }
}
```

#### **4. Gestión de Servicios de UI**

```typescript
// ✅ CORRECTO: Configurar servicios de presentación
ngOnInit(): void {
  this.titleService.setTitle('User Profile');
  this.breadcrumbService.setBreadcrumbs([
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Profile', route: '/profile' }
  ]);
}
```

### ❌ Qué NO DEBE hacer un Smart Component

#### **1. Lógica de Negocio**

```typescript
// ❌ INCORRECTO: Implementar reglas de negocio
if (user.age >= 18 && user.status === 'ACTIVE') {
  // Esta lógica debe estar en el Domain
}

// ✅ CORRECTO: Delegar al facade/domain
readonly canVote = computed(() => this.user()?.canVote() || false);
```

#### **2. Manipulación Compleja de Estado**

```typescript
// ❌ INCORRECTO: Estado complejo en el componente
private userStatus$ = new BehaviorSubject<UserStatus>('idle');
private errors$ = new BehaviorSubject<string[]>([]);

// ✅ CORRECTO: El facade maneja el estado
readonly status = computed(() => this.usersFacade.status());
readonly errors = computed(() => this.usersFacade.errors());
```

#### **3. Validación de Reglas de Negocio**

```typescript
// ❌ INCORRECTO: Validar reglas en el componente
isValidEmail(email: string): boolean {
  return email.includes('@') && email.length > 5;
}

// ✅ CORRECTO: El domain/facade valida
readonly isFormValid = computed(() => this.facade.isDataValid());
```

---

## 🎨 Dumb Components: Reglas de Implementación

Los Dumb Components son **componentes puramente presentacionales** que solo manejan UI y reciben toda la data necesaria del parent.

### ✅ Qué DEBE hacer un Dumb Component

#### **1. Modern Angular Input/Output Pattern**

```typescript
// ✅ CORRECTO: Usar input()/output() signals
userData = input<UserProfileData | null>(null);
loading = input<boolean>(false);

// ✅ CORRECTO: Outputs específicos y descriptivos
profileUpdate = output<UserFormData>();
profileCancel = output<void>();
```

#### **2. Estado UI Puro con Signals**

```typescript
// ✅ CORRECTO: Solo estado de UI interno
private readonly _isExpanded = signal(false);
private readonly _validationErrors = signal<Record<string, string>>({});

readonly isExpanded = computed(() => this._isExpanded());
readonly hasErrors = computed(() => Object.keys(this._validationErrors()).length > 0);
```

#### **3. Efectos para Sincronización con Parent**

```typescript
// ✅ CORRECTO: Sincronizar con input data usando effect
constructor() {
  effect(() => {
    const userData = this.userData();
    if (userData) {
      this._originalData.set({ ...userData });
      this.resetFormToData(userData);
    }
  });
}
```

#### **4. Computed Properties para UI Logic**

```typescript
// ✅ CORRECTO: Lógica de presentación pura
readonly submitButtonLabel = computed(() =>
  this.loading() ? 'Saving...' : 'Save Changes'
);

readonly hasUnsavedChanges = computed(() => {
  const original = this._originalData();
  const current = this.getCurrentFormData();
  return JSON.stringify(original) !== JSON.stringify(current);
});
```

#### **5. Event Handlers Específicos**

```typescript
// ✅ CORRECTO: Handlers que solo actualizan estado y emiten eventos
onEmailChange(value: string): void {
  this._emailValue.set(value);
  this.validateField('email', value);
}

onSubmit(): void {
  if (this.isFormValid() && this.hasUnsavedChanges()) {
    const formData = this.buildFormData();
    this.profileUpdate.emit(formData);
  }
}
```

### ❌ Qué NO DEBE hacer un Dumb Component

#### **1. Inyección de Facades o Servicios de Estado**

```typescript
// ❌ INCORRECTO: Inyectar facades
private readonly usersFacade = inject(UsersFacade);

// ✅ CORRECTO: Solo servicios de UI si es necesario
private readonly fb = inject(FormBuilder); // UI utility only
```

#### **2. Lógica de Negocio o Validaciones Complejas**

```typescript
// ❌ INCORRECTO: Reglas de negocio en dumb component
validateUserAge(age: number): boolean {
  return age >= 18 && age <= 65; // Business rule
}

// ✅ CORRECTO: Solo validaciones de UI
validateRequired(value: string): boolean {
  return value.trim().length > 0; // UI validation only
}
```

#### **3. Llamadas HTTP o Persistencia**

```typescript
// ❌ INCORRECTO: Operaciones de persistencia
async saveData(): Promise<void> {
  await this.http.post('/api/users', this.formData);
}

// ✅ CORRECTO: Solo emitir eventos
onSave(): void {
  this.dataUpdate.emit(this.formData);
}
```

---

## 🎨 Reglas de Estilo y UI

### ✅ Implementación Obligatoria de Tailwind CSS v4.1

#### **1. Uso Exclusivo de Paleta Personalizada**

```css
/* ✅ CORRECTO: Usar colores de la paleta */
.btn-primary {
  @apply bg-primary-500 text-white hover:bg-primary-700;
}

/* ❌ INCORRECTO: Colores hardcodeados */
.btn-wrong {
  background-color: #3b82f6; /* Prohibido */
}
```

#### **2. Directiva @apply para Clases Semánticas**

```css
/* ✅ CORRECTO: Agrupar utilidades con @apply */
.form-input {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md
         focus:ring-2 focus:ring-primary-500 transition-colors;
}

/* ❌ INCORRECTO: Utilidades en HTML */
<input class="border border-gray-300 px-4 py-2 rounded-md focus:ring-2">
```

#### **3. Soporte Obligatorio para Dark Mode**

```css
/* ✅ CORRECTO: Variantes dark mode */
.card {
  @apply bg-white dark:bg-background border border-gray-200 dark:border-gray-700;
}
```

#### **4. Referencia al Archivo de Estilos**

```css
/* ✅ OBLIGATORIO: En todo archivo .css de componente */
@reference '../../../../../styles.css';

.component-styles {
  @apply /* ... */;
}
```

### ✅ Reglas de Accesibilidad

#### **1. Contraste y Visibilidad**

- **OBLIGATORIO:** Contraste mínimo 4.5:1 para texto normal
- **OBLIGATORIO:** Contraste mínimo 3:1 para texto grande
- **OBLIGATORIO:** Focus indicators visibles para navegación por teclado

#### **2. Semantic HTML y ARIA**

```html
<!-- ✅ CORRECTO: Semantic HTML + ARIA -->
<button
  type="button"
  aria-label="Save user profile changes"
  [attr.aria-pressed]="isActive()"
  [disabled]="isLoading()"
  class="btn-primary">
  Save Changes
</button>

<!-- ❌ INCORRECTO: Div como botón sin semántica -->
<div (click)="save()" class="btn-primary">Save</div>
```

---

## 📡 Patrones de Comunicación y Estado

### ✅ Flujo Unidireccional de Datos

#### **1. Smart → Dumb: Data Flow**

```typescript
// Smart Component
readonly userData = computed(() => this.authFacade.user());
readonly isLoading = computed(() => this.authFacade.loading());

// Template
<app-user-form
  [userData]="userData()"
  [loading]="isLoading()"
  (userUpdate)="handleUserUpdate($event)">
</app-user-form>
```

#### **2. Dumb → Smart: Event Flow**

```typescript
// Dumb Component
userUpdate = output<UserFormData>();

onSubmit(): void {
  if (this.isValid()) {
    this.userUpdate.emit(this.getFormData());
  }
}

// Smart Component
async handleUserUpdate(data: UserFormData): Promise<void> {
  await this.usersFacade.updateUser(data);
}
```

### ✅ Manejo de Estado Reactivo

#### **1. Computed Properties para Transformaciones**

```typescript
// ✅ CORRECTO: Transformar data reactivamente
readonly displayUsers = computed(() => {
  const users = this.usersFacade.users();
  const filter = this.searchTerm();

  return users
    .filter(user => user.name.includes(filter))
    .map(user => ({
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      statusClass: `status-${user.status.toLowerCase()}`
    }));
});
```

#### **2. Effects para Side Effects**

```typescript
// ✅ CORRECTO: Effects para sincronización
constructor() {
  effect(() => {
    const user = this.authFacade.user();
    if (user) {
      this.titleService.setTitle(`Welcome ${user.firstName}`);
    }
  });
}
```

---

## 📁 Estructura de Archivos y Convenciones

### ✅ Organización por Feature

```
presentation/
├── pages/
│   └── users/
│       ├── pages/
│       │   ├── users-list/
│       │   │   ├── users-list.component.ts      # Smart Component
│       │   │   ├── users-list.component.html
│       │   │   └── users-list.component.css
│       │   └── user-detail/
│       │       ├── user-detail.component.ts     # Smart Component
│       │       ├── user-detail.component.html
│       │       └── user-detail.component.css
│       └── components/
│           ├── user-form/
│           │   ├── user-form.component.ts       # Dumb Component
│           │   ├── user-form.component.html
│           │   └── user-form.component.css
│           └── user-table/
│               ├── user-table.component.ts      # Dumb Component
│               ├── user-table.component.html
│               └── user-table.component.css
```

### ✅ Naming Conventions

#### **1. Archivos y Clases**

```typescript
// ✅ CORRECTO: Naming patterns
// Smart Components (Pages)
export class UsersListPage implements OnInit {} // Page suffix

// Dumb Components
export class UserFormComponent {} // Component suffix
export class UserTableComponent {}
```

#### **2. Selectores CSS**

```typescript
// ✅ CORRECTO: Selectores descriptivos
@Component({
  selector: 'app-users-list',        // Smart: feature-action
  selector: 'app-user-form',         // Dumb: entity-type
})
```

### ✅ Imports y Exports

#### **1. Import Order**

```typescript
// ✅ CORRECTO: Orden de imports
// 1. Angular core
import { Component, computed, signal } from '@angular/core';

// 2. Angular common/forms
import { CommonModule } from '@angular/common';

// 3. Application layer (facades)
import { UsersFacade } from '@application/facades/users.facade';

// 4. Presentation layer (UI components)
import { Button } from '@presentation/shared/ui/button/button';

// 5. Local imports
import { UserFormData } from './types/user-form.types';
```

#### **2. Path Aliases Obligatorios**

```typescript
// ✅ CORRECTO: Usar aliases definidos
import { UsersFacade } from '@application/facades/users.facade';
import { Button } from '@presentation/shared/ui/button/button';

// ❌ INCORRECTO: Paths relativos largos
import { UsersFacade } from '../../../application/facades/users.facade';
```

---

## ✅ Checklist de Implementación

### 📋 Antes de Crear un Smart Component

- [ ] ¿He identificado qué Facade(s) necesito inyectar?
- [ ] ¿He definido las transformaciones de datos necesarias como computed properties?
- [ ] ¿He planificado cómo manejar loading states y errores?
- [ ] ¿He identificado los servicios de UI necesarios (TitleService, BreadcrumbService)?
- [ ] ¿He definido la estructura de navigation/routing si aplica?

### 📋 Antes de Crear un Dumb Component

- [ ] ¿He definido claramente las interfaces de input data?
- [ ] ¿He planificado qué eventos necesito emitir al parent?
- [ ] ¿He identificado qué estado UI interno necesito manejar?
- [ ] ¿He definido las validaciones de UI (no de negocio)?
- [ ] ¿He asegurado que NO necesito inyectar facades?

### 📋 Durante la Implementación

- [ ] ¿Estoy usando `ChangeDetectionStrategy.OnPush`?
- [ ] ¿Estoy usando modern Angular signals en lugar de RxJS donde es posible?
- [ ] ¿Estoy documentando interfaces y computed properties?
- [ ] ¿Estoy siguiendo la paleta de colores personalizada?
- [ ] ¿Estoy usando `@apply` en lugar de utilidades inline?
- [ ] ¿Estoy implementando soporte para dark mode?

### 📋 Testing y Validación

- [ ] ¿He implementado unit tests apropiados para el tipo de componente?
- [ ] ¿He validado accesibilidad (contraste, focus, ARIA)?
- [ ] ¿He probado el flujo de datos parent → child → parent?
- [ ] ¿He verificado que no hay violaciones arquitecturales?
- [ ] ¿He verificado performance con OnPush strategy?

### 📋 Antes de Commit

- [ ] ¿Pasa ESLint sin errores?
- [ ] ¿Pasa TypeScript strict checks?
- [ ] ¿He ejecutado tests unitarios?
- [ ] ¿He verificado que el build de producción funciona?
- [ ] ¿He documentado cualquier decisión arquitectural no obvia?

---

## 🎯 Ejemplos de Implementación Completa

### Smart Component Template

```typescript
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, UserTableComponent, UserFiltersComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListPage implements OnInit {
  private readonly usersFacade = inject(UsersFacade);
  private readonly titleService = inject(TitleService);

  readonly users = computed(() => this.usersFacade.users());
  readonly loading = computed(() => this.usersFacade.loading());
  readonly error = computed(() => this.usersFacade.error());

  readonly displayUsers = computed(() => {
    const users = this.users();
    return users.map((user) => ({
      id: user.id,
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      statusClass: `status-${user.status.toLowerCase()}`,
    }));
  });

  ngOnInit(): void {
    this.titleService.setTitle('Users Management');
    this.usersFacade.loadUsers();
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersFacade.deleteUser(userId);
  }
}
```

### Dumb Component Template

```typescript
@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent {
  users = input<UserDisplayData[]>([]);
  loading = input<boolean>(false);

  userDelete = output<string>();
  userEdit = output<string>();

  private readonly _selectedUsers = signal<Set<string>>(new Set());

  readonly selectedUsers = computed(() => this._selectedUsers());
  readonly hasSelection = computed(() => this._selectedUsers().size > 0);

  onDeleteUser(userId: string): void {
    this.userDelete.emit(userId);
  }

  onEditUser(userId: string): void {
    this.userEdit.emit(userId);
  }

  toggleUserSelection(userId: string): void {
    const selected = new Set(this._selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this._selectedUsers.set(selected);
  }
}
```

---

## 📚 Referencias

- [Guía Presentation Layer](./guide-presentation.md)
- [Guía Application Layer](./guide-application.md)
- [Guía de Estilos](./guide-styles.md)
- [Diagramas de Arquitectura](./diagramas-layers.md)
- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Tailwind CSS v4.1 Documentation](https://tailwindcss.com/)

Esta guía debe ser la referencia principal para implementar componentes que cumplan con los estándares arquitecturales y de calidad del proyecto MAD-AI.
