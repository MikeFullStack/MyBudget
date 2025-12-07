import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Impure because it depends on a signal that might update
})
export class TranslatePipe implements PipeTransform {
    constructor(private langService: LanguageService) { }

    transform(key: string): string {
        return this.langService.translate(key);
    }
}
