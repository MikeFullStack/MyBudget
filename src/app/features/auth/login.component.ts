import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          💰
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Mon Budget</h1>
        <p class="text-gray-500 mb-8">Connectez-vous pour gérer vos finances</p>
        
        <button 
          (click)="login()"
          class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
          Continuer avec Google
        </button>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-400">Ou</span>
          </div>
        </div>

        <button 
          (click)="loginAnonymous()"
          class="w-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          Continuer en invité
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async login() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Login failed', err);
      // Optional: Show error toast
    }
  }

  async loginAnonymous() {
    try {
      await this.authService.loginAnonymously();
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Anonymous login failed', err);
    }
  }
}
