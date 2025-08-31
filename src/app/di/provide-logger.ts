/**
 * Logger Provider Configuration
 *
 * @description
 * Provides the LoggerService implementation for dependency injection
 * in the Application Layer. This ensures consistent logging across
 * all use cases and services.
 *
 * @architecture
 * - Core Layer: LoggerService implementation
 * - Application Layer: Logger injection in use cases
 * - Infrastructure Layer: Logger configuration and output
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import { Provider } from '@angular/core';
import { LOGGER_PORT } from './tokens';
import { LoggerService } from '@core/services/logger.service';

/**
 * Logger provider configuration
 * Provides the LoggerService as the implementation for LOGGER_PORT
 */
export const provideLogger: Provider = {
  provide: LOGGER_PORT,
  useClass: LoggerService,
};
