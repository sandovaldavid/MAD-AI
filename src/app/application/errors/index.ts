/**
 * Application Layer Error Handling System
 *
 * @description
 * This module provides specialized error handling utilities for the Application Layer.
 * It includes error transformers and handlers that convert domain errors into
 * user-friendly messages while maintaining clean architectural separation.
 *
 * @exports
 * - ApplicationErrorTransformer: Base error transformation utility
 * - UserErrorHandler: Specialized handler for user management errors
 *
 * @architecture
 * - Application Layer utilities
 * - Works with domain error entities
 * - Provides feature-specific error transformations
 * - Integrates with existing error handling system
 *
 * @usage
 * ```typescript
 * // In a use case
 * import { ApplicationErrorTransformer } from '@application/errors';
 *
 * @Injectable({ providedIn: 'root' })
 * export class SomeUseCase {
 *   private errorTransformer = inject(ApplicationErrorTransformer);
 *
 *   async execute(): Promise<Result> {
 *     try {
 *       // ... business logic
 *     } catch (error) {
 *       const message = this.errorTransformer.transformError(error);
 *       return Result.failure(message);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @layer Application
 */

export { ApplicationErrorTransformer } from './application-error.transformer';
export { UserErrorHandler } from './feature-handlers/user-error.handler';
