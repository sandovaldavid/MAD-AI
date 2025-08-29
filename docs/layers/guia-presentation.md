# Guía Arquitectónica para Presentation Layer

## QUÉ ES Presentation

Presentation es la capa que **maneja la interacción con el usuario** a través de interfaces visuales. Se encarga de mostrar información y capturar acciones del usuario, delegando toda la lógica a Application.

## PRINCIPIO FUNDAMENTAL

Presentation **SOLO PRESENTA**. No contiene lógica de negocio, no contiene orquestación compleja. Es únicamente el canal de comunicación entre el usuario y Application.

## REGLA DE DECISIÓN

**Pregunta clave:** "¿Este código está relacionado exclusivamente con cómo mostrar información o capturar input del usuario?"

- Si SÍ → Va en Presentation
- Si NO → Va en otra capa

## RESOLUCIÓN DEL PROBLEMA: ¿Dónde va /shared?

**DECISIÓN ARQUITECTÓNICA:** `/shared` debe ir **DENTRO** de Presentation.

**JUSTIFICACIÓN:**

- Los componentes de UI son específicos de la tecnología de presentación
- Si cambias de Angular a React, los componentes shared no se reutilizan
- Shared maneja concerns específicos de UI (styling, layouts, interacciones)

## ESTRUCTURA OBLIGATORIA

```typescript
presentation/
├── shared/                    # Componentes UI reutilizables
├── pages/                     # Páginas principales de la aplicación
├── layouts/                   # Layouts y estructuras principales
├── guards/                    # Guards específicos de routing
├── interceptors/              # Interceptors específicos de UI
├── pipes/                     # Pipes de transformación para templates
├── services/                  # Servicios específicos de UI
└── mappers/                   # Transformadores Application→UI
```

## DEFINICIÓN DETALLADA POR CARPETA

### `/shared` - Componentes UI reutilizables

**QUÉ VA:**

- Componentes de UI sin lógica de negocio
- Componentes que se reutilizan en múltiples páginas
- Directivas para comportamientos de UI
- Servicios técnicos de UI (modal, toast, theme)

**QUÉ NO VA:**

- Lógica de negocio
- Llamadas a APIs
- Validaciones de dominio
- Estado complejo de aplicación

**ESTRUCTURA REQUERIDA:**

```typescript
shared/
├── components/
│   ├── buttons/
│   │   ├── primary-button.component.ts
│   │   └── secondary-button.component.ts
│   ├── forms/
│   │   ├── input-field.component.ts
│   │   └── form-validator.directive.ts
│   ├── modals/
│   │   └── confirmation-modal.component.ts
│   └── tables/
│       └── data-table.component.ts
├── services/
│   ├── modal.service.ts       # Manejo técnico de modales
│   ├── theme.service.ts       # Cambio de tema UI
│   └── toast.service.ts       # Notificaciones visuales
└── pipes/
    ├── date-format.pipe.ts    # Formateo para mostrar
    └── currency-format.pipe.ts
```

**EJEMPLO DE COMPONENTE CORRECTO:**

```typescript
@Component({
  selector: 'app-primary-button',
  template: `
    <button [class]="buttonClasses" [disabled]="disabled" (click)="handleClick()">
      <ng-content></ng-content>
    </button>
  `,
})
export class PrimaryButtonComponent {
  @Input() disabled: boolean = false;
  @Input() variant: 'solid' | 'outline' = 'solid';
  @Output() clicked = new EventEmitter<void>();

  get buttonClasses(): string {
    // Solo lógica de presentación
    return `btn ${this.variant} ${this.disabled ? 'disabled' : ''}`;
  }

  handleClick(): void {
    if (!this.disabled) {
      this.clicked.emit(); // Solo emit, no lógica
    }
  }
}
```

### `/pages` - Páginas principales de la aplicación

**QUÉ VA:**

- Componentes que representan rutas/páginas completas
- Coordinación de componentes shared dentro de una página
- Manejo de estado específico de la página
- Integración con facades de Application

**QUÉ NO VA:**

- Lógica de negocio
- Llamadas directas a repositories
- Validaciones complejas (van en Application/Domain)

**ESTRUCTURA REQUERIDA:**

```typescript
pages/
├── auth/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   └── register/
│       └── register.component.ts
├── dashboard/
│   └── dashboard.component.ts
└── user-management/
    ├── user-list/
    └── user-detail/
```

**PATRÓN OBLIGATORIO PARA PÁGINAS:**

```typescript
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authFacade: AuthFacade,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Solo inicialización de UI
    this.setupFormValidations();
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const credentials = this.mapFormToRequest();
      const result = await this.authFacade.login(credentials);

      this.toastService.showSuccess('Welcome back!');
      this.router.navigate([result.redirectUrl]);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading = false;
    }
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  private mapFormToRequest(): LoginRequest {
    const value = this.loginForm.value;
    return {
      email: value.email,
      password: value.password,
      rememberMe: value.rememberMe,
    };
  }

  private handleError(error: any): void {
    if (error instanceof ApplicationError) {
      this.error = error.userMessage;
      this.toastService.showError(error.userMessage);
    } else {
      this.error = 'An unexpected error occurred';
      this.toastService.showError('Something went wrong');
    }
  }
}
```

### `/layouts` - Estructuras principales de la aplicación

