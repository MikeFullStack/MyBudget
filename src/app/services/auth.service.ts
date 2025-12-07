
import { Injectable, signal, inject } from '@angular/core';
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
import { LoggerService } from '../core/services/logger.service';

declare const __initial_auth_token: string | undefined;

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth: Auth = auth;
    private logger = inject(LoggerService);

    // Signal en lecture seule exposé pour l'état utilisateur
    readonly currentUser = signal<User | null | undefined>(undefined);

    constructor() {
        this.initAuth();
    }

    private async initAuth() {
        try {
            this.logger.phase('AUTH', 'Vérification de la session...');
            // Priorité au token custom si fourni par l'environnement
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(this.auth, __initial_auth_token);
            }

            onAuthStateChanged(this.auth, (user) => {
                this.currentUser.set(user);
                if (user) {
                    this.logger.success(`Utilisateur identifié ! (ID: ${user.uid.slice(0, 5)}...)`);
                } else {
                    this.logger.info('Aucun utilisateur connecté.');
                }
            });
        } catch (err) {
            this.logger.error('Erreur d\'authentification', err);
        }
    }

    async loginWithGoogle() {
        try {
            this.logger.phase('AUTH', 'Ouverture de la fenêtre Google...');
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
            this.logger.success('Google Sign-in réussi.');
        } catch (err) {
            this.logger.error('Google Sign in Error:', err);
            throw err;
        }
    }

    async loginAnonymously() {
        try {
            this.logger.phase('AUTH', 'Connexion anonyme...');
            await signInAnonymously(this.auth);
            this.logger.success('Mode Démo activé.');
        } catch (err) {
            this.logger.error('Anonymous Sign in Error:', err);
            throw err;
        }
    }

    async logout() {
        this.logger.phase('AUTH', 'Déconnexion...');
        await signOut(this.auth);
        this.logger.info('Au revoir !');
    }
}

