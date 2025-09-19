import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Input as UiInput } from '@presentation/shared/ui/input/input';

import type { UserSearchCriteria } from '../../types';

export interface FilterChangeEvent {
  readonly filters: UserSearchCriteria;
  readonly activeFiltersCount: number;
}

@Component({
  selector: 'app-user-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Icon, FormField, UiInput],
  templateUrl: './user-filter.html',
  styleUrl: './user-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFilterComponent implements OnInit, OnChanges {
  private readonly fb = new FormBuilder();

  @Input() filters: UserSearchCriteria = {
    searchTerm: '',
    statusFilter: 'all',
    roleFilter: '',
    sortBy: 'name',
    sortDirection: 'asc',
  };

  @Input() availableRoles: string[] = [];
  @Input() loading = false;

  @Output() filtersChange = new EventEmitter<FilterChangeEvent>();
  @Output() filtersClear = new EventEmitter<void>();

  // Form signals to track reactive form state
  private readonly _searchTerm = signal<string>('');
  private readonly _statusFilter = signal<'all' | 'active' | 'inactive' | 'pending'>('all');
  private readonly _roleFilter = signal<string>('');

  readonly filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    statusFilter: ['all'],
    roleFilter: [''],
  });

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this._searchTerm()?.trim()) count++;
    if (this._statusFilter() && this._statusFilter() !== 'all') count++;
    if (this._roleFilter() && this._roleFilter() !== '') count++;
    return count;
  });

  readonly hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  readonly currentFilters = computed((): UserSearchCriteria => {
    return {
      searchTerm: this._searchTerm()?.trim() || '',
      statusFilter: this._statusFilter() || 'all',
      roleFilter: this._roleFilter() || '',
      sortBy: this.filters.sortBy,
      sortDirection: this.filters.sortDirection,
    };
  });

  ngOnInit(): void {
    this.updateFormFromInputs();
    this.updateDisabledState();
    this.filterForm.valueChanges.subscribe((values) => {
      // Update signals when form values change
      this._searchTerm.set(values.searchTerm || '');
      this._statusFilter.set(values.statusFilter || 'all');
      this._roleFilter.set(values.roleFilter || '');

      this.onFiltersChange();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      this.updateDisabledState();
    }
    if (changes['filters']) {
      this.updateFormFromInputs();
    }
  }

  onClearFilters(): void {
    if (this.loading) return;

    this.filterForm.reset({
      searchTerm: '',
      statusFilter: 'all',
      roleFilter: '',
    });

    // Update signals when form is reset
    this._searchTerm.set('');
    this._statusFilter.set('all');
    this._roleFilter.set('');

    this.filtersClear.emit();
  }

  private updateFormFromInputs(): void {
    this.filterForm.patchValue(
      {
        searchTerm: this.filters.searchTerm || '',
        statusFilter: this.filters.statusFilter || 'all',
        roleFilter: this.filters.roleFilter || '',
      },
      { emitEvent: false }
    );

    // Update signals to match form values
    this._searchTerm.set(this.filters.searchTerm || '');
    this._statusFilter.set(this.filters.statusFilter || 'all');
    this._roleFilter.set(this.filters.roleFilter || '');
  }

  private updateDisabledState(): void {
    if (this.loading) {
      this.filterForm.disable({ emitEvent: false });
    } else {
      this.filterForm.enable({ emitEvent: false });
    }
  }

  private onFiltersChange(): void {
    const currentFilters = this.currentFilters();
    const activeCount = this.activeFiltersCount();

    this.filtersChange.emit({
      filters: currentFilters,
      activeFiltersCount: activeCount,
    });
  }
}
