import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {

    private styles = {
        header: 'background: #2c3e50; color: #ecf0f1; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 4px;',
        phase: 'background: #3498db; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        success: 'color: #27ae60; font-weight: bold;',
        info: 'color: #2980b9; font-weight: bold;',
        error: 'color: #c0392b; font-weight: bold;'
    };

    /**
     * Affiche un grand en-tête pour marquer une section majeure.
     */
    header(message: string) {
        console.log(`%c ${message} `, this.styles.header);
    }

    /**
     * Indique une phase active de l'application.
     * @param phase Nom de la phase (ex: "DÉMARRAGE", "CONNEXION")
     * @param message Description pour le néophyte
     */
    phase(phase: string, message: string) {
        console.log(`%c[${phase}]%c ${message}`, this.styles.phase, 'color: #34495e; font-size: 12px; margin-left: 5px;');
    }

    /**
     * Indique qu'une action a réussi.
     */
    success(message: string) {
        console.log(`%c✅ ${message}`, this.styles.success);
    }

    /**
     * Une information utile.
     */
    info(message: string) {
        console.log(`%cℹ️ ${message}`, this.styles.info);
    }

    error(message: string, error?: any) {
        console.log(`%c❌ ${message}`, this.styles.error);
        if (error) console.error(error);
    }
}
