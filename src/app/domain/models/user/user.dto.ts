import { UserStatus } from '../../enums/user_status.enum';

/**
 * Data transfer objects for User entity
 * These are used for creating and updating users
 */

/**
 * Data required to create a new user
 */
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId?: number;
    emailNotificationsEnabled?: boolean;
    systemNotificationsEnabled?: boolean;
    taskNotificationsEnabled?: boolean;
}

/**
 * Data for updating an existing user
 */
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    email?: string;
    roleId?: number;
    isActive?: boolean;
    status?: UserStatus;
    emailNotificationsEnabled?: boolean;
    systemNotificationsEnabled?: boolean;
    taskNotificationsEnabled?: boolean;
}

/**
 * Data for changing user password
 */
export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}

/**
 * User statistics value object
 */
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
}

/**
 * Reason for deactivating a user
 */
export interface DeactivateUserData {
    reason?: string;
}
