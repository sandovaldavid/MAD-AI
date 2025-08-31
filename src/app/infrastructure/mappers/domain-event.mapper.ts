/**
 * @fileoverview Domain Event Mapper - Infrastructure Layer
 *
 * @description Maps between domain events and external API DTOs.
 * Handles transformation of domain event entities to API request/response formats
 * and vice versa, ensuring proper data serialization and deserialization.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Data transformation for domain events
 * @architecture Infrastructure Layer - Mapper Pattern
 */

import { Injectable } from '@angular/core';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType, DomainEventSeverity } from '@domain/events/domain-event.enum';
import {
  PublishDomainEventRequestDTO,
  PublishDomainEventResponseDTO,
  DomainEventDTO,
} from '@infrastructure/dtos/events';

/**
 * Domain Event Mapper - Infrastructure Layer
 *
 * Maps domain events to/from external API DTOs.
 * Handles serialization/deserialization between domain and infrastructure layers.
 *
 * @description This mapper ensures that domain events can be properly
 * communicated with external systems while maintaining domain integrity.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Injectable({ providedIn: 'root' })
export class DomainEventMapper {
  /**
   * Maps a domain event to a publish request DTO
   *
   * @param event - The domain event to map
   * @returns The publish request DTO
   */
  toPublishRequestDTO(event: DomainEvent): PublishDomainEventRequestDTO {
    return {
      id: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      occurredAt: event.occurredAt.value,
      severity: event.severity,
      causedByUserId: event.causedByUserId,
      metadata: {
        source: 'MAD-AI',
        version: '1.0.0',
        correlationId: this.generateCorrelationId(event),
      },
    };
  }

  /**
   * Maps a publish response DTO to a domain result
   *
   * @param response - The API response DTO
   * @param originalEvent - The original domain event for context
   * @returns The mapped result
   */
  fromPublishResponseDTO(
    response: PublishDomainEventResponseDTO,
    originalEvent: DomainEvent
  ): { success: boolean; eventId: string; publishedAt: string; error?: string } {
    return {
      success: response.success,
      eventId: response.eventId || originalEvent.id,
      publishedAt: response.publishedAt || new Date().toISOString(),
      error: response.error,
    };
  }

  /**
   * Maps an API domain event DTO to a domain event entity
   *
   * @param dto - The API domain event DTO
   * @returns The domain event entity
   */
  fromDTO(dto: DomainEventDTO): DomainEvent {
    // Note: This would require creating a DomainEvent from external data
    // For now, this is a placeholder for future implementation
    // when we need to consume events from external systems

    const event = DomainEvent.create({
      id: dto.id,
      eventType: dto.eventType,
      aggregateId: dto.aggregateId,
      aggregateType: dto.aggregateType,
      eventData: dto.eventData,
      causedByUserId: dto.causedByUserId,
    });

    return event;
  }

  /**
   * Maps a domain event to a full DTO representation
   *
   * @param event - The domain event to map
   * @returns The full DTO representation
   */
  toDTO(event: DomainEvent): DomainEventDTO {
    return {
      id: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      occurredAt: event.occurredAt.value,
      severity: event.severity,
      causedByUserId: event.causedByUserId,
      status: 'processed', // Assume processed when mapping from domain
      publishedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a correlation ID for event tracing
   *
   * @param event - The domain event
   * @returns A correlation ID string
   */
  private generateCorrelationId(event: DomainEvent): string {
    return `evt-${event.id}-${Date.now()}`;
  }

  /**
   * Validates that an event can be published
   *
   * @param event - The event to validate
   * @returns True if the event is valid for publishing
   */
  canPublish(event: DomainEvent): boolean {
    return (
      event.id.length > 0 &&
      event.aggregateId.length > 0 &&
      event.aggregateType.length > 0 &&
      Object.keys(event.eventData).length > 0
    );
  }

  /**
   * Gets the event size estimate for logging/monitoring
   *
   * @param event - The domain event
   * @returns Estimated size in bytes
   */
  getEstimatedSize(event: DomainEvent): number {
    const jsonString = JSON.stringify(event.eventData);
    return jsonString.length;
  }
}
