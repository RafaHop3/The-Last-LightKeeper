/**
 * THE LAST LIGHTKEEPER - Entity Pool
 * Memory management system for zero Garbage Collection stutter
 * Pre-allocates entities and recycles them to prevent runtime GC pauses
 */

export class EntityPool {
    /**
     * @param {Object} entityManager - Global EntityManager instance
     * @param {Function} prefabFactory - Function that attaches default components to entity
     * @param {number} initialSize - Number of entities to pre-allocate in memory
     */
    constructor(entityManager, prefabFactory, initialSize = 100) {
        this.em = entityManager;
        this.prefabFactory = prefabFactory;
        this.pool = [];
        this.activeEntities = new Set();
        this.totalAllocated = 0;
        this.maxPoolSize = initialSize;
        this.poolExhaustedCount = 0;

        // Pre-warm: Static initial allocation to avoid Garbage Collection at runtime
        this.warmUp(initialSize);
    }

    /**
     * Pre-allocate entities to prevent runtime GC
     * @param {number} count - Number of entities to pre-allocate
     */
    warmUp(count) {
        for (let i = 0; i < count; i++) {
            const entity = this.em.createEntity();
            this.prefabFactory(entity, this.em);
            
            // Add 'Inactive' tag so systems ignore this entity
            this.em.addComponent(entity, 'Inactive', {});
            this.pool.push(entity);
            this.totalAllocated++;
        }
    }

    /**
     * Get an inactive entity from pool (Spawn)
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} velocityX - Initial X velocity
     * @param {number} velocityY - Initial Y velocity
     * @returns {number} - Entity ID
     */
    get(x, y, velocityX = 0, velocityY = 0) {
        let entity;

        if (this.pool.length === 0) {
            // Pool exhausted - allocate new entity (performance warning)
            this.poolExhaustedCount++;
            console.warn(`[Performance] Pool exhausted! Allocating extra memory. Consider increasing initialSize. Exhausted count: ${this.poolExhaustedCount}`);
            
            entity = this.em.createEntity();
            this.prefabFactory(entity, this.em);
            this.totalAllocated++;
        } else {
            entity = this.pool.pop();
            // Remove 'Inactive' tag to wake up the entity
            this.em.removeComponent(entity, 'Inactive');
        }

        // Reset critical state (Prevents bullet spawning at previous death location)
        this.resetEntityState(entity, x, y, velocityX, velocityY);
        
        // Track active entity
        this.activeEntities.add(entity);
        
        return entity;
    }

    /**
     * Return entity to pool (Kill/Despawn)
     * @param {number} entity - Entity ID to return to pool
     */
    release(entity) {
        if (!this.activeEntities.has(entity)) {
            console.warn(`[EntityPool] Attempted to release non-active entity: ${entity}`);
            return;
        }

        // Safety: Zero velocity to prevent physics ghost bugs
        const vel = this.em.getComponent(entity, 'Velocity');
        if (vel) { 
            vel.vx = 0; 
            vel.vy = 0; 
        }

        // Reset other critical components
        this.resetEntityForPooling(entity);

        // Add inactive tag again
        this.em.addComponent(entity, 'Inactive', {});
        this.pool.push(entity);
        this.activeEntities.delete(entity);
    }

    /**
     * Reset entity state when spawning from pool
     * @param {number} entity - Entity ID
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     */
    resetEntityState(entity, x, y, vx, vy) {
        // Reset position
        const pos = this.em.getComponent(entity, 'Position');
        if (pos) { 
            pos.x = x; 
            pos.y = y; 
        }

        // Reset velocity
        const vel = this.em.getComponent(entity, 'Velocity');
        if (vel) { 
            vel.vx = vx; 
            vel.vy = vy; 
        }

        // Reset health if entity has it
        const health = this.em.getComponent(entity, 'Health');
        if (health) { 
            health.current = health.max; 
        }

        // Reset bullet life if entity is bullet
        const bullet = this.em.getComponent(entity, 'Bullet');
        if (bullet) { 
            bullet.life = bullet.maxLife || 60; 
        }

        // Reset particle life if entity is particle
        const particle = this.em.getComponent(entity, 'Particle');
        if (particle) { 
            particle.life = particle.maxLife || 30; 
        }
    }

    /**
     * Reset entity components when returning to pool
     * @param {number} entity - Entity ID
     */
    resetEntityForPooling(entity) {
        // Reset any components that might cause issues when reused
        const renderable = this.em.getComponent(entity, 'Renderable');
        if (renderable) {
            // Reset color to default if it was modified
            renderable.color = renderable.originalColor || renderable.color;
        }

        // Remove temporary components
        this.em.removeComponent(entity, 'CollisionEvent');
        this.em.removeComponent(entity, 'IntentToShoot');
        this.em.removeComponent(entity, 'ScreenShake');
        this.em.removeComponent(entity, 'HitStop');
    }

