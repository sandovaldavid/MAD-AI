# Estructura general

```
src/app/
  app.config.ts
  app.routes.ts
  di/                   # tokens y provider bundles por feature
  domain/               # negocio puro (entities/VOs/ports)
  application/          # use-cases y facades (orquestación)
  infrastructure/       # detalles técnicos (HTTP/DTOs/mappers/repos/servicios)
  core/                 # servicios y cross-cutting de la app (singleton)
  presentation/         # UI (pages/components/models/view-mappers)
  shared/               # UI reusable (botones, charts wrappers, pipes, utils)
```

---

# di/ (Composition Root)

**Qué va aquí:** tokens de inyección y “provider bundles” por feature (auth, users, recursos, proyectos…).
**Por qué:** conectas **ports** (domain) → **implementaciones** (infra) sin acoplar capas.

```
di/
  tokens.ts
  provide-auth.ts
  provide-users.ts
  provide-resources.ts
```

**Ejemplos**

```ts
// di/tokens.ts
import { InjectionToken } from '@angular/core';
import type { AuthRepository } from '../domain/repositories/auth.repository';
import type { UserRepository } from '../domain/repositories/user.repository';
import type { TokenStorePort } from '../domain/ports/token-store.port';
import type { ClockPort } from '../domain/ports/clock.port';

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
export const USER_REPOSITORY = new InjectionToken<UserRepository>('USER_REPOSITORY');
export const TOKEN_STORE_PORT = new InjectionToken<TokenStorePort>('TOKEN_STORE_PORT');
export const CLOCK_PORT = new InjectionToken<ClockPort>('CLOCK_PORT');
```

```ts
// di/provide-auth.ts
import { Provider } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AUTH_REPOSITORY, TOKEN_STORE_PORT, CLOCK_PORT } from './tokens';
import { HttpAuthRepository } from '../infrastructure/repositories/http-auth.repository';
import { LocalStorageTokenStore } from '../infrastructure/services/local-storage-token-store.service';
import { SystemClock } from '../infrastructure/services/system-clock.service';
import { authInterceptor } from '../infrastructure/http/auth.interceptor';
import { AuthFacade } from '../application/facades/auth.facade';

export function provideAuth(): Provider[] {
    return [
        { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
        { provide: TOKEN_STORE_PORT, useClass: LocalStorageTokenStore },
        { provide: CLOCK_PORT, useClass: SystemClock },
        AuthFacade,
        provideHttpClient(withInterceptors([authInterceptor])),
    ];
}
```

---

# domain/ (Negocio puro, sin Angular)

**Qué va aquí:** Entities, Value Objects, reglas de negocio, **ports**:

-   `repositories/` (puertos de acceso a datos de entidades)
-   `ports/` (otros puertos técnicos: clock, storage, email, cache…)

```
domain/
  entities/
    user.entity.ts
    session.entity.ts
  value-objects/
    email.vo.ts
    access-token.vo.ts
    refresh-token.vo.ts
  repositories/
    user.repository.ts
    auth.repository.ts
  ports/
    token-store.port.ts
    clock.port.ts
```

**Ejemplo**

```ts
// domain/repositories/user.repository.ts
import { User } from '../entities/user.entity';
export interface UserRepository {
    getById(id: string): Promise<User>;
    list(): Promise<User[]>;
    save(user: User): Promise<void>;
}
```

---

# application/ (Orquestación, sin Angular UI)

**Qué va aquí:**

-   `use-cases/` (unidad atómica de negocio: get/list/save…)
-   `facades/` (opcional pero recomendado): **orquestan varios use cases** y exponen **signals/estado** a la UI.

```
application/
  use-cases/
    users/
      get-user-by-id.usecase.ts
      list-users.usecase.ts
  facades/
    auth.facade.ts
    users.facade.ts
```

**Ejemplos**

```ts
// application/use-cases/users/list-users.usecase.ts
import { inject } from '@angular/core';
import { USER_REPOSITORY } from '../../di/tokens';
import { UserRepository } from '../../domain/repositories/user.repository';
export class ListUsers {
    private repo = inject<UserRepository>(USER_REPOSITORY);
    execute() {
        return this.repo.list();
    }
}
```

```ts
// application/facades/users.facade.ts
import { inject, signal, computed } from '@angular/core';
import { ListUsers } from '../use-cases/users/list-users.usecase';
export class UsersFacade {
    private listUsers = inject(ListUsers);
    private _loading = signal(false);
    private _error = signal<string | null>(null);
    private _users = signal<any[]>([]);
    readonly loading = computed(() => this._loading());
    readonly users = computed(() => this._users());
    readonly error = computed(() => this._error());
    async refresh() {
        this._loading.set(true);
        this._error.set(null);
        try {
            this._users.set(await this.listUsers.execute());
        } catch (e: any) {
            this._error.set(e?.message ?? 'Error');
        } finally {
            this._loading.set(false);
        }
    }
}
```

