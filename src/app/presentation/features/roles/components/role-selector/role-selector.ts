import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

// Application layer imports
import { RolesFacade } from '@application/facades/roles.facade';

// Presentation layer imports
import { RoleModel } from '../../models/role.model';

// Feature components
import { AccessLevelIndicator } from '../access-level-indicator/access-level-indicator';

export type RoleSelectorVariant = 'dropdown' | 'list' | 'cards' | 'compact';
export type SelectionMode = 'single' | 'multiple';

export interface RoleSelectionEvent {
  role: RoleModel | null;
  roles: RoleModel[];
  selectedIds: number[];
}

@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AccessLevelIndicator],
  templateUrl: './role-selector.html',
  styleUrl: './role-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelectorComponent implements OnInit {
  private readonly rolesFacade = inject(RolesFacade);

  // Configuration inputs
  @Input() variant: RoleSelectorVariant = 'dropdown';
  @Input() selectionMode: SelectionMode = 'single';
  @Input() placeholder: string = 'Select role(s)...';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() allowClear: boolean = true;
  @Input() searchable: boolean = true;
  @Input() showAccessLevel: boolean = true;
  @Input() showRoleCount: boolean = false;
  @Input() maxSelections: number | null = null;
  @Input() filterByAccessLevel: number[] | null = null;
  @Input() excludeRoles: number[] = [];
  @Input() label: string = '';
  @Input() errorMessage: string | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Value inputs
  @Input() selectedRoleId: number | null = null;
  @Input() selectedRoleIds: number[] = [];

  // Output events
  @Output() selectionChange = new EventEmitter<RoleSelectionEvent>();
  @Output() roleSelect = new EventEmitter<RoleModel>();
  @Output() roleDeselect = new EventEmitter<RoleModel>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() dropdownOpen = new EventEmitter<void>();
  @Output() dropdownClose = new EventEmitter<void>();

  // Internal state
  private readonly _isOpen = signal(false);
  private readonly _searchTerm = signal('');
  private readonly _hoveredIndex = signal(-1);
  private readonly _focusedIndex = signal(-1);
  private readonly _selectedIds = signal<number[]>([]);

  // Form control for search
  readonly searchControl = new FormControl('');

  // Computed properties
  readonly isOpen = computed(() => this._isOpen());
  readonly searchTerm = computed(() => this._searchTerm());
  readonly loading = computed(() => this.rolesFacade.loading());
  readonly facadeError = computed(() => this.rolesFacade.error());

  readonly availableRoles = computed(() => {
    const allRoles = this.rolesFacade.roles();
    const searchTerm = this._searchTerm().toLowerCase();

    let filtered = allRoles.filter((role) => {
      // Exclude roles in excludeRoles array
      if (this.excludeRoles.includes(role.id)) {
        return false;
      }

      // Filter by access level if specified
      if (this.filterByAccessLevel && this.filterByAccessLevel.length > 0) {
        if (!this.filterByAccessLevel.includes(role.accessLevel)) {
          return false;
        }
      }

      // Apply search filter
      if (searchTerm) {
        const matchesName = role.name.toLowerCase().includes(searchTerm);
        const matchesDescription = role.description?.toLowerCase().includes(searchTerm) || false;
        return matchesName || matchesDescription;
      }

      return true;
    });

    return filtered;
  });

  readonly selectedRoles = computed(() => {
    const roles = this.rolesFacade.roles();
    const selectedIds = this._selectedIds();
    return roles.filter((role) => selectedIds.includes(role.id));
  });

  readonly canAddMore = computed(() => {
    if (this.selectionMode === 'single') return false;
    if (!this.maxSelections) return true;
    return this._selectedIds().length < this.maxSelections;
  });

  readonly displayValue = computed(() => {
    const selected = this.selectedRoles();
    if (selected.length === 0) {
      return this.placeholder;
    }

    if (this.selectionMode === 'single') {
      return selected[0]?.name || '';
    }

    if (selected.length === 1) {
      return selected[0].name;
    }

    return `${selected.length} roles selected`;
  });

  readonly hasValidSelection = computed(() => {
    const selectedCount = this._selectedIds().length;
    if (this.required && selectedCount === 0) {
      return false;
    }
    return true;
  });

  ngOnInit() {
    // Initialize selected IDs from inputs
    if (this.selectionMode === 'single' && this.selectedRoleId) {
      this._selectedIds.set([this.selectedRoleId]);
    } else if (this.selectionMode === 'multiple' && this.selectedRoleIds.length > 0) {
      this._selectedIds.set([...this.selectedRoleIds]);
    }

    // Load roles if not already loaded
    if (this.rolesFacade.roles().length === 0) {
      this.loadRoles();
    }

    // Setup search subscription
    if (this.searchable) {
      this.searchControl.valueChanges.subscribe((value) => {
        this._searchTerm.set(value || '');
        this.searchChange.emit(value || '');
      });
    }
  }

  async loadRoles() {
    try {
      await this.rolesFacade.refresh();
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  }

  toggleDropdown() {
    if (this.disabled) return;

    if (this._isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    if (this.disabled) return;

    this._isOpen.set(true);
    this._focusedIndex.set(-1);
    this.dropdownOpen.emit();
  }

  closeDropdown() {
    this._isOpen.set(false);
    this._hoveredIndex.set(-1);
    this._focusedIndex.set(-1);
    this.dropdownClose.emit();
  }

  selectRole(role: RoleModel) {
    if (this.disabled) return;

    const currentSelected = this._selectedIds();

    if (this.selectionMode === 'single') {
      this._selectedIds.set([role.id]);
      this.emitSelectionChange();
      this.roleSelect.emit(role);
      this.closeDropdown();
    } else {
      // Multiple selection mode
      if (currentSelected.includes(role.id)) {
        // Deselect
        this.deselectRole(role);
      } else {
        // Select (if we can add more)
        if (this.canAddMore()) {
          this._selectedIds.set([...currentSelected, role.id]);
          this.emitSelectionChange();
          this.roleSelect.emit(role);
        }
      }
    }
  }

  deselectRole(role: RoleModel) {
    if (this.disabled) return;

    const currentSelected = this._selectedIds();
    const newSelected = currentSelected.filter((id) => id !== role.id);
    this._selectedIds.set(newSelected);
    this.emitSelectionChange();
    this.roleDeselect.emit(role);
  }

  clearSelection() {
    if (this.disabled) return;

    const previouslySelected = this.selectedRoles();
    this._selectedIds.set([]);
    this.emitSelectionChange();

    // Emit deselect events for all previously selected roles
    previouslySelected.forEach((role) => {
      this.roleDeselect.emit(role);
    });
  }

  isRoleSelected(role: RoleModel): boolean {
    return this._selectedIds().includes(role.id);
  }

  private emitSelectionChange() {
    const selectedRoles = this.selectedRoles();
    const selectedIds = this._selectedIds();

    const event: RoleSelectionEvent = {
      role: this.selectionMode === 'single' ? selectedRoles[0] || null : null,
      roles: selectedRoles,
      selectedIds: selectedIds,
    };

    this.selectionChange.emit(event);
  }

  // Keyboard navigation
  onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this._isOpen()) {
          this.openDropdown();
        } else {
          const focusedRole = this.getFocusedRole();
          if (focusedRole) {
            this.selectRole(focusedRole);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this._isOpen()) {
          this.openDropdown();
        } else {
          this.moveFocus(1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this._isOpen()) {
          this.moveFocus(-1);
        }
        break;

      case 'Tab':
        if (this._isOpen()) {
          this.closeDropdown();
        }
        break;
    }
  }

  private moveFocus(direction: number) {
    const roles = this.availableRoles();
    if (roles.length === 0) return;

    const currentIndex = this._focusedIndex();
    let newIndex = currentIndex + direction;

    if (newIndex < 0) {
      newIndex = roles.length - 1;
    } else if (newIndex >= roles.length) {
      newIndex = 0;
    }

    this._focusedIndex.set(newIndex);
  }

  private getFocusedRole(): RoleModel | null {
    const roles = this.availableRoles();
    const focusedIndex = this._focusedIndex();
    return roles[focusedIndex] || null;
  }

  onRoleHover(index: number) {
    this._hoveredIndex.set(index);
  }

  onRoleLeave() {
    this._hoveredIndex.set(-1);
  }

  isRoleFocused(index: number): boolean {
    return this._focusedIndex() === index;
  }

  isRoleHovered(index: number): boolean {
    return this._hoveredIndex() === index;
  }

  // Click outside handler
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const selector = target.closest('.role-selector');

    if (!selector && this._isOpen()) {
      this.closeDropdown();
    }
  }

  // Utility methods for templates
  getRoleIcon(role: RoleModel): string {
    // Map role names to icons (customize as needed)
    const iconMap: Record<string, string> = {
      'System Administrator': 'settings',
      'Project Manager': 'user-check',
      'Senior User': 'user-circle',
      'Standard User': 'user',
      'Basic User': 'user-minus',
    };

    return iconMap[role.name] || 'user';
  }

  getRoleDescription(role: RoleModel): string {
    return role.description || `Access Level ${role.accessLevel}`;
  }

  trackByRoleId(index: number, role: RoleModel): number {
    return role.id;
  }
}
