import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SwipeDirective } from './swipe.directive';
import { vi, describe, it, expect, beforeEach } from 'vitest';

@Component({
    template: `<div appSwipe (swipeLeft)="onLeft()" (swipeRight)="onRight()" style="width: 100px; height: 100px;"></div>`,
    standalone: true,
    imports: [SwipeDirective]
})
class VitestTestComponent {
    onLeft = vi.fn();
    onRight = vi.fn();
}

describe('SwipeDirective', () => {
    let fixture: ComponentFixture<VitestTestComponent>;
    let component: VitestTestComponent;
    let div: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SwipeDirective, VitestTestComponent]
        });
        fixture = TestBed.createComponent(VitestTestComponent);
        component = fixture.componentInstance;
        div = fixture.debugElement.query(By.directive(SwipeDirective));
        fixture.detectChanges();
    });

    const triggerSwipe = (startX: number, startY: number, endX: number, endY: number) => {
        // Mock the Touch objects
        const startTouch = { identifier: 0, target: div.nativeElement, pageX: startX, pageY: startY };
        const endTouch = { identifier: 0, target: div.nativeElement, pageX: endX, pageY: endY };

        // Hack: manually create an event like object because JSDOM TouchList is strict
        const startEvent = {
            type: 'touchstart',
            changedTouches: [startTouch]
        };

        const endEvent = {
            type: 'touchend',
            changedTouches: [endTouch]
        };

        // We dispatch via Angular's triggerEventHandler which accepts logic compatible with the Directive's expectation
        // usage: e.changedTouches[0]
        div.triggerEventHandler('touchstart', startEvent);
        div.triggerEventHandler('touchend', endEvent);
    };

    it('should emit swipeLeft on valid left swipe', () => {
        // Swipe Left: Start X=100, End X=50 (Diff = -50)
        triggerSwipe(100, 10, 50, 10);
        expect(component.onLeft).toHaveBeenCalled();
    });

    it('should emit swipeRight on valid right swipe', () => {
        // Swipe Right: Start X=50, End X=100 (Diff = +50)
        triggerSwipe(50, 10, 100, 10);
        expect(component.onRight).toHaveBeenCalled();
    });

    it('should NOT emit if swipe is too short (threshold)', () => {
        // Diff = 10 (< 30)
        triggerSwipe(50, 10, 60, 10);
        expect(component.onLeft).not.toHaveBeenCalled();
        expect(component.onRight).not.toHaveBeenCalled();
    });

    it('should NOT emit if swipe is too vertical (scrolling)', () => {
        // X Diff = 50 (valid), Y Diff = 50 (> 30 threshold for vertical)
        triggerSwipe(50, 0, 100, 50);
        expect(component.onLeft).not.toHaveBeenCalled();
        expect(component.onRight).not.toHaveBeenCalled();
    });
});
