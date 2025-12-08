import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { TextScrambleService } from '../../core/services/text-scramble.service';

@Directive({
    selector: '[appScramble]',
    standalone: true
})
export class TextScrambleDirective implements OnChanges, OnDestroy {
    @Input('appScramble') text: string = '';

    private el = inject(ElementRef);
    private service = inject(TextScrambleService);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['text']) {
            const oldText = changes['text'].previousValue || '';
            const newText = changes['text'].currentValue || '';

            // If first load (oldText empty), just set it to avoid animation on load (unless desired).
            // User seemed to like the global effect, might be cool on load too, but safer to respect "Change" event mainly.
            // However, previous implementation updated innerText immediately if !oldText. I will keep that logic.
            if (!oldText) {
                this.el.nativeElement.innerText = newText;
                return;
            }

            this.service.add(this.el.nativeElement, newText);
        }
    }

    ngOnDestroy() {
        this.service.remove(this.el.nativeElement);
    }
}
