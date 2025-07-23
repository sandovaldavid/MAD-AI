export interface ResourceType {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Resource {
    id: string;
    name: string;
    description: string;
    type: ResourceType;
    created_at: Date;
    updated_at: Date;
}

export interface HumanResource extends Resource {
    user_id: string;
    skills: string[];
    hourly_rate: number;
}

export interface MaterialResource extends Resource {
    stock: number;
    low_stock_threshold: number;
}
