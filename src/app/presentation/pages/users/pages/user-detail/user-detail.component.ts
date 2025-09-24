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

import {
  Component,
  computed,
  signal,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Application Layer Imports
import { UserLookupFacade, UserCrudFacade } from '@application/facades/users';
import { RolesFacade } from '@application/facades/role/role.facade';

// Domain Imports (for typing only)
import type { User } from '@domain/entities/user.entity';

// Application Layer Types
import type { RoleSummary } from '@application/mappers/role.mapper';

// Presentation Layer Imports
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';

// Shared UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';
import {
  PageHeader,
  PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';

// Local Imports
import type { UserActionConfig } from '../../types';
import { UserPresentationMapper } from '../../mappers';

// Role Access Level Imports
import {
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '@presentation/pages/roles/types/role-colors.type';

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
  imports: [CommonModule, Icon, PageHeader],
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
  private readonly rolesFacade = inject(RolesFacade);
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
   * Current user's role details from roles facade
   */
  private readonly _userRole = signal<RoleSummary | null>(null);

  /**
   * Loading state for user operations
   */
  private readonly _loading = signal<boolean>(false);

  /**
   * Loading state for role operations
   */
  private readonly _roleLoading = signal<boolean>(false);

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
   * Current user's role details
   */
  readonly userRole = computed(() => this._userRole());

  /**
   * Loading state
   */
  readonly loading = computed(() => this._loading());

  /**
   * Role loading state
   */
  readonly roleLoading = computed(() => this._roleLoading());

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
    return (
      userData?.actions || {
        canView: false,
        canEdit: false,
        canDelete: false,
        canActivate: false,
        canDeactivate: false,
        canResetPassword: false,
      }
    );
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
   * Role access level information based on user's role
   */
  readonly roleAccessLevelInfo = computed(() => {
    const role = this.userRole();
    if (!role?.accessLevel) return null;

    return getRoleAccessLevelInfo(role.accessLevel);
  });

  /**
   * Role access level icon based on user's role
   */
  readonly roleAccessLevelIcon = computed(() => {
    const role = this.userRole();
    if (!role?.accessLevel) return null;

    return getRoleAccessLevelIcon(role.accessLevel);
  });

  /**
   * Combined loading state for both user and role data
   */
  readonly isLoading = computed(() => {
    return this.loading() || this.roleLoading();
  });

  /**
   * Page header configuration for the PageHeader component
   */
  readonly headerConfig = computed((): PageHeaderConfig => {
    const userData = this.userDetailData();
    const roleInfo = this.roleAccessLevelInfo();
    const isLoading = this.isLoading();

    if (isLoading) {
      return {
        title: 'Loading User Details...',
        description: 'Please wait while we load the user information',
        icon: 'user',
        showBreadcrumbs: true,
        actions: [],
      };
    }

    if (!userData) {
      return {
        title: 'User Not Found',
        description: 'The requested user could not be found',
        icon: 'alert-circle',
        iconColor: 'text-error-500',
        showBreadcrumbs: true,
        actions: [
          {
            label: 'Go Back',
            icon: 'arrow-left',
            action: () => this.goBackToList(),
            variant: 'secondary',
          },
        ],
      };
    }

    const actions = [];
    const availableActions = this.availableActions();

    if (availableActions.canEdit) {
      actions.push({
        label: 'Edit User',
        icon: 'pencil',
        action: () => this.editUser(),
        variant: 'primary' as const,
      });
    }

    if (availableActions.canActivate) {
      actions.push({
        label: 'Activate',
        icon: 'check-circle',
        action: () => this.activateUser(),
        variant: 'secondary' as const,
        disabled: this.processing(),
      });
    }

    if (availableActions.canDeactivate) {
      actions.push({
        label: 'Deactivate',
        icon: 'x-circle',
        action: () => this.deactivateUser(),
        variant: 'secondary' as const,
        disabled: this.processing(),
      });
    }
    console.log(`role color: ${roleInfo?.iconColor}`);
    return {
      title: userData.displayName,
      description: roleInfo
        ? `${userData.email} • ${roleInfo.label} (${roleInfo.description})`
        : userData.email,
      icon: 'user',
      iconColor: roleInfo?.iconColor + ' ' + roleInfo?.iconBg || 'text-primary-500 bg-primary-100',
      showBreadcrumbs: true,
      actions,
    };
  });

  /**
   * User not found state
   */
  readonly userNotFound = computed(() => {
    return !this.loading() && !this.user() && this.userId() !== null;
  });

  /**
   * User initials for profile display (delegates to model)
   */
  readonly initials = computed(() => {
    const userData = this.userDetailData();
    return userData?.initials || 'U';
  });

  /**
   * Formatted last activity display (delegates to model)
   */
  readonly lastActivityDisplay = computed(() => {
    const userData = this.userDetailData();
    return userData?.lastActivityDisplay || 'Never logged in';
  });

  /**
   * Activity level (delegates to model)
   */
  readonly activityLevel = computed(() => {
    const userData = this.userDetailData();
    return userData?.activityLevel || 'inactive';
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
      const result = await this.userLookupFacade.getUserById(userId);
      // If result is a Message, extract user
      let user: User | null = null;
      if (result && typeof result === 'object' && 'success' in result) {
        user = result['user'] ?? null;
      } else {
        user = result as User;
      }
      this._user.set(user);
      // Load role details if user has a role
      if (user && user['role'] && user['role']['id']) {
        await this.loadUserRole(user['role']['id']);
      }
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
   * Load user role details by role ID
   */
  async loadUserRole(roleId: number): Promise<void> {
    this._roleLoading.set(true);

    try {
      await this.rolesFacade.loadRole(roleId);
      const role = this.rolesFacade.currentRole();
      this._userRole.set(role);
    } catch (error: unknown) {
      console.error('Failed to load user role:', error);
      // Don't set error for role loading as it's secondary data
    } finally {
      this._roleLoading.set(false);
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
      const result = await this.userCrudFacade.updateUserStatus(userId, true);
      if (result.success) {
        this._error.set(null);
        await this.refreshUser();
        this._error.set(result.message || 'Usuario activado exitosamente.');
      } else {
        this._error.set(result.error || result.message || 'No se pudo activar el usuario.');
      }
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
      const result = await this.userCrudFacade.updateUserStatus(userId, false);
      if (result.success) {
        this._error.set(null);
        await this.refreshUser();
        this._error.set(result.message || 'Usuario desactivado exitosamente.');
      } else {
        this._error.set(result.error || result.message || 'No se pudo desactivar el usuario.');
      }
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
      const result = await this.userCrudFacade.sendResetPasswordEmail(userId);
      if (result.success) {
        this._error.set(null);
        this._error.set(result.message || 'Contraseña restablecida y correo enviado.');
      } else {
        this._error.set(result.error || result.message || 'No se pudo restablecer la contraseña.');
      }
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
    const confirmed = confirm(
      `Are you sure you want to delete ${userData.displayName}? The user account will be deactivated and can no longer access the system.`
    );
    if (!confirmed) return;

    this._processing.set(true);

    try {
      const result = await this.userCrudFacade.deleteUser(userId);
      if (result.success) {
        this._error.set(null);
        this.router.navigate(['/users'], {
          state: {
            message:
              result.message ||
              `Usuario ${userData.displayName} eliminado (desactivado) exitosamente.`,
          },
        });
      } else {
        this._error.set(result.error || result.message || 'No se pudo eliminar el usuario.');
      }
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
