// src/app/domain/repositories/domain-event-store.repository.ts
import { DomainEvent } from '../../events/domain-event.entity';
import { DomainEventType } from '../../events/domain-event.enum';

/**
 * Domain Event Store Repository - Domain Layer
 *
 * Repository interface for domain event persistence and retrieval.
 * Defines the contract for storing and querying domain events.
 *
 * @responsibility Domain event persistence contract
 * @architecture Domain Layer - Repository Pattern
 */
export interface IDomainEventStoreRepository {
  /**
   * Store a domain event
   * Business rule: Events must be stored for audit and replay purposes
   */
  store(event: DomainEvent): Promise<void>;

  /**
   * Store multiple domain events
   * Business rule: Batch operations for performance
   */
  storeAll(events: DomainEvent[]): Promise<void>;

  /**
   * Retrieve events for a specific aggregate
   * Business rule: Aggregate events are needed for event sourcing
   */
  getAggregateEvents(aggregateId: string): Promise<DomainEvent[]>;

  /**
   * Retrieve events of a specific type
   * Business rule: Type-specific queries for event processing
   */
  getEventsByType(eventType: DomainEventType): Promise<DomainEvent[]>;

  /**
   * Retrieve all stored events
   * Business rule: Complete event history for debugging and analysis
   */
  getAllEvents(): Promise<DomainEvent[]>;

  /**
   * Retrieve events within a time range
   * Business rule: Temporal queries for event analysis
   */
  getEventsByTimeRange(startDate: Date, endDate: Date): Promise<DomainEvent[]>;

  /**
   * Retrieve events by correlation ID
   * Business rule: Trace related events across the system
   */
  getEventsByCorrelationId(correlationId: string): Promise<DomainEvent[]>;

  /**
   * Get event count for an aggregate
   * Business rule: Aggregate version tracking
   */
  getAggregateEventCount(aggregateId: string): Promise<number>;

  /**
   * Check if aggregate exists (has events)
   * Business rule: Aggregate existence validation
   */
  aggregateExists(aggregateId: string): Promise<boolean>;
}

/**
 * Domain Event Store Repository Implementation Contract
 * Defines the concrete implementation requirements
 */
export abstract class DomainEventStoreRepository implements IDomainEventStoreRepository {
  abstract store(event: DomainEvent): Promise<void>;
  abstract storeAll(events: DomainEvent[]): Promise<void>;
  abstract getAggregateEvents(aggregateId: string): Promise<DomainEvent[]>;
  abstract getEventsByType(eventType: DomainEventType): Promise<DomainEvent[]>;
  abstract getAllEvents(): Promise<DomainEvent[]>;
  abstract getEventsByTimeRange(startDate: Date, endDate: Date): Promise<DomainEvent[]>;
  abstract getEventsByCorrelationId(correlationId: string): Promise<DomainEvent[]>;
  abstract getAggregateEventCount(aggregateId: string): Promise<number>;
  abstract aggregateExists(aggregateId: string): Promise<boolean>;
}
