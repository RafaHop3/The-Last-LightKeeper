/**
 * THE LAST LIGHTKEEPER - Weapon System
 * ECS system for weapon firing and bullet management
 * Implements fire rate control and zero garbage collection shooting
 */

export class WeaponSystem {
    constructor(entityManager, bulletPool) {
        this.em = entityManager;
        this.bulletPool = bulletPool;
        this.performanceMetrics = {
            shotsFired: 0,
            bulletsActive: 0,
            averageFireRate: 0
        };
    }

    /**
     * Main weapon update loop
     * Processes shooting intentions and respects fire rate limits
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Find entities that want to shoot and have a weapon equipped
        const shooters = this.em.getEntitiesWith(['IntentToShoot', 'Weapon', 'Position']);
        
        // Reset metrics
        this.performanceMetrics.bulletsActive = 0;

        for (const entity of shooters) {
            // Skip inactive entities
            if (this.em.getComponent(entity, 'Inactive')) continue;

            const intent = this.em.getComponent(entity, 'IntentToShoot');
            const weapon = this.em.getComponent(entity, 'Weapon');
            const pos = this.em.getComponent(entity, 'Position');

            if (!intent || !weapon || !pos) continue;

            // Update weapon cooldown based on real time (deltaTime)
            // CYBER SAFETY: Prevents Auto-Clicker exploits or DOM event injection
            weapon.timeSinceLastShot += deltaTime;

            // Check if weapon can fire
            if (this.#canFire(weapon, intent)) {
                this.#fireWeapon(entity, pos, intent, weapon);
                weapon.timeSinceLastShot = 0; // Reset cooldown
                this.performanceMetrics.shotsFired++;
            }

            // Remove intent after processing
            this.em.removeComponent(entity, 'IntentToShoot');
        }

        // Count active bullets
        const bullets = this.em.getEntitiesWith(['Bullet', 'Position']);
        this.performanceMetrics.bulletsActive = bullets.filter(b => !this.em.getComponent(b, 'Inactive')).length;
    }

    /**
     * Check if weapon can fire based on cooldown and ammo
     * @param {Object} weapon - Weapon component
     * @param {Object} intent - Shooting intent
     * @returns {boolean} - True if weapon can fire
     */
    #canFire(weapon, intent) {
        // Check fire rate cooldown
        if (weapon.timeSinceLastShot < weapon.fireRate) {
            return false;
        }

        // Check ammo if weapon has limited ammo
        if (weapon.currentAmmo !== undefined && weapon.currentAmmo <= 0) {
            return false;
        }

        // Check if target is valid (not too close)
        const dx = intent.targetX - intent.originX;
        const dy = intent.targetY - intent.originY;
        const distanceSq = (dx * dx) + (dy * dy);
        const minDistanceSq = (weapon.minFireDistance || 50) * (weapon.minFireDistance || 50);
        
        if (distanceSq < minDistanceSq) {
            return false;
        }

