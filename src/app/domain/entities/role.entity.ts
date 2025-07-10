import { RoleAccessLevel } from '../enums/role-access-level.enum';

/**
 * Role entity representing a user role in the system
 * Contains core business logic and validation for roles
 */
export class RoleEntity {
    // Core properties
    id: number;
    name: string;
    description: string;
    accessLevel: RoleAccessLevel;
    
    // Role capabilities
    canLeadProjects: boolean;
    isUniquePerTeam: boolean;
    
    // Status and metadata
    isActive: boolean;
    createdAt: Date;
    userCount: number;
    
    constructor(params: {
        id?: number;
        name: string;
        description: string;
        accessLevel: RoleAccessLevel;
        canLeadProjects?: boolean;
        isUniquePerTeam?: boolean;
        isActive?: boolean;
        createdAt?: Date | string;
        userCount?: number;
    }) {
        this.id = params.id || 0;
        this.name = params.name;
        this.description = params.description;
        this.accessLevel = params.accessLevel;
        
        // Role capabilities
        this.canLeadProjects = params.canLeadProjects ?? false;
        this.isUniquePerTeam = params.isUniquePerTeam ?? false;
        
        // Status and metadata
        this.isActive = params.isActive ?? true;
        this.createdAt = this.parseDate(params.createdAt) || new Date();
        this.userCount = params.userCount ?? 0;
    }
    
    /**
     * Get the display label for the access level
     */
    get accessLevelLabel(): string {
        return RoleAccessLevel[this.accessLevel] || 'Unknown';
    }
    
    /**
     * Check if the role has administrative privileges
     */
    hasAdminPrivileges(): boolean {
        return this.accessLevel === RoleAccessLevel.ADMINISTRATOR;
    }
    
    /**
     * Check if the role has project management privileges
     */
    hasProjectManagementPrivileges(): boolean {
        return this.accessLevel <= RoleAccessLevel.PROJECT_MANAGER;
    }
    
    /**
     * Check if the role is higher in hierarchy than another role
     */
    isHigherThan(otherRole: RoleEntity): boolean {
        return this.accessLevel < otherRole.accessLevel;
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
