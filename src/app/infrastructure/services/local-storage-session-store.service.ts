/**
 * @fileoverview LocalStorageSessionStore - Complete session storage implementation
 *
 * This service provides a comprehensive session storage solution that combines
 * user data, tokens, and metadata persistence using localStorage. It implements
 * the SessionStorePort interface from the domain layer.
 *
 * Key Features:
 * - Atomic session storage operations
 * - Session integrity validation
 * - Comprehensive error handling
 * - Seamless integration with existing storage services
 *
 * @architecture Clean Architecture - Infrastructure Layer
 * @dependencies Domain session contracts and storage ports
 */

// ============================================================================
// Angular Core Imports
// ============================================================================
import { Injectable, inject } from '@angular/core';

// ============================================================================
// Domain Layer Imports
// ============================================================================
import type { SessionStorePort } from '@domain/repositories/session/session-store.repository';
import type { SessionSnapshotContract } from '@domain/contracts/session-store.contract';
import type { TokenStorePort, AuthUserStorePort } from '@domain/repositories/session/session-store.repository';

// ============================================================================
// DI Tokens
// ============================================================================
import { TOKEN_STORE_PORT, AUTH_USER_STORE_PORT } from '@di/tokens';

/**
 * LocalStorageSessionStore - Complete session persistence implementation
 *
 * Provides a unified interface for session storage operations by coordinating
 * between separate token and user data stores. This implementation ensures
 * atomic operations and data consistency.
 *
 * @example Session Storage
 * ```typescript
 * const sessionData = {
 *   user: { id: 123, email: 'user@example.com', ... },
 *   tokens: { accessToken: '...', refreshToken: '...' },
 *   metadata: { createdAt: new Date().toISOString(), ... }
 * };
 *
 * await sessionStore.writeAll(sessionData);
 * ```
 *
 * @example Session Restoration
 * ```typescript
 * const session = await sessionStore.readAll();
 * if (session) {
 *   console.log('Session restored for user:', session.user.email);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageSessionStore implements SessionStorePort {
    // ============================================================================
    // Dependencies Injection
    // ============================================================================

    private readonly tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);
    private readonly userStore = inject<AuthUserStorePort>(AUTH_USER_STORE_PORT);

    // ============================================================================
    // Private Configuration
    // ============================================================================

    private readonly SESSION_METADATA_KEY = 'mad_ai_session_metadata';

    // ============================================================================
    // Public Interface Implementation
    // ============================================================================

    /**
     * Retrieves complete session data from storage
     */
    async readAll(): Promise<SessionSnapshotContract | null> {
        try {
            // Read data from separate stores
            const tokens = await this.tokenStore.read();
            const user = await this.userStore.read();

            // Return null if essential data is missing
            if (!tokens || !user) {
                return null;
            }

            // Construct complete session snapshot
            const session: SessionSnapshotContract = {
                user,
                tokens,
                version: 1,
                updatedAt: Date.now(),
            };

            return session;
        } catch (error) {
            console.error('Failed to read session data:', error);
            return null;
        }
    }

    /**
     * Stores complete session data atomically
     */
    async writeAll(snapshot: SessionSnapshotContract | null): Promise<void> {
        try {
            if (!snapshot) {
                // Clear all session data
                await this.clearAll();
                return;
            }

            // Validate required data
            if (!snapshot.user || !snapshot.tokens) {
                throw new Error('Invalid session snapshot: missing required user or tokens data');
            }

            // Store data atomically
            await this.tokenStore.write(snapshot.tokens);
            await this.userStore.write(snapshot.user);

        } catch (error) {
            console.error('Failed to write session data:', error);
            throw error;
        }
    }

    /**
     * Clears all session data
     */
    async clearAll(): Promise<void> {
        try {
            // Clear all stores atomically
            await this.tokenStore.clear();
            await this.userStore.clear();
        } catch (error) {
            console.error('Failed to clear session data:', error);
            throw error;
        }
    }
}