**QUÉ VA:**

- Layouts base de la aplicación
- Headers, sidebars, footers principales
- Navegación principal
- Estructura responsive

**EJEMPLO:**

```typescript
layouts/
├── main-layout/
│   ├── main-layout.component.ts
│   ├── header/
│   ├── sidebar/
│   └── footer/
├── auth-layout/
└── minimal-layout/
```

### `/guards` - Protección de rutas específica de UI

**QUÉ VA:**

- Guards que protegen rutas basándose en Application facades
- Lógica de redirección específica de UI
- Guards que manejan estado de loading/navegación

**QUÉ NO VA:**

- Lógica compleja de autorización (va en Application)
- Validaciones de dominio

**EJEMPLO CORRECTO:**

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authFacade: AuthFacade,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(): boolean {
    if (this.authFacade.isAuthenticated()) {
      return true;
    }

    this.toastService.showWarning('Please log in to access this page');
    this.router.navigate(['/auth/login']);
    return false;
  }
}
```

### `/services` - Servicios específicos de UI

**QUÉ VA:**

- Servicios de modal, toast, theme
- Servicios de navegación y routing
- Servicios de estado de UI (loading, sidebar abierto/cerrado)

**QUÉ NO VA:**

- Servicios con lógica de negocio
- Servicios que llamen a APIs
- Servicios transversales (van en Core)

**EJEMPLO CORRECTO:**

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];

  showSuccess(message: string): void {
    this.addToast({ type: 'success', message, duration: 3000 });
  }

  showError(message: string): void {
    this.addToast({ type: 'error', message, duration: 5000 });
  }

  showWarning(message: string): void {
    this.addToast({ type: 'warning', message, duration: 4000 });
  }

  private addToast(toast: Toast): void {
    this.toasts.push(toast);
    setTimeout(() => this.removeToast(toast), toast.duration);
  }
}
```

### `/mappers` - Transformaciones UI específicas

**QUÉ VA:**

- Application types → UI models
- Mappers para formularios
- Transformaciones específicas de presentación

**EJEMPLO:**

```typescript
export class UserPresentationMapper {
  static toTableRow(user: UserSummary): UserTableRow {
    return {
      id: user.id,
      displayName: user.fullName,
      email: user.email,
      roleLabel: this.formatRoleLabel(user.role),
      statusBadge: this.getStatusBadge(user.status),
      lastActive: this.formatLastActive(user.lastActivityAt),
    };
  }

  private static formatRoleLabel(role: string): string {
    return role.replace('_', ' ').toUpperCase();
  }
}
```

### `/pipes` - Transformaciones para templates

**QUÉ VA:**

- Pipes de formateo para mostrar datos
- Transformaciones específicas de presentación
- Pipes de filtrado para listas

**EJEMPLO:**

```typescript
@Pipe({ name: 'userStatus' })
export class UserStatusPipe implements PipeTransform {
  transform(status: string): { label: string; class: string } {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'badge-success' };
      case 'inactive':
        return { label: 'Inactive', class: 'badge-warning' };
      default:
        return { label: 'Unknown', class: 'badge-secondary' };
    }
  }
}
```

## INTEGRACIÓN CON APPLICATION

**PATRÓN REQUERIDO:**

```typescript
// Presentation SOLO usa facades de Application
constructor(
  private userFacade: UserFacade,    // ✅ Correcto
  private authFacade: AuthFacade     // ✅ Correcto
) {}

// NUNCA uses directamente:
// private userRepository: UserRepository     ❌ Incorrecto
// private createUserUseCase: CreateUserUseCase ❌ Incorrecto
```

## MANEJO DE ERRORES EN PRESENTATION

**PATRÓN OBLIGATORIO:**

```typescript
async handleAction(): Promise<void> {
  try {
    await this.facade.performAction(data);
    this.showSuccessMessage();
  } catch (error) {
    if (error instanceof ApplicationError) {
      this.showUserFriendlyError(error.userMessage);
      if (error.suggestedAction) {
        this.showActionSuggestion(error.suggestedAction);
      }
    } else {
      this.showGenericError();
    }
  }
}
```

## REGLAS DE DEPENDENCIAS

**Presentation PUEDE usar:**

- Application (solo facades)
- Core (solo logging para debugging de UI)
- Framework específico (Angular/React)
- Librerías de UI

**Presentation NO PUEDE usar:**

- Domain directamente
- Infrastructure directamente
- Use cases directamente

## PROHIBICIONES ABSOLUTAS

**NUNCA hagas esto en Presentation:**

- Validaciones de reglas de negocio
- Cálculos complejos
- Llamadas directas a APIs
- Lógica de persistencia
- Instanciar entidades de Domain

## SEÑALES DE ALARMA

Si encuentras esto en Presentation, está mal ubicado:

- Lógica if/else sobre reglas de negocio
- Cálculos matemáticos complejos
- Imports de Domain entities
- Imports de Infrastructure services
- Validaciones que no sean de formato de UI

## TEST DE VALIDACIÓN

**Pregunta final:** "¿Este código sería completamente diferente si cambio de Angular a React?"

- Si SÍ → Está correctamente en Presentation
- Si NO → Probablemente contiene lógica que pertenece a otra capa

**Presentation debe ser específica del framework y mecanismo de UI que uses.**
