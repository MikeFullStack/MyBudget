import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoggerService } from './core/services/logger.service';
import { LanguageService } from './core/services/language.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `
})
export class App {
  private logger = inject(LoggerService);
  private langService = inject(LanguageService);
  private document = inject(DOCUMENT);

  constructor() {
    this.logger.header('🚀 BIENVENUE DANS MON BUDGET');
    this.logger.phase('INIT', 'Lancement de l\'application...');

    // A11y: Sync HTML lang attribute
    effect(() => {
      const lang = this.langService.currentLang();
      this.document.documentElement.lang = lang;
      this.logger.info(`Langue changée : ${lang.toUpperCase()}`);
    });
  }
}
