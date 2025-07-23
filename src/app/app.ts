import {
    Component,
    ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, FontAwesomeModule],
    templateUrl: './app.html',
    styleUrl: './app.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
    protected readonly title = 'MAD-AI-NEW';
}
