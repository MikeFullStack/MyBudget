import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoggerService } from './core/services/logger.service';

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

  constructor() {
    this.logger.header('🚀 BIENVENUE DANS MON BUDGET');
    this.logger.phase('INIT', 'Lancement de l\'application...');
  }
}
