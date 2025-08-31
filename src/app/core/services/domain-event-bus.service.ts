/**
 * @fileoverview Domain Event Bus Service - Core Layer
 *
 * @description Core service for domain event communication following Domain-Driven Design
 * principles. This service provides transversal event publishing capabilities that are
 * independent of any specific framework or technology.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Domain event transversal communication
 * @architecture Core Layer - Transversal Service
 */

import { Injectable, Inject } from '@angular/core';
import { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import { DomainEvent } from '@domain/events/domain-event.entity';
import {
  PublishEventContract,
  EventPublishResultContract,
} from '@domain/repositories/business/domain-event-bus.contract';
import { Logger } from '../interfaces/logger.interface';
import { LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '../../di/tokens';

/**
 * Domain Event Bus Service - Core Layer
 *
 * This service provides transversal domain event publishing capabilities.
 * It is independent of any specific framework and delegates persistence
 * to infrastructure implementations through contracts.
 *
 * **Responsibilities:**
 * - Publish domain events across bounded contexts
 * - Log event publishing operations
 * - Handle publishing errors gracefully
 * - Provide unified interface for event communication
 *
 * **Dependencies:**
 * - Logger (Core service)
 * - Domain Event Bus Repository (Infrastructure contract)
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class SomeUseCase {
 *   constructor(private eventBus: DomainEventBusService) {}
 *
 *   async execute() {
 *     // Business logic...
 *     const event = DomainEvent.create({...});
 *     await this.eventBus.publish(event);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class DomainEventBusService {
  constructor(
    @Inject(LOGGER_PORT) private logger: Logger,
    @Inject(DOMAIN_EVENT_BUS_REPO) private repository: IDomainEventBusRepository
  ) {}

  /**
   * Publish a single domain event
   *
   * @param event - The domain event to publish
   * @returns Promise resolving to publish result
   *
   * @example
   * ```typescript
   * const event = UserLoggedOutEvent.create({
   *   userId: 123,
   *   reason: 'user_requested'
   * });
   *
   * const result = await eventBus.publish(event.event);
   * if (result.success) {
   *   // Event published successfully
   * }
   * ```
   */
  async publish(event: DomainEvent): Promise<EventPublishResultContract> {
    try {
      this.logger.info('Publishing domain event', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        operation: 'domain_event_publish_start',
      } as any);

      const publishContract: PublishEventContract = { event };
      const result = await this.repository.publish(publishContract);

      if (result.success) {
        this.logger.info('Domain event published successfully', {
          eventId: result.eventId,
          publishedAt: result.publishedAt,
          operation: 'domain_event_publish_success',
        } as any);
      } else {
        this.logger.warn('Domain event publishing failed', {
          eventId: result.eventId,
          error: result.error,
          operation: 'domain_event_publish_failed',
        } as any);
      }

      return result;
    } catch (error) {
      this.logger.error('Unexpected error during domain event publishing', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        error: (error as Error).message,
        operation: 'domain_event_publish_error',
      } as any);

      // Return error result instead of throwing
      return {
        success: false,
        eventId: event.id,
        timestamp: new Date(),
        error: (error as Error).message || 'Unknown publishing error',
      };
    }
  }

  /**
   * Publish multiple domain events
   *
   * @param events - Array of domain events to publish
   * @returns Promise resolving to array of publish results
   *
   * @example
   * ```typescript
   * const events = [
   *   UserLoggedOutEvent.create({...}).event,
   *   UserProfileUpdatedEvent.create({...}).event
   * ];
   *
   * const results = await eventBus.publishAll(events);
   * const successful = results.filter(r => r.success);
   * ```
   */
  async publishAll(events: DomainEvent[]): Promise<EventPublishResultContract[]> {
    this.logger.info('Publishing multiple domain events', {
      eventCount: events.length,
      operation: 'domain_event_publish_all_start',
    } as any);

    const results: EventPublishResultContract[] = [];

    for (const event of events) {
      try {
        const result = await this.publish(event);
        results.push(result);
      } catch (error) {
        this.logger.error('Failed to publish event in batch', {
          eventId: event.id,
          eventType: event.eventType,
          error: (error as Error).message,
          operation: 'domain_event_publish_batch_error',
        } as any);

        results.push({
          success: false,
          eventId: event.id,
          timestamp: new Date(),
          error: (error as Error).message || 'Batch publishing error',
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    this.logger.info('Domain event batch publishing completed', {
      totalEvents: events.length,
      successfulEvents: successful,
      failedEvents: events.length - successful,
      operation: 'domain_event_publish_all_complete',
    } as any);

    return results;
  }

  /**
   * Check if the event bus is properly configured
   *
   * @returns boolean indicating if the service is ready
   */
  isConfigured(): boolean {
    return this.repository !== null && this.repository !== undefined;
  }

  /**
   * Get service health status
   *
   * @returns Service health information
   */
  getHealthStatus() {
    return {
      service: 'DomainEventBusService',
      configured: this.isConfigured(),
      loggerAvailable: this.logger !== null,
      timestamp: new Date().toISOString(),
    };
  }
}
