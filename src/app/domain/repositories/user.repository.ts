import { Observable } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import { CreateUserModel } from '../models/user/create-user.model';
import { UpdateUserModel } from '../models/user/update-user.model';
import { UserStatsModel } from '../models/user/user-stats.model';

/**
 * Repository interface for User-related operations
 * Following the Clean Architecture pattern
 * Returns UserEntity objects instead of models
 */
export abstract class UserRepository {
    abstract getUsers(): Observable<UserEntity[]>;
    abstract getUserById(id: number): Observable<UserEntity>;
    abstract getUserStats(): Observable<UserStatsModel>;
    abstract createUser(user: CreateUserModel): Observable<UserEntity>;
    abstract updateUser(id: number, user: UpdateUserModel): Observable<UserEntity>;
    abstract activateUser(id: number): Observable<UserEntity>;
    abstract deactivateUser(id: number, reason?: string): Observable<UserEntity>;
    abstract deleteUser(id: number): Observable<void>;
}
