/**
 * THE LAST LIGHTKEEPER - Game Constants
 * Centralized configuration for better maintainability
 */

// ============================================
// MATHEMATICAL CONSTANTS
// ============================================

export const DIAGONAL_NORMALIZER = Math.SQRT1_2; // 0.70710678
export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

// ============================================
// GAME CONFIGURATION
// ============================================

export const GAME_CONFIG = {
    width: 1000,
    height: 700,
    targetFPS: 60,
    dt: 1/60,
    maxEntities: 1000,
    maxParticles: 800
};

// ============================================
// PLAYER CONFIGURATION
// ============================================

export const PLAYER_CONFIG = {
    baseSpeed: 300,
    radius: 20,
    health: 100,
    bulletDamage: 34,
    bulletSpeed: 12,
    bulletLife: 60
};

// ============================================
// COLORS (9 Circles of Dante's Inferno)
// ============================================

export const CIRCLE_COLORS = [
    { name: 'LIMBO', color: '#888888', bg: '#2a2a3a' },
    { name: 'LUST', color: '#ff66aa', bg: '#1a1a2e' },
    { name: 'GLUTTONY', color: '#8B4513', bg: '#2d2518' },
    { name: 'GREED', color: '#FFD700', bg: '#1a1510' },
    { name: 'WRATH', color: '#DC143C', bg: '#1a0a0a' },
    { name: 'HERESY', color: '#FF4500', bg: '#0a0a0a' },
    { name: 'VIOLENCE', color: '#8B0000', bg: '#2a0a0a' },
    { name: 'FRAUD', color: '#4B0082', bg: '#0f0a1a' },
    { name: 'TREACHERY', color: '#00CED1', bg: '#0a1a2e' }
];

// ============================================
// CIRCLE CONFIGURATION
// ============================================

export const CIRCLES = [
    { name: 'LIMBO', orbs: 10, enemies: 6, ...CIRCLE_COLORS[0] },
    { name: 'LUST', orbs: 12, enemies: 7, ...CIRCLE_COLORS[1] },
    { name: 'GLUTTONY', orbs: 14, enemies: 6, ...CIRCLE_COLORS[2] },
    { name: 'GREED', orbs: 16, enemies: 7, ...CIRCLE_COLORS[3] },
    { name: 'WRATH', orbs: 16, enemies: 8, ...CIRCLE_COLORS[4] },
    { name: 'HERESY', orbs: 18, enemies: 7, ...CIRCLE_COLORS[5] },
    { name: 'VIOLENCE', orbs: 18, enemies: 8, ...CIRCLE_COLORS[6] },
    { name: 'FRAUD', orbs: 20, enemies: 9, ...CIRCLE_COLORS[7] },
    { name: 'TREACHERY', orbs: 20, enemies: 10, ...CIRCLE_COLORS[8] }
];

// ============================================
// ENEMY TYPES
// ============================================

export const ENEMY_TYPES = [
    'lovers', 'glutton', 'hoarder', 'wrathful', 
    'heretic', 'violent', 'fraud', 'traitor', 'default'
];

// ============================================
// PARTICLE CONFIGURATION
// ============================================

export const PARTICLE_CONFIG = {
    explosionPool: {
        maxParticles: 500,
        colors: ['#ff6600', '#ffaa00', '#ffff00']
    },
    trailPool: {
        maxParticles: 300,
        colors: ['#00ffff', '#0088ff', '#0044ff']
    }
};

// ============================================
// GAME FEEL CONFIGURATION
// ============================================

export const GAME_FEEL_CONFIG = {
    screenShake: {
        intensity: 2,
        decay: 0.9
    },
    hitStop: {
        frames: 3
    },
    camera: {
        lerpFactor: 0.1
    }
};

// ============================================
// VALIDATION BOUNDS
// ============================================

export const VALIDATION_BOUNDS = {
    maxSpeed: 15,
    positionBounds: {
        minX: 0,
        maxX: GAME_CONFIG.width,
        minY: 0,
        maxY: GAME_CONFIG.height
    },
    healthBounds: {
        min: 0,
        max: 100
    },
    scoreBounds: {
        min: 0,
        max: 1000000
    }
};

// ============================================
// UI CONFIGURATION
// ============================================

export const UI_CONFIG = {
    hud: {
        updateInterval: 100 // ms
    },
    announcements: {
        duration: 3000 // ms
    }
};

// ============================================
// CIRCLE CONFIGURATIONS (Data-Driven Design)
// ============================================

