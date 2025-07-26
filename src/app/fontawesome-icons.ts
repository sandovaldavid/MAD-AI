import { NgModule } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faCoffee,
    faUser,
    faHome,
    faEdit,
    faTrash,
    faCubes,
    faCheckCircle,
    faBoxOpen,
    faTasks,
    faChartPie,
    faChartBar,
    faBox,
    faRecycle,
    faArchive,
    faListUl,
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
    imports: [FontAwesomeModule],
    exports: [FontAwesomeModule],
})
export class FontAwesomeIconsModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(
            faCoffee,
            faUser,
            faHome,
            faEdit,
            faTrash,
            faCubes,
            faCheckCircle,
            faBoxOpen,
            faTasks,
            faChartPie,
            faChartBar,
            faBox,
            faRecycle,
            faArchive,
            faListUl
        );
    }
}
