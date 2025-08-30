import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import {
  PublishEventContract,
  SubscribeToEventContract,
  SubscribeToAggregateContract,
  EventPublishResultContract,
  EventSubscriptionResultContract,
} from './domain-event-bus.contract';

/**
 * @fileoverview Domain Event Bus Repository Contract - Domain Layer
 *
 * @description Defines the contract for domain event bus services following Domain-Driven Design
 * principles. This interface establishes the boundary between the domain layer and infrastructure
 * layer for event communication, ensuring that domain logic remains independent of external implementations.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Domain event communication contract
 * @architecture Domain Layer - Repository Pattern
 *
 * @example Basic Usage
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class PublishUserEventUseCase {
 *   constructor(@Inject(DOMAIN_EVENT_BUS) private eventBus: IDomainEventBusRepository) {}
 *
 *   async execute(userEvent: DomainEvent): Promise<EventPublishResultContract> {
 *     return await this.eventBus.publish(userEvent);
 *   }
 * }
 * ```
 *
 * @example Event Subscription
 * ```typescript
 * // In an event handler
 * @Injectable({ providedIn: 'root' })
 * export class UserEventHandler {
 *   constructor(@Inject(DOMAIN_EVENT_BUS) private eventBus: IDomainEventBusRepository) {}
 *
 *   async setupSubscriptions(): Promise<void> {
 *     const result = await this.eventBus.subscribeToEvent({
 *       eventType: DomainEventType.USER_CREATED,
 *       handler: this.handleUserCreated.bind(this)
 *     });
 *
 *     if (result.success) {
 *       // Handle successful subscription
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link DomainEvent} - Domain event entity
 * @see {@link DomainEventType} - Available event types
 * @see {@link PublishEventContract} - Event publishing contract
 * @see {@link SubscribeToEventContract} - Event subscription contract
 */
export interface IDomainEventBusRepository {
  /**
   * Publish a single domain event
   *
   * @param event - The domain event to publish
   * @returns Promise resolving to publish result
   *
   * @example
   * ```typescript
   * const event = DomainEvent.create({
   *   id: 'evt-123',
   *   eventType: DomainEventType.USER_CREATED,
   *   aggregateId: 'user-456',
   *   aggregateType: 'User',
   *   eventData: { email: 'user@example.com' }
   * });
   *
   * const result = await eventBus.publish(event);
   * if (result.success) {
   *   // Event published successfully
   * }
   * ```
   */
  publish(event: PublishEventContract): Promise<EventPublishResultContract>;

  /**
   * Publish multiple domain events
   *
   * @param events - Array of domain events to publish
   * @returns Promise resolving to array of publish results
   *
   * @example
   * ```typescript
   * const events = [
   *   DomainEvent.create({ ... }),
   *   DomainEvent.create({ ... })
   * ];
   *
   * const results = await eventBus.publishAll(events);
   * const successful = results.filter(r => r.success);
   * ```
   */
  publishAll(events: PublishEventContract[]): Promise<EventPublishResultContract[]>;

  /**
   * Subscribe to events of a specific type
   *
   * @param subscription - Subscription contract
   * @returns Promise resolving to subscription result
   *
   * @example
   * ```typescript
   * const result = await eventBus.subscribeToEvent({
   *   eventType: DomainEventType.USER_CREATED,
   *   handler: async (event) => {
   *     // Handle user created event
   *   }
   * });
   * ```
   */
  subscribeToEvent(
    subscription: SubscribeToEventContract
  ): Promise<EventSubscriptionResultContract>;

  /**
   * Subscribe to events from a specific aggregate
   *
   * @param subscription - Aggregate subscription contract
   * @returns Promise resolving to subscription result
   *
   * @example
   * ```typescript
   * const result = await eventBus.subscribeToAggregate({
   *   aggregateId: 'user-123',
   *   handler: async (event) => {
   *     // Handle user aggregate event
   *   }
   * });
   * ```
   */
  subscribeToAggregate(
    subscription: SubscribeToAggregateContract
  ): Promise<EventSubscriptionResultContract>;

  /**
   * Unsubscribe from events
   *
   * @param subscriptionId - ID of the subscription to remove
   * @returns Promise resolving to boolean indicating success
   *
   * @example
   * ```typescript
   * const unsubscribed = await eventBus.unsubscribe('sub-123');
   * if (unsubscribed) {
   *   // Successfully unsubscribed
   * }
   * ```
   */
  unsubscribe(subscriptionId: string): Promise<boolean>;

  /**
   * Get events for a specific aggregate
   *
   * @param aggregateId - ID of the aggregate
   * @returns Promise resolving to array of events
   *
   * @example
   * ```typescript
   * const events = await eventBus.getAggregateEvents('user-123');
   * // Process aggregate events
   * ```
   */
  getAggregateEvents(aggregateId: string): Promise<DomainEvent[]>;

  /**
   * Get events of a specific type
   *
   * @param eventType - Type of events to retrieve
   * @returns Promise resolving to array of events
   *
   * @example
   * ```typescript
   * const userEvents = await eventBus.getEventsByType(DomainEventType.USER_CREATED);
   * // Process user events
   * ```
   */
  getEventsByType(eventType: DomainEventType): Promise<DomainEvent[]>;

  /**
   * Get all published events
   *
   * @returns Promise resolving to array of all events
   *
   * @example
   * ```typescript
   * const allEvents = await eventBus.getAllEvents();
   * // Process all events
   * ```
   */
  getAllEvents(): Promise<DomainEvent[]>;
}

/**
 * Domain Event Bus Repository Implementation Contract
 * Defines the concrete implementation requirements for event communication
 */
export abstract class DomainEventBusRepositoryContract implements IDomainEventBusRepository {
  abstract publish(event: PublishEventContract): Promise<EventPublishResultContract>;
  abstract publishAll(events: PublishEventContract[]): Promise<EventPublishResultContract[]>;
  abstract subscribeToEvent(
    subscription: SubscribeToEventContract
  ): Promise<EventSubscriptionResultContract>;
  abstract subscribeToAggregate(
    subscription: SubscribeToAggregateContract
  ): Promise<EventSubscriptionResultContract>;
  abstract unsubscribe(subscriptionId: string): Promise<boolean>;
  abstract getAggregateEvents(aggregateId: string): Promise<DomainEvent[]>;
  abstract getEventsByType(eventType: DomainEventType): Promise<DomainEvent[]>;
  abstract getAllEvents(): Promise<DomainEvent[]>;
}
