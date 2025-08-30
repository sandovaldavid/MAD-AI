export interface MeResponseDTO {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: {
    id: number;
    name: string;
    access_level: number;
    is_active: boolean;
  };
  notification_preferences: {
    email_notifications: boolean;
    system_notifications: boolean;
    task_notifications: boolean;
  };
}
