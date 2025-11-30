import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule,FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
password = '';
  isLoading = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/admin']);
    }
  }

  doLogin() {
    if (!this.password) return;

    this.isLoading = true;
    this.errorMsg = '';

    this.auth.login(this.password).subscribe(success => {
      this.isLoading = false;
      if (success) {
        // Redireciona APENAS se o login retornar true
        console.log('🚀 [LoginComponent] Redirecionando para Admin...');
        this.router.navigate(['/admin']);
      } else {
        this.errorMsg = 'Senha incorreta.';
      }
    });
  }
}
