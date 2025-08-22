import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { EXPORT_PORT } from '@di/tokens';
import { ClientExportService } from '@infrastructure/services/export/client-export.service';

export function provideExportServices(): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: EXPORT_PORT,
            useClass: ClientExportService,
        },
    ]);
}
