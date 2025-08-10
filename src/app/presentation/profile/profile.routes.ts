import { Routes } from '@angular/router';
import { DetailProfile } from './pages/detail-profile/detail-profile';
import { SettingsProfile } from './pages/settings-profile/settings-profile';
import { UpdateProfile } from './pages/update-profile/update-profile';

export const profileRoutes: Routes = [
    {
        path: '',
        component: DetailProfile,
        title: 'Perfil',
    },
    {
        path: 'settings',
        component: SettingsProfile,
        title: 'Configuración de Perfil',
    },
    {
        path: 'update',
        component: UpdateProfile,
        title: 'Actualizar Perfil',
    },
];
