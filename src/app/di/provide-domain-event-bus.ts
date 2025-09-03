/**
 * Domain Event Bus Provider Configuration
 *
 * @description
 * Provides the DomainEventBusService and HttpDomainEventBusRepository implementations
 * for dependency injection in the Application Layer.
 *
 * @architecture
 * - Core Layer: DomainEventBusService implementation
 * - Infrastructure Layer: HttpDomainEventBusRepository implementation
 * - Application Layer: DomainEventBusService injection in use cases
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import { Provider } from '@angular/core';
import { DOMAIN_EVENT_BUS_REPO } from './tokens';
import { HttpDomainEventBusRepository } from '@infrastructure/repositories/business/http-domain-event-bus.repository';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';

/**
 * Domain Event Bus provider configuration
 * Provides the HttpDomainEventBusRepository as the implementation for DOMAIN_EVENT_BUS_REPO
 */
export function provideDomainEventBus(): Provider {
  return {
    provide: DOMAIN_EVENT_BUS_REPO,
    useClass: HttpDomainEventBusRepository,
  };
}

/**
 * Domain Event Bus Service provider configuration
 * Provides the DomainEventBusService for dependency injection
 */
export const provideDomainEventBusService: Provider = {
  provide: DomainEventBusService,
  useClass: DomainEventBusService,
};
