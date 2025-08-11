La idea es que el flujo sea:

**API (DTO) ⇄ Mapper ⇄ Entity (Domain) ⇄ Presenter/ViewMapper ⇄ Model (UI)**

---

# Estructura de carpetas

```bash
src/app/
  domain/
    entities/user.entity.ts
    value-objects/email.vo.ts
    repositories/user.repository.ts
  application/
    use-cases/get-user-by-id.usecase.ts
  infrastructure/
    dtos/user.dto.ts
    mappers/user.mapper.ts          // DTO ⇄ Entity
    repositories/http-user.repository.ts
  presentation/
    models/user.model.ts
    mappers/user.view-mapper.ts     // Entity ⇄ Model (UI)
    pages/user-detail/
      user-detail.component.ts
      user-detail.component.html
      user-detail.component.css
```

---

# Domain

## Value Object (Email)

```tsx
// domain/value-objects/email.vo.ts
export class Email {
    private constructor(public readonly value: string) {}

    static create(raw: string): Email {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
        if (!ok) throw new Error('Invalid email');
        return new Email(raw);
    }
}
```

## Entity (User)

```tsx
// domain/entities/user.entity.ts
import { Email } from '../value-objects/email.vo';

export type Role = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

export class User {
    private constructor(
        readonly id: string,
        private _email: Email,
        private _firstName: string,
        private _lastName: string,
        private _roles: Role[],
        private _active: boolean,
        readonly createdAt: Date
    ) {}

    static create(params: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles?: Role[];
        active?: boolean;
        createdAt?: Date;
    }): User {
        const roles = params.roles ?? ['VIEWER'];
        return new User(
            params.id,
            Email.create(params.email),
            params.firstName.trim(),
            params.lastName.trim(),
            roles,
            params.active ?? true,
            params.createdAt ?? new Date()
        );
    }

    get email() {
        return this._email.value;
    }
    get firstName() {
        return this._firstName;
    }
    get lastName() {
        return this._lastName;
    }
    get fullName() {
        return `${this._firstName} ${this._lastName}`.trim();
    }
    get roles() {
        return [...this._roles];
    }
    get isActive() {
        return this._active;
    }

    activate() {
        this._active = true;
    }
    deactivate() {
        this._active = false;
    }

    hasRole(role: Role) {
        return this._roles.includes(role);
    }
    canAssignRole(role: Role) {
        return this.hasRole('ADMIN') || role !== 'ADMIN';
    }
    assignRole(role: Role) {
        if (!this.canAssignRole(role)) throw new Error('Not allowed');
        if (!this._roles.includes(role)) this._roles = [...this._roles, role];
    }
}
```

## Repository (contrato)

```tsx
// domain/repositories/user.repository.ts
import { User } from '../entities/user.entity';

export interface UserRepository {
    getById(id: string): Promise<User>;
    list(): Promise<User[]>;
    save(user: User): Promise<void>;
}
```

---

# Application

## Use Case

```tsx
// application/use-cases/get-user-by-id.usecase.ts
import { UserRepository } from '../../domain/repositories/user.repository';

export class GetUserById {
    constructor(private readonly repo: UserRepository) {}
    execute(id: string) {
        return this.repo.getById(id);
    }
}
```

---

# Infrastructure

## DTO (forma exacta de la API)

```tsx
// infrastructure/dtos/user.dto.ts
export interface UserDTO {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[]; // del backend
    is_active: boolean;
    created_at: string; // ISO string
}
```

## Mapper DTO ⇄ Entity

```tsx
// infrastructure/mappers/user.mapper.ts
import { User } from '../../domain/entities/user.entity';
import { UserDTO } from '../dtos/user.dto';

export const UserMapper = {
    dtoToEntity(dto: UserDTO): User {
        return User.create({
            id: dto.id,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            roles: dto.roles as any, // mapear/validar si difiere
            active: dto.is_active,
            createdAt: new Date(dto.created_at),
        });
    },

    entityToDto(entity: User): UserDTO {
        return {
            id: entity.id,
            email: entity.email,
            first_name: entity.firstName,
            last_name: entity.lastName,
            roles: entity.roles,
            is_active: entity.isActive,
            created_at: entity.createdAt.toISOString(),
        };
    },
};
```

## Repositorio HTTP (implementación)

