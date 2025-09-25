import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  effect,
} from '@angular/core';
// Access level config for consistent labels/descriptions
import { ROLE_ACCESS_LEVEL_CONFIG } from '../../types/role-colors.type';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesFacade } from '@application/facades/role';
import { RoleCard } from '../../components/role-card/role-card';
import { RoleModel } from '../../models/role.model';
import { Toggle } from '@presentation/shared/ui/toggle/toggle';

type FormMode = 'create' | 'edit';

interface RoleFormData {
  name: string;
  accessLevel: number;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RoleCard, Toggle],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormComponent {
  private fb = inject(FormBuilder);
  private facade = inject(RolesFacade);

  // Inputs
  mode = input<FormMode>('create');
  loading = input<boolean>(false);
  initialData = input<Partial<RoleFormData>>();

  // Outputs
  submitted = output<RoleFormData>();
  cancelled = output<void>();

  // Internal state
  submitting = signal<boolean>(false);
  accessLevelValue = signal<number>(3);
  formNameValue = signal<string>('');
  formDescriptionValue = signal<string>('');
  formIsActiveValue = signal<boolean>(true);

  // Form setup
  roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    accessLevel: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    description: [''],
    isActive: [true],
  });

  // Access levels configuration (from config)
  readonly accessLevels = Object.entries(ROLE_ACCESS_LEVEL_CONFIG).map(([key, info]) => ({
    value: Number(key),
    label: `Nivel ${key} - ${info.label}`,
    description: info.description,
    color: info.color,
    // Optionally add icon if needed: icon: ROLE_ACCESS_LEVEL_ICONS[Number(key)]
  }));

  // Preview role model computed from form values
  readonly previewRole = computed((): RoleModel => {
    const name = this.formNameValue() || 'Nuevo Rol';
    const accessLevel = this.accessLevelValue();

    return {
      id: -1, // Temporary ID for preview
      name: name,
      displayName: `${name} (L${accessLevel})`,
      accessLevel: accessLevel,
      isActive: this.formIsActiveValue(),
      description: this.formDescriptionValue() || undefined,
      userCount: 0, // New role starts with 0 users
    };
  });

  constructor() {
    // Initialize form with data if provided
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.roleForm.patchValue(data);
        // Update signals when initial data is provided
        if (data.accessLevel !== undefined) {
          this.accessLevelValue.set(data.accessLevel);
        }
        if (data.name !== undefined) {
          this.formNameValue.set(data.name);
        }
        if (data.description !== undefined) {
          this.formDescriptionValue.set(data.description);
        }
        if (data.isActive !== undefined) {
          this.formIsActiveValue.set(data.isActive);
        }
      }
    });

    // Handle form disabling based on loading or submitting state
    effect(() => {
      const isSubmitting = this.submitting() || this.loading();
      if (isSubmitting) {
        this.roleForm.disable();
      } else {
        this.roleForm.enable();
      }
    });

    // Subscribe to form field changes to update signals
    this.roleForm.get('accessLevel')?.valueChanges.subscribe((value) => {
      if (value !== null && value !== undefined) {
        this.accessLevelValue.set(value);
      }
    });

    this.roleForm.get('name')?.valueChanges.subscribe((value) => {
      this.formNameValue.set(value || '');
    });

    this.roleForm.get('description')?.valueChanges.subscribe((value) => {
      this.formDescriptionValue.set(value || '');
    });

    this.roleForm.get('isActive')?.valueChanges.subscribe((value) => {
      this.formIsActiveValue.set(value ?? true);
    });
  }

  async onSubmit() {
    if (this.roleForm.valid) {
      this.submitting.set(true);
      try {
        const rawFormData = this.roleForm.value;
        // Ensure accessLevel is a number (form select values are strings by default)
        const formData: RoleFormData = {
          name: rawFormData.name!,
          accessLevel: Number(rawFormData.accessLevel),
          description: rawFormData.description || '',
          isActive: rawFormData.isActive ?? true,
        };
        this.submitted.emit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        this.submitting.set(false);
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.roleForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return `${fieldName} es requerido`;
      if (field.errors?.['minlength'])
        return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors?.['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors?.['max']) return `El valor máximo es ${field.errors['max'].max}`;
    }
    return null;
  }

  // Handle toggle status change
  onToggleActiveStatus(isActive: boolean): void {
    this.roleForm.patchValue({ isActive });
    this.roleForm.markAsTouched();
  }

  // Event handlers for role-card (disabled in preview mode)
  onPreviewView() {
    // No action in preview mode
  }

  onPreviewToggleStatus() {
    // No action in preview mode
  }

  onPreviewDelete() {
    // No action in preview mode
  }

  // Legacy method for backwards compatibility
  async submit() {
    if (this.roleForm.valid) {
      await this.facade.createRole({
        name: this.roleForm.value.name!,
        accessLevel: Number(this.roleForm.value.accessLevel!),
        description: this.roleForm.value.description || '',
      });
    }
  }
}
