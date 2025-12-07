
import { Injectable, signal } from '@angular/core';
import {
    Auth,
    onAuthStateChanged,
    signInWithCustomToken,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    User
} from 'firebase/auth';
import { auth } from '../core/firebase-init';

declare const __initial_auth_token: string | undefined;

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth: Auth = auth;

    // Signal en lecture seule exposé pour l'état utilisateur
    readonly currentUser = signal<User | null | undefined>(undefined);

    constructor() {
        this.initAuth();
    }

    private async initAuth() {
        try {
            // Priorité au token custom si fourni par l'environnement
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(this.auth, __initial_auth_token);
            }

            onAuthStateChanged(this.auth, (user) => {
                this.currentUser.set(user);
                if (user) console.log('[AuthService] User authenticated:', user.uid);
            });
        } catch (err) {
            console.error('[AuthService] Error:', err);
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
        } catch (err) {
            console.error('Google Sign in Error:', err);
            throw err;
        }
    }

    async loginAnonymously() {
        try {
            await signInAnonymously(this.auth);
        } catch (err) {
            console.error('Anonymous Sign in Error:', err);
            throw err;
        }
    }

    async logout() {
        await signOut(this.auth);
    }
}