export const CIRCLE_CONFIGS = {
    1: { 
        name: 'LIMBO', 
        orbsCount: 10, 
        enemyCount: 6, 
        enemyType: 'Sombras', 
        backgroundColor: '#333333', 
        particleEffect: 'fog', 
        themeColor: '#aaaaaa', 
        enemyBaseSpeed: 100,
        ambientLight: 0.9,
        windForce: { x: 10, y: 0 },
        orbPattern: 'random',
        enemyPattern: 'perimeter',
        particleDensity: 30
    },
    2: { 
        name: 'LUST', 
        orbsCount: 12, 
        enemyCount: 7, 
        enemyType: 'Amantes', 
        backgroundColor: '#4a2533', 
        particleEffect: 'wind_pink', 
        themeColor: '#ff99cc', 
        enemyBaseSpeed: 120,
        ambientLight: 0.8,
        windForce: { x: 20, y: -5 },
        orbPattern: 'circular',
        enemyPattern: 'perimeter',
        particleDensity: 40
    },
    3: { 
        name: 'GLUTTONY', 
        orbsCount: 14, 
        enemyCount: 6, 
        enemyType: 'Glutões', 
        backgroundColor: '#3b2f2f', 
        particleEffect: 'rain_brown', 
        themeColor: '#8b4513', 
        enemyBaseSpeed: 90,
        ambientLight: 0.7,
        windForce: { x: 0, y: 10 },
        orbPattern: 'grid',
        enemyPattern: 'random',
        particleDensity: 50
    },
    4: { 
        name: 'GREED', 
        orbsCount: 16, 
        enemyCount: 7, 
        enemyType: 'Avarentos', 
        backgroundColor: '#332a00', 
        particleEffect: 'gold_sparkle', 
        themeColor: '#ffd700', 
        enemyBaseSpeed: 110,
        ambientLight: 0.8,
        windForce: { x: -10, y: 5 },
        orbPattern: 'random',
        enemyPattern: 'grid',
        particleDensity: 45
    },
    5: { 
        name: 'WRATH', 
        orbsCount: 16, 
        enemyCount: 8, 
        enemyType: 'Furiosos', 
        backgroundColor: '#4a0000', 
        particleEffect: 'fire', 
        themeColor: '#ff3333', 
        enemyBaseSpeed: 150,
        ambientLight: 0.6,
        windForce: { x: 30, y: -10 },
        orbPattern: 'perimeter',
        enemyPattern: 'circular',
        particleDensity: 60
    },
    6: { 
        name: 'HERESY', 
        orbsCount: 18, 
        enemyCount: 7, 
        enemyType: 'Hereges', 
        backgroundColor: '#2a0800', 
        particleEffect: 'flaming_tombs', 
        themeColor: '#ff6600', 
        enemyBaseSpeed: 130,
        ambientLight: 0.5,
        windForce: { x: 25, y: 15 },
        orbPattern: 'grid',
        enemyPattern: 'perimeter',
        particleDensity: 55
    },
    7: { 
        name: 'VIOLENCE', 
        orbsCount: 18, 
        enemyCount: 8, 
        enemyType: 'Violentos', 
        backgroundColor: '#5c0000', 
        particleEffect: 'blood_river', 
        themeColor: '#990000', 
        enemyBaseSpeed: 160,
        ambientLight: 0.4,
        windForce: { x: 40, y: 20 },
        orbPattern: 'circular',
        enemyPattern: 'random',
        particleDensity: 70
    },
    8: { 
        name: 'FRAUD', 
        orbsCount: 20, 
        enemyCount: 9, 
        enemyType: 'Fraudadores', 
        backgroundColor: '#2e004d', 
        particleEffect: 'purple_fog', 
        themeColor: '#9933ff', 
        enemyBaseSpeed: 140,
        ambientLight: 0.3,
        windForce: { x: -20, y: -10 },
        orbPattern: 'random',
        enemyPattern: 'grid',
        particleDensity: 65
    },
    9: { 
        name: 'TREACHERY', 
        orbsCount: 20, 
        enemyCount: 10, 
        enemyType: 'Traidores', 
        backgroundColor: '#001a33', 
        particleEffect: 'ice_lake', 
        themeColor: '#00ccff', 
        enemyBaseSpeed: 180,
        ambientLight: 0.2,
        windForce: { x: -30, y: -15 },
        orbPattern: 'perimeter',
        enemyPattern: 'circular',
        particleDensity: 80
    }
};
