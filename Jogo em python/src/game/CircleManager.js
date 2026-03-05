/**
 * THE LAST LIGHTKEEPER - Circle Manager
 * Data-Driven Design for managing Dante's 9 Circles of Hell
 * Encapsulates level loading, entity spawning, and environment management
 */

import { CIRCLE_CONFIGS } from './config/constants.js';

export class CircleManager {
    constructor(entityManager, enemyPool, orbPool, particlePool) {
        this.em = entityManager;
        this.enemyPool = enemyPool;
        this.orbPool = orbPool;
        this.particlePool = particlePool;
        
        this.currentActiveEnemies = [];
        this.currentActiveOrbs = [];
        this.currentActiveParticles = [];
        this.currentCircle = 0;
        this.environmentEntity = null;
        
        this.spawnPatterns = {
            circular: this.#spawnCircularPattern.bind(this),
            grid: this.#spawnGridPattern.bind(this),
            random: this.#spawnRandomPattern.bind(this),
            perimeter: this.#spawnPerimeterPattern.bind(this)
        };
    }

    /**
     * Load a new circle with data-driven configuration
     * @param {number} circleNumber - Circle number (1-9)
     * @returns {Object|null} - Circle configuration or null if invalid
     */
    loadCircle(circleNumber) {
        // 1. Cyber Safety: Input validation
        if (!this.#validateCircleNumber(circleNumber)) {
            console.error(`[CircleManager] Invalid circle number: ${circleNumber}`);
            return null;
        }

        const config = CIRCLE_CONFIGS[circleNumber];
        console.log(`[CircleManager] Loading Circle ${circleNumber}: ${config.name}`);

        // 2. Memory cleanup (atomic transition)
        this.clearCurrentCircle();

        // 3. Update environment (global engine state)
        this.setEnvironment(config);

        // 4. Entity generation via pools (Zero Garbage Collection)
        this.spawnOrbs(config.orbsCount, config.themeColor, config.orbPattern || 'random');
        this.spawnEnemies(config.enemyCount, config.enemyType, config.enemyBaseSpeed, config.enemyPattern || 'perimeter');
        this.spawnEnvironmentParticles(config.particleEffect, config.particleDensity || 50);

        // 5. Set current circle for tracking
        this.currentCircle = circleNumber;

        return config;
    }

