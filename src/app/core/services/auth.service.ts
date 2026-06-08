import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { tap } from "rxjs/operators";

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
    private readonly API_URL = 'http://localhost:3000/auth';
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
        return !!localStorage.getItem(this.TOKEN_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private handleAuth(response: AuthResponse) {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUser.set(response.user);
    }

    private loadUserFromStorage() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return;
    }
}