    /**
     * Release all active entities back to pool
     * Useful for level changes or game restart
     */
    releaseAll() {
        const activeEntitiesArray = Array.from(this.activeEntities);
        for (const entity of activeEntitiesArray) {
            this.release(entity);
        }
    }

    /**
     * Get pool statistics
     * @returns {Object} - Pool metrics
     */
    getStats() {
        return {
            totalAllocated: this.totalAllocated,
            availableInPool: this.pool.length,
            activeEntities: this.activeEntities.size,
            poolExhaustedCount: this.poolExhaustedCount,
            utilizationRate: this.activeEntities.size / this.totalAllocated,
            maxPoolSize: this.maxPoolSize
        };
    }

    /**
     * Check if pool needs expansion
     * @returns {boolean} - True if pool is under pressure
     */
    needsExpansion() {
        const utilizationRate = this.activeEntities.size / this.totalAllocated;
        const exhaustionRate = this.poolExhaustedCount / this.totalAllocated;
        
        return utilizationRate > 0.8 || exhaustionRate > 0.1;
    }

    /**
     * Expand pool size if needed
     * @param {number} additionalSize - Number of additional entities to allocate
     */
    expand(additionalSize = 50) {
        console.log(`[EntityPool] Expanding pool by ${additionalSize} entities`);
        this.warmUp(additionalSize);
        this.maxPoolSize += additionalSize;
    }

    /**
     * Auto-manage pool size based on usage patterns
     */
    autoManage() {
        if (this.needsExpansion()) {
            this.expand();
        }
        
        // Optional: Shrink pool if consistently underutilized
        const utilizationRate = this.activeEntities.size / this.totalAllocated;
        if (utilizationRate < 0.3 && this.totalAllocated > this.maxPoolSize * 0.5) {
            this.shrink();
        }
    }

    /**
     * Shrink pool size (cautious operation)
     */
    shrink() {
        const shrinkAmount = Math.min(this.pool.length, Math.floor(this.totalAllocated * 0.2));
        
        for (let i = 0; i < shrinkAmount; i++) {
            const entity = this.pool.pop();
            this.em.removeEntity(entity);
            this.totalAllocated--;
        }
        
        console.log(`[EntityPool] Shrunk pool by ${shrinkAmount} entities`);
    }

    /**
     * Get all active entities (for debugging)
     * @returns {Array} - Array of active entity IDs
     */
    getActiveEntities() {
        return Array.from(this.activeEntities);
    }

    /**
     * Force garbage collection (for debugging)
     * Note: This is a development/debug tool only
     */
    forceGC() {
        if (window.gc) {
            window.gc();
            console.log('[EntityPool] Forced garbage collection');
        } else {
            console.warn('[EntityPool] GC not available. Use Chrome DevTools > Performance > Collect garbage');
        }
    }

    /**
     * Destroy pool and clean up all entities
     */
    destroy() {
        this.releaseAll();
        
        // Remove all pooled entities from EntityManager
        for (const entity of this.pool) {
            this.em.removeEntity(entity);
        }
        
        this.pool = [];
        this.activeEntities.clear();
        this.totalAllocated = 0;
        
        console.log('[EntityPool] Pool destroyed and cleaned up');
    }
}

/**
 * Factory function for common entity types
 */
export const EntityPrefabs = {
    /**
     * Bullet prefab factory
     * @returns {Function} - Bullet prefab function
     */
    bullet: () => {
        return (entity, em) => {
            em.addComponent(entity, 'Position', { x: 0, y: 0 });
            em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
            em.addComponent(entity, 'Collider', { radius: 4, layer: 'bullet' });
            em.addComponent(entity, 'Renderable', { 
                color: '#ffcc00', 
                radius: 4, 
                type: 'circle',
                originalColor: '#ffcc00'
            });
            em.addComponent(entity, 'Bullet', { damage: 34, life: 60, maxLife: 60 });
        };
    },

    /**
     * Particle prefab factory
     * @returns {Function} - Particle prefab function
     */
    particle: () => {
        return (entity, em) => {
            em.addComponent(entity, 'Position', { x: 0, y: 0 });
            em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
            em.addComponent(entity, 'Renderable', { 
                color: '#ff6600', 
                radius: 2, 
                type: 'particle'
            });
            em.addComponent(entity, 'Particle', { life: 30, maxLife: 30 });
        };
    },

    /**
     * Enemy prefab factory
     * @returns {Function} - Enemy prefab function
     */
    enemy: () => {
        return (entity, em) => {
            em.addComponent(entity, 'Position', { x: 0, y: 0 });
            em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
            em.addComponent(entity, 'Collider', { radius: 25, layer: 'enemy' });
            em.addComponent(entity, 'Renderable', { 
                color: '#ff0000', 
                radius: 25, 
                type: 'devil'
            });
            em.addComponent(entity, 'Health', { current: 100, max: 100 });
            em.addComponent(entity, 'Enemy', { type: 'default', damage: 10 });
            em.addComponent(entity, 'DevilType', { type: 'default' });
        };
    }
};
