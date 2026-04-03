/**
 * UIFlash: Independent Visual Feedback.
 * Handles screen shakes and floating combat text.
 * Requires: EventBus (modules/eventbus.ts)
 */

import { bus } from './eventbus.js';

export class UIFlash {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private shakeIntensity: number = 0;
    private shakeDecay: number = 0.9;
    private floatingTexts: Array<{ x: number, y: number, text: string, color: string, life: number }> = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        
        // Listen for "hit" events to trigger shake
        bus.on('UI_SHAKE', (intensity: number) => {
            this.shakeIntensity = intensity || 10;
        });

        // Listen for "float" events for text popups
        bus.on('UI_FLOAT_TEXT', (data: { x: number, y: number, text: string, color: string }) => {
            this.floatingTexts.push({ ...data, life: 1.0 });
        });
    }

    /**
     * Update the visual states
     */
    update(dt: number) {
        // Shake decay
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }

        // Text life decay
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.life -= dt;
            t.y -= 20 * dt; // Float upwards
            return t.life > 0;
        });
    }

    /**
     * Apply the visual offsets to the main render
     * returns {x, y} offsets to be used by the main camera/renderer
     */
    getShakeOffsets() {
        if (this.shakeIntensity <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeIntensity,
            y: (Math.random() - 0.5) * this.shakeIntensity
        };
    }

    /**
     * Draw the floating texts independently
     */
    draw() {
        this.ctx.save();
        this.floatingTexts.forEach(t => {
            this.ctx.globalAlpha = t.life;
            this.ctx.fillStyle = t.color;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(t.text, t.x, t.y);
        });
        this.ctx.restore();
    }
}
