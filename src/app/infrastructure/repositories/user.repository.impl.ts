import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserStatsModel } from '../../domain/models/user/user-stats.model';
import { CreateUserModel } from '../../domain/models/user/create-user.model';
import { UpdateUserModel } from '../../domain/models/user/update-user.model';
import { UserApiClient } from '../api/user.api';
import { UserStatus } from '../../domain/enums/user_status.enum';

@Injectable({
    providedIn: 'root',
})
export class UserRepositoryImpl extends UserRepository {
    private readonly userApi = inject(UserApiClient);

    getUsers(): Observable<UserEntity[]> {
        return this.userApi.getUsers().pipe(
            map((users) => {
                return users.map(
                    (user) =>
                        new UserEntity({
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            status: UserStatus.PENDING, // Default since not available in list DTO
                            isActive: user.is_active,
                            isEmailConfirmed: false, // Default since not available in list DTO
                            profileCompleted: false, // Default since not available in list DTO
                            emailNotificationsEnabled: true, // Default since not available in list DTO
                            systemNotificationsEnabled: true, // Default since not available in list DTO
                            taskNotificationsEnabled: true, // Default since not available in list DTO
                            createdAt: new Date(user.created_at),
                            updatedAt: new Date(), // Default since not available in list DTO
                            roleName: user.role_name || undefined,
                        })
                );
            })
        );
    }

    getUserById(id: number): Observable<UserEntity> {
        return this.userApi.getUserById(id).pipe(
            map(
                (user) =>
                    new UserEntity({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        status: (user.status as UserStatus) || UserStatus.PENDING,
                        isActive: user.is_active,
                        isEmailConfirmed: user.is_email_confirmed || false,
                        profileCompleted: user.profile_completed || false,
                        emailNotificationsEnabled: user.email_notifications_enabled || true,
                        systemNotificationsEnabled: user.system_notifications_enabled || true,
                        taskNotificationsEnabled: user.task_notifications_enabled || true,
                        createdAt: new Date(user.created_at),
                        updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
                        roleName: user.role_name || undefined,
                        roleId: user.role_id,
                        lastActivityAt: user.last_activity_at
                            ? new Date(user.last_activity_at)
                            : undefined,
                    })
            )
        );
    }

    getUserStats(): Observable<UserStatsModel> {
        return this.getUsers().pipe(
            map((users) => {
                const total_users = users.length;
                const active_users = users.filter((user) => user.isActive).length;
                const inactive_users = total_users - active_users;

                return {
                    total_users,
                    active_users,
                    inactive_users,
                };
            })
        );
    }

    createUser(user: CreateUserModel): Observable<UserEntity> {
        const createUserDto = {
            username: user.username,
            email: user.email,
            password: user.password,
            first_name: user.first_name,
            last_name: user.last_name,
            role_id: user.role_id,
        };

        return this.userApi.createUser(createUserDto).pipe(
            map(
                (response) =>
                    new UserEntity({
                        id: response.id,
                        username: response.username,
                        email: response.email,
                        firstName: response.first_name,
                        lastName: response.last_name,
                        isActive: response.is_active,
                        status: (response.status as UserStatus) || UserStatus.PENDING,
                        isEmailConfirmed: response.is_email_confirmed || false,
                        profileCompleted: response.profile_completed || false,
                        emailNotificationsEnabled: response.email_notifications_enabled || true,
                        systemNotificationsEnabled: response.system_notifications_enabled || true,
                        taskNotificationsEnabled: response.task_notifications_enabled || true,
                        createdAt: new Date(response.created_at),
                        updatedAt: response.updated_at ? new Date(response.updated_at) : new Date(),
                        roleId: response.role_id,
                        roleName: response.role_name || undefined,
                        lastActivityAt: response.last_activity_at
                            ? new Date(response.last_activity_at)
                            : undefined,
                    })
            )
        );
    }

    updateUser(id: number, user: UpdateUserModel): Observable<UserEntity> {
        return this.userApi.updateUser(id, user).pipe(
            map(
                (response) =>
                    new UserEntity({
                        id: response.id,
                        username: response.username,
                        email: response.email,
                        firstName: response.first_name,
                        lastName: response.last_name,
                        isActive: response.is_active,
                        status: (response.status as UserStatus) || UserStatus.PENDING,
                        isEmailConfirmed: response.is_email_confirmed || false,
                        profileCompleted: response.profile_completed || false,
                        emailNotificationsEnabled: response.email_notifications_enabled || true,
                        systemNotificationsEnabled: response.system_notifications_enabled || true,
                        taskNotificationsEnabled: response.task_notifications_enabled || true,
                        createdAt: new Date(response.created_at),
                        updatedAt: response.updated_at ? new Date(response.updated_at) : new Date(),
                        roleId: response.role_id,
                        roleName: response.role_name || undefined,
                        lastActivityAt: response.last_activity_at
                            ? new Date(response.last_activity_at)
                            : undefined,
                    })
            )
        );
    }

    activateUser(id: number): Observable<UserEntity> {
        return this.userApi.activateUser(id).pipe(
            map(
                (response) =>
                    new UserEntity({
                        id: response.id,
                        username: response.username,
                        email: response.email,
                        firstName: response.first_name,
                        lastName: response.last_name,
                        isActive: response.is_active,
                        status: (response.status as UserStatus) || UserStatus.PENDING,
                        isEmailConfirmed: response.is_email_confirmed || false,
                        profileCompleted: response.profile_completed || false,
                        emailNotificationsEnabled: response.email_notifications_enabled || true,
                        systemNotificationsEnabled: response.system_notifications_enabled || true,
                        taskNotificationsEnabled: response.task_notifications_enabled || true,
                        createdAt: new Date(response.created_at),
                        updatedAt: response.updated_at ? new Date(response.updated_at) : new Date(),
                        roleId: response.role_id,
                        roleName: response.role_name || undefined,
                        lastActivityAt: response.last_activity_at
                            ? new Date(response.last_activity_at)
                            : undefined,
                    })
            )
        );
    }

    deactivateUser(id: number, reason?: string): Observable<UserEntity> {
        return this.userApi.deactivateUser(id, reason).pipe(
            map(
                (response) =>
                    new UserEntity({
                        id: response.id,
                        username: response.username,
                        email: response.email,
                        firstName: response.first_name,
                        lastName: response.last_name,
                        isActive: response.is_active,
                        status: (response.status as UserStatus) || UserStatus.PENDING,
                        isEmailConfirmed: response.is_email_confirmed || false,
                        profileCompleted: response.profile_completed || false,
                        emailNotificationsEnabled: response.email_notifications_enabled || true,
                        systemNotificationsEnabled: response.system_notifications_enabled || true,
                        taskNotificationsEnabled: response.task_notifications_enabled || true,
                        createdAt: new Date(response.created_at),
                        updatedAt: response.updated_at ? new Date(response.updated_at) : new Date(),
                        roleId: response.role_id,
                        roleName: response.role_name || undefined,
                        lastActivityAt: response.last_activity_at
                            ? new Date(response.last_activity_at)
                            : undefined,
                    })
            )
        );
    }

    deleteUser(id: number): Observable<void> {
        return this.userApi.deleteUser(id);
    }
}
