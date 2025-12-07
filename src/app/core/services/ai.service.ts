import { Injectable } from '@angular/core';
import { getAI, getGenerativeModel, GenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../firebase-init'; // Assuming you export 'app' from here

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private model: GenerativeModel;

    constructor() {
        // Initialize Gemini Developer API (GoogleAIBackend)
        // This allows usage on the Spark (Free) plan.
        const ai = getAI(app, { backend: new GoogleAIBackend() });

        // Using 'gemini-2.0-flash' as 'gemini-1.5' family is retired (Dec 2025).
        this.model = getGenerativeModel(ai, { model: 'gemini-2.0-flash-exp' });
    }

    async askAdvisor(budgetContext: any, question: string): Promise<string> {
        const prompt = `
      Tu es un expert financier personnel "Mon Budget AI".
      Le contexte financier (JSON) est :
      ${JSON.stringify(budgetContext)}

      L'utilisateur te pose cette question : "${question}"

      Réponds de manière concise, précise et amicale. Utilise les données fournies pour justifier ta réponse.
      Si la réponse ne se trouve pas dans les données, dis-le poliment.
      Format: Texte brut (pas de Markdown complexe sauf gras/italique). maximum 3 phrases si possible.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw error;
        }
    }

    async analyzeBudget(budgetContext: any): Promise<string> {
        const prompt = `
      Tu es un expert financier personnel "Mon Budget AI".
      Analyse les données budgétaires mensuelles suivantes en JSON et donne 3 conseils concrets et brefs (bullet points) pour économiser ou mieux gérer le budget.
      Sois encourageant but direct. Utilise des emojis.
      
      Données:
      ${JSON.stringify(budgetContext)}
      
      Format de réponse souhaité (Markdown):
      ### 📊 Analyse
      [Court résumé]
      
      ### 💡 Conseils
      1. [Conseil 1]
      2. [Conseil 2]
      3. [Conseil 3]
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error('AI Error:', error);
            throw error;
        }
    }
}
