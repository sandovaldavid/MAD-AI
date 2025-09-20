import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileInfoForm } from '../../components/profile-info-form/profile-info-form';
import { NotificationSettingsForm } from '../../components/notification-settings-form/notification-settings-form';
import { ChangePasswordForm } from '../../components/change-password-form/change-password-form';
import { AuthFacade } from '@application/facades/auth.facade';
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';
import { PageHeader, PageHeaderConfig } from '@shared/components/page-header/page-header';
import { Icon } from '@shared/ui/icon/icon';

/**
 * Profile Page - Smart Component
 *
 * @description
 * Smart component that manages user profile viewing and editing functionality.
 * Integrates with AuthFacade for profile operations and manages UI state for
 * different profile sections (information, notifications, password).
 *
 * @responsibilities
 * - Coordinate profile data display and updates through AuthFacade
 * - Manage UI state for different profile sections
 * - Handle navigation and page-level UI concerns
 * - Provide reactive data to dumb components
 * - Orchestrate profile management workflows
 *
 * @architecture
 * Smart Component following MAD-AI patterns:
 * - Uses facades for business logic orchestration
 * - Manages reactive state with Angular signals
 * - Delegates UI rendering to dumb components
 * - Handles page-level services (title, breadcrumbs)
 * - No direct business logic or validation
 *
 * @uiSections
 * - Profile Information: Basic user details (name, email, username)
 * - Notification Settings: Email, system, and task notification preferences
 * - Password Management: Change password functionality
 *
 * @since 1.0.0
 * @layer Presentation
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoForm,
    NotificationSettingsForm,
    ChangePasswordForm,
    PageHeader,
    Icon,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly titleService = inject(TitleService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Active tab identifier
   * Controls which profile section is currently displayed
   */
  private readonly _activeTab = signal<'info' | 'notifications' | 'password'>('info');

  /**
   * Tab configuration for navigation
   * Defines available profile sections with icons and labels
   */
  readonly tabs = [
    {
      id: 'info' as const,
      label: 'Información del Perfil',
      iconName: 'user',
    },
    {
      id: 'notifications' as const,
      label: 'Notificaciones',
      iconName: 'mail',
    },
    {
      id: 'password' as const,
      label: 'Seguridad',
      iconName: 'lock',
    },
  ];

  // ============================================================================
  // Computed Properties (Reactive State for Template)
  // ============================================================================

  /**
   * Current authenticated user
   * Reactive computed property that updates when user state changes
   */
  readonly user = computed(() => this.authFacade.user());

  /**
   * Currently active tab
   * Reactive computed property for template binding
   */
  readonly activeTab = computed(() => this._activeTab());

  /**
   * User profile data transformed for ProfileInfoForm
   * Transforms domain User entity into simplified UserProfileData format
   */
  readonly userProfileData = computed(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return null;
    }

    console.log('[ProfilePage] userProfileData computed with user:', currentUser);

    return {
      username: currentUser.username?.toString() ?? '',
      firstName: currentUser.firstName?.toString() ?? '',
      lastName: currentUser.lastName?.toString() ?? '',
      email: currentUser.email?.toString() ?? '',
      role: currentUser.role?.name,
      status: currentUser.status?.toString(),
      createdAt: currentUser.createdAt?.toString(),
    };
  });

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async ngOnInit(): Promise<void> {
    // Set page metadata
    this.titleService.setTitle('Configuración del Perfil');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Configuración del Perfil', icon: 'user' },
    ]);

    // Ensure user profile is loaded
    await this.refreshProfile();
  }

  // ============================================================================
  // Navigation Methods
  // ============================================================================

  /**
   * Sets the active tab for profile sections
   * @param tabId - The tab identifier to activate
   */
  setActiveTab(tabId: 'info' | 'notifications' | 'password'): void {
    this._activeTab.set(tabId);
  }

  /**
   * Handles keyboard navigation for tabs (ARIA compliance)
   * @param event - The keyboard event
   * @param tabId - The current tab ID
   */
  onTabKeydown(event: KeyboardEvent, tabId: string): void {
    const tabIds = this.tabs.map((tab) => tab.id);
    const currentIndex = tabIds.indexOf(tabId as 'info' | 'notifications' | 'password');

    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
        this.setActiveTab(tabIds[prevIndex] as 'info' | 'notifications' | 'password');
        this.focusTab(tabIds[prevIndex]);
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        const nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
        this.setActiveTab(tabIds[nextIndex] as 'info' | 'notifications' | 'password');
        this.focusTab(tabIds[nextIndex]);
        break;
      }

      case 'Home': {
        event.preventDefault();
        this.setActiveTab(tabIds[0] as 'info' | 'notifications' | 'password');
        this.focusTab(tabIds[0]);
        break;
      }

      case 'End': {
        event.preventDefault();
        this.setActiveTab(tabIds[tabIds.length - 1] as 'info' | 'notifications' | 'password');
        this.focusTab(tabIds[tabIds.length - 1]);
        break;
      }
    }
  }

  /**
   * Focus a specific tab element
   * @param tabId - The ID of the tab to focus
   */
  private focusTab(tabId: string): void {
    // In a real implementation, you'd use ViewChild or ElementRef to focus the tab
    // For now, we'll use a simple setTimeout to allow DOM updates
    setTimeout(() => {
      const tabElement = document.getElementById(`tab-${tabId}`);
      if (tabElement) {
        tabElement.focus();
      }
    }, 0);
  }

  // ============================================================================
  // Profile Management Methods
  // ============================================================================

  /**
   * Refreshes user profile data
   * Delegates to AuthFacade for profile retrieval
   */
  async refreshProfile(): Promise<void> {
    try {
      await this.authFacade.refreshProfile();
    } catch (error) {
      // Error handling is managed by AuthFacade
      console.error('Failed to refresh profile:', error);
    }
  }

  /**
   * Updates user profile information
   * @param updateData - Profile data to update
   */
  async updateProfile(updateData: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  }): Promise<void> {
    try {
      await this.authFacade.updateProfile(updateData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }

  /**
   * Changes user password
   * @param passwordData - Current and new password data
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }): Promise<void> {
    try {
      await this.authFacade.changePassword(passwordData);
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  }

  /**
   * Updates notification preferences
   * @param preferences - New notification preferences
   */
  async updateNotificationPreferences(preferences: {
    email: boolean;
    system: boolean;
    task: boolean;
  }): Promise<void> {
    console.log('[ProfilePage] updateNotificationPreferences called with:', preferences);

    try {
      console.log('[ProfilePage] Calling authFacade.updateNotificationPreferences...');
      await this.authFacade.updateNotificationPreferences(preferences);
      console.log('[ProfilePage] authFacade.updateNotificationPreferences completed successfully');
    } catch (error) {
      console.error('[ProfilePage] Failed to update notification preferences:', error);
      throw error; // Re-throw to maintain error handling
    }
  }

  /**
   * Handles form cancellation events
   * Can be used to provide feedback or navigation on cancel
   */
  onFormCancel(): void {
    // For now, just switch back to the info tab if needed
    // This can be extended later for specific cancellation logic
    console.log('Form cancelled');
  }

  // Expose AuthFacade for template access
  get authFacadeInstance() {
    return this.authFacade;
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Perfil de Usuario',
      icon: 'user',
      description: 'Revisa tu perfil de usuario',
      showBreadcrumbs: true,
    })
  );
}
