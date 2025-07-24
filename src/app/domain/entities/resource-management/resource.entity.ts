
export interface Resource {
  id: number;
  name: string;
  description: string;
  location: string;
  availability_status: 'available' | 'assigned' | 'maintenance' | 'unavailable' | 'in_used';
  status_display: string;
  workload_percentage: number;
  is_active: boolean;
  acquisition_date: string | null;
  created_at: string;
  updated_at: string;
  resource_type: number;
  resource_type_name: string;
  resource_category: string;
  resource_type_detail: any;
  is_available: boolean;
  remaining_capacity: number;
  days_since_acquisition: number | null;
  human_resource: string;
  material_resource: string;
  active_absences_count: number;
  recent_absences: string;
}
