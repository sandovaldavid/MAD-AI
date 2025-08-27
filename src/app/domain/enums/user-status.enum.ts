export enum UserStatus {
  /** User account is active and has full system access */
  ACTIVE = 'active',
  /** User account is inactive and cannot access the system */
  INACTIVE = 'inactive',
  /** User account is suspended due to policy violations */
  SUSPENDED = 'suspended',
  /** User account is pending activation (new registrations) */
  PENDING = 'pending',
}
