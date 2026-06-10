import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required, Validators.maxLength(100)],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    const { name, email, password } = this.form.value;
    this.authService.register(email, password, name).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.isLoading = false;
        if (err.status === 429) {
          this.errorMessage = 'Troppi tentativi, riprova tra qualche minuto'
        } else {
          this.errorMessage = err.error?.messare || 'Errore durante la registrazione'
        }
      },
    });
  }
}