import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly API_URL = environment.apiBaseUrl + '/auth';
    private readonly TOKEN_KEY = 'pfd_token';

    currentUser = signal<User | null>(null);

    constructor(private http: HttpClient, private router: Router) {
        this.loadUserFromStorage();
    }

    register(email: string, password: string, name?: string) {
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, { email, password, name}).pipe(
            tap(response => this.handleAuth(response)),
        );
    }

    login(email: string, password: string) {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password}).pipe(
            tap(response => this.handleAuth(response)),
        );
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    isLoggedIn(): boolean {
        const token = this.getToken();
        if (!token) return false;

        const payload = this.parseJwtPayload(token);
        if (!payload || typeof payload['exp'] !== 'number') return false;

        return Date.now() < payload['exp'] * 1000;
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private parseJwtPayload(token: string): Record<string, unknown> | null {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;

            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(base64);
            const decoded = JSON.parse(json);

            return decoded && typeof decoded === 'object' ? decoded : null;
        } catch {
            return null;
        }
    }

    private handleAuth(response: AuthResponse) {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUser.set(response.user);
    }

    private loadUserFromStorage() {
        const token = this.getToken();
        if (!token) return;

        const payload = this.parseJwtPayload(token);
        if (!payload || typeof payload['exp'] !== 'number' || Date.now() >= payload['exp'] * 1000) {
            localStorage.removeItem(this.TOKEN_KEY);
            this.currentUser.set(null);
            return;
        }

        const user = this.mapUserFromPayload(payload);
        this.currentUser.set(user);
    }

    private mapUserFromPayload(payload: Record<string, unknown>): User | null {
        const id = typeof payload['sub'] === 'string'
            ? payload['sub']
            : typeof payload['id'] === 'string'
            ? payload['id']
            : null;

        const email = typeof payload['email'] === 'string' ? payload['email'] : null;
        const name = typeof payload['name'] === 'string' ? payload['name'] : undefined;

        if (!id || !email) return null;
        return { id, email, name};
    }
}