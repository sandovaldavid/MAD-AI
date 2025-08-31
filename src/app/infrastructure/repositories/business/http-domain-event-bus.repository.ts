/**
 * @fileoverview HTTP Domain Event Bus Repository - Infrastructure Layer
 *
 * @description HTTP-based implementation of the Domain Event Bus Repository.
 * Handles publishing domain events to external systems via HTTP APIs,
 * including error handling, retries, and data transformation.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility HTTP-based domain event publishing
 * @architecture Infrastructure Layer - Repository Pattern
 */

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import {
  PublishEventContract,
  SubscribeToEventContract,
  SubscribeToAggregateContract,
  EventPublishResultContract,
  EventSubscriptionResultContract,
} from '@domain/repositories/business/domain-event-bus.contract';
import { DomainEventApiClient } from '@infrastructure/http/clients/domain-event-api.client';
import { DomainEventMapper } from '@infrastructure/mappers/domain-event.mapper';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { Logger } from '@core/interfaces/logger.interface';
import { LOGGER_PORT } from '@di/tokens';

/**
 * HTTP-based implementation of Domain Event Bus Repository
 *
 * @description Publishes domain events to external systems via HTTP APIs.
 * Handles HTTP communication, error transformation, and data mapping
 * between domain events and API formats.
 *
 * @class HttpDomainEventBusRepository
 * @implements {IDomainEventBusRepository}
 *
 * @apiBaseUrl {environment.API_URL}/events
 * @apiAuthentication Bearer token via HTTP interceptor
 * @apiContentType application/json
 *
 * @errorHandling
 * - HTTP errors are transformed to domain-appropriate error messages
 * - Network failures trigger retry logic
 * - Invalid API responses trigger descriptive errors
 * - Publishing failures are logged and tracked
 *
 * @performanceOptimizations
 * - Uses RxJS firstValueFrom for single-shot requests
 * - Implements proper error handling and logging
 * - Supports batch publishing for multiple events
 */
@Injectable({ providedIn: 'root' })
export class HttpDomainEventBusRepository implements IDomainEventBusRepository {
  private readonly eventClient = inject(DomainEventApiClient);
  private readonly eventMapper = inject(DomainEventMapper);
  private readonly errorTransformer = inject(HttpErrorTransformer);
  private readonly logger = inject(LOGGER_PORT);

  /**
   * Publish a single domain event
   *
   * @param eventContract - The event publishing contract
   * @returns Promise resolving to publish result
   */
  async publish(eventContract: PublishEventContract): Promise<EventPublishResultContract> {
    const event = eventContract.event;

    try {
      this.logger.info('Publishing domain event via HTTP', {
        eventId: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        operation: 'http_event_publish_start',
      } as any);

      // Validate event can be published
      if (!this.eventMapper.canPublish(event)) {
        const error = 'Invalid domain event structure';
        this.logger.warn('Domain event validation failed', {
          eventId: event.id,
          error,
          operation: 'http_event_validation_failed',
        } as any);

        return {
          success: false,
          eventId: event.id,
          timestamp: new Date(),
          error,
        };
      }

      // Map to API request format
      const requestDTO = this.eventMapper.toPublishRequestDTO(event);

      // Publish via HTTP
      const response$ = this.eventClient.publish(requestDTO);
      const responseDTO = await firstValueFrom(response$);

      // Map response back to domain format
      const result = this.eventMapper.fromPublishResponseDTO(responseDTO, event);

      this.logger.info('Domain event published successfully via HTTP', {
        eventId: result.eventId,
        publishedAt: result.publishedAt,
        operation: 'http_event_publish_success',
      } as any);

      return {
        success: result.success,
        eventId: result.eventId,
        timestamp: new Date(result.publishedAt),
        publishedAt: new Date(result.publishedAt),
        error: result.error,
      };
    } catch (error) {
      const transformedError = this.errorTransformer.transform(error as any, {
        endpoint: '/events/publish',
        operation: 'publish_domain_event',
      });

      this.logger.error('Failed to publish domain event via HTTP', {
        eventId: event.id,
        eventType: event.eventType,
        error: (error as Error).message,
        operation: 'http_event_publish_error',
      } as any);

      return {
        success: false,
        eventId: event.id,
        timestamp: new Date(),
        error: (error as Error).message || 'HTTP publishing failed',
      };
    }
  }

