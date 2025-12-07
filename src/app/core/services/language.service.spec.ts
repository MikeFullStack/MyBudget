import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TRANSLATIONS } from '../i18n/translations';

describe('LanguageService', () => {
    let service: LanguageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LanguageService);
        localStorage.clear();
    });

    it('should be created with default language fr', () => {
        expect(service).toBeTruthy();
        expect(service.currentLang()).toBe('fr');
    });

    it('should toggle language', () => {
        service.toggle();
        expect(service.currentLang()).toBe('en');
        service.toggle();
        expect(service.currentLang()).toBe('fr');
    });

    it('should return translation for key', () => {
        service.currentLang.set('en');
        // @ts-ignore
        expect(service.translate('sidebar.new_budget')).toBe('New Budget');

        service.currentLang.set('fr');
        // @ts-ignore
        expect(service.translate('sidebar.new_budget')).toBe('Nouveau Budget');
    });

    it('should return key if translation missing', () => {
        expect(service.translate('missing.key')).toBe('missing.key');
    });
});
