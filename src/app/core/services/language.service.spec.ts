import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TRANSLATIONS } from '../i18n/translations';

describe('LanguageService', () => {
    let service: LanguageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        localStorage.clear();
        service = TestBed.inject(LanguageService);
    });

    it('should be created with default language fr', () => {
        expect(service).toBeTruthy();
        expect(service.currentLang()).toBe('fr');
    });

    it('should toggle language and persist to localStorage', () => {
        service.toggle();
        TestBed.flushEffects(); // Ensure effect runs
        expect(service.currentLang()).toBe('en');
        expect(localStorage.getItem('lang')).toBe('en');

        service.toggle();
        TestBed.flushEffects();
        expect(service.currentLang()).toBe('fr');
        expect(localStorage.getItem('lang')).toBe('fr');
    });

    it('should initialize from localStorage if available', () => {
        localStorage.setItem('lang', 'en');
        // Re-inject to trigger constructor
        TestBed.resetTestingModule();
        const newService = TestBed.inject(LanguageService);
        expect(newService.currentLang()).toBe('en');
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
