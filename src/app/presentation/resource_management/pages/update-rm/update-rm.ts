import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Button } from '../../../../shared/components/ui/button/button';
import { SlideToggleComponent } from '../../../../shared/components/ui/slide-toggle/slide-toggle.component';
import { ResourceUseCases } from '@application/use-cases/resource-management/resource.use-case';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { ResourceFormService } from './resource-form.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-update-rm',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FontAwesomeModule,
        Button,
    SlideToggleComponent,
    ],
    templateUrl: './update-rm.html',
    styleUrl: './update-rm.css',
    providers: [ResourceUseCases, HumanResourceUseCases, MaterialResourceUseCases],
})
export class UpdateRm implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly resourceUseCases = inject(ResourceUseCases);
    private readonly humanResourceUseCases = inject(HumanResourceUseCases);
    private readonly materialResourceUseCases = inject(MaterialResourceUseCases);
    private readonly resourceFormService = inject(ResourceFormService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly notificationService = inject(NotificationService);

    resourceId: number | null = null;
    resourceType: string | null = null;
    loading = true;
    error: string | null = null; // Only for internal error state, not user feedback
    success: string | null = null; // Only for internal success state, not user feedback

    resourceForm!: FormGroup;
    humanForm!: FormGroup;
    materialForm!: FormGroup;

    // Display fields for HumanResource
    humanDisplay: Partial<HumanResource> = {};
    // Display fields for MaterialResource
    materialDisplay: Partial<MaterialResource> = {};

    ngOnInit() {
        this.resourceId = Number(this.route.snapshot.paramMap.get('id'));
        this.loadResource();
    }

    loadResource() {
        this.loading = true;
        this.resourceUseCases.getById(this.resourceId!).subscribe({
            next: (resource: Resource) => {
                this.resourceType = resource.resource_category;
                this.resourceForm = this.resourceFormService.buildResourceForm(resource);
                this.cdr.detectChanges();

                if (resource.resource_category === 'HUMANO') {
                    this.humanResourceUseCases
                        .getHumanResourceById(String(this.resourceId))
                        .subscribe({
                            next: (human: HumanResource) => {
                                this.humanForm = this.resourceFormService.buildHumanForm(human);
                                // Store display fields for template
                                this.humanDisplay = {
                                    resource: human.resource,
                                    resource_id: human.resource_id,
                                    resource_name: human.resource_name,
                                    resource_status: human.resource_status,
                                    resource_workload: human.resource_workload,
                                    role_display: human.role_display,
                                    employment_type_display: human.employment_type_display,
                                    user_email: human.user_email,
                                    user_full_name: human.user_full_name,
                                    is_available: human.is_available,
                                    monthly_cost: human.monthly_cost,
                                };
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                            error: (err) => {
                                this.notificationService
                                    .error('Error', 'Error cargando datos de recurso humano.')
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                        });
                } else {
                    this.materialResourceUseCases
                        .getMaterialResourceById(String(this.resourceId))
                        .subscribe({
                            next: (material: MaterialResource) => {
                                this.materialForm =
                                    this.resourceFormService.buildMaterialForm(material);
                                // Store display fields for template
                                this.materialDisplay = {
                                    resource: material.resource,
                                    resource_id: material.resource_id,
                                    resource_name: material.resource_name,
                                    resource_status: material.resource_status,
                                    resource_type_name: material.resource_type_name,
                                    unit_of_measure_display: material.unit_of_measure_display,
                                    is_low_stock: material.is_low_stock,
                                    total_value: material.total_value,
                                    is_available: material.is_available,
                                    stock_status: material.stock_status,
                                };
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                            error: (err) => {
                                this.notificationService
                                    .error('Error', 'Error cargando datos de recurso material.')
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                        });
                }
            },
            error: (err) => {
                this.notificationService
                    .error('Error', 'Error cargando datos del recurso.')
                    .subscribe();
                this.loading = false;
                this.cdr.detectChanges();
            },
        });
    }

    submit() {
        this.error = null;
        this.success = null;
        this.loading = true;
        this.cdr.detectChanges();
        this.resourceUseCases.updateResource(this.resourceId!, this.resourceForm.value).subscribe({
            next: () => {
                if (this.resourceType === 'HUMANO') {
                    this.humanResourceUseCases
                        .updateHumanResource(String(this.resourceId), this.humanForm.value)
                        .subscribe({
                            next: () => {
                                this.notificationService
                                    .success(
                                        'Actualización exitosa',
                                        'Recurso humano actualizado correctamente.'
                                    )
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                            error: (err) => {
                                this.notificationService
                                    .error('Error', 'Error actualizando recurso humano.')
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                        });
                } else {
                    this.materialResourceUseCases
                        .updateMaterialResource(String(this.resourceId), this.materialForm.value)
                        .subscribe({
                            next: () => {
                                this.notificationService
                                    .success(
                                        'Actualización exitosa',
                                        'Recurso material actualizado correctamente.'
                                    )
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                            error: (err) => {
                                this.notificationService
                                    .error('Error', 'Error actualizando recurso material.')
                                    .subscribe();
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                        });
                }
            },
            error: (err) => {
                this.notificationService.error('Error', 'Error actualizando recurso.').subscribe();
                this.loading = false;
                this.cdr.detectChanges();
            },
        });
    }

    goBack() {
        this.router.navigate(['/resource-management/dashboard']);
    }
}
