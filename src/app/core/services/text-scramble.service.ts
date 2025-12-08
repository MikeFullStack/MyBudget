import { Injectable, NgZone } from '@angular/core';

export interface ScrambleRequest {
    element: HTMLElement;
    originalText: string; // The goal text
    currentText: string[]; // Array of chars
    iteration: number;
}

@Injectable({ providedIn: 'root' })
export class TextScrambleService {
    private activeRequests = new Map<HTMLElement, ScrambleRequest>();
    private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    private isRunning = false;
    private lastFrameTime = 0;
    private fps = 60;
    private interval = 1000 / this.fps;

    constructor(private ngZone: NgZone) { }

    add(el: HTMLElement, text: string) {
        if (this.activeRequests.has(el)) {
            // Reset if already animating (e.g. rapid changes)
            this.activeRequests.delete(el);
        }

        // Initial state
        this.activeRequests.set(el, {
            element: el,
            originalText: text,
            currentText: Array(text.length).fill(''), // Or start with current innerText
            iteration: 0
        });

        if (!this.isRunning) {
            this.startLoop();
        }
    }

    remove(el: HTMLElement) {
        this.activeRequests.delete(el);
        // Loop stops automatically if map is empty
    }

    private startLoop() {
        this.isRunning = true;

        // Run outside Angular Zone to prevent massive Change Detection triggers on every frame
        this.ngZone.runOutsideAngular(() => {
            this.loop();
        });
    }

    private loop = (timestamp: number = 0) => {
        if (this.activeRequests.size === 0) {
            this.isRunning = false;
            return; // Stop loop
        }

        requestAnimationFrame(this.loop);

        const delta = timestamp - this.lastFrameTime;
        if (delta < this.interval) return; // Cap FPS

        this.lastFrameTime = timestamp - (delta % this.interval);

        this.activeRequests.forEach((req, el) => {
            let complete = true;

            const newContent = req.originalText
                .split('')
                .map((letter, index) => {
                    if (index < req.iteration) {
                        return req.originalText[index];
                    }
                    complete = false;
                    return this.chars[Math.floor(Math.random() * this.chars.length)];
                })
                .join('');

            el.innerText = newContent;

            if (req.iteration >= req.originalText.length) {
                el.innerText = req.originalText; // Ensure purity
                this.activeRequests.delete(el);
            } else {
                req.iteration += 1 / 3; // Speed
            }
        });
    }
}
