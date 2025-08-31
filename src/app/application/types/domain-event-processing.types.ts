/**
 * Domain Event Processing Types
 *
 * @description
 * Minimal type definitions for Application Layer domain event coordination.
 * These types provide simple interfaces for event processing orchestration.
 *
 * @responsibilities
 * - Define minimal interfaces for domain event handling
 * - Provide type safety for event processing coordination
 * - Keep complexity in appropriate layers (Domain/Core)
 *
 * @architecture
 * - Application layer: Simple coordination types only
 * - Domain layer: Event definitions and business logic
 * - Core layer: Event processing infrastructure
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-08-18
 * @layer Application
 */

import type { DomainEvent } from '@domain/events/domain-event.entity';

// ============================================================================
// Simple Interfaces (Application Layer Coordination)
// ============================================================================

/**
 * Simple interface for aggregate roots that generate domain events
 */
export interface AggregateRoot {
  getDomainEvents(): DomainEvent[];
  clearDomainEvents(): void;
}

// ============================================================================
// Minimal Processing Types
// ============================================================================

/**
 * Simple metadata for domain events
 */
export interface DomainEventMetadata {
  correlationId?: string;
  userId?: number;
  timestamp?: Date;
}

/**
 * Simple result type for event processing
 */
export interface ProcessEventsResult {
  success: boolean;
  processedCount: number;
  errors?: string[];
}
