/**
 * Domain Events Provider Configuration
 *
 * @description
 * Environment provider configuration for Domain Events processing infrastructure.
 * Sets up dependency injection for DomainEventProcessor and related services.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-08-18
 */

import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { EventProcessingConfig } from '@application/types/domain-event-processing.types';

/**
 * Default configuration for Domain Events processing
 *
 * @description
 * Provides sensible defaults for event processing behavior.
 * Can be overridden in environment configurations.
 */
export const DEFAULT_EVENT_PROCESSING_CONFIG: EventProcessingConfig = {
  enableExternalSystems: false, // Disable by default for safety
  enableSecurityProcessing: true, // Always enable security processing
  enableAuditLogging: true, // Always enable audit logging
  maxBatchSize: 100, // Process up to 100 events in batch
  processingTimeout: 5000, // 5 seconds timeout
  failFast: false, // Continue processing other events on failure
};

/**
 * Development configuration for Domain Events processing
 *
 * @description
 * Configuration optimized for development environment.
 * More verbose logging, smaller batch sizes for testing.
 */
export const DEVELOPMENT_EVENT_PROCESSING_CONFIG: EventProcessingConfig = {
  enableExternalSystems: false, // Disable external systems in dev
  enableSecurityProcessing: true,
  enableAuditLogging: true,
  maxBatchSize: 10, // Smaller batches for easier debugging
  processingTimeout: 10000, // Longer timeout for debugging
  failFast: true, // Fail fast in development to catch issues
};

/**
 * Production configuration for Domain Events processing
 *
 * @description
 * Configuration optimized for production environment.
 * Enables all features with performance optimizations.
 */
export const PRODUCTION_EVENT_PROCESSING_CONFIG: EventProcessingConfig = {
  enableExternalSystems: true, // Enable external integrations
  enableSecurityProcessing: true,
  enableAuditLogging: true,
  maxBatchSize: 500, // Larger batches for performance
  processingTimeout: 3000, // Shorter timeout for production
  failFast: false, // Continue processing for resilience
};

/**
 * Testing configuration for Domain Events processing
 *
 * @description
 * Configuration optimized for testing environment.
 * Minimal external dependencies, fast processing.
 */
export const TESTING_EVENT_PROCESSING_CONFIG: EventProcessingConfig = {
  enableExternalSystems: false, // Disable external systems in tests
  enableSecurityProcessing: false, // Simplify for testing
  enableAuditLogging: false, // Reduce noise in tests
  maxBatchSize: 5, // Very small batches for unit tests
  processingTimeout: 1000, // Fast timeout for tests
  failFast: true, // Fail fast to catch test issues
};

/**
 * Dependency Injection token for EventProcessingConfig
 *
 * @description
 * Use this token to inject EventProcessingConfig in services.
 *
 * @example
 * ```typescript
 * constructor(
 *   @Inject(EVENT_PROCESSING_CONFIG) private config: EventProcessingConfig
 * ) {}
 * ```
 */
export const EVENT_PROCESSING_CONFIG = 'EVENT_PROCESSING_CONFIG';

/**
 * Provide Domain Events processing infrastructure
 *
 * @description
 * Creates environment providers for Domain Events processing.
 * Registers DomainEventProcessor service and its dependencies.
 *
 * @param config - Optional configuration override
 * @returns Environment providers for Domain Events
 *
 * @example Basic usage
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideDomainEvents()
 *   ]
 * };
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideDomainEvents({
 *       enableExternalSystems: true,
 *       maxBatchSize: 200
 *     })
 *   ]
 * };
 * ```
 *
 * @example Environment-specific configuration
 * ```typescript
 * // In app.config.ts
 * import { environment } from '@env/environment';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideDomainEvents(
 *       environment.production
 *         ? PRODUCTION_EVENT_PROCESSING_CONFIG
 *         : DEVELOPMENT_EVENT_PROCESSING_CONFIG
 *     )
 *   ]
 * };
 * ```
 */
export function provideDomainEvents(
  config: Partial<EventProcessingConfig> = {}
): EnvironmentProviders {
  // Merge provided config with defaults
  const finalConfig: EventProcessingConfig = {
    ...DEFAULT_EVENT_PROCESSING_CONFIG,
    ...config,
  };

  return makeEnvironmentProviders([
    // Provide the configuration
    {
      provide: EVENT_PROCESSING_CONFIG,
      useValue: finalConfig,
    },

    // Provide the main DomainEventProcessor service
    {
      provide: DomainEventProcessor,
      useClass: DomainEventProcessor,
    },

    // Note: Additional providers can be added here as needed
    // For example:
    // - External system integrations
    // - Custom audit loggers
    // - Event storage services
    // - Notification services
  ]);
}

/**
 * Provide Domain Events for development environment
 *
 * @description
 * Convenience function for development configuration.
 * Uses development-optimized settings.
 *
 * @example
 * ```typescript
 * // In app.config.ts for development
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideDomainEventsForDevelopment()
 *   ]
 * };
 * ```
 */
export function provideDomainEventsForDevelopment(): EnvironmentProviders {
  return provideDomainEvents(DEVELOPMENT_EVENT_PROCESSING_CONFIG);
}

/**
 * Provide Domain Events for production environment
 *
 * @description
 * Convenience function for production configuration.
 * Uses production-optimized settings.
 *
 * @example
 * ```typescript
 * // In app.config.ts for production
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideDomainEventsForProduction()
 *   ]
 * };
 * ```
 */
export function provideDomainEventsForProduction(): EnvironmentProviders {
  return provideDomainEvents(PRODUCTION_EVENT_PROCESSING_CONFIG);
}

/**
 * Provide Domain Events for testing environment
 *
 * @description
 * Convenience function for testing configuration.
 * Uses testing-optimized settings.
 *
 * @example
 * ```typescript
 * // In test setup files
 * beforeEach(() => {
 *   TestBed.configureTestingModule({
 *     providers: [
 *       provideDomainEventsForTesting()
 *     ]
 *   });
 * });
 * ```
 */
export function provideDomainEventsForTesting(): EnvironmentProviders {
  return provideDomainEvents(TESTING_EVENT_PROCESSING_CONFIG);
}

/**
 * Type definitions for provider configuration functions
 */
export type DomainEventsProviderFn = (
  config?: Partial<EventProcessingConfig>
) => EnvironmentProviders;
export type DomainEventsEnvironmentProviderFn = () => EnvironmentProviders;
