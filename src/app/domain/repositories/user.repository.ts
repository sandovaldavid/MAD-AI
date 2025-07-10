import { Observable } from 'rxjs';
import { UserListModel } from '../models/user/user-list.model';
import { UserStatsModel } from '../models/user/user-stats.model';
import { CreateUserModel } from '../models/user/create-user.model';
import { UpdateUserModel } from '../models/user/update-user.model';

export interface UserRepository {
    getUsers(): Observable<UserListModel[]>;
    getUserById(id: number): Observable<UserListModel>;
    getUserStats(): Observable<UserStatsModel>;
    createUser(user: CreateUserModel): Observable<UserListModel>;
    updateUser(id: number, user: UpdateUserModel): Observable<UserListModel>;
    activateUser(id: number): Observable<UserListModel>;
    deactivateUser(id: number, reason?: string): Observable<UserListModel>;
    deleteUser(id: number): Observable<void>;
}