    /**
     * Validate circle number for security
     * @param {number} circleNumber - Circle number to validate
     * @returns {boolean} - True if valid
     */
    #validateCircleNumber(circleNumber) {
        return Number.isInteger(circleNumber) && circleNumber >= 1 && circleNumber <= 9;
    }

    /**
     * Clear current circle entities (atomic cleanup)
     */
    clearCurrentCircle() {
        // Release all active entities back to pools
        for (const enemy of this.currentActiveEnemies) {
            this.enemyPool.release(enemy);
        }
        
        for (const orb of this.currentActiveOrbs) {
            this.orbPool.release(orb);
        }
        
        for (const particle of this.currentActiveParticles) {
            this.particlePool.release(particle);
        }

        // Reset tracking arrays
        this.currentActiveEnemies.length = 0;
        this.currentActiveOrbs.length = 0;
        this.currentActiveParticles.length = 0;

        console.log(`[CircleManager] Cleared Circle ${this.currentCircle}`);
    }

    /**
     * Set environment configuration
     * @param {Object} config - Circle configuration
     */
    setEnvironment(config) {
        // Update global environment entity (singleton in ECS)
        const envEntities = this.em.getEntitiesWith(['EnvironmentData']);
        
        if (envEntities.length > 0) {
            const envData = this.em.getComponent(envEntities[0], 'EnvironmentData');
            envData.backgroundColor = config.backgroundColor;
            envData.particleEffect = config.particleEffect;
            envData.ambientLight = config.ambientLight || 0.8;
            envData.windForce = config.windForce || { x: 0, y: 0 };
            envData.circleName = config.name;
            envData.circleNumber = this.currentCircle;
            this.environmentEntity = envEntities[0];
        } else {
            // Create environment entity if first time
            this.environmentEntity = this.em.createEntity();
            this.em.addComponent(this.environmentEntity, 'EnvironmentData', {
                backgroundColor: config.backgroundColor,
                particleEffect: config.particleEffect,
                ambientLight: config.ambientLight || 0.8,
                windForce: config.windForce || { x: 0, y: 0 },
                circleName: config.name,
                circleNumber: this.currentCircle
            });
        }
    }

    /**
     * Spawn orbs with specified pattern
     * @param {number} count - Number of orbs to spawn
     * @param {string} color - Orb color
     * @param {string} pattern - Spawn pattern
     */
    spawnOrbs(count, color, pattern = 'random') {
        const spawnFunction = this.spawnPatterns[pattern] || this.spawnPatterns.random;
        const positions = spawnFunction(count, { margin: 50, avoidCenter: true });

        for (let i = 0; i < positions.length; i++) {
            const { x, y } = positions[i];
            const orb = this.orbPool.get(x, y, 0, 0);
            
            // Inject thematic color into orb renderable
            const render = this.em.getComponent(orb, 'Renderable');
            if (render) {
                render.color = color;
                render.glowColor = this.#adjustColorBrightness(color, 1.5);
            }

            // Set orb value based on circle difficulty
            const orbComponent = this.em.getComponent(orb, 'Orb');
            if (orbComponent) {
                orbComponent.value = 50 * this.currentCircle; // Scale with circle
            }

            this.currentActiveOrbs.push(orb);
        }
    }

    /**
     * Spawn enemies with specified pattern
     * @param {number} count - Number of enemies to spawn
     * @param {string} type - Enemy type
     * @param {number} baseSpeed - Base movement speed
     * @param {string} pattern - Spawn pattern
     */
    spawnEnemies(count, type, baseSpeed, pattern = 'perimeter') {
        const spawnFunction = this.spawnPatterns[pattern] || this.spawnPatterns.perimeter;
        const positions = spawnFunction(count, { margin: 100, avoidCenter: true });

        for (let i = 0; i < positions.length; i++) {
            const { x, y } = positions[i];
            const enemy = this.enemyPool.get(x, y, 0, 0);

            // Set enemy AI type and behavior
            this.em.addComponent(enemy, 'EnemyAI', { 
                type: type, 
                aggroRange: 200 + (this.currentCircle * 20), // Scale with circle
                attackCooldown: 2000 - (this.currentCircle * 100), // Faster attacks
                behavior: this.#getEnemyBehavior(type)
            });

            // Set movement speed based on circle difficulty
            const movement = this.em.getComponent(enemy, 'Velocity');
            if (movement) {
                movement.baseSpeed = baseSpeed;
            }

            // Set enemy appearance
            const render = this.em.getComponent(enemy, 'Renderable');
            if (render) {
                render.color = this.#getEnemyColor(type);
                render.type = 'devil';
            }

            // Set enemy health based on circle
            const health = this.em.getComponent(enemy, 'Health');
            if (health) {
                health.current = 50 + (this.currentCircle * 10);
                health.max = health.current;
            }

            this.currentActiveEnemies.push(enemy);
        }
    }

    /**
     * Spawn environment particles
     * @param {string} effectType - Particle effect type
     * @param {number} density - Particle density
     */
    spawnEnvironmentParticles(effectType, density) {
        if (!this.particlePool) return;

        for (let i = 0; i < density; i++) {
            const x = Math.random() * 1000;
            const y = Math.random() * 700;
            
            const particle = this.particlePool.get(x, y, 0, 0);
            
            // Set particle behavior based on effect type
            const particleComponent = this.em.getComponent(particle, 'Particle');
            if (particleComponent) {
                particleComponent.effectType = effectType;
                particleComponent.life = 60 + Math.random() * 60; // Random lifetime
                particleComponent.maxLife = particleComponent.life;
            }

            // Set particle appearance
            const render = this.em.getComponent(particle, 'Renderable');
            if (render) {
                render.color = this.#getParticleColor(effectType);
                render.alpha = 0.3 + Math.random() * 0.4;
                render.type = 'particle';
            }

            // Set particle movement
            const velocity = this.em.getComponent(particle, 'Velocity');
            if (velocity) {
                const movement = this.#getParticleMovement(effectType);
                velocity.vx = movement.vx;
                velocity.vy = movement.vy;
            }

            this.currentActiveParticles.push(particle);
        }
    }

    /**
     * Spawn patterns implementation
     */
    #spawnCircularPattern(count, options = {}) {
        const positions = [];
        const centerX = 500;
        const centerY = 350;
        const radius = options.radius || 300;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            positions.push({ x, y });
        }
        
        return positions;
    }

    #spawnGridPattern(count, options = {}) {
        const positions = [];
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const spacing = options.spacing || 100;
        const startX = options.startX || 500 - (cols * spacing) / 2;
        const startY = options.startY || 350 - (rows * spacing) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (positions.length >= count) break;
                positions.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing
                });
            }
        }
        
        return positions;
    }

    #spawnRandomPattern(count, options = {}) {
        const positions = [];
        const margin = options.margin || 50;
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            // Try to avoid overlapping
            do {
                x = margin + Math.random() * (1000 - margin * 2);
                y = margin + Math.random() * (700 - margin * 2);
                attempts++;
            } while (this.#isPositionOccupied(x, y, options.minDistance || 50) && attempts < 10);
            
            positions.push({ x, y });
        }
        
        return positions;
    }

    #spawnPerimeterPattern(count, options = {}) {
        const positions = [];
        const margin = options.margin || 100;
        
        for (let i = 0; i < count; i++) {
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch (side) {
                case 0: // top
                    x = margin + Math.random() * (1000 - margin * 2);
                    y = margin;
                    break;
                case 1: // right
                    x = 1000 - margin;
                    y = margin + Math.random() * (700 - margin * 2);
                    break;
                case 2: // bottom
                    x = margin + Math.random() * (1000 - margin * 2);
                    y = 700 - margin;
                    break;
                case 3: // left
                    x = margin;
                    y = margin + Math.random() * (700 - margin * 2);
                    break;
            }
            
            positions.push({ x, y });
        }
        
        return positions;
    }

    /**
     * Utility functions
     */
    #isPositionOccupied(x, y, minDistance) {
        // Check against existing entities
        const allPositions = [
            ...this.currentActiveEnemies.map(id => this.em.getComponent(id, 'Position')),
            ...this.currentActiveOrbs.map(id => this.em.getComponent(id, 'Position'))
        ];
        
        return allPositions.some(pos => {
            if (!pos) return false;
            const dx = pos.x - x;
            const dy = pos.y - y;
            return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });
    }

    #adjustColorBrightness(color, factor) {
        // Simple color brightness adjustment
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    #getEnemyBehavior(type) {
        const behaviors = {
            'Sombras': 'stealth',
            'Amantes': 'aggressive',
            'Glutões': 'patrol',
            'Avarentos': 'guardian',
            'Furiosos': 'berserker',
            'Hereges': 'summoner',
            'Violentos': 'charger',
            'Fraudadores': 'deceiver',
            'Traidores': 'assassin'
        };
        return behaviors[type] || 'default';
    }

    #getEnemyColor(type) {
        const colors = {
            'Sombras': '#666666',
            'Amantes': '#ff99cc',
            'Glutões': '#8b4513',
            'Avarentos': '#ffd700',
            'Furiosos': '#ff3333',
            'Hereges': '#ff6600',
            'Violentos': '#990000',
            'Fraudadores': '#9933ff',
            'Traidores': '#00ccff'
        };
        return colors[type] || '#ff0000';
    }

    #getParticleColor(effectType) {
        const colors = {
            'fog': '#cccccc',
            'wind_pink': '#ff99cc',
            'rain_brown': '#8b4513',
            'gold_sparkle': '#ffd700',
            'fire': '#ff6600',
            'flaming_tombs': '#ff3300',
            'blood_river': '#990000',
            'purple_fog': '#9933ff',
            'ice_lake': '#00ccff'
        };
        return colors[effectType] || '#ffffff';
    }

    #getParticleMovement(effectType) {
        const movements = {
            'fog': { vx: (Math.random() - 0.5) * 20, vy: -10 },
            'wind_pink': { vx: 30, vy: (Math.random() - 0.5) * 10 },
            'rain_brown': { vx: (Math.random() - 0.5) * 5, vy: 50 },
            'gold_sparkle': { vx: (Math.random() - 0.5) * 10, vy: -20 },
            'fire': { vx: (Math.random() - 0.5) * 30, vy: -40 },
            'flaming_tombs': { vx: (Math.random() - 0.5) * 20, vy: -30 },
            'blood_river': { vx: 20, vy: 10 },
            'purple_fog': { vx: (Math.random() - 0.5) * 15, vy: -5 },
            'ice_lake': { vx: (Math.random() - 0.5) * 10, vy: 5 }
        };
        return movements[effectType] || { vx: 0, vy: 0 };
    }

    /**
     * Get current circle statistics
     * @returns {Object} - Circle statistics
     */
    getCircleStats() {
        return {
            currentCircle: this.currentCircle,
            activeEnemies: this.currentActiveEnemies.length,
            activeOrbs: this.currentActiveOrbs.length,
            activeParticles: this.currentActiveParticles.length,
            environmentEntity: this.environmentEntity
        };
    }

    /**
     * Check if circle is completed (all orbs collected)
     * @returns {boolean} - True if circle is completed
     */
    isCircleCompleted() {
        return this.currentActiveOrbs.length === 0;
    }

    /**
     * Get remaining enemies count
     * @returns {number} - Number of active enemies
     */
    getRemainingEnemies() {
        return this.currentActiveEnemies.length;
    }

    /**
     * Get remaining orbs count
     * @returns {number} - Number of active orbs
     */
    getRemainingOrbs() {
        return this.currentActiveOrbs.length;
    }

    /**
     * Force cleanup of current circle (for debugging)
     */
    forceCleanup() {
        console.warn('[CircleManager] Force cleanup triggered');
        this.clearCurrentCircle();
    }
}
