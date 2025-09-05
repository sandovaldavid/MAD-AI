import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeToggle } from '@presentation/shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-header',
  standalone: true,
  imports: [ThemeToggle],
  templateUrl: './auth-header.html',
  styleUrl: './auth-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeader {}
