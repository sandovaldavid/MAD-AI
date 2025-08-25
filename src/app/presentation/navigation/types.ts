// Simple types for navigation configuration - no entities needed
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  activeMatch?: string;
  requireRoles?: string[];
  badge?: string | number;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}