  /**
   * Publish multiple domain events
   *
   * @param events - Array of event publishing contracts
   * @returns Promise resolving to array of publish results
   */
  async publishAll(events: PublishEventContract[]): Promise<EventPublishResultContract[]> {
    this.logger.info('Publishing multiple domain events via HTTP', {
      eventCount: events.length,
      operation: 'http_event_publish_all_start',
    } as any);

    const results: EventPublishResultContract[] = [];

    // Publish events sequentially to maintain order and handle errors properly
    for (const eventContract of events) {
      try {
        const result = await this.publish(eventContract);
        results.push(result);
      } catch (error) {
        this.logger.error('Failed to publish event in batch', {
          eventId: eventContract.event.id,
          error: (error as Error).message,
          operation: 'http_event_batch_error',
        } as any);

        results.push({
          success: false,
          eventId: eventContract.event.id,
          timestamp: new Date(),
          error: (error as Error).message || 'Batch publishing error',
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    this.logger.info('HTTP domain event batch publishing completed', {
      totalEvents: events.length,
      successfulEvents: successful,
      failedEvents: events.length - successful,
      operation: 'http_event_publish_all_complete',
    } as any);

    return results;
  }

  /**
   * Subscribe to events of a specific type
   *
   * @param subscription - Subscription contract
   * @returns Promise resolving to subscription result
   */
  async subscribeToEvent(
    subscription: SubscribeToEventContract
  ): Promise<EventSubscriptionResultContract> {
    // Note: HTTP-based subscription is not implemented in this version
    // This would require WebSocket or Server-Sent Events implementation
    this.logger.warn('HTTP subscription not implemented', {
      eventType: subscription.eventType,
      operation: 'http_subscription_not_implemented',
    } as any);

    return {
      success: false,
      subscriptionId: `sub-${Date.now()}`,
      timestamp: new Date(),
      eventType: subscription.eventType,
      error: 'HTTP-based event subscription not implemented',
    };
  }

  /**
   * Subscribe to events from a specific aggregate
   *
   * @param subscription - Aggregate subscription contract
   * @returns Promise resolving to subscription result
   */
  async subscribeToAggregate(
    subscription: SubscribeToAggregateContract
  ): Promise<EventSubscriptionResultContract> {
    // Note: HTTP-based subscription is not implemented in this version
    this.logger.warn('HTTP aggregate subscription not implemented', {
      aggregateId: subscription.aggregateId,
      operation: 'http_aggregate_subscription_not_implemented',
    } as any);

    return {
      success: false,
      subscriptionId: `sub-${Date.now()}`,
      timestamp: new Date(),
      aggregateId: subscription.aggregateId,
      error: 'HTTP-based aggregate subscription not implemented',
    };
  }

  /**
   * Unsubscribe from events
   *
   * @param subscriptionId - ID of the subscription to remove
   * @returns Promise resolving to boolean indicating success
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    // Note: HTTP-based unsubscription is not implemented in this version
    this.logger.warn('HTTP unsubscription not implemented', {
      subscriptionId,
      operation: 'http_unsubscription_not_implemented',
    } as any);

    return false;
  }

  /**
   * Get events for a specific aggregate
   *
   * @param aggregateId - ID of the aggregate
   * @returns Promise resolving to array of events
   */
  async getAggregateEvents(aggregateId: string): Promise<DomainEvent[]> {
    try {
      const response$ = this.eventClient.getByAggregate(aggregateId);
      const responseDTO = await firstValueFrom(response$);

      // Map DTOs to domain events
      const events = responseDTO.events.map((dto) => this.eventMapper.fromDTO(dto));

      this.logger.info('Retrieved aggregate events via HTTP', {
        aggregateId,
        eventCount: events.length,
        operation: 'http_get_aggregate_events_success',
      } as any);

      return events;
    } catch (error) {
      this.logger.error('Failed to get aggregate events via HTTP', {
        aggregateId,
        error: (error as Error).message,
        operation: 'http_get_aggregate_events_error',
      } as any);

      return [];
    }
  }

  /**
   * Get events of a specific type
   *
   * @param eventType - Type of events to retrieve
   * @returns Promise resolving to array of events
   */
  async getEventsByType(eventType: DomainEventType): Promise<DomainEvent[]> {
    try {
      const response$ = this.eventClient.getByType(eventType);
      const responseDTO = await firstValueFrom(response$);

      // Map DTOs to domain events
      const events = responseDTO.events.map((dto) => this.eventMapper.fromDTO(dto));

      this.logger.info('Retrieved events by type via HTTP', {
        eventType,
        eventCount: events.length,
        operation: 'http_get_events_by_type_success',
      } as any);

      return events;
    } catch (error) {
      this.logger.error('Failed to get events by type via HTTP', {
        eventType,
        error: (error as Error).message,
        operation: 'http_get_events_by_type_error',
      } as any);

      return [];
    }
  }

  /**
   * Get all published events
   *
   * @returns Promise resolving to array of all events
   */
  async getAllEvents(): Promise<DomainEvent[]> {
    try {
      const response$ = this.eventClient.getAll();
      const responseDTO = await firstValueFrom(response$);

      // Map DTOs to domain events
      const events = responseDTO.events.map((dto) => this.eventMapper.fromDTO(dto));

      this.logger.info('Retrieved all events via HTTP', {
        eventCount: events.length,
        operation: 'http_get_all_events_success',
      } as any);

      return events;
    } catch (error) {
      this.logger.error('Failed to get all events via HTTP', {
        error: (error as Error).message,
        operation: 'http_get_all_events_error',
      } as any);

      return [];
    }
  }
}
