/**
 * THE LAST LIGHTKEEPER - Input Manager
 * Raw input capture from DOM events
 */

import { DIAGONAL_NORMALIZER } from '../../../game/config/constants.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false, wasDown: false };
        this.previousKeys = {};
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard capture
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse capture
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => {
            this.mouse.isDown = true;
        });
        window.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    isKeyJustPressed(code) {
        const currentPressed = this.keys[code];
        const wasPressed = this.previousKeys[code];
        return currentPressed && !wasPressed;
    }

    isKeyJustReleased(code) {
        const currentPressed = this.keys[code];
        const wasPressed = this.previousKeys[code];
        return !currentPressed && wasPressed;
    }

    updatePreviousState() {
        // Store current state for next frame comparison
        this.previousKeys = { ...this.keys };
        this.mouse.wasDown = this.mouse.isDown;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMouseDown() {
        return this.mouse.isDown;
    }

    isMouseJustPressed() {
        return this.mouse.isDown && !this.mouse.wasDown;
    }

    isMouseJustReleased() {
        return !this.mouse.isDown && this.mouse.wasDown;
    }

    clear() {
        this.keys = {};
        this.previousKeys = {};
        this.mouse = { x: 0, y: 0, isDown: false, wasDown: false };
    }
}

/**
 * THE LAST LIGHTKEEPER - Input System
 * Translates raw input into entity actions with cyber safety
 */

export class InputSystem {
    constructor(entityManager, inputManager) {
        this.em = entityManager;
        this.input = inputManager;
    }
    
    update(dt) {
        // Only process entities with PlayerControlled component
        const entities = this.em.getEntitiesWith('PlayerControlled');
        
        for (const entity of entities) {
            const control = this.em.getComponent(entity, 'PlayerControlled');
            const velocity = this.em.getComponent(entity, 'Velocity');
            
            if (!velocity || !control) continue;
            
            let dirX = 0;
            let dirY = 0;
            
            // WASD or Arrow keys
            if (this.input.isKeyPressed('KeyW') || this.input.isKeyPressed('ArrowUp')) dirY -= 1;
            if (this.input.isKeyPressed('KeyS') || this.input.isKeyPressed('ArrowDown')) dirY += 1;
            if (this.input.isKeyPressed('KeyA') || this.input.isKeyPressed('ArrowLeft')) dirX -= 1;
            if (this.input.isKeyPressed('KeyD') || this.input.isKeyPressed('ArrowRight')) dirX += 1;
            
            // OPTIMIZED VECTOR NORMALIZATION (Cyber Safety)
            // Prevents diagonal speed exploit using pre-calculated constant
            // Instead of expensive Math.sqrt() every frame, use Math.SQRT1_2
            if (dirX !== 0 && dirY !== 0) {
                dirX *= DIAGONAL_NORMALIZER;
                dirY *= DIAGONAL_NORMALIZER;
            }
            
            // Apply normalized velocity based on baseSpeed
            velocity.vx = dirX * control.baseSpeed * dt;
            velocity.vy = dirY * control.baseSpeed * dt;
            
            // Handle shooting intent
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
        
        // Update input manager's previous state for next frame
        this.input.updatePreviousState();
    }
}
