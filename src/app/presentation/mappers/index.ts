/**
 * @fileoverview Presentation Mappers Index
 *
 * This file exports all presentation layer mappers for easy importing.
 * These mappers transform Application layer types to Presentation layer models.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

// User mappers
export { UserPresentationMapper } from './users/user.mapper';

// Role mappers
export {
  transformToTableRowView,
  transformToCardView,
  transformToFormView,
  transformToDetailView,
} from './roles/role.mapper';
