export interface HumanResourcesStats {
    total_human_resources: number;
    active_human_resources: number;
    available_human_resources: number;
    role_distribution: Record<string, number>;
    employment_distribution: Record<string, number>;
}
