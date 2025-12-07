import { Injectable, signal } from '@angular/core';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    action?: ToastAction;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    readonly toasts = signal<Toast[]>([]);

    show(message: string, type: 'success' | 'error' | 'info' = 'info', action?: ToastAction) {
        const id = crypto.randomUUID();
        const toast: Toast = { id, message, type, action };

        this.toasts.update(current => [...current, toast]);

        // Auto-dismiss after 4 seconds (longer if action present? maybe 5s)
        const duration = action ? 6000 : 4000;
        setTimeout(() => this.remove(id), duration);
    }

    remove(id: string) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
