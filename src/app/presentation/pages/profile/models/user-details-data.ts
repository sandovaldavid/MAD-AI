/**
 * User details data interface for presentation layer
 * Used to display user information in profile components
 */
export interface UserDetailsData {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: {
    id?: number;
    name?: string;
    accessLevel?: number;
    isActive?: boolean;
  };
  status?: string;
  createdAt?: string;
  lastActivityAt?: string;
}
