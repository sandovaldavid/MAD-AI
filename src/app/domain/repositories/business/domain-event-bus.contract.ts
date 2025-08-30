/**
 * @fileoverview Domain Event Bus Basic Contracts - Domain Layer
 *
 * @description Defines the basic contracts and data structures for domain event communication
 * following Domain-Driven Design principles. These contracts establish the fundamental
 * interfaces for event publishing, subscription, and result handling.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Domain event communication contracts
 * @architecture Domain Layer - Contract Pattern
 */

import { DomainEvent } from '../../events/domain-event.entity';
import { DomainEventType } from '../../events/domain-event.enum';

/**
 * Contract for publishing a domain event
 */
export interface PublishEventContract {
  /** The domain event to publish */
  event: DomainEvent;
}

/**
 * Contract for subscribing to events of a specific type
 */
export interface SubscribeToEventContract {
  /** Type of event to subscribe to */
  eventType: DomainEventType;

  /** Handler function to process the event */
  handler: (event: DomainEvent) => Promise<void> | void;

  /** Optional subscription identifier */
  subscriptionId?: string;
}

/**
 * Contract for subscribing to events from a specific aggregate
 */
export interface SubscribeToAggregateContract {
  /** ID of the aggregate to subscribe to */
  aggregateId: string;

  /** Handler function to process aggregate events */
  handler: (event: DomainEvent) => Promise<void> | void;

  /** Optional subscription identifier */
  subscriptionId?: string;
}

/**
 * Contract for event publishing result
 */
export interface EventPublishResultContract {
  /** Whether the publishing was successful */
  success: boolean;

  /** Event ID if successfully published */
  eventId: string;

  /** Timestamp of the publishing attempt */
  timestamp: Date;

  /** Timestamp when the event was published */
  publishedAt?: Date;

  /** Optional error messages if publishing failed */
  errors?: string[];

  /** Optional single error message if publishing failed */
  error?: string;
}

/**
 * Contract for event subscription result
 */
export interface EventSubscriptionResultContract {
  /** Whether the subscription was successful */
  success: boolean;

  /** Subscription identifier if successfully subscribed */
  subscriptionId: string;

  /** Timestamp of the subscription attempt */
  timestamp: Date;

  /** Event type for type-specific subscriptions */
  eventType?: DomainEventType;

  /** Aggregate ID for aggregate-specific subscriptions */
  aggregateId?: string;

  /** Optional error messages if subscription failed */
  errors?: string[];

  /** Optional single error message if subscription failed */
  error?: string;
}
