import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GetResourceDetailUseCase } from '@application/use-cases/resource-management/get-resource-detail.use-case';
import { ResourceTypeCacheUseCase } from '@application/use-cases/resource-management/resource-type-cache.use-case';
import { ResourceDetail } from '@domain/models/resource-management/resource-detail.model';
import { MaterialResourceDetail } from '@domain/models/resource-management/material-resource-detail.model';
import { HumanResourceDetail } from '@domain/models/resource-management/human-resource-detail.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-detail-rm',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './detail-rm.html',
    styleUrl: './detail-rm.css',
})
export class DetailRm implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly getResourceDetailUseCase = inject(GetResourceDetailUseCase);
    private readonly resourceTypeCacheUseCase = inject(ResourceTypeCacheUseCase);
    private readonly router = inject(Router);

    resourceId = signal<number | null>(null);
    resourceDetail = signal<ResourceDetail | null>(null);
    materialDetail = signal<MaterialResourceDetail | null>(null);
    humanDetail = signal<HumanResourceDetail | null>(null);
    resourceTypes = signal<any[] | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    async ngOnInit() {
        this.loading.set(true);
        try {
            const id = Number(this.route.snapshot.paramMap.get('id'));
            this.resourceId.set(id);

            // 1. Obtener tipos de recurso (de caché o API)
            let types = this.resourceTypeCacheUseCase.getResourceTypesFromCache();
            if (!types || types.length === 0) {
                // Si no hay tipos en caché, obtener de API y guardar en caché
                types = await this.resourceTypeCacheUseCase.fetchAndCacheResourceTypes();
            }
            this.resourceTypes.set(types);

            // 2. Obtener detalle común del recurso
            const detail = await this.getResourceDetailUseCase.execute(id);
            this.resourceDetail.set(detail);

            // 3. Según el tipo, obtener detalles específicos
            if (detail.resource_category === 'HUMANO') {
                const human = await this.getResourceDetailUseCase.getHumanDetail(id);
                this.humanDetail.set(human);
            } else {
                const material = await this.getResourceDetailUseCase.getMaterialDetail(id);
                this.materialDetail.set(material);
            }
        } catch (e: any) {
            this.error.set(e?.message || 'Error al cargar el recurso');
        } finally {
            this.loading.set(false);
        }
    }

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }
}
