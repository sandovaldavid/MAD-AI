import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';
import {
    CreateUserData,
    UpdateUserData,
    DeactivateUserData,
    UserStats,
} from '../../domain/models/user/user.dto';
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

    getUserStats(): Observable<UserStats> {
        return this.getUsers().pipe(
            map((users) => {
                const totalUsers = users.length;
                const activeUsers = users.filter((user) => user.isActive).length;
                const inactiveUsers = totalUsers - activeUsers;

                return {
                    totalUsers,
                    activeUsers,
                    inactiveUsers,
                };
            })
        );
    }

    createUser(user: CreateUserData): Observable<UserEntity> {
        const createUserDto = {
            username: user.username,
            email: user.email,
            password: user.password,
            first_name: user.firstName,
            last_name: user.lastName,
            role_id: user.roleId,
            email_notifications_enabled: user.emailNotificationsEnabled,
            system_notifications_enabled: user.systemNotificationsEnabled,
            task_notifications_enabled: user.taskNotificationsEnabled,
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

    updateUser(id: number, user: UpdateUserData): Observable<UserEntity> {
        // Convert camelCase to snake_case for API
        const updateUserDto: any = {};

        if (user.firstName !== undefined) updateUserDto.first_name = user.firstName;
        if (user.lastName !== undefined) updateUserDto.last_name = user.lastName;
        if (user.email !== undefined) updateUserDto.email = user.email;
        if (user.roleId !== undefined) updateUserDto.role_id = user.roleId;
        if (user.isActive !== undefined) updateUserDto.is_active = user.isActive;
        if (user.status !== undefined) updateUserDto.status = user.status;
        if (user.emailNotificationsEnabled !== undefined)
            updateUserDto.email_notifications_enabled = user.emailNotificationsEnabled;
        if (user.systemNotificationsEnabled !== undefined)
            updateUserDto.system_notifications_enabled = user.systemNotificationsEnabled;
        if (user.taskNotificationsEnabled !== undefined)
            updateUserDto.task_notifications_enabled = user.taskNotificationsEnabled;

        return this.userApi.updateUser(id, updateUserDto).pipe(
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

    deactivateUser(id: number, data?: DeactivateUserData): Observable<UserEntity> {
        return this.userApi.deactivateUser(id, data?.reason).pipe(
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
