/**
 * User Detail Page - Smart Component
 *
 * @description
 * Smart component responsible for displaying detailed information about a specific user.
 * Handles user lookup, information display, and contextual actions like edit, activate,
 * deactivate, and navigation. Provides comprehensive user overview with statistics.
 *
 * @responsibilities
 * - Load user details through UserLookupFacade
 * - Display comprehensive user information and statistics
 * - Handle user-specific actions (edit, activate, deactivate, delete)
 * - Manage navigation and breadcrumb context
 * - Set dynamic page metadata based on user data
 * - Handle loading, error, and not-found states
 * - Coordinate between lookup and CRUD facades
 *
 * @architecture
 * Smart Component following MAD-AI patterns:
 * - Uses facades for business logic orchestration
 * - Manages reactive state with Angular signals
 * - Delegates UI rendering to dumb components
 * - Handles page-level services (title, breadcrumbs)
 * - No direct business logic or validation
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { Component, computed, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Application Layer Imports
import { UserLookupFacade, UserCrudFacade } from '@application/facades/users';

// Domain Imports (for typing only)
import type { User } from '@domain/entities/user.entity';

// Presentation Layer Imports
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';

// Local Imports
import type { UserActionConfig } from '../../types';
import { UserPresentationMapper } from '../../mappers';

/**
 * User Detail Page Component
 *
 * Displays comprehensive information about a specific user including
 * personal details, activity statistics, permissions, and provides
 * contextual actions for user management.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    Icon,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage implements OnInit {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly userLookupFacade = inject(UserLookupFacade);
  private readonly userCrudFacade = inject(UserCrudFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(TitleService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Current user ID from route parameters
   */
  private readonly _userId = signal<number | null>(null);

  /**
   * Current user entity from facade
   */
  private readonly _user = signal<User | null>(null);

  /**
   * Loading state for user operations
   */
  private readonly _loading = signal<boolean>(false);

  /**
   * Error state for user operations
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Processing state for user actions
   */
  private readonly _processing = signal<boolean>(false);

  // ============================================================================
  // Computed Properties (Reactive State for Template)
  // ============================================================================

  /**
   * Current user ID
   */
  readonly userId = computed(() => this._userId());

  /**
   * Current user entity
   */
  readonly user = computed(() => this._user());

  /**
   * Loading state
   */
  readonly loading = computed(() => this._loading());

  /**
   * Error state
   */
  readonly error = computed(() => this._error());

  /**
   * Processing state for actions
   */
  readonly processing = computed(() => this._processing());

  /**
   * User detail view model optimized for display
   */
  readonly userDetailData = computed(() => {
    const user = this.user();
    if (!user) return null;

    const actions = this.computeUserActions(user);
    return UserPresentationMapper.toDetailViewModel(user, actions);
  });

  /**
   * Available actions for the current user
   */
  readonly availableActions = computed(() => {
    const userData = this.userDetailData();
    return userData?.actions || {
      canView: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canDeactivate: false,
      canResetPassword: false,
    };
  });

  /**
   * Dynamic page title based on user data
   */
  readonly pageTitle = computed(() => {
    const userData = this.userDetailData();
    if (!userData) return 'User Details';
    return `${userData.displayName} - User Details`;
  });

  /**
   * Dynamic breadcrumbs based on user data
   */
  readonly breadcrumbs = computed(() => {
    const userData = this.userDetailData();
    const baseCrumbs = [
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
    ];

    if (userData) {
      baseCrumbs.push({
        label: userData.displayName,
        icon: 'user',
        route: `/users/${userData.id}`, // Add the current user detail route
      });
    } else {
      baseCrumbs.push({
        label: 'User Details',
        icon: 'user',
        route: '#', // Use placeholder route for loading state
      });
    }

    return baseCrumbs;
  });

  /**
   * User not found state
   */
  readonly userNotFound = computed(() => {
    return !this.loading() && !this.user() && this.userId() !== null;
  });

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async ngOnInit(): Promise<void> {
    // Extract user ID from route
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId || isNaN(Number(userId))) {
      this.handleInvalidUserId();
      return;
    }

    this._userId.set(Number(userId));

    // Set initial page metadata
    this.titleService.setTitle('User Details');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
      { label: 'Loading...', icon: 'user' },
    ]);

    // Load user data
    await this.loadUser();
  }

  // ============================================================================
  // Data Loading Methods
  // ============================================================================

  /**
   * Load user data by ID
   */
  async loadUser(): Promise<void> {
    const userId = this.userId();
    if (!userId) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const user = await this.userLookupFacade.getUserById(userId);
      this._user.set(user);

      // Update page metadata with user info
      this.updatePageMetadata();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user';
      this._error.set(errorMessage);
      console.error('Failed to load user:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Refresh current user data
   */
  async refreshUser(): Promise<void> {
    await this.loadUser();
  }

  // ============================================================================
  // Navigation Methods
  // ============================================================================

  /**
   * Navigate back to users list
   */
  goBackToList(): void {
    this.router.navigate(['/users']);
  }

  /**
   * Navigate to user edit page
   */
  editUser(): void {
    const userId = this.userId();
    if (userId) {
      this.router.navigate(['/users/edit', userId]);
    }
  }

  // ============================================================================
  // User Action Methods
  // ============================================================================

  /**
   * Activate user account
   */
  async activateUser(): Promise<void> {
    const userId = this.userId();
    if (!userId) return;

    this._processing.set(true);

    try {
      // This would call the appropriate facade method
      console.log('Activating user:', userId);
      // await this.userCrudFacade.activateUser({ userId });

      // Refresh user data to reflect changes
      await this.refreshUser();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate user';
      this._error.set(errorMessage);
      console.error('Failed to activate user:', error);
    } finally {
      this._processing.set(false);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(): Promise<void> {
    const userId = this.userId();
    if (!userId) return;

    this._processing.set(true);

    try {
      // This would call the appropriate facade method
      console.log('Deactivating user:', userId);
      // await this.userCrudFacade.deactivateUser({ userId });

      // Refresh user data to reflect changes
      await this.refreshUser();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user';
      this._error.set(errorMessage);
      console.error('Failed to deactivate user:', error);
    } finally {
      this._processing.set(false);
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(): Promise<void> {
    const userId = this.userId();
    if (!userId) return;

    this._processing.set(true);

    try {
      // This would call the appropriate facade method
      console.log('Resetting password for user:', userId);
      // await this.userCrudFacade.resetPassword({ userId });

      // Show success message (would be handled by notification service)
      console.log('Password reset email sent');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      this._error.set(errorMessage);
      console.error('Failed to reset password:', error);
    } finally {
      this._processing.set(false);
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(): Promise<void> {
    const userId = this.userId();
    const userData = this.userDetailData();
    if (!userId || !userData) return;

    // This would typically show a confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete ${userData.displayName}? This action cannot be undone.`);
    if (!confirmed) return;

    this._processing.set(true);

    try {
      await this.userCrudFacade.deleteUser(userId);

      // Navigate back to list after successful deletion
      this.router.navigate(['/users'], {
        state: { message: `User ${userData.displayName} has been deleted successfully.` }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      this._error.set(errorMessage);
      console.error('Failed to delete user:', error);
    } finally {
      this._processing.set(false);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Handle invalid user ID from route
   */
  private handleInvalidUserId(): void {
    this._error.set('Invalid user ID provided');
    this.titleService.setTitle('Invalid User');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
      { label: 'Invalid User', icon: 'alert-circle' },
    ]);
  }

  /**
   * Update page metadata based on loaded user
   */
  private updatePageMetadata(): void {
    const userData = this.userDetailData();
    if (!userData) return;

    // Update page title
    this.titleService.setTitle(this.pageTitle());

    // Update breadcrumbs
    this.breadcrumbService.setBreadcrumbs(this.breadcrumbs());
  }

  /**
   * Compute available actions based on user data and current user permissions
   */
  private computeUserActions(user: User): UserActionConfig {
    // This would typically check current user permissions and business rules
    // For now, we'll use basic rules based on user state
    return {
      canView: true,
      canEdit: true, // Would check if current user can edit this user
      canDelete: !user.active, // Can only delete inactive users
      canActivate: !user.active,
      canDeactivate: user.active,
      canResetPassword: user.active,
    };
  }
}