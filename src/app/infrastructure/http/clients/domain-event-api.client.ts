/**
 * @fileoverview Domain Event API Client - Infrastructure Layer
 *
 * @description HTTP client for domain event operations with external APIs.
 * Provides pure HTTP communication for publishing and retrieving domain events
 * without business logic or data transformation.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility HTTP communication for domain events
 * @architecture Infrastructure Layer - HTTP Client Pattern
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import {
  PublishDomainEventRequestDTO,
  PublishDomainEventResponseDTO,
  DomainEventDTO,
  DomainEventQueryDTO,
  DomainEventListResponseDTO,
} from '@infrastructure/dtos/events';

/**
 * Domain Event API Client - Infrastructure Layer
 *
 * Cliente HTTP puro para operaciones de eventos de dominio.
 * Encapsula todas las llamadas HTTP relacionadas con eventos
 * sin lógica de negocio ni transformación de datos.
 *
 * @description Este cliente sigue el patrón de infraestructura limpia,
 * proporcionando una interfaz pura de HTTP para que los repositories
 * puedan usarla sin conocer los detalles de las llamadas HTTP.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Injectable({ providedIn: 'root' })
export class DomainEventApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Publish a domain event to external systems
   *
   * @param event - The domain event to publish
   * @returns Observable of the publishing response
   */
  publish(event: PublishDomainEventRequestDTO): Observable<PublishDomainEventResponseDTO> {
    return this.http.post<PublishDomainEventResponseDTO>(API_ENDPOINTS_V1.EVENTS.PUBLISH, event);
  }

  /**
   * Get a specific domain event by ID
   *
   * @param eventId - The unique identifier of the event
   * @returns Observable of the domain event
   */
  getById(eventId: string): Observable<DomainEventDTO> {
    return this.http.get<DomainEventDTO>(API_ENDPOINTS_V1.EVENTS.DETAIL(eventId));
  }

  /**
   * Query domain events with filters
   *
   * @param query - Query parameters and filters
   * @returns Observable of paginated event list
   */
  query(query: DomainEventQueryDTO): Observable<DomainEventListResponseDTO> {
    let params = new HttpParams();

    if (query.eventType) {
      params = params.set('eventType', query.eventType);
    }
    if (query.aggregateId) {
      params = params.set('aggregateId', query.aggregateId);
    }
    if (query.aggregateType) {
      params = params.set('aggregateType', query.aggregateType);
    }
    if (query.severity) {
      params = params.set('severity', query.severity);
    }
    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }
    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.limit) {
      params = params.set('limit', query.limit.toString());
    }
    if (query.offset) {
      params = params.set('offset', query.offset.toString());
    }

    return this.http.get<DomainEventListResponseDTO>(API_ENDPOINTS_V1.EVENTS.LIST, { params });
  }

  /**
   * Get all domain events (without filters)
   *
   * @returns Observable of all events
   */
  getAll(): Observable<DomainEventListResponseDTO> {
    return this.http.get<DomainEventListResponseDTO>(API_ENDPOINTS_V1.EVENTS.LIST);
  }

  /**
   * Get events for a specific aggregate
   *
   * @param aggregateId - The aggregate ID to filter by
   * @returns Observable of events for the aggregate
   */
  getByAggregate(aggregateId: string): Observable<DomainEventListResponseDTO> {
    const params = new HttpParams().set('aggregateId', aggregateId);

    return this.http.get<DomainEventListResponseDTO>(API_ENDPOINTS_V1.EVENTS.LIST, { params });
  }

  /**
   * Get events of a specific type
   *
   * @param eventType - The event type to filter by
   * @returns Observable of events of the specified type
   */
  getByType(eventType: string): Observable<DomainEventListResponseDTO> {
    const params = new HttpParams().set('eventType', eventType);

    return this.http.get<DomainEventListResponseDTO>(API_ENDPOINTS_V1.EVENTS.LIST, { params });
  }
}
