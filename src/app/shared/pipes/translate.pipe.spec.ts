import { TranslatePipe } from './translate.pipe';
import { LanguageService } from '../../core/services/language.service';

describe('TranslatePipe', () => {
    let pipe: TranslatePipe;
    let mockLangService: any;

    beforeEach(() => {
        mockLangService = {
            translate: (key: string) => key === 'test' ? 'Test Value' : key
        };
        pipe = new TranslatePipe(mockLangService);
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should transform key using service', () => {
        expect(pipe.transform('test')).toBe('Test Value');
    });
});
