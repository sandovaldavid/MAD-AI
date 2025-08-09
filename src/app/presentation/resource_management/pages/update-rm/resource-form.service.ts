// ...existing code...
import { Injectable } from '@angular/core';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ResourceFormService {
    constructor(private fb: FormBuilder) {}

    buildResourceForm(resource: Resource): FormGroup {
        return this.fb.group({
            name: [resource.name, [Validators.required, Validators.maxLength(255)]],
            description: [resource.description],
            resource_type: [resource.resource_type, Validators.required],
            location: [resource.location, [Validators.maxLength(255)]],
            availability_status: [resource.availability_status, Validators.required],
            workload_percentage: [
                resource.workload_percentage,
                [Validators.min(0), Validators.max(100)],
            ],
            is_active: [resource.is_active],
            acquisition_date: [resource.acquisition_date],
        });
    }

    buildHumanForm(human: HumanResource): FormGroup {
        return this.fb.group({
            position: [human.position, [Validators.required, Validators.maxLength(255)]],
            role: [human.role, Validators.required],
            employment_type: [human.employment_type, Validators.required],
            experience_years: [human.experience_years, [Validators.min(0), Validators.max(50)]],
            hourly_rate: [human.hourly_rate],
            skills: [human.skills],
            certification_level: [human.certification_level],
        });
    }

    buildMaterialForm(material: MaterialResource): FormGroup {
        return this.fb.group({
            is_consumable: [material.is_consumable],
            unit_cost: [material.unit_cost],
            unit_of_measure: [material.unit_of_measure, Validators.required],
            quantity_available: [material.quantity_available],
            minimum_stock: [material.minimum_stock],
            supplier: [material.supplier],
            purchase_date: [material.purchase_date],
            warranty_expiry: [material.warranty_expiry],
            serial_number: [material.serial_number],
        });
    }
}
// ...existing code...
