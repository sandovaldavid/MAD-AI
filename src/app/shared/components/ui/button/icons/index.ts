// Importar todos los iconos
import { PlusIcon } from './plus.icon';
import { EditIcon } from './edit.icon';
import { DeleteIcon } from './delete.icon';
import { RefreshIcon } from './refresh.icon';
import { SaveIcon } from './save.icon';
import { ArrowLeftIcon } from './arrow-left.icon';
import { ArrowRightIcon } from './arrow-right.icon';
import { DownloadIcon } from './download.icon';
import { UploadIcon } from './upload.icon';
import { SearchIcon } from './search.icon';
import { XIcon } from './x.icon';
import { CheckIcon } from './check.icon';
import { EyeIcon } from './eye.icon';
import { CheckCircleIcon } from './check-circle.icon';
import { XCircleIcon } from './x-circle.icon';
import { TrashIcon } from './trash.icon';
import { UsersIcon } from './users.icon';

// Exportar todos los iconos
export { PlusIcon } from './plus.icon';
export { EditIcon } from './edit.icon';
export { DeleteIcon } from './delete.icon';
export { RefreshIcon } from './refresh.icon';
export { SaveIcon } from './save.icon';
export { ArrowLeftIcon } from './arrow-left.icon';
export { ArrowRightIcon } from './arrow-right.icon';
export { DownloadIcon } from './download.icon';
export { UploadIcon } from './upload.icon';
export { SearchIcon } from './search.icon';
export { XIcon } from './x.icon';
export { CheckIcon } from './check.icon';
export { EyeIcon } from './eye.icon';
export { CheckCircleIcon } from './check-circle.icon';
export { XCircleIcon } from './x-circle.icon';
export { TrashIcon } from './trash.icon';
export { UsersIcon } from './users.icon';

// Tipos para los iconos disponibles
export type IconName = 
    | 'plus'
    | 'edit'
    | 'delete'
    | 'refresh'
    | 'save'
    | 'arrow-left'
    | 'arrow-right'
    | 'download'
    | 'upload'
    | 'search'
    | 'x'
    | 'check'
    | 'eye'
    | 'check-circle'
    | 'x-circle'
    | 'trash'
    | 'users';

// Mapa de iconos para facilitar la selección
export const ICON_MAP = {
    'plus': PlusIcon,
    'edit': EditIcon,
    'delete': DeleteIcon,
    'refresh': RefreshIcon,
    'save': SaveIcon,
    'arrow-left': ArrowLeftIcon,
    'arrow-right': ArrowRightIcon,
    'download': DownloadIcon,
    'upload': UploadIcon,
    'search': SearchIcon,
    'x': XIcon,
    'check': CheckIcon,
    'eye': EyeIcon,
    'check-circle': CheckCircleIcon,
    'x-circle': XCircleIcon,
    'trash': TrashIcon,
    'users': UsersIcon,
} as const;
