import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  isMobileProfileOpen = false;

  logout() {
    this.authService.logout();
  }

  toggleMobileProfile() {
    this.isMobileProfileOpen = !this.isMobileProfileOpen;
  }

  closeMobileProfile() {
    this.isMobileProfileOpen = false;
  }

  logoutFromMobileProfile() {
    this.isMobileProfileOpen = false;
    this.logout();
  }
 
  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}