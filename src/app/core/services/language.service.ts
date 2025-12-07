import { Injectable, signal, computed, effect } from '@angular/core';
import { TRANSLATIONS } from '../i18n/translations';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    currentLang = signal<'fr' | 'en'>('fr');

    translations = computed(() => TRANSLATIONS[this.currentLang()]);

    constructor() {
        const stored = localStorage.getItem('lang') as 'fr' | 'en';
        if (stored && (stored === 'fr' || stored === 'en')) {
            this.currentLang.set(stored);
        }

        effect(() => {
            localStorage.setItem('lang', this.currentLang());
        });
    }

    toggle() {
        this.currentLang.update(l => l === 'fr' ? 'en' : 'fr');
    }

    translate(key: string): string {
        // @ts-ignore
        return this.translations()[key] || key;
    }
}
