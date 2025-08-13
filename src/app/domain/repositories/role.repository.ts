import { Role } from '../entities/role.entity';

export type CreateRolePayload = Readonly<{
    name: string;
    accessLevel?: number;
    description?: string;
}>;

export type UpdateRolePayload = Readonly<{
    name?: string;
    accessLevel?: number;
    description?: string;
}>;

export type ListRolesParams = Readonly<{
    search?: string;
    active?: boolean;
}>;

export type AssignRolePayload = Readonly<{
    userId: number;
    roleId: number;
    assignedByUserId?: number;
}>;

export type UnassignRolePayload = Readonly<{
    userId: number;
}>;

export interface RoleRepository {
    list(params?: ListRolesParams): Promise<Role[]>;
    getById(id: number): Promise<Role>;
    create(payload: CreateRolePayload): Promise<Role>;
    update(id: number, payload: UpdateRolePayload): Promise<Role>;
    delete(id: number): Promise<void>;
    assign(payload: { roleId: number; userId: number }): Promise<void>;
    unassign(payload: { roleId: number; userId: number }): Promise<void>;
}
