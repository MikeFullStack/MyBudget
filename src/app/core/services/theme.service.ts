import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDark = signal<boolean>(false);

    constructor() {
        // Load from storage
        const stored = localStorage.getItem('theme');
        if (stored) {
            this.isDark.set(stored === 'dark');
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDark.set(prefersDark);
        }

        // React to changes
        effect(() => {
            const dark = this.isDark();
            if (dark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    toggle() {
        this.isDark.update(d => !d);
    }
}
