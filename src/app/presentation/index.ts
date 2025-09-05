/**
 * @fileoverview Presentation Layer Index
 *
 * This file exports all presentation layer components, services, and utilities
 * for easy importing throughout the application.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

// Shared components and utilities
export * from './shared';

// Models
export * from './models';

// Mappers
export * from './mappers';

// Layouts
export * from './layouts';

// Navigation
export * from './navigation';

// UI Services (moved from core)
export * from './services/theme.service';
export * from './services/breadcrumb.service';
export * from './services/return-url.service';
export * from './services/title.service';
export * from './services/icon-registry.service';
export * from './services/layout.service';
export * from './services/sidebar.service';

// Formatters (moved from domain)
export * from './services/formatters/lastname-formatter.service';
export * from './services/formatters/role-formatter.service';
export * from './services/formatters/username-formatter.service';
export * from './services/formatters/user-display-formatter.service';

// Guards (moved from infrastructure)
export * from './services/guards/auth.guard';
export * from './services/guards/role.guard';
export * from './services/guards/email-confirmed.guard';
export * from './services/guards/matchers.guard';
