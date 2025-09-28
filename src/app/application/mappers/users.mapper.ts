/**
 * Users Application Mapper
 *
 * @description
 * Application layer mapper for user-related transformations between
 * domain entities and facade/presentation requirements. This mapper
 * handles the transformation logic needed for the UsersFacade.
 *
 * @responsibilities
 * - Transform domain entities to facade-friendly formats
 * - Handle user statistics calculations
 * - Provide utility methods for user data manipulation
 * - Support facade-specific data transformations
 *
 * @architecture
 * - Application Layer: Transformation logic for facade operations
 * - No business logic: Pure transformation functions
 * - Domain entities in, facade types out
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import { Injectable } from '@angular/core';
import type { User } from '@domain/entities/user.entity';
import type { UserStatistics } from '../types/users/users.types';
import { ActivityPeriod } from '@domain/value-objects';

/**
 * Users Application Mapper
 *
 * Provides transformation utilities for the UsersFacade,
 * converting domain entities into facade-friendly formats.
 */
@Injectable({ providedIn: 'root' })
export class UsersMapper {
  /**
   * Calculate user statistics from a list of users
   *
   * @param users Array of user entities
   * @returns User statistics for analytics
   */
  calculateUserStatistics(users: User[]): UserStatistics {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.active).length;
    const inactiveUsers = totalUsers - activeUsers;

    // Calculate users by role
    const usersByRole: Record<string, number> = {};
    users.forEach((user) => {
      const roleName = user.role.name;
      usersByRole[roleName] = (usersByRole[roleName] || 0) + 1;
    });

    // Calculate recent activity using domain business rules
    const recentActivityPeriod = ActivityPeriod.recentActivity();

    const recentlyActiveUsers = users.filter((user) => {
      if (!user.lastActivityAt) return false;
      return recentActivityPeriod.isWithinPeriod(user.lastActivityAt.value);
    });

    const recentActivity = {
      recentlyCreated: users.filter((user) => {
        if (!user.createdAt) return false;
        return recentActivityPeriod.isWithinPeriod(user.createdAt.value);
      }).length,
      recentlyUpdated: users.filter((user) => {
        if (!user.updatedAt) return false;
        return recentActivityPeriod.isWithinPeriod(user.updatedAt.value);
      }).length,
      recentlyLoggedIn: recentlyActiveUsers.length,
    };

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentActivity,
    };
  }

  /**
   * Transform user entity to summary format for listings
   *
   * @param user User entity
   * @returns Simplified user summary
   */
  toUserSummary(user: User) {
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      firstName: user.firstName.value,
      lastName: user.lastName.value,
      active: user.active,
      roleName: user.role.name,
      status: user.userStatus.value,
      createdAt: user.createdAt?.value,
      lastActivityAt: user.lastActivityAt?.value,
    };
  }

  /**
   * Transform array of users to summary format
   *
   * @param users Array of user entities
   * @returns Array of user summaries
   */
  toUserSummaries(users: User[]) {
    return users.map((user) => this.toUserSummary(user));
  }

  /**
   * Create user event from operation result
   *
   * @param eventType Type of user event
   * @param data Event data
   * @returns User event object
   */
  createUserEvent(eventType: string, data: Record<string, unknown>) {
    return {
      type: eventType,
      ...data,
      timestamp: new Date().toISOString(),
    };
  }
}