        return true;
    }

    /**
     * Fire weapon and create bullet
     * @param {number} entity - Shooting entity
     * @param {Object} pos - Position component
     * @param {Object} intent - Shooting intent
     * @param {Object} weapon - Weapon component
     */
    #fireWeapon(entity, pos, intent, weapon) {
        const dx = intent.targetX - pos.x;
        const dy = intent.targetY - pos.y;
        
        // Squared distance first to avoid unnecessary Math.sqrt
        const distanceSq = (dx * dx) + (dy * dy);
        if (distanceSq === 0) return;

        const distance = Math.sqrt(distanceSq);
        
        // Calculate bullet trajectory
        const trajectory = this.#calculateTrajectory(dx, dy, distance, weapon);
        
        // Spawn bullet from pool (Zero Garbage Collection)
        const bullet = this.bulletPool.get(pos.x, pos.y, trajectory.vx, trajectory.vy);
        
        // Configure bullet properties
        this.#configureBullet(bullet, weapon, entity);
        
        // Update ammo if limited
        if (weapon.currentAmmo !== undefined) {
            weapon.currentAmmo--;
        }

        // Create muzzle flash effect
        this.#createMuzzleFlash(pos.x, pos.y, trajectory.angle, weapon);
    }

    /**
     * Calculate bullet trajectory with spread and accuracy
     * @param {number} dx - Delta X to target
     * @param {number} dy - Delta Y to target
     * @param {number} distance - Distance to target
     * @param {Object} weapon - Weapon component
     * @returns {Object} - Trajectory with vx, vy, and angle
     */
    #calculateTrajectory(dx, dy, distance, weapon) {
        // Base angle to target
        let angle = Math.atan2(dy, dx);
        
        // Add weapon spread (inaccuracy)
        if (weapon.spread) {
            const spreadRadians = (weapon.spread * Math.PI) / 180; // Convert degrees to radians
            angle += (Math.random() - 0.5) * spreadRadians;
        }
        
        // Calculate velocity components
        const speed = weapon.bulletSpeed || 800;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        return { vx, vy, angle };
    }

    /**
     * Configure bullet with weapon properties
     * @param {number} bullet - Bullet entity
     * @param {Object} weapon - Weapon component
     * @param {number} owner - Shooting entity
     */
    #configureBullet(bullet, weapon, owner) {
        // Set damage
        const damageComp = this.em.getComponent(bullet, 'Damage');
        if (damageComp) {
            damageComp.amount = weapon.damage || 25;
            damageComp.owner = owner; // Track who fired the bullet
        }
        
        // Set bullet lifetime
        const bulletComp = this.em.getComponent(bullet, 'Bullet');
        if (bulletComp) {
            bulletComp.life = weapon.bulletLife || 60;
            bulletComp.maxLife = bulletComp.life;
            bulletComp.penetration = weapon.penetration || 1; // How many enemies can pierce
        }
        
        // Set visual properties
        const render = this.em.getComponent(bullet, 'Renderable');
        if (render) {
            render.color = weapon.bulletColor || '#ffcc00';
            render.radius = weapon.bulletSize || 4;
            render.type = 'circle';
        }
        
        // Set collision properties
        const collider = this.em.getComponent(bullet, 'Collider');
        if (collider) {
            collider.radius = weapon.bulletSize || 4;
            collider.layer = 'bullet';
            collider.damageTeam = this.#getDamageTeam(owner);
        }
    }

    /**
     * Get damage team for bullet (friendly fire prevention)
     * @param {number} owner - Shooting entity
     * @returns {string} - Team identifier
     */
    #getDamageTeam(owner) {
        if (this.em.hasComponent(owner, 'PlayerControlled')) {
            return 'player';
        } else if (this.em.hasComponent(owner, 'EnemyAI')) {
            return 'enemy';
        }
        return 'neutral';
    }

    /**
     * Create muzzle flash visual effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Firing angle
     * @param {Object} weapon - Weapon component
     */
    #createMuzzleFlash(x, y, angle, weapon) {
        // This would integrate with particle system
        // For now, just log the effect
        const flashSize = weapon.muzzleFlashSize || 10;
        const flashColor = weapon.muzzleFlashColor || '#ffffff';
        
        // Store request for particle system
        if (!this.muzzleFlashRequests) this.muzzleFlashRequests = [];
        
        this.muzzleFlashRequests.push({
            type: 'muzzle_flash',
            x: x + Math.cos(angle) * 20,
            y: y + Math.sin(angle) * 20,
            color: flashColor,
            size: flashSize,
            count: 3,
            spread: 0.5
        });
    }

    /**
     * Reload weapon
     * @param {number} entity - Entity with weapon
     * @returns {boolean} - True if reload started
     */
    reloadWeapon(entity) {
        const weapon = this.em.getComponent(entity, 'Weapon');
        if (!weapon || weapon.currentAmmo === undefined) return false;
        
        if (weapon.currentAmmo === weapon.maxAmmo) return false; // Already full
        
        // Start reload animation/cooldown
        weapon.isReloading = true;
        weapon.reloadTime = 0;
        weapon.reloadDuration = weapon.reloadDuration || 2.0; // 2 seconds default
        
        return true;
    }

    /**
     * Update reload progress
     * @param {number} deltaTime - Time since last frame
     */
    updateReloads(deltaTime) {
        const reloadingEntities = this.em.getEntitiesWith(['Weapon']);
        
        for (const entity of reloadingEntities) {
            const weapon = this.em.getComponent(entity, 'Weapon');
            if (!weapon || !weapon.isReloading) continue;
            
            weapon.reloadTime += deltaTime;
            
            if (weapon.reloadTime >= weapon.reloadDuration) {
                // Reload complete
                weapon.currentAmmo = weapon.maxAmmo;
                weapon.isReloading = false;
                weapon.reloadTime = 0;
            }
        }
    }

    /**
     * Get pending muzzle flash requests (for particle system)
     * @returns {Array} - Array of muzzle flash requests
     */
    getMuzzleFlashRequests() {
        const requests = this.muzzleFlashRequests || [];
        this.muzzleFlashRequests = [];
        return requests;
    }

    /**
     * Get weapon system performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Force all weapons to stop firing (for debugging)
     */
    ceaseFire() {
        const shooters = this.em.getEntitiesWith(['Weapon']);
        for (const entity of shooters) {
            this.em.removeComponent(entity, 'IntentToShoot');
        }
    }

    /**
     * Give infinite ammo to all weapons (for debugging)
     */
    infiniteAmmo() {
        const weapons = this.em.getEntitiesWith(['Weapon']);
        for (const entity of weapons) {
            const weapon = this.em.getComponent(entity, 'Weapon');
            if (weapon) {
                weapon.currentAmmo = 999;
                weapon.maxAmmo = 999;
            }
        }
    }

    /**
     * Set weapon properties for all entities
     * @param {Object} properties - Weapon properties to set
     */
    setWeaponProperties(properties) {
        const weapons = this.em.getEntitiesWith(['Weapon']);
        for (const entity of weapons) {
            const weapon = this.em.getComponent(entity, 'Weapon');
            if (weapon) {
                Object.assign(weapon, properties);
            }
        }
    }
}
