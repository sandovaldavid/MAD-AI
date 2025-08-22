import { Injectable, inject } from '@angular/core';
import type { ExportPort, PdfConfig, CsvConfig, JsonConfig } from '@domain/contracts/export.port';
import { EXPORT_PORT } from '@di/tokens';
import type { Role } from '@domain/entities/role.entity';
import { AccessLevel } from '@domain/value-objects/accesslevel.vo';

export interface RoleExportOptions {
    includeId?: boolean;
    includeAccessLevel?: boolean;
    includeStatus?: boolean;
    includeDescription?: boolean;
    includeUserCount?: boolean;
    customTitle?: string;
    format?: 'pdf' | 'csv' | 'json';
}

@Injectable({
    providedIn: 'root',
})
export class RoleExportService {
    private exportPort = inject<ExportPort>(EXPORT_PORT);

    async exportRoles(roles: Role[], options: RoleExportOptions = {}): Promise<void> {
        const {
            includeId = true,
            includeAccessLevel = true,
            includeStatus = true,
            includeDescription = true,
            includeUserCount = true,
            customTitle = 'Roles Report',
            format = 'pdf',
        } = options;

        // Preparar los datos planos para exportación
        const exportData = roles.map((role) => {
            const data: any = {};

            if (includeId) data.id = role.id;
            data.name = role.name;
            if (includeAccessLevel) {
                // Create AccessLevel instance to get display name
                try {
                    const accessLevel = AccessLevel.create(role.accessLevel);
                    data.accessLevel = accessLevel.getDisplayName();
                } catch {
                    data.accessLevel = `Level ${role.accessLevel}`;
                }
            }
            if (includeStatus) data.status = role.isActive ? 'Activo' : 'Inactivo';
            if (includeDescription) data.description = role.description || 'N/A';
            if (includeUserCount) data.userCount = role.userCount;

            return data;
        });

        const timestamp = this.generateTimestamp();

        switch (format) {
            case 'pdf':
                await this.exportToPdf(exportData, customTitle, timestamp, options);
                break;
            case 'csv':
                await this.exportToCsv(exportData, timestamp, options);
                break;
            case 'json':
                await this.exportToJson(exportData, timestamp);
                break;
        }
    }

    private async exportToPdf(
        data: any[],
        title: string,
        timestamp: string,
        options: RoleExportOptions
    ): Promise<void> {
        const columns: any[] = [];

        if (options.includeId) {
            columns.push({ header: 'ID', dataKey: 'id', width: 15 });
        }
        columns.push({ header: 'Nombre', dataKey: 'name', width: 40 });

        if (options.includeAccessLevel) {
            columns.push({ header: 'Nivel de Acceso', dataKey: 'accessLevel', width: 35 });
        }
        if (options.includeStatus) {
            columns.push({ header: 'Estado', dataKey: 'status', width: 25 });
        }
        if (options.includeDescription) {
            columns.push({ header: 'Descripción', dataKey: 'description', width: 50 });
        }
        if (options.includeUserCount) {
            columns.push({ header: 'Usuarios', dataKey: 'userCount', width: 30 });
        }

        const config: PdfConfig = {
            title: `${title} - ${timestamp}`,
            filename: `roles-${timestamp}.pdf`,
            columns,
            orientation: 'landscape',
            headerColor: '#475569', // slate-600
            alternateRowColors: true,
        };

        await this.exportPort.exportToPdf(data, config);
    }

    private async exportToCsv(
        data: any[],
        timestamp: string,
        options: RoleExportOptions
    ): Promise<void> {
        const headers: string[] = [];

        if (options.includeId) headers.push('id');
        headers.push('name');
        if (options.includeAccessLevel) headers.push('accessLevel');
        if (options.includeStatus) headers.push('status');
        if (options.includeDescription) headers.push('description');
        if (options.includeUserCount) headers.push('userCount');

        const config: CsvConfig = {
            filename: `roles-${timestamp}.csv`,
            headers,
            includeHeaders: true,
            delimiter: ',',
        };

        await this.exportPort.exportToCsv(data, config);
    }

    private async exportToJson(data: any[], timestamp: string): Promise<void> {
        const config: JsonConfig = {
            filename: `roles-${timestamp}.json`,
            prettify: true,
        };

        await this.exportPort.exportToJson(data, config);
    }

    private generateTimestamp(): string {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
    }
}
