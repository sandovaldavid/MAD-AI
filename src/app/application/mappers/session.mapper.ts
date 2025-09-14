import { Injectable } from '@angular/core';
import type { Session } from '@domain/entities/session.entity';
import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';

/**
 * Session Mapper - Application Layer
 *
 * @description
 * Handles transformations between Domain Session entities and persistence contracts.
 * Follows the Application Layer guidelines for mappers by containing only
 * data transformation logic without business rules.
 *
 * @responsibilities
 * - Transform Session entities to SessionSnapshotContract for persistence
 * - Handle value object conversions (Username, Email, ISODateTime, etc.)
 * - Manage data structure mapping between Domain and persistence layers
 *
 * @architecture
 * - Application Layer mapper
 * - Pure data transformation without business logic
 * - Stateless transformation methods
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class SessionMapper {
  /**
   * Maps Domain Session entity to SessionSnapshotContract for persistence
   *
   * @param session - Domain session entity
   * @returns SessionSnapshotContract for persistence layer
   *
   * @example
   * ```typescript
   * const sessionSnapshot = SessionMapper.toSessionSnapshot(session);
   * await sessionStore.writeAll(sessionSnapshot);
   * ```
   */
  static toSessionSnapshot(session: Session): SessionSnapshotContract {
    return {
      user: {
        id: session.user.id,
        username: session.user.username.value, // Convert Username VO to string
        email: session.user.email.value, // Convert Email VO to string
        roleId: session.user.role.id, // Use Role getter for id
        roleName: session.user.role.name, // Use Role getter for name
        accessLevel: session.user.role.accessLevel, // Use direct access to accessLevel
        isEmailConfirmed: session.user.isEmailConfirmed,
        status: session.user.status?.value,
        updatedAt: session.user.updatedAt?.value, // Convert ISODateTime to string
      },
      tokens: {
        accessToken: session.accessToken.getValue(), // Use AccessToken value object
        accessExp: session.accessToken.expSeconds, // Get expiration from AccessToken
        refreshToken: session.refreshToken.getValue(), // Use RefreshToken value object
      },
      version: 1,
      updatedAt: Date.now(),
    };
  }

  /**
   * Maps SessionSnapshotContract to application-friendly format
   * (Future: if needed for reading sessions back from storage)
   */
  // static fromSessionSnapshot(snapshot: SessionSnapshotContract): Session {
  //   // Implementation would go here when needed
  //   // This would reconstruct a Session entity from storage data
  // }
}
