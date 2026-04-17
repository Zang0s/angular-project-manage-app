import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { NotificationDialogComponent } from './components/notification-dialog/notification-dialog.component';
import { ThemeService } from './services/theme.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, NotificationDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private userService = inject(UserService);

  showShell(): boolean {
    const path = this.router.url.split('?')[0];
    if (path === '/login' || path === '/pending-approval' || path === '/blocked') {
      return false;
    }

    return this.userService.isAuthenticated();
  }
}