```tsx
// infrastructure/repositories/http-user.repository.ts
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserDTO } from '../dtos/user.dto';
import { UserMapper } from '../mappers/user.mapper';

const API = '/api/v1/users';

export class HttpUserRepository implements UserRepository {
    private http = inject(HttpClient);

    async getById(id: string): Promise<User> {
        const dto = await firstValueFrom(this.http.get<UserDTO>(`${API}/${id}`));
        return UserMapper.dtoToEntity(dto);
    }

    async list(): Promise<User[]> {
        const dtos = await firstValueFrom(this.http.get<UserDTO[]>(API));
        return dtos.map(UserMapper.dtoToEntity);
    }

    async save(user: User): Promise<void> {
        const dto = UserMapper.entityToDto(user);
        await firstValueFrom(this.http.put<void>(`${API}/${dto.id}`, dto));
    }
}
```

---

# Presentation (UI)

## Model (forma cómoda para la vista)

```tsx
// presentation/models/user.model.ts
export interface UserModel {
    id: string;
    fullName: string;
    email: string;
    active: boolean;
    createdAt: Date;
    roleBadges: string[]; // ejemplo: directo para pintar chips
}
```

## ViewMapper (Entity ⇄ Model)

```tsx
// presentation/mappers/user.view-mapper.ts
import { User } from '../../domain/entities/user.entity';
import { UserModel } from '../models/user.model';

export const UserViewMapper = {
    entityToModel(entity: User): UserModel {
        return {
            id: entity.id,
            fullName: entity.fullName,
            email: entity.email,
            active: entity.isActive,
            createdAt: entity.createdAt,
            roleBadges: entity.roles.map((r) => r.toLowerCase()), // ejemplo
        };
    },
};
```

## Componente de ejemplo (Angular 20 + signals)

```tsx
// presentation/pages/user-detail/user-detail.component.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpUserRepository } from '../../../infrastructure/repositories/http-user.repository';
import { GetUserById } from '../../../application/use-cases/get-user-by-id.usecase';
import { UserViewMapper } from '../../mappers/user.view-mapper';
import { UserModel } from '../../models/user.model';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-detail.component.html',
    styleUrl: './user-detail.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailComponent {
    private readonly repo = new HttpUserRepository();
    private readonly getUserById = new GetUserById(this.repo);

    // Estado UI
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly user = signal<UserModel | null>(null);

    async load(id: string) {
        this.loading.set(true);
        this.error.set(null);
        try {
            const entity = await this.getUserById.execute(id);
            this.user.set(UserViewMapper.entityToModel(entity));
        } catch (e: any) {
            this.error.set(e?.message ?? 'Unexpected error');
        } finally {
            this.loading.set(false);
        }
    }

    // Ejemplo rápido: cargar de inmediato (en real usarías router params + effect)
    constructor() {
        this.load('123'); // id de ejemplo
    }
}
```

```html
<!-- presentation/pages/user-detail/user-detail.component.html -->
<section class="p-6">
    @if (loading()) {
    <p class="text-neutral-600">Cargando usuario…</p>
    } @else if (error()) {
    <p class="text-error-600">Error: {{ error() }}</p>
    } @else if (user()) {
    <article class="rounded-lg border p-4 bg-primary-100 dark:bg-primary-800">
        <h2 class="text-xl font-bold">{{ user()!.fullName }}</h2>
        <p class="text-neutral-700 dark:text-neutral-200">{{ user()!.email }}</p>
        <p class="mt-2">
            Estado:
            <span class="{{ user()!.active ? 'text-successful-600' : 'text-error-600' }}">
                {{ user()!.active ? 'Activo' : 'Inactivo' }}
            </span>
        </p>
        <div class="mt-3 flex gap-2 flex-wrap">
            @for (role of user()!.roleBadges; track role) {
            <span
                class="px-2 py-1 rounded bg-secondary-200 dark:bg-secondary-700 text-xs font-semibold uppercase">
                {{ role }}
            </span>
            }
        </div>
        <p class="mt-3 text-sm text-neutral-600">Creado: {{ user()!.createdAt | date:'medium' }}</p>
    </article>
    }
</section>
```

---

## ¿Qué se logra con esta separación?

-   **DTO**: forma idéntica a la API (ideal para `HttpClient`).
-   **Entity**: reglas y comportamiento del negocio (dominio puro).
-   **ViewModel**: datos listos para la vista (sin lógica de negocio).
-   **Mappers**:
    -   `UserMapper` (infra): **DTO ⇄ Entity**.
    -   `UserViewMapper` (presentación): **Entity ⇄ Model**.

Así evitas “filtrar” decisiones de la API a tu UI y mantienes las **reglas** dentro del **dominio**.
