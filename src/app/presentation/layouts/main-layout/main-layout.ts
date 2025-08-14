
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainSidebar } from '@presentation/shell/main-sidebar/main-sidebar';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet, MainSidebar],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {}
