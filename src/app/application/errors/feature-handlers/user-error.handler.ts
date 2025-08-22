import { Injectable } from '@angular/core';
import { ApplicationErrorTransformer } from '../application-error.transformer';

/**
 * User Management Error Handler
 * 
 * @description
 * Specialized error handler for user management operations within the Application Layer.
 * This handler extends the base error transformer with user-specific business logic
 * and provides specialized messaging for user profile and account management scenarios.
 * 
 * @responsibilities
 * - Handle user profile management errors
 * - Transform user-related domain errors to application messages
 * - Provide specialized error categorization for user operations
 * - Manage user state and lifecycle error scenarios
 * 
 * @architecture
 * - Application Layer utility
 * - Extends ApplicationErrorTransformer
 * - Focuses on user management domain
 * - Provides feature-specific error handling
 * 
 * @errorTypes
 * - Profile validation errors
 * - User state transition errors
 * - Account status and verification errors
 * - User permissions and role errors
 * - Profile update and modification errors
 * 
 * @example
 * ```typescript
 * // In a user management use case
 * @Injectable({ providedIn: 'root' })
 * export class UpdateUserProfileUseCase {
 *   private errorHandler = inject(UserErrorHandler);
 *   
 *   async execute(data: UpdateProfileData): Promise<Result> {
 *     try {
 *       // ... business logic
 *     } catch (error) {
 *       const message = this.errorHandler.transformUserError(error, 'profile_update');
 *       return Result.failure(message);
 *     }
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserErrorHandler extends ApplicationErrorTransformer {

    /**
     * Transforms user management specific errors
     */
    transformUserError(error: unknown, operation?: string): string {
        // Use base transformation with user context
        const baseMessage = this.transformError(error, { 
            feature: 'user', 
            operation 
        });

        // Apply user-specific enhancements
        return this.enhanceUserMessage(baseMessage, error, operation);
    }

    /**
     * Enhances error messages with user-specific context
     */
    private enhanceUserMessage(baseMessage: string, error: unknown, operation?: string): string {
        // Handle specific user operations
        switch (operation) {
            case 'profile_update':
                return this.enhanceProfileUpdateMessage(baseMessage, error);
            
            case 'profile_retrieval':
                return this.enhanceProfileRetrievalMessage(baseMessage, error);
            
            case 'email_confirmation':
                return this.enhanceEmailConfirmationMessage(baseMessage, error);
            
            case 'password_reset':
                return this.enhancePasswordResetMessage(baseMessage, error);
            
            case 'account_status':
                return this.enhanceAccountStatusMessage(baseMessage, error);
            
            default:
                return baseMessage;
        }
    }

    /**
     * Enhances profile update specific messages
     */
    private enhanceProfileUpdateMessage(baseMessage: string, error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('conflict') || message.includes('409')) {
                return 'Another user already has this information. Please choose different details.';
            }
            
            if (message.includes('validation')) {
                return 'Profile information is invalid. Please check all fields and try again.';
            }
            
            if (message.includes('permission') || message.includes('forbidden')) {
                return 'You do not have permission to update this profile information.';
            }
        }
        
        return baseMessage.includes('Profile') ? baseMessage : `Profile update failed: ${baseMessage}`;
    }

    /**
     * Enhances profile retrieval specific messages
     */
    private enhanceProfileRetrievalMessage(baseMessage: string, error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('not found')) {
                return 'User profile not found. Please contact support if this issue persists.';
            }
            
            if (message.includes('inactive') || message.includes('disabled')) {
                return 'This user account is inactive. Please contact support for assistance.';
            }
            
            if (message.includes('suspended')) {
                return 'This user account has been suspended. Please contact support for more information.';
            }
        }
        
        return baseMessage.includes('profile') ? baseMessage : `Unable to load profile: ${baseMessage}`;
    }

    /**
     * Enhances email confirmation specific messages
     */
    private enhanceEmailConfirmationMessage(baseMessage: string, error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('expired')) {
                return 'The email confirmation link has expired. Please request a new confirmation email.';
            }
            
            if (message.includes('invalid') || message.includes('malformed')) {
                return 'The email confirmation link is invalid. Please check the link or request a new one.';
            }
            
            if (message.includes('already')) {
                return 'Your email address has already been confirmed. You can now use all features.';
            }
            
            if (message.includes('not found')) {
                return 'The confirmation token was not found. It may have already been used or expired.';
            }
        }
        
        return baseMessage.includes('email') || baseMessage.includes('confirmation') 
            ? baseMessage 
            : `Email confirmation failed: ${baseMessage}`;
    }

    /**
     * Enhances password reset specific messages
     */
    private enhancePasswordResetMessage(baseMessage: string, error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('expired')) {
                return 'The password reset link has expired. Please request a new password reset.';
            }
            
            if (message.includes('invalid') || message.includes('malformed')) {
                return 'The password reset link is invalid. Please check the link or request a new one.';
            }
            
            if (message.includes('used') || message.includes('consumed')) {
                return 'This password reset link has already been used. Please request a new one if needed.';
            }
            
            if (message.includes('weak') || message.includes('common')) {
                return 'The new password is too weak. Please choose a stronger password with mixed characters.';
            }
            
            if (message.includes('recent') || message.includes('history')) {
                return 'You cannot reuse a recent password. Please choose a different password.';
            }
        }
        
        return baseMessage.includes('password') 
            ? baseMessage 
            : `Password reset failed: ${baseMessage}`;
    }

    /**
     * Enhances account status specific messages
     */
    private enhanceAccountStatusMessage(baseMessage: string, error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('inactive')) {
                return 'Your account is inactive. Please contact support to reactivate your account.';
            }
            
            if (message.includes('suspended')) {
                return 'Your account has been suspended. Please contact support for assistance.';
            }
            
            if (message.includes('locked')) {
                return 'Your account is temporarily locked due to multiple failed login attempts. Please try again later or contact support.';
            }
            
            if (message.includes('pending')) {
                return 'Your account is pending approval. You will receive an email once your account is activated.';
            }
            
            if (message.includes('verification')) {
                return 'Your account requires email verification. Please check your email and click the verification link.';
            }
        }
        
        return baseMessage.includes('account') 
            ? baseMessage 
            : `Account status issue: ${baseMessage}`;
    }

    /**
     * Gets user-friendly operation names
     */
    static getOperationDisplayName(operation: string): string {
        const operationNames: Record<string, string> = {
            'profile_update': 'Profile Update',
            'profile_retrieval': 'Profile Access',
            'email_confirmation': 'Email Confirmation',
            'password_reset': 'Password Reset',
            'account_status': 'Account Status',
            'user_creation': 'Account Creation',
            'user_deletion': 'Account Deletion',
            'permission_update': 'Permission Update'
        };
        
        return operationNames[operation] || operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Checks if an error is user-management related
     */
    static isUserManagementError(error: unknown): boolean {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            const userKeywords = [
                'profile', 'account', 'user', 'email confirmation',
                'password reset', 'verification', 'activation',
                'suspension', 'deactivation', 'registration'
            ];
            
            return userKeywords.some(keyword => message.includes(keyword));
        }
        
        return false;
    }
}
