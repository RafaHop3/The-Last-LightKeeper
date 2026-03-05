/**
 * THE LAST LIGHTKEEPER - Movement System
 * Handles entity movement and boundary checking
 */

export class MovementSystem {
    constructor(entityManager, canvasWidth, canvasHeight) {
        this.em = entityManager;
        this.bounds = { w: canvasWidth, h: canvasHeight };
    }

    update(dt) {
        const entities = this.em.getEntitiesWith('Position', 'Velocity');
        
        for (const entityId of entities) {
            const pos = this.em.getComponent(entityId, 'Position');
            const vel = this.em.getComponent(entityId, 'Velocity');
            const collider = this.em.getComponent(entityId, 'Collider');
            
            if (!pos || !vel) continue;
            
            // Update position based on velocity and delta time
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
            
            // Boundary check if entity has collider
            if (collider) {
                const r = collider.radius;
                pos.x = Math.max(r, Math.min(this.bounds.w - r, pos.x));
                pos.y = Math.max(r, Math.min(this.bounds.h - r, pos.y));
                
                // Stop velocity at boundaries to prevent jitter
                if (pos.x <= r || pos.x >= this.bounds.w - r) {
                    vel.vx = 0;
                }
                if (pos.y <= r || pos.y >= this.bounds.h - r) {
                    vel.vy = 0;
                }
            }
        }
    }

    setBounds(width, height) {
        this.bounds = { w: width, h: height };
    }

    getBounds() {
        return { ...this.bounds };
    }
}
