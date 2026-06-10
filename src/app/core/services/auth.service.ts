import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { catchError, tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { throwError, of } from "rxjs";

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly API_URL = environment.apiBaseUrl + '/auth';
    private readonly REFRESH_TOKEN_KEY = 'pfd_refresh_token';

    private accessToken = signal<string | null>(null);

    currentUser = signal<User | null>(null);

    constructor(private http: HttpClient, private router: Router) {
        window.addEventListener('storage', (event) => this.handleStorageEvent(event));
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

    refresh() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token available'));
        }

        return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
            tap(response => this.handleAuth(response)),
        )
    }

    logout() {
        const refreshToken = this.getRefreshToken();

        if (refreshToken) {
            this.http.post(`${this.API_URL}/logout`, { refreshToken }).pipe(
                catchError(() => of(null)),
            ).subscribe();
        }

        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        this.accessToken.set(null);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    isLoggedIn(): boolean {
        return this.getRefreshToken() !== null;
    }

    getAccessToken(): string | null {
        return this.accessToken();
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    setAccessToken(token: string): void {
        this.accessToken.set(token);
    }

    private handleAuth(response: AuthResponse) {
        this.accessToken.set(response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        this.currentUser.set(response.user);
    }

    private handleStorageEvent(event: StorageEvent) {
        if (event.key !== this.REFRESH_TOKEN_KEY) return;

        if (event.newValue === null && event.oldValue !== null) {
            this.accessToken.set(null);
            this.currentUser.set(null);
            this.router.navigate(['/auth/login']);
        }
    }
}