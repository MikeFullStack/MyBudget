import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, filter, take, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

// Assuming authGuard is defined elsewhere, e.g., in a separate file or above this.
// For the purpose of this edit, we'll just use it as specified.
const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Wait for auth to settle
    return toObservable(auth.currentUser).pipe(
        filter(u => u !== undefined), // Assume undefined is initial loading, null is unauth
        take(1),
        map(user => {
            if (user) return true;
            return router.createUrlTree(['/login']);
        })
    );
};

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
