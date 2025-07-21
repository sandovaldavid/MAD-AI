
export interface HumanResource {
  resource: number;
  resource_id: number;
  resource_name: string;
  resource_status: string;
  resource_workload: number;
  role: 'senior' | 'junior' | 'specialist' | 'consultant' | 'intern';
  role_display: string;
  position: string;
  skills: string;
  hourly_rate: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'intern';
  employment_type_display: string;
  experience_years: number | null;
  certification_level: string;
  user: number | null;
  user_email: string;
  user_full_name: string;
  is_available: boolean;
  monthly_cost: string | null;
}
