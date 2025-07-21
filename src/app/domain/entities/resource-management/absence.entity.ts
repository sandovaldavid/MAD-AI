
export interface Absence {
  id: number;
  resource: number;
  resource_detail: any; 
  absence_type: 'vacation' | 'sick_leave' | 'training' | 'maintenance' | 'conference' | 'personal' | 'other';
  absence_type_display: string;
  status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  start_date: string;
  end_date: string;
  duration_days: string;
  reason: string;
  notes: string;
  approved_by: number | null;
  approved_by_detail: any;
  approval_date: string | null;
  conflict_info: any;
  created_at: string;
  updated_at: string;
}
