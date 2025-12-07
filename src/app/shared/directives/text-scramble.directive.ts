import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Directive({
    selector: '[appScramble]',
    standalone: true
})
export class TextScrambleDirective implements OnChanges {
    @Input('appScramble') text: string = '';

    private el = inject(ElementRef);
    private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    private frameRequest: number | null = null;
    private interval: any;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['text']) {
            const oldText = changes['text'].previousValue || '';
            const newText = changes['text'].currentValue || '';

            // If first load (oldText empty), just set it no animation to avoid layout shift chaos, 
            // OR animate it if you want an "Intro" effect. User asked for language change effect.
            if (!oldText) {
                this.el.nativeElement.innerText = newText;
                return;
            }

            this.scramble(newText);
        }
    }

    scramble(newText: string) {
        const el = this.el.nativeElement;
        const length = Math.max(el.innerText.length, newText.length);
        let iteration = 0;

        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            el.innerText = newText
                .split('')
                .map((letter, index) => {
                    if (index < iteration) {
                        return newText[index];
                    }
                    return this.chars[Math.floor(Math.random() * this.chars.length)];
                })
                .join('');

            if (iteration >= newText.length) {
                clearInterval(this.interval);
                el.innerText = newText; // Ensure final consistency
            }

            iteration += 1 / 3; // Speed control
        }, 30);
    }
}
