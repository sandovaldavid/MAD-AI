import { UserStatus } from '../enums/user_status.enum';

/**
 * User entity representing a system user
 * Contains core business logic and validation related to users
 */
export class UserEntity {
    // Core properties
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    isActive: boolean;

    // Profile properties
    isEmailConfirmed: boolean;
    profileCompleted: boolean;
    
    // Notification preferences
    emailNotificationsEnabled: boolean;
    systemNotificationsEnabled: boolean;
    taskNotificationsEnabled: boolean;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt?: Date;
    
    // Role-related properties
    roleId?: number;
    roleName?: string;
    
    constructor(params: {
        id?: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        status?: UserStatus;
        isActive?: boolean;
        isEmailConfirmed?: boolean;
        profileCompleted?: boolean;
        emailNotificationsEnabled?: boolean;
        systemNotificationsEnabled?: boolean;
        taskNotificationsEnabled?: boolean;
        createdAt?: Date | string;
        updatedAt?: Date | string;
        lastActivityAt?: Date | string;
        roleId?: number;
        roleName?: string;
    }) {
        this.id = params.id || 0;
        this.username = params.username;
        this.email = params.email;
        this.firstName = params.firstName;
        this.lastName = params.lastName;
        this.status = params.status || UserStatus.PENDING;
        this.isActive = params.isActive ?? true;
        
        // Profile settings
        this.isEmailConfirmed = params.isEmailConfirmed ?? false;
        this.profileCompleted = params.profileCompleted ?? false;
        
        // Notification preferences
        this.emailNotificationsEnabled = params.emailNotificationsEnabled ?? true;
        this.systemNotificationsEnabled = params.systemNotificationsEnabled ?? true;
        this.taskNotificationsEnabled = params.taskNotificationsEnabled ?? true;
        
        // Timestamps
        this.createdAt = this.parseDate(params.createdAt) || new Date();
        this.updatedAt = this.parseDate(params.updatedAt) || new Date();
        this.lastActivityAt = params.lastActivityAt ? this.parseDate(params.lastActivityAt) || undefined : undefined;
        
        // Role information
        this.roleId = params.roleId;
        this.roleName = params.roleName;
    }
    
    /**
     * Helper method to get the full name
     */
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
    
    /**
     * Check if the user has admin privileges
     * (This can be expanded with proper role-based logic)
     */
    hasAdminPrivileges(): boolean {
        return this.roleName?.toLowerCase().includes('admin') ?? false;
    }
    
    /**
     * Business logic: Determine if user profile is complete enough
     */
    isProfileComplete(): boolean {
        return Boolean(
            this.firstName && 
            this.lastName && 
            this.email
        );
    }
    
    /**
     * Update the last activity timestamp
     */
    updateLastActivity(): void {
        this.lastActivityAt = new Date();
    }
    
    /**
     * Calculate days since registration
     */
    getDaysSinceRegistration(): number {
        const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Helper to parse string dates into Date objects
     */
    private parseDate(date?: Date | string): Date | null {
        if (!date) return null;
        
        if (date instanceof Date) {
            return date;
        }
        
        try {
            return new Date(date);
        } catch {
            return null;
        }
    }
}
