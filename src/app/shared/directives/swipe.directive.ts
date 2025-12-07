import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appSwipe]',
    standalone: true
})
export class SwipeDirective {
    @Output() swipeLeft = new EventEmitter<void>();
    @Output() swipeRight = new EventEmitter<void>();

    private swipeCoord?: [number, number];
    private swipeTime?: number;

    constructor() { }

    @HostListener('touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
        const time = new Date().getTime();
        this.swipeCoord = coord;
        this.swipeTime = time;
    }

    @HostListener('touchend', ['$event'])
    onTouchEnd(e: TouchEvent) {
        const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
        const time = new Date().getTime();

        if (this.swipeCoord && this.swipeTime) {
            const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
            const duration = time - this.swipeTime;

            // Thresholds
            // Horizontal swipe > 30px
            // Vertical deviation < 30px (to allow scrolling)
            // Duration < 1000ms
            if (duration < 1000 && Math.abs(direction[0]) > 30 && Math.abs(direction[1]) < 30) {
                const swipe = direction[0] < 0 ? 'left' : 'right';
                if (swipe === 'left') {
                    this.swipeLeft.emit();
                } else {
                    this.swipeRight.emit();
                }
            }
        }
    }
}
