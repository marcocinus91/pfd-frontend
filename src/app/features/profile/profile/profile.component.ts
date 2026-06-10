import { Component, inject } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { Router } from "@angular/router";

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
})
export class ProfileComponent {
    authService = inject(AuthService);
    private router = inject(Router);

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

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth/login'])
    }
};