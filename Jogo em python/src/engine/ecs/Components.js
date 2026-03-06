/**
 * THE LAST LIGHTKEEPER - ECS Components
 * Data containers for entity properties
 */

import { PLAYER_CONFIG } from '../../game/config/constants.js';

export const Components = {
    Position: (x = 0, y = 0) => ({ x, y }),
    Velocity: (vx = 0, vy = 0) => ({ vx, vy }),
    Renderable: (color = '#fff', radius = 10, type = 'circle') => ({ color, radius, type }),
    Health: (max = 100) => ({ current: max, max }),
    Collider: (radius = 10, layer = 'default') => ({ radius, layer }),
    Enemy: (type = 'default', damage = 10) => ({ type, damage }),
    Orb: (value = 50) => ({ value }),
    Bullet: (damage = PLAYER_CONFIG.bulletDamage, life = PLAYER_CONFIG.bulletLife) => ({ damage, life }),
    Particle: (life = 30, maxLife = 30) => ({ life, maxLife }),
    DevilType: (type = 'default') => ({ type }),
    PlayerControlled: (baseSpeed = PLAYER_CONFIG.baseSpeed) => ({ baseSpeed }),
    IntentToShoot: (targetX = 0, targetY = 0) => ({ targetX, targetY }),
    Camera: (lerpFactor = 0.1) => ({ lerpFactor }),
    Light: (intensity = 100, radius = 200) => ({ intensity, radius }),
    Trail: (color = '#00ffff', duration = 0.5) => ({ color, duration }),
    ScreenShake: (intensity = 2, duration = 0.2) => ({ intensity, duration }),
    HitStop: (frames = 3) => ({ frames }),
    Invulnerable: (timer = 5.0) => ({ timer })
};

// Component type constants for validation
export const COMPONENT_TYPES = {
    POSITION: 'Position',
    VELOCITY: 'Velocity',
    RENDERABLE: 'Renderable',
    HEALTH: 'Health',
    COLLIDER: 'Collider',
    ENEMY: 'Enemy',
    ORB: 'Orb',
    BULLET: 'Bullet',
    PARTICLE: 'Particle',
    DEVIL_TYPE: 'DevilType',
    PLAYER_CONTROLLED: 'PlayerControlled',
    INTENT_TO_SHOOT: 'IntentToShoot',
    CAMERA: 'Camera',
    LIGHT: 'Light',
    TRAIL: 'Trail',
    SCREEN_SHAKE: 'ScreenShake',
    HIT_STOP: 'HitStop',
    INVULNERABLE: 'Invulnerable'
};
