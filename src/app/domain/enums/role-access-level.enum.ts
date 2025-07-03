export enum RoleAccessLevel {
    ADMINISTRATOR = 1,
    PROJECT_MANAGER = 2,
    TEAM_LEAD = 3,
    DEVELOPER = 4,
    USER = 5,
}

export const ROLE_ACCESS_LEVEL_LABELS = {
    [RoleAccessLevel.ADMINISTRATOR]: 'Administrator',
    [RoleAccessLevel.PROJECT_MANAGER]: 'Project Manager',
    [RoleAccessLevel.TEAM_LEAD]: 'Team Lead',
    [RoleAccessLevel.DEVELOPER]: 'Developer',
    [RoleAccessLevel.USER]: 'User',
} as const;
