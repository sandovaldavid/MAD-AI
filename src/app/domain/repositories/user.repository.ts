import { Observable } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import {
    CreateUserData,
    DeactivateUserData,
    UpdateUserData,
    UserStats,
} from '../models/user/user.dto';

/**
 * Repository interface for User-related operations
 * Following the Clean Architecture pattern
 *
 * In Clean Architecture, the domain layer defines interfaces (contracts)
 * that the outer layers must implement. This ensures that the domain layer
 * doesn't depend on external concerns.
 */
export abstract class UserRepository {
    /**
     * Get all users
     */
    abstract getUsers(): Observable<UserEntity[]>;

    /**
     * Get a specific user by ID
     */
    abstract getUserById(id: number): Observable<UserEntity>;

    /**
     * Get user statistics
     */
    abstract getUserStats(): Observable<UserStats>;

    /**
     * Create a new user
     */
    abstract createUser(userData: CreateUserData): Observable<UserEntity>;

    /**
     * Update an existing user
     */
    abstract updateUser(id: number, userData: UpdateUserData): Observable<UserEntity>;

    /**
     * Activate a user
     */
    abstract activateUser(id: number): Observable<UserEntity>;

    /**
     * Deactivate a user
     */
    abstract deactivateUser(id: number, data?: DeactivateUserData): Observable<UserEntity>;

    /**
     * Delete a user
     */
    abstract deleteUser(id: number): Observable<void>;
}