> Nota: el **componente** usa solo la **facade** (no casos directos), y queda muy limpio.

---

# infrastructure/ (Detalles técnicos)

**Qué va aquí:** todo lo que toca frameworks/red/host: HTTP, DTOs/mappers, repositorios HTTP, servicios técnicos.

```
infrastructure/
  dtos/
    user.dto.ts
    auth.dto.ts
  mappers/
    user.mapper.ts
    auth.mapper.ts
  repositories/
    http-user.repository.ts
    http-auth.repository.ts
  services/
    local-storage-token-store.service.ts
    system-clock.service.ts
  http/
    auth-http.orchestrator.ts
    auth.interceptor.ts
```

**Ejemplos**

```ts
// infrastructure/dtos/user.dto.ts (forma exacta API)
export interface UserDTO {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    is_active: boolean;
    created_at: string;
}
```

```ts
// infrastructure/mappers/user.mapper.ts (DTO ⇄ Entity)
import { UserDTO } from '../dtos/user.dto';
import { User } from '../../domain/entities/user.entity';
export const UserMapper = {
    toEntity(dto: UserDTO): User {
        return User.create({
            id: dto.id,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            roles: dto.roles as any,
            active: dto.is_active,
            createdAt: new Date(dto.created_at),
        });
    },
};
```

```ts
// infrastructure/repositories/http-user.repository.ts (implementa port)
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserDTO } from '../dtos/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../../domain/entities/user.entity';

export class HttpUserRepository implements UserRepository {
    private http = inject(HttpClient);
    private API = '/api/users';
    async list(): Promise<User[]> {
        const dtos = await firstValueFrom(this.http.get<UserDTO[]>(this.API));
        return dtos.map(UserMapper.toEntity);
    }
    async getById(id: string) {
        const dto = await firstValueFrom(this.http.get<UserDTO>(`${this.API}/${id}`));
        return UserMapper.toEntity(dto);
    }
    async save(user: User) {
        /* post/put con mapper inverso si hace falta */
    }
}
```

```ts
// infrastructure/http/auth.interceptor.ts (boundary HTTP)
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthHttpOrchestrator } from './auth-http.orchestrator';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const orch = inject(AuthHttpOrchestrator);
    return orch.ensureFreshAccess$().pipe(
        switchMap((header) =>
            next(orch.withAuth(req, header)).pipe(
                catchError((err) => {
                    if (err instanceof HttpErrorResponse && err.status === 401) {
                        return orch
                            .forceRefreshOnce$()
                            .pipe(switchMap((h2) => next(orch.withAuth(req, h2))));
                    }
                    return throwError(() => err);
                })
            )
        )
    );
};
```

---

Sí, **mantén la capa `core/`**. En tu arquitectura sirve para **preparar el terreno de la app** (servicios globales, guards e interceptores transversales, wiring y configuración), sin meter reglas de dominio. Piensa en `core/` como _“infraestructura de la UI”_ y en `shared/` como _“componentes puros reutilizables”_.

Aquí va la estructura **completa** integrada con `core/`, qué va en cada carpeta y mini‑ejemplos.

# Estructura general (con `core/`)

```
src/app/
  app.config.ts
  app.routes.ts
  di/                   # tokens y provider bundles por feature
  domain/               # negocio puro (entities/VOs/ports)
  application/          # use-cases y facades (orquestación)
  infrastructure/       # detalles técnicos (HTTP/DTOs/mappers/repos/servicios)
  core/                 # servicios y cross-cutting de la app (singleton)
  presentation/         # UI (pages/components/models/view-mappers)
  shared/               # UI reusable (botones, charts wrappers, pipes, utils)
```

---

# core/ (capa transversal de la app)

**Objetivo:** elementos globales y de enrutamiento que **no** contienen lógica de dominio, pero sí ayudan a la UI y a la “plomería” de la app.

```
core/
  core-services/
    notification.service.ts   # toasts/snackbars centralizados (signals)
    theme.service.ts          # modo oscuro/tema (usa tus colors.css)
    layout.service.ts         # estados globales de layout (sidebar, etc.)
    app-store.service.ts      # (opcional) estado global mínimo (signals)
  guards/
    auth.guard.ts             # protege rutas (lee de AuthFacade)
    role.guard.ts             # protege por rol/permisos
  interceptors/
    error.interceptor.ts      # manejo de 4xx/5xx transversal (toasts, redirecciones)
    logging.interceptor.ts    #  trazas de red en dev
    # Nota: el auth.interceptor lo registras desde provideAuth() (feature auth)
  providers/
    provide-core.ts           # paquete de providers globales (servicios + interceptores core)
  config/
    environment.token.ts      # token para ENV
```

