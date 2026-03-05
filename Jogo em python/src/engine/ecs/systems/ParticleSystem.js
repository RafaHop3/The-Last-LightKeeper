/**
 * THE LAST LIGHTKEEPER - Particle System
 * High-performance particle system using Data-Oriented Design with Typed Arrays
 * Features contiguous memory allocation, ring buffer recycling, and optimized rendering
 */

export class ParticleSystem {
    /**
     * @param {Object} context2d - Canvas context for rendering
     * @param {number} maxParticles - Strict memory limit (default: 1000)
     */
    constructor(context2d, maxParticles = 1000) {
        this.ctx = context2d;
        this.maxParticles = maxParticles;
        this.poolIndex = 0; // Points to next available particle
        this.activeCount = 0; // Track active particles for metrics
        
        // Contiguous Memory Architecture (Data-Oriented Design)
        // Use one-dimensional arrays to maximize CPU cache hit rate
        this.x = new Float32Array(maxParticles);
        this.y = new Float32Array(maxParticles);
        this.vx = new Float32Array(maxParticles);
        this.vy = new Float32Array(maxParticles);
        this.life = new Float32Array(maxParticles);
        this.maxLife = new Float32Array(maxParticles);
        this.size = new Float32Array(maxParticles);
        
        // Colors in JavaScript need to be stored in regular array
        // or encoded as Uint32, but for CSS color flexibility (ex: '#ff0000'):
        this.colors = new Array(maxParticles).fill('#ffffff');
        
        // Performance metrics
        this.metrics = {
            particlesEmitted: 0,
            particlesRendered: 0,
            averageActive: 0,
            peakActive: 0,
            memoryUsage: maxParticles * 32 // 32 bytes per particle estimate
        };
        
        // Particle presets for common effects
        this.presets = {
            explosion: {
                count: 20,
                speedBase: 300,
                speedVariation: 0.5,
                lifeMin: 0.3,
                lifeMax: 0.8,
                sizeMin: 2,
                sizeMax: 6,
                colors: ['#ff6600', '#ff3300', '#ffaa00', '#ffffff']
            },
            blood: {
                count: 15,
                speedBase: 200,
                speedVariation: 0.3,
                lifeMin: 0.4,
                lifeMax: 0.7,
                sizeMin: 1,
                sizeMax: 3,
                colors: ['#ff0000', '#cc0000', '#990000', '#660000']
            },
            magic: {
                count: 25,
                speedBase: 150,
                speedVariation: 0.7,
                lifeMin: 0.5,
                lifeMax: 1.2,
                sizeMin: 2,
                sizeMax: 5,
                colors: ['#00ffff', '#00ccff', '#0099ff', '#ffffff', '#ffff00']
            },
            spark: {
                count: 10,
                speedBase: 400,
                speedVariation: 0.6,
                lifeMin: 0.1,
                lifeMax: 0.3,
                sizeMin: 1,
                sizeMax: 2,
                colors: ['#ffffff', '#ffffcc', '#ffff99', '#ffff66']
            },
            smoke: {
                count: 8,
                speedBase: 50,
                speedVariation: 0.8,
                lifeMin: 0.8,
                lifeMax: 1.5,
                sizeMin: 4,
                sizeMax: 8,
                colors: ['#666666', '#777777', '#888888', '#999999', '#aaaaaa']
            }
        };
    }

    /**
     * Emit a new particle. O(1) operation.
     * Overwrites oldest particle if pool is full (Ring Buffer).
     */
    emit(x, y, vx, vy, life, size, color) {
        const i = this.poolIndex;

        this.x[i] = x;
        this.y[i] = y;
        this.vx[i] = vx;
        this.vy[i] = vy;
        this.life[i] = life;
        this.maxLife[i] = life;
        this.size[i] = size;
        this.colors[i] = color;

        // Advance index and do mathematical wrap-around
        this.poolIndex = (i + 1) % this.maxParticles;
        
        // Update metrics
        this.metrics.particlesEmitted++;
    }

