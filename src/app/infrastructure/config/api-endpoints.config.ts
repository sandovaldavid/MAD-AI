import { environment } from '@/env/environment';

export const API_ENDPOINTS_V1 = {
  AUTH: {
    BASE: `${environment.API_URL}/auth`,
    LOGIN: `${environment.API_URL}/auth/login/`,
    ME: `${environment.API_URL}/auth/me/`,
    REFRESH: `${environment.API_URL}/auth/refresh-token/`,
    LOGOUT: `${environment.API_URL}/auth/logout/`,
    REGISTER: `${environment.API_URL}/auth/register/`,
    CONFIRM_EMAIL: `${environment.API_URL}/auth/confirm-email/`,
    RESET_PASSWORD: `${environment.API_URL}/auth/reset-password/`,
    RESET_PASSWORD_CONFIRM: `${environment.API_URL}/auth/reset-password/confirm/`,
  },
  USERS: {
    BASE: `${environment.API_URL}/auth/users`,
    LIST: `${environment.API_URL}/auth/users/`,
    DETAIL: (id: number) => `${environment.API_URL}/auth/users/${id}/`,
    CREATE: `${environment.API_URL}/auth/users/create`,
    UPDATE: (id: number) => `${environment.API_URL}/auth/users/${id}/update/`,
    DELETE: (id: number) => `${environment.API_URL}/auth/users/${id}/delete/`,
    ACTIVATE: (id: number) => `${environment.API_URL}/auth/users/${id}/activate/`,
    DEACTIVATE: (id: number) => `${environment.API_URL}/auth/users/${id}/deactivate/`,
    CHANGE_PASSWORD: `${environment.API_URL}/auth/users/change-password/`,
    CHANGE_ROLE: (id: number) => `${environment.API_URL}/auth/users/${id}/change-role/`,
  },
  ROLES: {
    BASE: `${environment.API_URL}/auth/roles`,
    LIST: `${environment.API_URL}/auth/roles/`,
    DETAIL: (id: number) => `${environment.API_URL}/auth/roles/${id}/`,
    CREATE: `${environment.API_URL}/auth/roles/create/`,
    UPDATE: (id: number) => `${environment.API_URL}/auth/roles/${id}/update/`,
    DELETE: (id: number) => `${environment.API_URL}/auth/roles/${id}/delete/`,
    ASSIGN: `${environment.API_URL}/auth/roles/assign/`,
    UNASSIGN: `${environment.API_URL}/auth/roles/unassign/`,
  },
  EVENTS: {
    BASE: `${environment.API_URL}/events/`,
    PUBLISH: `${environment.API_URL}/events/publish/`,
    LIST: `${environment.API_URL}/events/`,
    DETAIL: (id: string) => `${environment.API_URL}/events/${id}/`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS_V1;