### Mini‑ejemplos (core)

**NotificationService (signals)**

```ts
// core/core-services/notification.service.ts
import { Injectable, signal } from '@angular/core';

export type Toast = {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    msg: string;
    timeout?: number;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
    readonly toasts = signal<Toast[]>([]);
    push(t: Omit<Toast, 'id'>) {
        const id = crypto.randomUUID();
        this.toasts.update((list) => [...list, { id, ...t }]);
        if (t.timeout ?? 3500) setTimeout(() => this.dismiss(id), t.timeout ?? 3500);
    }
    dismiss(id: string) {
        this.toasts.update((list) => list.filter((x) => x.id !== id));
    }
    success(msg: string) {
        this.push({ type: 'success', msg, timeout: 3000 });
    }
    error(msg: string) {
        this.push({ type: 'error', msg, timeout: 5000 });
    }
}
```

**ThemeService (dark/light usando tus tokens de color)**

```ts
// core/core-services/theme.service.ts
import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly isDark = signal<boolean>(false);
    init() {
        document.documentElement.classList.toggle('dark', this.isDark());
    }
    toggle() {
        this.isDark.update((v) => !v);
        document.documentElement.classList.toggle('dark', this.isDark());
    }
}
```

**AuthGuard (delegando en la facade)**

```ts
// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '../../application/facades/auth.facade';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
    const hasToken = !!auth.getAccessHeaderOrNull();
    if (hasToken) return true;
    router.navigate(['/auth/login']);
    return false;
};
```

**ErrorInterceptor (core, transversal)**

```ts
// core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../core-services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notify = inject(NotificationService);
    return next(req).pipe({
        error: (err) => {
            if (err instanceof HttpErrorResponse) {
                if (err.status >= 500) notify.error('Error del servidor. Intenta más tarde.');
                else if (err.status === 403) notify.error('No tienes permisos para esta acción.');
            }
            throw err;
        },
    } as any);
};
```

**Provider bundle de core**

```ts
// core/providers/provide-core.ts
import { Provider } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from '../interceptors/error.interceptor';

export function provideCore(): Provider[] {
    return [
        // Interceptores transversales no atados a un feature específico
        provideHttpClient(withInterceptors([errorInterceptor])),
    ];
}
```

> **Dónde registrar el auth interceptor**: mantenlo en `provideAuth()` (feature Auth). El **error/logging** queda en `provideCore()` para toda la app.

---

# ¿Cómo convive `core/` con el resto?

-   **`domain/`**: negocio puro (sin Angular).
-   **`application/`**: _use‑cases_ + **facades** (orquestación, pueden exponer signals).
-   **`infrastructure/`**: detalles técnicos (repos HTTP, DTOs/mappers, servicios de puertos como `LocalStorageTokenStore`, y el **AuthHttpOrchestrator + auth.interceptor** del feature **Auth**).
-   **`core/`**: servicios **globales** de la app (tema, notificaciones, guards, interceptores genéricos, providers globales).
-   **`shared/`**: UI reusable y utilidades puras (sin estado global ni conocimiento de features).
-   **`presentation/`**: páginas/componentes. Inyectan **facades** (no repos ni HttpClient).

---

# Infraestructura (recordatorio corto)

```
infrastructure/
  dtos/               # formas exactas de la API
  mappers/            # DTO ⇄ Entities (y opcionalmente Entities ⇄ ViewModel)
  repositories/       # implementaciones HTTP de ports de dominio
  services/           # implementaciones de ports técnicos (storage/clock/cache)
  http/               # boundary HTTP de features (p.ej. auth-http.orchestrator.ts, auth.interceptor.ts)
```

> El **AuthInterceptor** es específico del feature Auth (refresh, headers), por eso vive en `infrastructure/http` y se registra en `provideAuth()`.

---

# App bootstrap con `core/` + `auth`

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideCore } from './core/providers/provide-core';
import { provideAuth } from './di/provide-auth';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        ...provideCore(), // interceptores y servicios transversales
        ...provideAuth(), // auth (repos, token store, clock, interceptor de auth, facade)
    ],
};
```

---

# Diferencias rápidas: `core/` vs `shared/`

-   **core/** = singletons y wiring **global** (guards, interceptores, tema, notificaciones, layout).
-   **shared/** = **componentes puros reutilizables** (cards, tablas, charts wrappers), pipes, directives, utils. Nada de estado global.

---

# presentation/ (UI – Angular)

**Qué va aquí:** páginas, componentes y mappers a **ViewModels** si los usas. Nada de llamadas HTTP directas.

```
presentation/
  features/
    users/
      pages/
        users-list/
          users-list.component.ts
          users-list.component.html
          users-list.component.css
      mappers/
        user.view-mapper.ts     // Entity → Model para la UI (opcional)
      models/
        user.model.ts           // forma amigable para la vista
      users.routes.ts           // providers por feature + rutas lazy
