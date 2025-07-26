export interface ResourceSearch {
    name?: string;
    resource_type_id?: number;
    category?: string;
    availability_status?: 'available' | 'assigned' | 'maintenance' | 'unavailable';
    location?: string;
    min_capacity?: number;
    is_active?: boolean;
}
