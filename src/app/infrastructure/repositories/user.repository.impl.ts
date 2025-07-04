import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserListModel } from '../../domain/models/user/user-list.model';
import { UserStatsModel } from '../../domain/models/user/user-stats.model';
import { CreateUserModel } from '../../domain/models/user/create-user.model';
import { UpdateUserModel } from '../../domain/models/user/update-user.model';
import { UserApiClient } from '../api/user.api';

@Injectable({
    providedIn: 'root'
})
export class UserRepositoryImpl implements UserRepository {
    private readonly userApi = inject(UserApiClient);

    getUsers(): Observable<UserListModel[]> {
        return this.userApi.getUsers().pipe(
            map(users => users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: user.full_name,
                status: user.status,
                is_email_confirmed: user.is_email_confirmed,
                profile_completed: user.profile_completed,
                email_notifications_enabled: user.email_notifications_enabled,
                system_notifications_enabled: user.system_notifications_enabled,
                task_notifications_enabled: user.task_notifications_enabled,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                role_id: user.role_id,
                role_name: user.role_name,
                last_activity_at: user.last_activity_at
            })))
        );
    }

    getUserById(id: number): Observable<UserListModel> {
        return this.userApi.getUserById(id).pipe(
            map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: user.full_name,
                status: user.status,
                is_email_confirmed: user.is_email_confirmed,
                profile_completed: user.profile_completed,
                email_notifications_enabled: user.email_notifications_enabled,
                system_notifications_enabled: user.system_notifications_enabled,
                task_notifications_enabled: user.task_notifications_enabled,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                role_id: user.role_id,
                role_name: user.role_name,
                last_activity_at: user.last_activity_at
            }))
        );
    }

    getUserStats(): Observable<UserStatsModel> {
        return this.getUsers().pipe(
            map(users => {
                const total_users = users.length;
                const active_users = users.filter(user => user.is_active).length;
                const inactive_users = total_users - active_users;

                return {
                    total_users,
                    active_users,
                    inactive_users
                };
            })
        );
    }

    createUser(user: CreateUserModel): Observable<UserListModel> {
        const createUserDto = {
            username: user.username,
            email: user.email,
            password: user.password,
            first_name: user.first_name,
            last_name: user.last_name,
            role_id: user.role_id
        };

        return this.userApi.createUser(createUserDto).pipe(
            map(response => ({
                id: response.id,
                username: response.username,
                email: response.email,
                first_name: response.first_name,
                last_name: response.last_name,
                full_name: response.full_name,
                status: response.status,
                is_email_confirmed: response.is_email_confirmed,
                profile_completed: response.profile_completed,
                email_notifications_enabled: response.email_notifications_enabled,
                system_notifications_enabled: response.system_notifications_enabled,
                task_notifications_enabled: response.task_notifications_enabled,
                is_active: response.is_active,
                created_at: response.created_at,
                updated_at: response.updated_at,
                role_id: response.role_id,
                role_name: response.role_name,
                last_activity_at: response.last_activity_at
            }))
        );
    }

    updateUser(id: number, user: UpdateUserModel): Observable<UserListModel> {
        return this.userApi.updateUser(id, user).pipe(
            map(response => ({
                id: response.id,
                username: response.username,
                email: response.email,
                first_name: response.first_name,
                last_name: response.last_name,
                full_name: response.full_name,
                status: response.status,
                is_email_confirmed: response.is_email_confirmed,
                profile_completed: response.profile_completed,
                email_notifications_enabled: response.email_notifications_enabled,
                system_notifications_enabled: response.system_notifications_enabled,
                task_notifications_enabled: response.task_notifications_enabled,
                is_active: response.is_active,
                created_at: response.created_at,
                updated_at: response.updated_at,
                role_id: response.role_id,
                role_name: response.role_name,
                last_activity_at: response.last_activity_at
            }))
        );
    }

    deleteUser(id: number): Observable<void> {
        return this.userApi.deleteUser(id);
    }
}
