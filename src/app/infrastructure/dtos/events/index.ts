/**
 * @fileoverview Domain Event DTOs - Infrastructure Layer
 *
 * @description Data Transfer Objects for domain event communication with external APIs.
 * These DTOs represent the contract between the infrastructure layer and external
 * event processing systems.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility External API contracts for domain events
 * @architecture Infrastructure Layer - DTO Pattern
 */

import { DomainEventType, DomainEventSeverity } from '@domain/events/domain-event.enum';

/**
 * DTO for publishing a domain event to external systems
 */
export interface PublishDomainEventRequestDTO {
  /** Unique identifier of the event */
  id: string;

  /** Type of domain event */
  eventType: DomainEventType;

  /** ID of the aggregate that generated the event */
  aggregateId: string;

  /** Type of the aggregate */
  aggregateType: string;

  /** Event-specific data payload */
  eventData: Record<string, unknown>;

  /** Timestamp when the event occurred (ISO 8601) */
  occurredAt: string;

  /** Severity level of the event */
  severity: DomainEventSeverity;

  /** ID of the user who caused the event (if applicable) */
  causedByUserId?: string;

  /** Additional metadata for processing */
  metadata?: {
    /** Source system identifier */
    source: string;

    /** Event version for schema evolution */
    version: string;

    /** Correlation ID for tracing */
    correlationId?: string;
  };
}

/**
 * DTO for domain event publishing response
 */
export interface PublishDomainEventResponseDTO {
  /** Whether the publishing was successful */
  success: boolean;

  /** Event ID for tracking */
  eventId: string;

  /** Timestamp of the publishing operation */
  publishedAt: string;

  /** Processing ID from the external system */
  processingId?: string;

  /** Error message if publishing failed */
  error?: string;

  /** HTTP status code */
  statusCode?: number;
}

/**
 * DTO for retrieving domain events
 */
export interface DomainEventDTO {
  /** Unique identifier of the event */
  id: string;

  /** Type of domain event */
  eventType: DomainEventType;

  /** ID of the aggregate that generated the event */
  aggregateId: string;

  /** Type of the aggregate */
  aggregateType: string;

  /** Event-specific data payload */
  eventData: Record<string, unknown>;

  /** Timestamp when the event occurred (ISO 8601) */
  occurredAt: string;

  /** Severity level of the event */
  severity: DomainEventSeverity;

  /** ID of the user who caused the event (if applicable) */
  causedByUserId?: string;

  /** Processing status */
  status: 'pending' | 'processing' | 'processed' | 'failed';

  /** Timestamp when the event was published */
  publishedAt?: string;

  /** Timestamp when the event was processed */
  processedAt?: string;

  /** Error message if processing failed */
  errorMessage?: string;
}

/**
 * DTO for domain event query filters
 */
export interface DomainEventQueryDTO {
  /** Filter by event type */
  eventType?: DomainEventType;

  /** Filter by aggregate ID */
  aggregateId?: string;

  /** Filter by aggregate type */
  aggregateType?: string;

  /** Filter by severity */
  severity?: DomainEventSeverity;

  /** Filter by date range */
  fromDate?: string;

  /** Filter by date range */
  toDate?: string;

  /** Filter by processing status */
  status?: 'pending' | 'processing' | 'processed' | 'failed';

  /** Maximum number of results */
  limit?: number;

  /** Number of results to skip */
  offset?: number;
}

/**
 * DTO for paginated domain event list response
 */
export interface DomainEventListResponseDTO {
  /** Array of domain events */
  events: DomainEventDTO[];

  /** Total number of events matching the query */
  total: number;

  /** Number of events returned in this response */
  count: number;

  /** Whether there are more results available */
  hasMore: boolean;

  /** Next page offset (if applicable) */
  nextOffset?: number;
}