```

**Ejemplos**

```ts
// presentation/features/users/models/user.model.ts
export interface UserModel {
    id: string;
    fullName: string;
    email: string;
    active: boolean;
    createdAt: Date;
}
```

```ts
// presentation/features/users/mappers/user.view-mapper.ts
import { User } from '../../../domain/entities/user.entity';
import { UserModel } from '../models/user.model';
export const UserViewMapper = {
    toModel(e: User): UserModel {
        return {
            id: e.id,
            fullName: e.fullName,
            email: e.email,
            active: e.isActive,
            createdAt: e.createdAt,
        };
    },
};
```

```ts
// presentation/features/users/pages/users-list/users-list.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersFacade } from '../../../../application/facades/users.facade';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
    private facade = inject(UsersFacade);
    loading = this.facade.loading;
    users = this.facade.users; // ya es signal
    ngOnInit() {
        this.facade.refresh();
    }
}
```

```html
<!-- users-list.component.html (usa tus colores Tailwind) -->
<section class="dashboard-container">
    <h2 class="dashboard-title">Usuarios</h2>
    @if (loading()) {
    <p class="text-neutral-600">Cargando…</p>
    } @else {
    <ul class="space-y-2">
        @for (u of users(); track u.id) {
        <li class="p-3 rounded bg-primary-100 dark:bg-primary-800">
            <span class="font-semibold">{{ u.fullName }}</span>
            <span class="ml-2 text-neutral-600">{{ u.email }}</span>
        </li>
        }
    </ul>
    }
</section>
```

```ts
// presentation/features/users/users.routes.ts
import { Routes } from '@angular/router';
import { provideUsers } from '../../../di/provide-users';

export const usersRoutes: Routes = [
    {
        path: '',
        providers: [...provideUsers()], // providers SOLO para /users
        loadComponent: () =>
            import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
    },
];
```

---

# shared/ (Cross‑feature UI y utils)

**Qué va aquí:** componentes puros reutilizables, pipes, directives, adapters de Chart.js, helpers de formularios, tokens UI.

```
shared/
  ui/
    card/
      card.component.ts/html/css
    stat/
      stat.component.ts/html/css
  charts/
    bar-chart.component.ts     // ng2-charts wrapper
  pipes/
    date-ago.pipe.ts
  directives/
    autofocus.directive.ts
  utils/
    forms/
      form-error.util.ts
```

**Ejemplo corto**

```ts
// shared/charts/bar-chart.component.ts (ng2-charts wrapper básico)
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
@Component({
    selector: 'app-bar-chart',
    standalone: true,
    imports: [BaseChartDirective],
    template: `<canvas baseChart [type]="'bar'" [data]="data()" [options]="options()"></canvas>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
    data = input<any>();
    options = input<any>();
}
```

---

# app.config.ts / app.routes.ts (Bootstrap)

**Qué va aquí:** router, providers globales (por ejemplo `provideAuth()`), SSR si aplica.

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAuth } from './di/provide-auth';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        ...provideAuth(), // Auth global (tokens + interceptor)
    ],
};
```

```ts
// app.routes.ts (rutas con lazy features)
import { Routes } from '@angular/router';
export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'users',
        loadChildren: () =>
            import('./presentation/features/users/users.routes').then((m) => m.usersRoutes),
    },
    // ... recursos, proyectos, etc.
];
```

---

# Estilos globales (Tailwind v4)

Ya tienes:

```
styles.css
styles/colors.css   // usa tu paleta (primary, secondary, etc.)
styles/components.css
```

Sigue usando las utilidades de `@apply` que ya definiste (por ejemplo `dashboard-container`, `section-dashboard`, etc.). Así tu **Presentación** solo aplica clases semánticas reutilizables.

---

# Convenciones rápidas

-   **DTO** = forma de la API (en `infrastructure/dtos`), **sin lógica**.
-   **Mapper** = traduce DTO ⇄ Entity (dominio) y opcionalmente Entity ⇄ ViewModel (presentación).
-   **Use‑case** = tarea puntual de negocio (sin estado UI).
-   **Facade** = API de pantalla/feature (puede exponer **signals**).
-   **Repository (port)** = contrato en `domain/repositories`. Implementación en `infrastructure/repositories`.
-   **Ports** (no persistencia) en `domain/ports` (Clock, TokenStore, Cache…). Implementaciones en `infrastructure/services`.
-   **Boundary HTTP** en `infrastructure/http` (interceptors/orchestrators, transversales).
