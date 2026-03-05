/**
 * THE LAST LIGHTKEEPER - Input Manager
 * Handles keyboard, mouse (with canvas-scale correction), and touch (virtual joystick + tap-to-shoot)
 */

import { DIAGONAL_NORMALIZER } from '../../../game/config/constants.js';

// Canvas dimensions (must match index.html / GameConfig)
const CANVAS_W = 1000;
const CANVAS_H = 700;

/**
 * Convert a screen-space point (clientX/Y) into canvas-space coordinates,
 * accounting for CSS transform: scale() applied to the canvas wrapper.
 */
function screenToCanvas(clientX, clientY) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    // rect.width / CANVAS_W gives the CSS scale factor
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

export class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        // Mouse position in CANVAS space
        this.mouse = { x: CANVAS_W / 2, y: CANVAS_H / 2, isDown: false, wasDown: false };

        // ── Virtual joystick (mobile left thumb) ──────────────────────────
        this.joystick = {
            active: false,
            touchId: null,
            originX: 0, originY: 0,    // where the finger started (canvas space)
            dx: 0, dy: 0,              // normalised direction  [-1, 1]
            radius: 80                 // dead-zone + max distance in canvas px
        };

        // ── Shoot touch (mobile right thumb) ──────────────────────────────
        this.shootTouch = {
            active: false,
            touchId: null,
            x: CANVAS_W / 2,
            y: CANVAS_H / 2
        };

        this._setupKeyboard();
        this._setupMouse();
        this._setupTouch();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Setup helpers
    // ─────────────────────────────────────────────────────────────────────

    _setupKeyboard() {
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    }

    _setupMouse() {
        const canvas = () => document.getElementById('gameCanvas');

        window.addEventListener('mousemove', e => {
            const c = screenToCanvas(e.clientX, e.clientY);
            this.mouse.x = c.x;
            this.mouse.y = c.y;
        });
        window.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this.mouse.isDown = true;
                const c = screenToCanvas(e.clientX, e.clientY);
                this.mouse.x = c.x;
                this.mouse.y = c.y;
            }
        });
        window.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.isDown = false;
        });
    }

    _setupTouch() {
        const el = document.getElementById('gameCanvas') || window;

        // Prevent default scrolling / zooming on the game canvas
        const opts = { passive: false };

        el.addEventListener('touchstart', e => { e.preventDefault(); this._onTouchStart(e); }, opts);
        el.addEventListener('touchmove', e => { e.preventDefault(); this._onTouchMove(e); }, opts);
        el.addEventListener('touchend', e => { e.preventDefault(); this._onTouchEnd(e); }, opts);
        el.addEventListener('touchcancel', e => { e.preventDefault(); this._onTouchEnd(e); }, opts);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Touch handlers
    // ─────────────────────────────────────────────────────────────────────

    _onTouchStart(e) {
        for (const t of e.changedTouches) {
            const pos = screenToCanvas(t.clientX, t.clientY);

            // Left half → joystick
            if (pos.x < CANVAS_W / 2) {
                if (!this.joystick.active) {
                    this.joystick.active = true;
                    this.joystick.touchId = t.identifier;
                    this.joystick.originX = pos.x;
                    this.joystick.originY = pos.y;
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                }
            } else {
                // Right half → shoot toward touch point
                if (!this.shootTouch.active) {
                    this.shootTouch.active = true;
                    this.shootTouch.touchId = t.identifier;
                    this.shootTouch.x = pos.x;
                    this.shootTouch.y = pos.y;
                    this.mouse.isDown = true;
                    this.mouse.x = pos.x;
                    this.mouse.y = pos.y;
                }
            }
        }
    }

    _onTouchMove(e) {
        for (const t of e.changedTouches) {
            const pos = screenToCanvas(t.clientX, t.clientY);

            if (t.identifier === this.joystick.touchId) {
                const rawDx = pos.x - this.joystick.originX;
                const rawDy = pos.y - this.joystick.originY;
                const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
                const maxR = this.joystick.radius;
                if (dist > 0) {
                    this.joystick.dx = rawDx / Math.max(dist, maxR) * Math.min(dist, maxR) / maxR;
                    this.joystick.dy = rawDy / Math.max(dist, maxR) * Math.min(dist, maxR) / maxR;
                } else {
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                }
            }

            if (t.identifier === this.shootTouch.touchId) {
                this.shootTouch.x = pos.x;
                this.shootTouch.y = pos.y;
                this.mouse.x = pos.x;
                this.mouse.y = pos.y;
            }
        }
    }

    _onTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
            }
            if (t.identifier === this.shootTouch.touchId) {
                this.shootTouch.active = false;
                this.shootTouch.touchId = null;
                this.mouse.isDown = false;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API (called by InputSystem / game loop)
    // ─────────────────────────────────────────────────────────────────────

    isKeyPressed(code) { return !!this.keys[code]; }
    isKeyJustPressed(code) { return !!this.keys[code] && !this.previousKeys[code]; }
    isKeyJustReleased(code) { return !this.keys[code] && !!this.previousKeys[code]; }

    isMouseDown() { return this.mouse.isDown; }
    isMouseJustPressed() { return this.mouse.isDown && !this.mouse.wasDown; }
    isMouseJustReleased() { return !this.mouse.isDown && this.mouse.wasDown; }
    getMousePosition() { return { x: this.mouse.x, y: this.mouse.y }; }

    /** Normalised joystick direction { dx, dy } — already normalised to [-1,1] */
    getJoystickDirection() { return { dx: this.joystick.dx, dy: this.joystick.dy }; }
    isJoystickActive() { return this.joystick.active; }

    /** Draw the virtual joystick on-canvas (call from HUDSystem / RenderSystem) */
    drawJoystick(ctx) {
        if (!this.joystick.active) return;
        const { originX, originY, dx, dy, radius } = this.joystick;
        const stickX = originX + dx * radius;
        const stickY = originY + dy * radius;

        // Outer ring
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner knob
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(stickX, stickY, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    updatePreviousState() {
        this.previousKeys = { ...this.keys };
        this.mouse.wasDown = this.mouse.isDown;
    }

    clear() {
        this.keys = {};
        this.previousKeys = {};
        this.mouse = { x: CANVAS_W / 2, y: CANVAS_H / 2, isDown: false, wasDown: false };
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        this.shootTouch.active = false;
        this.mouse.isDown = false;
    }
}

/**
 * THE LAST LIGHTKEEPER - Input System
 * Translates raw input into entity velocity / shoot intent
 */
export class InputSystem {
    constructor(entityManager, inputManager) {
        this.em = entityManager;
        this.input = inputManager;
    }

    update(dt) {
        const entities = this.em.getEntitiesWith('PlayerControlled');

        for (const entity of entities) {
            const control = this.em.getComponent(entity, 'PlayerControlled');
            const velocity = this.em.getComponent(entity, 'Velocity');
            const pos = this.em.getComponent(entity, 'Position');
            if (!velocity || !control) continue;

            // ── Movement ───────────────────────────────────────────────
            let dirX = 0, dirY = 0;

            // Keyboard (WASD / Arrows)
            if (this.input.isKeyPressed('KeyW') || this.input.isKeyPressed('ArrowUp')) dirY -= 1;
            if (this.input.isKeyPressed('KeyS') || this.input.isKeyPressed('ArrowDown')) dirY += 1;
            if (this.input.isKeyPressed('KeyA') || this.input.isKeyPressed('ArrowLeft')) dirX -= 1;
            if (this.input.isKeyPressed('KeyD') || this.input.isKeyPressed('ArrowRight')) dirX += 1;

            // Virtual joystick (overrides keyboard if active)
            if (this.input.isJoystickActive()) {
                const joy = this.input.getJoystickDirection();
                dirX = joy.dx;
                dirY = joy.dy;
            }

            // Diagonal normalisation only for keyboard (joystick already normalised)
            if (!this.input.isJoystickActive() && dirX !== 0 && dirY !== 0) {
                dirX *= DIAGONAL_NORMALIZER;
                dirY *= DIAGONAL_NORMALIZER;
            }

            // Velocity in pixels/second — MovementSystem multiplies by dt
            velocity.vx = dirX * control.baseSpeed;
            velocity.vy = dirY * control.baseSpeed;

            // ── Shooting ───────────────────────────────────────────────
            if (this.input.isMouseDown()) {
                const mousePos = this.input.getMousePosition();
                this.em.addComponent(entity, 'IntentToShoot', {
                    targetX: mousePos.x,
                    targetY: mousePos.y
                });
            } else {
                this.em.removeComponent?.(entity, 'IntentToShoot');
            }
        }

        this.input.updatePreviousState();
    }
}
