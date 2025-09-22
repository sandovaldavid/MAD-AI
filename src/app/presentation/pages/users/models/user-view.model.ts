import { UserStatusDisplay } from '../types/user-ui.types';

export interface RoleInfo {
  name: string;
  isActive: boolean;
  accessLevel: number;
}

export interface UserViewModel {
  id: number;
  displayName: string;
  email: string;
  username: string;
  role: RoleInfo;
  status: UserStatusDisplay;
  initials: string;
  lastActivity?: Date;
  lastActivityDisplay?: string;
  createdAt: Date;
  isActive: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