    /**
     * Emit a particle burst with random directions
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of particles
     * @param {string|Array} color - Color(s) to use
     * @param {number} speedBase - Base speed
     * @param {Object} options - Additional options
     */
    emitBurst(x, y, count, color, speedBase = 100, options = {}) {
        const colors = Array.isArray(color) ? color : [color];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speedVariation = options.speedVariation || 0.5;
            const speed = speedBase * (1 - speedVariation + Math.random() * speedVariation * 2);
            const lifeMin = options.lifeMin || 0.2;
            const lifeMax = options.lifeMax || 0.6;
            const life = lifeMin + Math.random() * (lifeMax - lifeMin);
            const sizeMin = options.sizeMin || 2;
            const sizeMax = options.sizeMax || 5;
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            
            this.emit(
                x, y, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed, 
                life, size, particleColor
            );
        }
    }

    /**
     * Emit particles using a preset configuration
     * @param {string} presetName - Preset name
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} overrides - Override preset properties
     */
    emitPreset(presetName, x, y, overrides = {}) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`[ParticleSystem] Unknown preset: ${presetName}`);
            return;
        }
        
        const config = { ...preset, ...overrides };
        
        this.emitBurst(
            x, y,
            config.count,
            config.colors,
            config.speedBase,
            {
                speedVariation: config.speedVariation,
                lifeMin: config.lifeMin,
                lifeMax: config.lifeMax,
                sizeMin: config.sizeMin,
                sizeMax: config.sizeMax
            }
        );
    }

    /**
     * Emit particles in a cone shape
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} direction - Direction angle in radians
     * @param {number} spread - Spread angle in radians
     * @param {number} count - Number of particles
     * @param {string} color - Particle color
     * @param {number} speed - Particle speed
     */
    emitCone(x, y, direction, spread, count, color, speed = 200) {
        const halfSpread = spread / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = direction - halfSpread + (Math.random() * spread);
            const particleSpeed = speed * (0.5 + Math.random() * 0.5);
            const life = 0.3 + Math.random() * 0.4;
            const size = 2 + Math.random() * 3;
            
            this.emit(
                x, y,
                Math.cos(angle) * particleSpeed,
                Math.sin(angle) * particleSpeed,
                life, size, color
            );
        }
    }

    /**
     * Emit particles in a line pattern
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number} count - Number of particles
     * @param {string} color - Particle color
     * @param {number} spread - Line spread
     */
    emitLine(x1, y1, x2, y2, count, color, spread = 10) {
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Add perpendicular spread
            const perpX = -(y2 - y1) / Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const perpY = (x2 - x1) / Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const spreadAmount = (Math.random() - 0.5) * spread;
            
            const vx = perpX * spreadAmount;
            const vy = perpY * spreadAmount;
            const life = 0.2 + Math.random() * 0.3;
            const size = 2 + Math.random() * 2;
            
            this.emit(x, y, vx, vy, life, size, color);
        }
    }

    /**
     * Process physics and render particles in same cycle
     * Avoids iterating over thousands of elements twice (Loop optimization)
     * @param {number} deltaTime - Time since last frame
     * @param {Object} options - Rendering options
     */
    updateAndRender(deltaTime, options = {}) {
        this.ctx.save();
        
        // The globalCompositeOperation optimization creates the "bright" effect
        // when particles overlap (ideal for light and fire)
        this.ctx.globalCompositeOperation = options.blendMode || 'lighter';
        
        this.activeCount = 0;
        
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.life[i] > 0) {
                this.activeCount++;
                
                // 1. Physics Update
                this.x[i] += this.vx[i] * deltaTime;
                this.y[i] += this.vy[i] * deltaTime;
                this.life[i] -= deltaTime;

                // Friction - smooth deceleration in air
                const friction = options.friction || 0.95;
                this.vx[i] *= friction;
                this.vy[i] *= friction;
                
                // Gravity (optional)
                if (options.gravity) {
                    this.vy[i] += options.gravity * deltaTime;
                }

                // 2. Rendering (only if still alive after decrement)
                if (this.life[i] > 0) {
                    const lifeRatio = this.life[i] / this.maxLife[i];
                    
                    this.ctx.globalAlpha = lifeRatio * (options.alpha || 1.0);
                    this.ctx.fillStyle = this.colors[i];
                    
                    // Drawing squares (fillRect) is immensely faster in Canvas API
                    // than drawing circles (arc) for tiny particles
                    const currentSize = this.size[i] * lifeRatio * (options.sizeScale || 1.0);
                    
                    if (options.rounded) {
                        // Use circles for special effects (slower but better quality)
                        this.ctx.beginPath();
                        this.ctx.arc(this.x[i], this.y[i], currentSize / 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else {
                        // Use squares for maximum performance
                        this.ctx.fillRect(
                            this.x[i] - currentSize / 2, 
                            this.y[i] - currentSize / 2, 
                            currentSize, currentSize
                        );
                    }
                }
            }
        }

        this.ctx.restore();
        
        // Update metrics
        this.metrics.particlesRendered = this.activeCount;
        this.metrics.averageActive = (this.metrics.averageActive * 0.9) + (this.activeCount * 0.1);
        this.metrics.peakActive = Math.max(this.metrics.peakActive, this.activeCount);
    }

    /**
     * Clear all particles
     */
    clear() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.life[i] = 0;
        }
        this.activeCount = 0;
    }

    /**
     * Get performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeCount: this.activeCount,
            poolUtilization: (this.activeCount / this.maxParticles) * 100,
            memoryEfficiency: (this.metrics.memoryUsage / 1024).toFixed(2) + ' KB'
        };
    }

    /**
     * Add or modify a particle preset
     * @param {string} name - Preset name
     * @param {Object} config - Preset configuration
     */
    setPreset(name, config) {
        this.presets[name] = config;
    }

    /**
     * Get available preset names
     * @returns {Array} - Array of preset names
     */
    getPresetNames() {
        return Object.keys(this.presets);
    }

    /**
     * Force emit specific number of particles (for testing)
     * @param {number} count - Number of particles to emit
     */
    forceEmit(count = 100) {
        for (let i = 0; i < count; i++) {
            this.emit(
                Math.random() * 800 + 100,
                Math.random() * 600 + 50,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                0.5 + Math.random() * 0.5,
                2 + Math.random() * 3,
                `hsl(${Math.random() * 360}, 70%, 50%)`
            );
        }
    }

    /**
     * Create particle trail following an entity
     * @param {number} x - Entity X position
     * @param {number} y - Entity Y position
     * @param {number} vx - Entity velocity X
     * @param {number} vy - Entity velocity Y
     * @param {string} color - Trail color
     * @param {number} intensity - Trail intensity (0-1)
     */
    emitTrail(x, y, vx, vy, color, intensity = 0.5) {
        if (Math.random() < intensity) {
            // Emit particle opposite to movement direction
            const trailVx = -vx * 0.1 + (Math.random() - 0.5) * 20;
            const trailVy = -vy * 0.1 + (Math.random() - 0.5) * 20;
            
            this.emit(
                x, y,
                trailVx, trailVy,
                0.2 + Math.random() * 0.3,
                1 + Math.random() * 2,
                color
            );
        }
    }

    /**
     * Resize particle pool (recreates arrays)
     * @param {number} newMaxParticles - New maximum particle count
     */
    resizePool(newMaxParticles) {
        // Store current data
        const currentData = {
            x: this.x.slice(),
            y: this.y.slice(),
            vx: this.vx.slice(),
            vy: this.vy.slice(),
            life: this.life.slice(),
            maxLife: this.maxLife.slice(),
            size: this.size.slice(),
            colors: this.colors.slice()
        };
        
        // Create new arrays
        this.maxParticles = newMaxParticles;
        this.x = new Float32Array(newMaxParticles);
        this.y = new Float32Array(newMaxParticles);
        this.vx = new Float32Array(newMaxParticles);
        this.vy = new Float32Array(newMaxParticles);
        this.life = new Float32Array(newMaxParticles);
        this.maxLife = new Float32Array(newMaxParticles);
        this.size = new Float32Array(newMaxParticles);
        this.colors = new Array(newMaxParticles).fill('#ffffff');
        
        // Copy data back (up to new limit)
        const copyCount = Math.min(currentData.x.length, newMaxParticles);
        for (let i = 0; i < copyCount; i++) {
            this.x[i] = currentData.x[i];
            this.y[i] = currentData.y[i];
            this.vx[i] = currentData.vx[i];
            this.vy[i] = currentData.vy[i];
            this.life[i] = currentData.life[i];
            this.maxLife[i] = currentData.maxLife[i];
            this.size[i] = currentData.size[i];
            this.colors[i] = currentData.colors[i];
        }
        
        this.poolIndex = 0;
        this.metrics.memoryUsage = newMaxParticles * 32;
        
        console.log(`[ParticleSystem] Resized pool to ${newMaxParticles} particles`);
    }
}
