
export interface ResourceType {
  id: number;
  name: string;
  description: string;
  category: 'human' | 'software' | 'hardware' | 'other';
  category_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  resources_count: number;
  active_resources_count: number;
  resources_by_status: any;
  last_resource_created: any | null;
}
