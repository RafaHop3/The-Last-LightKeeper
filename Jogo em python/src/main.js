/**
 * THE LAST LIGHTKEEPER - Main Entry Point
 * Vite + ES Modules Architecture
 * ECS-based game loop orchestration
 */

import { EntityManager } from './engine/ecs/EntityManager.js';
import { Components } from './engine/ecs/Components.js';
import { InputManager, InputSystem } from './engine/ecs/systems/InputSystem.js';
import { MovementSystem } from './engine/ecs/systems/MovementSystem.js';
import { CollisionSystem } from './engine/ecs/systems/CollisionSystem.js';
import { RenderSystem } from './engine/ecs/systems/RenderSystem.js';
import { EnemyAISystem } from './engine/ecs/systems/EnemyAISystem.js';
import { WeaponSystem } from './engine/ecs/systems/WeaponSystem.js';
import { CombatSystem } from './engine/ecs/systems/CombatSystem.js';
import { HUDSystem } from './engine/ecs/systems/HUDSystem.js';
import { ParticleSystem } from './engine/ecs/systems/ParticleSystem.js';
import { QuadTree } from './engine/math/QuadTree.js';
import { GameFeel } from './engine/math/GameFeel.js';
import { AudioSystem } from './engine/audio/AudioSystem.js';
import { GameState, STATES } from './game/GameState.js';
import { CircleManager } from './game/CircleManager.js';
import { CIRCLE_CONFIGS } from './game/config/constants.js';
import { EntityPool } from './engine/ecs/EntityPool.js';

// ============================================
// 1. CANVAS SETUP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============================================
// 2. ECS ENGINE INITIALIZATION
// ============================================

const em = new EntityManager();
const quadTree = new QuadTree(0, 0, GAME_WIDTH, GAME_HEIGHT);
const gameFeel = new GameFeel(GAME_WIDTH, GAME_HEIGHT);
const audioSystem = new AudioSystem();
const gameState = new GameState();

// ============================================
// 2B. ENTITY PREFABS
// ============================================

const orbPrefab = (entity, em) => {
    em.addComponent(entity, 'Position', { x: 0, y: 0 });
    em.addComponent(entity, 'Renderable', { color: '#ffff99', radius: 8 });
    em.addComponent(entity, 'Collider', { radius: 14, layer: 'orb' });
    em.addComponent(entity, 'Orb', {});
};

const enemyPrefab = (entity, em) => {
    em.addComponent(entity, 'Position', { x: 0, y: 0 });
    em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
    em.addComponent(entity, 'Renderable', { color: '#ff3333', radius: 15 });
    em.addComponent(entity, 'Collider', { radius: 18, layer: 'enemy' });
    em.addComponent(entity, 'Health', { current: 50, max: 50 });
    em.addComponent(entity, 'Enemy', { type: 'default', damage: 12 });
};

const bulletPrefab = (entity, em) => {
    em.addComponent(entity, 'Position', { x: 0, y: 0 });
    em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
    em.addComponent(entity, 'Renderable', { color: '#ffffff', radius: 4 });
    em.addComponent(entity, 'Damage', { amount: 25 });
};

// ============================================
// 2C. MEMORY POOLS
// ============================================

const enemyPool = new EntityPool(em, enemyPrefab, 100);
const orbPool = new EntityPool(em, orbPrefab, 200);
const bulletPool = new EntityPool(em, bulletPrefab, 200);
const particleSystem = new ParticleSystem(ctx, 2000);

// ============================================
// 3. ECS SYSTEMS INITIALIZATION
// ============================================

const inputManager = new InputManager();
const inputSystem = new InputSystem(em, inputManager);
const movementSystem = new MovementSystem(em, GAME_WIDTH, GAME_HEIGHT);
const collisionSystem = new CollisionSystem(em, GAME_WIDTH, GAME_HEIGHT, bulletPool, enemyPool, orbPool, gameState);
const renderSystem = new RenderSystem(em, ctx);
const enemyAISystem = new EnemyAISystem(em);
const weaponSystem = new WeaponSystem(em, bulletPool);
const combatSystem = new CombatSystem(em, quadTree, enemyPool, bulletPool, particleSystem);
const hudSystem = new HUDSystem(em, ctx, GAME_WIDTH, GAME_HEIGHT, gameState);
const circleManager = new CircleManager(em, enemyPool, orbPool, particleSystem);

// ============================================
// 4. AUDIO ASSETS
// ============================================

async function loadAudioAssets() {
    const audioAssets = {
        'shoot': '/audio/laser.wav',
        'hit': '/audio/impact.wav',
        'orb': '/audio/chime.wav',
        'enemy_death': '/audio/explosion.wav',
        'player_hit': '/audio/player_hit.wav',
        'bgm_limbo': '/audio/ambient_dark.mp3',
        'bgm_lust': '/audio/ambient_pink.mp3',
        'bgm_gluttony': '/audio/ambient_brown.mp3',
        'bgm_greed': '/audio/ambient_gold.mp3',
        'bgm_wrath': '/audio/ambient_red.mp3',
        'bgm_heresy': '/audio/ambient_orange.mp3',
        'bgm_violence': '/audio/ambient_blood.mp3',
        'bgm_fraud': '/audio/ambient_purple.mp3',
        'bgm_treachery': '/audio/ambient_ice.mp3'
    };
    await audioSystem.loadSounds(audioAssets);
}

// ============================================
// 5. GAME STATE HANDLERS
// ============================================

function handleStateChange(state, circle) {
    switch (state) {
        case STATES.PLAYING:
            const circleKey = `bgm_${Object.keys(CIRCLE_CONFIGS)[circle - 1]?.toLowerCase() || 'limbo'}`;
            audioSystem.playBGM(circleKey, 2.0, 0.4);
            break;
        case STATES.GAME_OVER:
            audioSystem.playSFX('player_hit');
            audioSystem.stopBGM(2.0);
            break;
        case STATES.VICTORY:
            audioSystem.stopBGM(3.0);
            break;
    }
}

// ============================================
// 6. GAME FLOW FUNCTIONS
// ============================================

let playerEntity = null;
let gameLoopRunning = false;

function setupPlayer() {
    // Remove old player if exists
    if (playerEntity !== null) {
        try { em.removeEntity(playerEntity); } catch (e) { }
        playerEntity = null;
    }

    playerEntity = em.createEntity();
    em.addComponent(playerEntity, 'Position', { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    em.addComponent(playerEntity, 'Velocity', { vx: 0, vy: 0 });
    em.addComponent(playerEntity, 'Renderable', { color: '#00ffcc', radius: 15 });
    em.addComponent(playerEntity, 'Collider', { radius: 15, layer: 'player' });
    em.addComponent(playerEntity, 'PlayerControlled', { baseSpeed: 320 });
    em.addComponent(playerEntity, 'Health', { current: 100, max: 100 });
    em.addComponent(playerEntity, 'Weapon', {
        fireRate: 0.12,
        timeSinceLastShot: 0,
        bulletSpeed: 900,
        damage: 30,
        bulletLife: 80,
        minFireDistance: 10
    });
    em.addComponent(playerEntity, 'Collector', { count: 0 });

    console.log('[Game] Player created. Entity ID:', playerEntity);
    return playerEntity;
}

function startGame() {
    // Release all entities back to pools
    bulletPool.releaseAll();
    enemyPool.releaseAll();
    orbPool.releaseAll();
    particleSystem.clear();

    setupPlayer();
    em.addComponent(playerEntity, 'Invulnerable', { timer: 5.0 }); // Shield in Limbo (Circle 1)
    circleManager.loadCircle(1);

    // Transition from MENU to PLAYING
    const success = gameState.changeState(STATES.PLAYING);
    if (!success) {
        // Force if FSM blocked (e.g. restart)
        gameState.forceState(STATES.PLAYING);
    }

    if (!gameLoopRunning) {
        gameLoopRunning = true;
        requestAnimationFrame(gameLoop);
    }

    console.log('[Game] Game started. Circle 1: LIMBO');
}

function restartGame() {
    // Clear the circle (releases active enemies/orbs back to pools)
    circleManager.clearCurrentCircle();

    // Release any remaining active pool entities
    bulletPool.releaseAll();
    enemyPool.releaseAll();
    orbPool.releaseAll();
    particleSystem.clear();

    // Remove only the player entity (not pool-managed)
    if (playerEntity !== null) {
        try { em.removeEntity(playerEntity); } catch (e) { }
        playerEntity = null;
    }

    // Force back to MENU, then immediately restart
    gameState.forceState(STATES.MENU);
    startGame();
}

function checkGameConditions() {
    if (gameState.current !== STATES.PLAYING) return;

    // Victory check
    if (circleManager.isCircleCompleted()) {
        const nextCircle = gameState.circle + 1;
        if (nextCircle <= 9) {
            // Award circle completion bonus
            const bonusPoints = 500 * gameState.circle;
            gameState.addScore(bonusPoints);

            // Reset collector count for the new circle
            if (playerEntity !== null) {
                const collector = em.getComponent(playerEntity, 'Collector');
                if (collector) collector.count = 0;
            }

            gameState.advanceCircle();
            circleManager.loadCircle(nextCircle);
            if (playerEntity !== null) {
                em.addComponent(playerEntity, 'Invulnerable', { timer: 5.0 }); // Shield on new circle
            }
            hudSystem.addNotification?.(`âš”ï¸ CÃ­rculo ${nextCircle}: ${CIRCLE_CONFIGS[nextCircle]?.name}`, '#ff8800', 3000);
            hudSystem.addNotification?.(`+${bonusPoints.toLocaleString()} BONUS!`, '#ffdd00', 2500);
        } else {
            // Award final boss bonus
            gameState.addScore(5000);
            gameState.changeState(STATES.VICTORY);
        }
    }

    // Death check
    if (playerEntity !== null) {
        const health = em.getComponent(playerEntity, 'Health');
        if (health && health.current <= 0) {
            gameState.changeState(STATES.GAME_OVER);
        }
    }
}

// ============================================
// 7. INPUT HANDLERS (Game-state-aware)
// ============================================

// Use document-level pointerdown so CSS transform scale
// doesn't break click coordinate mapping.
// IMPORTANT: Only fires for non-playing states so shooting doesn't restart the game
document.addEventListener('pointerdown', (e) => {
    const state = gameState.current;
    // Only handle state transitions - don't interfere with gameplay shooting
    if (state === STATES.MENU) {
        startGame();
    } else if (state === STATES.GAME_OVER) {
        restartGame();
    } else if (state === STATES.VICTORY) {
        restartGame();
    }
    // PLAYING / PAUSED: let InputManager handle mouse for aiming/shooting
});

// Keyboard input for game control
window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        if (gameState.current === STATES.PLAYING) {
            gameState.changeState(STATES.PAUSED);
        } else if (gameState.current === STATES.PAUSED) {
            gameState.changeState(STATES.PLAYING);
        }
    }
    if (e.code === 'Space') {
        if (gameState.current === STATES.MENU) {
            startGame();
        } else if (gameState.current === STATES.GAME_OVER || gameState.current === STATES.VICTORY) {
            restartGame();
        }
    }
});

// ============================================
// 8B. BACKGROUND THEMES (Animated per circle)
// ============================================

let bgTime = 0;

function drawCircleBackground(circleNumber, dt) {
    bgTime += dt;
    const t = bgTime;
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const cx = W / 2, cy = H / 2;

    switch (circleNumber) {

        // â”€â”€ 1. LIMBO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 1: {
            // Deep charcoal base
            ctx.fillStyle = '#10101a';
            ctx.fillRect(0, 0, W, H);

            // Large translucent fog blobs drifting across screen
            for (let i = 0; i < 18; i++) {
                const px = (Math.sin(t * 0.12 + i * 1.7) * 0.5 + 0.5) * W;
                const py = (Math.cos(t * 0.08 + i * 2.1) * 0.5 + 0.5) * H;
                const r = 100 + Math.sin(t * 0.4 + i) * 50;
                const a = 0.08 + Math.sin(t * 0.25 + i * 0.9) * 0.04;
                const g = ctx.createRadialGradient(px, py, 0, px, py, r);
                g.addColorStop(0, `rgba(170,170,200,${a})`);
                g.addColorStop(0.5, `rgba(100,100,130,${a * 0.5})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            }

            // Slowly spinning grey rings
            for (let i = 0; i < 5; i++) {
                const r = 120 + i * 80;
                const a = 0.06 - i * 0.008;
                ctx.strokeStyle = `rgba(160,160,180,${a})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, r + Math.sin(t * 0.2 + i) * 10, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Ghostly vertical shafts of light
            for (let i = 0; i < 6; i++) {
                const sx = (i / 5) * W + Math.sin(t * 0.1 + i * 1.2) * 30;
                const sha = 0.04 + Math.sin(t * 0.6 + i) * 0.02;
                const sg = ctx.createLinearGradient(sx, 0, sx, H);
                sg.addColorStop(0, 'transparent');
                sg.addColorStop(0.4, `rgba(200,200,220,${sha})`);
                sg.addColorStop(1, 'transparent');
                ctx.fillStyle = sg;
                ctx.fillRect(sx - 15, 0, 30, H);
            }
            break;
        }

        // â”€â”€ 2. LUST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 2: {
            ctx.fillStyle = '#120010';
            ctx.fillRect(0, 0, W, H);

            // Warm pink radial from center
            const lustGrd = ctx.createRadialGradient(cx, cy, 50, cx, cy, 500);
            lustGrd.addColorStop(0, 'rgba(180,0,80,0.18)');
            lustGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = lustGrd;
            ctx.fillRect(0, 0, W, H);

            // Dense swirling wind ribbons
            for (let i = 0; i < 30; i++) {
                const x1 = -120 + ((t * 70 + i * 40) % (W + 240));
                const y1 = (Math.sin(t * 0.35 + i * 0.9) * 120 + i * 24) % H;
                const amp = 30 + Math.sin(i * 0.7) * 20;
                const a = 0.10 + Math.sin(t * 1.2 + i * 0.6) * 0.05;
                const hue = 320 + Math.sin(t + i) * 20;
                ctx.strokeStyle = `hsla(${hue},100%,65%,${a})`;
                ctx.lineWidth = 2 + Math.sin(t * 0.8 + i) * 1.2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(
                    x1 + 80, y1 - amp,
                    x1 + 160, y1 + amp,
                    x1 + 240, y1 + Math.sin(t + i) * 10
                );
                ctx.stroke();
            }

            // Pink heart pulses at center
            const hPulse = 0.5 + Math.sin(t * 3) * 0.3;
            ctx.fillStyle = `rgba(255,80,140,${hPulse * 0.08})`;
            ctx.beginPath();
            ctx.arc(cx, cy, 80 + Math.sin(t * 3) * 10, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        // â”€â”€ 3. GLUTTONY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 3: {
            ctx.fillStyle = '#0e0a04';
            ctx.fillRect(0, 0, W, H);

            // Thick mud floor gradient
            const mudGrd = ctx.createLinearGradient(0, H * 0.65, 0, H);
            mudGrd.addColorStop(0, 'rgba(60,35,10,0)');
            mudGrd.addColorStop(1, 'rgba(60,35,10,0.25)');
            ctx.fillStyle = mudGrd;
            ctx.fillRect(0, H * 0.65, W, H * 0.35);

            // Mud bubble blobs
            for (let i = 0; i < 14; i++) {
                const bx = (i * 83 + Math.sin(t * 0.1 + i) * 20) % W;
                const by = H * 0.75 + Math.sin(t * 0.6 + i * 1.3) * 20;
                const br = 12 + Math.sin(t * 1.5 + i) * 6;
                const ba = 0.15 + Math.sin(t * 2 + i) * 0.07;
                ctx.fillStyle = `rgba(100,60,20,${ba})`;
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();
            }

            // Heavy rain streaks
            for (let i = 0; i < 50; i++) {
                const rx = (i * 21 + ((t * 60) % W)) % W;
                const ryS = ((t * 200 + i * 17) % (H + 30)) - 30;
                const rlen = 14 + (i % 3) * 8;
                const ra = 0.12 + Math.sin(i * 0.7) * 0.05;
                ctx.strokeStyle = `rgba(110,70,25,${ra})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(rx, ryS);
                ctx.lineTo(rx - 3, ryS + rlen);
                ctx.stroke();
            }
            break;
        }

        // â”€â”€ 4. GREED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 4: {
            ctx.fillStyle = '#0a0800';
            ctx.fillRect(0, 0, W, H);

            // Deep gold radial vignette
            const greedGrd = ctx.createRadialGradient(cx, cy, 80, cx, cy, 550);
            greedGrd.addColorStop(0, 'rgba(180,130,0,0.12)');
            greedGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = greedGrd;
            ctx.fillRect(0, 0, W, H);

            // Shimmering gold particle field (coins)
            for (let i = 0; i < 70; i++) {
                const sx = ((i * 137.5) % W);
                const sy = ((i * 91.3 + t * 8) % H);
                const pa = 0.2 + Math.sin(t * 4 + i * 0.9) * 0.2;
                const ps = 1.5 + Math.sin(t * 2.5 + i) * 1;
                const hue = 43 + Math.sin(t + i * 0.5) * 10;
                const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, ps * 5);
                grd.addColorStop(0, `hsla(${hue},100%,65%,${pa})`);
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.ellipse(sx, sy, ps * 5, ps * 2, t * 0.5 + i, 0, Math.PI * 2);
                ctx.fill();
            }

            // Pulsing golden rings from center
            for (let i = 0; i < 4; i++) {
                const rr = ((t * 80 + i * 120) % 500);
                const ra = (1 - rr / 500) * 0.15;
                ctx.strokeStyle = `rgba(255,215,0,${ra})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, rr, 0, Math.PI * 2);
                ctx.stroke();
            }
            break;
        }

        // â”€â”€ 5. WRATH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 5: {
            ctx.fillStyle = '#0d0000';
            ctx.fillRect(0, 0, W, H);

            // Hellish sky gradient (embers rising)
            const wrathSky = ctx.createLinearGradient(0, 0, 0, H);
            wrathSky.addColorStop(0, 'rgba(80,0,0,0.3)');
            wrathSky.addColorStop(0.6, 'transparent');
            ctx.fillStyle = wrathSky;
            ctx.fillRect(0, 0, W, H);

            // Wide fire columns â€” tall and dramatic
            for (let i = 0; i < 22; i++) {
                const fx = (i / 21) * W;
                const fh = 100 + Math.sin(t * 3.5 + i * 1.4) * 70 + Math.sin(t * 7.2 + i * 2.1) * 35;
                const fa = 0.5 + Math.sin(t * 2 + i) * 0.15;
                const fg = ctx.createLinearGradient(fx, H, fx, H - fh);
                fg.addColorStop(0, `rgba(255,40,0,${fa})`);
                fg.addColorStop(0.35, `rgba(255,120,0,${fa * 0.6})`);
                fg.addColorStop(0.7, `rgba(255,200,30,${fa * 0.2})`);
                fg.addColorStop(1, 'transparent');
                ctx.fillStyle = fg;
                ctx.fillRect(fx - 22, H - fh, 44, fh);
            }

            // Floating embers
            for (let i = 0; i < 40; i++) {
                const ex = (i * 37 + Math.sin(t * 0.4 + i) * 40) % W;
                const ey = H - ((t * 50 + i * 23) % (H + 30));
                const ea = 0.4 + Math.sin(t * 3 + i) * 0.2;
                const er = 1.5 + Math.sin(t * 5 + i) * 1;
                ctx.fillStyle = `rgba(255,${100 + (i % 6) * 20},0,${ea})`;
                ctx.beginPath();
                ctx.arc(ex, ey, er, 0, Math.PI * 2);
                ctx.fill();
            }

            // Red ground glow
            const wrathGlow = ctx.createLinearGradient(0, H - 60, 0, H);
            wrathGlow.addColorStop(0, 'transparent');
            wrathGlow.addColorStop(1, 'rgba(200,0,0,0.35)');
            ctx.fillStyle = wrathGlow;
            ctx.fillRect(0, H - 60, W, 60);
            break;
        }

        // â”€â”€ 6. HERESY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 6: {
            ctx.fillStyle = '#080300';
            ctx.fillRect(0, 0, W, H);

            // Flaming tomb columns across screen
            for (let i = 0; i < 10; i++) {
                const tx = (i / 9) * (W - 40) + 20;
                const th = 180 + Math.sin(t * 1.8 + i * 0.9) * 50;
                const ta = 0.35 + Math.sin(t * 1.2 + i * 0.6) * 0.1;

                // Stone tomb body
                ctx.fillStyle = `rgba(50,25,5,${ta})`;
                ctx.fillRect(tx - 18, H - th, 36, th);
                // Stone cross top
                ctx.fillRect(tx - 6, H - th - 28, 12, 28);
                ctx.fillRect(tx - 20, H - th - 18, 40, 10);

                // Flame plume above tomb
                const flameH = 60 + Math.sin(t * 4 + i) * 30;
                const fGrd = ctx.createLinearGradient(tx, H - th - flameH, tx, H - th);
                fGrd.addColorStop(0, 'transparent');
                fGrd.addColorStop(0.3, `rgba(255,180,0,${ta * 0.6})`);
                fGrd.addColorStop(1, `rgba(255,80,0,${ta * 1.2})`);
                ctx.fillStyle = fGrd;
                ctx.fillRect(tx - 14, H - th - flameH, 28, flameH);
            }

            // Orange sky wash
            const heresySky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
            heresySky.addColorStop(0, 'rgba(60,20,0,0.25)');
            heresySky.addColorStop(1, 'transparent');
            ctx.fillStyle = heresySky;
            ctx.fillRect(0, 0, W, H * 0.5);
            break;
        }

        // â”€â”€ 7. VIOLENCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 7: {
            ctx.fillStyle = '#080000';
            ctx.fillRect(0, 0, W, H);

            // Deep crimson radial center
            const violGrd = ctx.createRadialGradient(cx, H * 0.4, 30, cx, H * 0.4, 400);
            violGrd.addColorStop(0, 'rgba(120,0,0,0.18)');
            violGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = violGrd;
            ctx.fillRect(0, 0, W, H);

            // Stacked blood river waves â€” full bottom half
            for (let w = 0; w < 8; w++) {
                const yBase = H * 0.45 + w * 40 + Math.sin(t * 0.7 + w * 0.4) * 18;
                const wa = 0.06 + w * 0.03;
                const dr = Math.floor(80 + w * 15);
                ctx.fillStyle = `rgba(${dr},0,0,${wa})`;
                ctx.beginPath();
                ctx.moveTo(0, yBase);
                for (let x = 0; x <= W; x += 15) {
                    const waveY = yBase + Math.sin((x / W) * Math.PI * 5 + t * 2 + w * 0.6) * 18;
                    ctx.lineTo(x, waveY);
                }
                ctx.lineTo(W, H);
                ctx.lineTo(0, H);
                ctx.closePath();
                ctx.fill();
            }

            // Dripping blood from top
            for (let i = 0; i < 10; i++) {
                const dx = (i * 113 + 40) % W;
                const dlen = 30 + Math.sin(t * 1.5 + i * 1.2) * 20;
                const da = 0.25 + Math.sin(t * 2 + i) * 0.1;
                const dGrd = ctx.createLinearGradient(dx, 0, dx, dlen);
                dGrd.addColorStop(0, `rgba(180,0,0,${da})`);
                dGrd.addColorStop(1, `rgba(180,0,0,0)`);
                ctx.fillStyle = dGrd;
                ctx.fillRect(dx - 2, 0, 4, dlen);
            }
            break;
        }

        // â”€â”€ 8. FRAUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 8: {
            ctx.fillStyle = '#030008';
            ctx.fillRect(0, 0, W, H);

            // Spiraling concentric void rings
            for (let i = 1; i <= 12; i++) {
                const baseR = 50 + i * 40;
                const phase = t * (i % 2 === 0 ? 0.25 : -0.2) + i * 0.5;
                const r = baseR + Math.sin(t * 0.6 + i) * 20;
                const a = Math.max(0, 0.15 - i * 0.01);
                const hue = 270 + Math.sin(t * 0.4 + i * 0.3) * 30;
                ctx.strokeStyle = `hsla(${hue},100%,55%,${a})`;
                ctx.lineWidth = 2.5 - i * 0.15;
                ctx.beginPath();
                ctx.arc(cx, cy, r, phase, phase + Math.PI * 2);
                ctx.stroke();
            }

            // Central glowing void
            const fraudCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
            fraudCore.addColorStop(0, `rgba(100,0,200,${0.1 + Math.sin(t * 2) * 0.05})`);
            fraudCore.addColorStop(1, 'transparent');
            ctx.fillStyle = fraudCore;
            ctx.fillRect(0, 0, W, H);

            // Purple particle sparks spiraling outward
            for (let i = 0; i < 30; i++) {
                const angle = t * 1.5 + (i / 30) * Math.PI * 2;
                const radius = 60 + (t * 40 + i * 30) % 400;
                const px = cx + Math.cos(angle) * radius;
                const py = cy + Math.sin(angle) * radius;
                const pa = Math.max(0, 0.4 - radius / 400);
                ctx.fillStyle = `rgba(180,50,255,${pa})`;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        }

        // â”€â”€ 9. TREACHERY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        case 9: {
            ctx.fillStyle = '#010810';
            ctx.fillRect(0, 0, W, H);

            // Icy floor â€” covers bottom 45%
            const iceY = H * 0.55;
            const iceFloor = ctx.createLinearGradient(0, iceY, 0, H);
            iceFloor.addColorStop(0, 'rgba(0,150,200,0.08)');
            iceFloor.addColorStop(0.5, 'rgba(0,200,240,0.14)');
            iceFloor.addColorStop(1, 'rgba(0,230,255,0.22)');
            ctx.fillStyle = iceFloor;
            ctx.fillRect(0, iceY, W, H - iceY);

            // Ice surface reflection shimmer
            for (let i = 0; i < 20; i++) {
                const rx = (i * 67 + t * 8) % W;
                const ry = iceY + (i * 37) % (H - iceY);
                const ra = 0.05 + Math.sin(t * 2.5 + i) * 0.04;
                const rw = 20 + Math.sin(i) * 12;
                ctx.fillStyle = `rgba(200,240,255,${ra})`;
                ctx.beginPath();
                ctx.ellipse(rx, ry, rw, 3, 0.3 + i * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ice crack network (branching)
            for (let i = 0; i < 18; i++) {
                const crx = (i * 67 + 30) % W;
                const cry = iceY + ((i * 47 + 10) % (H - iceY));
                const crA = 0.10 + Math.sin(t * 0.4 + i * 0.7) * 0.04;
                ctx.strokeStyle = `rgba(180,240,255,${crA})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(crx, cry);
                // Main crack
                const ang1 = i * 0.7;
                ctx.lineTo(crx + Math.cos(ang1) * 40, cry + Math.sin(ang1) * 30);
                ctx.moveTo(crx, cry);
                // Branch
                const ang2 = ang1 + Math.PI * 0.4;
                ctx.lineTo(crx + Math.cos(ang2) * 25, cry + Math.sin(ang2) * 20);
                ctx.stroke();
            }

            // Cold blue mist drifting at ice level
            for (let i = 0; i < 8; i++) {
                const mx = (Math.sin(t * 0.08 + i * 1.3) * 0.5 + 0.5) * W;
                const my = iceY + (i * 40) % (H * 0.35);
                const mr = 80 + Math.sin(t * 0.3 + i) * 30;
                const ma = 0.06 + Math.sin(t * 0.5 + i * 0.8) * 0.03;
                const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
                mg.addColorStop(0, `rgba(0,200,240,${ma})`);
                mg.addColorStop(1, 'transparent');
                ctx.fillStyle = mg;
                ctx.fillRect(0, 0, W, H);
            }

            // Stars in the frozen sky above ice
            for (let i = 0; i < 60; i++) {
                const sx = (i * 137.5) % W;
                const sy = ((i * 79.3)) % iceY;
                const sa = 0.2 + Math.sin(t * 1.5 + i * 0.9) * 0.2;
                ctx.fillStyle = `rgba(200,230,255,${sa})`;
                ctx.fillRect(sx, sy, 1, 1);
            }
            break;
        }

        default:
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, W, H);
    }
}

// ============================================
// 8. GAME LOOP
// ============================================

// 8. GAME LOOP
// ============================================

let lastTime = performance.now();

function gameLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    const rawDt = (timestamp - lastTime) / 1000;
    // Clamp delta to 100ms max to avoid big jumps after tab switch
    const deltaTime = Math.min(rawDt, 0.1);
    lastTime = timestamp;

    // --- Clear frame / Background ---
    if (gameState.current === STATES.PLAYING) {
        drawCircleBackground(gameState.circle, deltaTime);
    } else {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // --- Game Logic ---
    if (gameState.current === STATES.PLAYING) {
        const dt = deltaTime;
        inputSystem.update(dt);
        enemyAISystem.update(dt);
        weaponSystem.update(dt);
        movementSystem.update(dt);
        collisionSystem.update();
        combatSystem.update(dt);

        // Bullet lifetime management â€” release expired bullets back to pool
        const activeBullets = em.getEntitiesWith('Bullet');
        for (const bid of activeBullets) {
            const b = em.getComponent(bid, 'Bullet');
            if (b) {
                b.life--;
                if (b.life <= 0 && bulletPool.activeEntities.has(bid)) {
                    bulletPool.release(bid);
                }
            }
        }

        checkGameConditions();
    }

    // --- Camera update ---
    const players = em.getEntitiesWith(['PlayerControlled', 'Position']);
    if (players.length > 0) {
        const playerPos = em.getComponent(players[0], 'Position');
        gameFeel.update(deltaTime, playerPos);
    }

    // --- Render World ---
    ctx.save();
    gameFeel.applyCamera(ctx);
    renderSystem.update();
    particleSystem.updateAndRender(deltaTime);
    ctx.restore();

    // --- Render HUD ---
    hudSystem.update();

    // --- Render virtual joystick (mobile) ---
    if (gameState.current === STATES.PLAYING) {
        inputManager.drawJoystick(ctx);

        // Draw aim indicator: line from player to crosshair, crosshair at mouse
        const mp = inputManager.getMousePosition();
        const players2 = em.getEntitiesWith(['PlayerControlled', 'Position']);

        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,200,0.85)';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.85;

        if (players2.length > 0) {
            const playerPos = em.getComponent(players2[0], 'Position');
            if (playerPos) {
                // Convert player world position â†’ screen position using camera offset
                const camPos = gameFeel.getCameraPosition();
                const screenPlayerX = playerPos.x - camPos.x + GAME_WIDTH / 2;
                const screenPlayerY = playerPos.y - camPos.y + GAME_HEIGHT / 2;

                // Aim line from player screen pos to crosshair
                const dx = mp.x - screenPlayerX;
                const dy = mp.y - screenPlayerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const playerRadius = 18;

                if (dist > playerRadius) {
                    // Start line just outside the player circle
                    const nx = dx / dist;
                    const ny = dy / dist;
                    ctx.setLineDash([4, 6]);
                    ctx.beginPath();
                    ctx.moveTo(screenPlayerX + nx * playerRadius, screenPlayerY + ny * playerRadius);
                    ctx.lineTo(mp.x - nx * 14, mp.y - ny * 14);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }

        // Crosshair at mouse position
        const cs = 10;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(mp.x - cs, mp.y); ctx.lineTo(mp.x + cs, mp.y);
        ctx.moveTo(mp.x, mp.y - cs); ctx.lineTo(mp.x, mp.y + cs);
        ctx.arc(mp.x, mp.y, cs * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// ============================================
// 9. INITIALIZATION
// ============================================

async function initGame() {
    console.log('[Game] Initializing...');

    // Subscribe to game state changes for audio
    gameState.subscribe((state, circle) => {
        handleStateChange(state, circle);
    });

    // Load audio (graceful fail)
    try {
        await loadAudioAssets();
    } catch (e) {
        console.warn('[Game] Audio load failed (non-fatal):', e.message);
    }

    // Start game loop even in MENU state so HUD renders the menu screen
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);

    console.log('[Game] Ready. State:', gameState.current, '| Click canvas to start!');
}

initGame();

// Debug hooks
window.gameDebug = {
    gameState,
    audioSystem,
    particleSystem,
    gameFeel,
    circleManager,
    bulletPool,
    enemyPool,
    startGame,
    restartGame,
    skipToCircle: (n) => {
        circleManager.loadCircle(n);
        gameState.forceState(STATES.PLAYING);
    },
    forceEmitParticles: () => particleSystem.forceEmit?.(100),
    addTrauma: (amount) => gameFeel.addTrauma(amount),
    unlockAudio: () => audioSystem.forceUnlock(),
    getMetrics: () => ({
        audio: audioSystem.getMetrics(),
        particles: particleSystem.getMetrics?.(),
        pools: { bullets: bulletPool.getStats?.(), enemies: enemyPool.getStats?.() }
    })
};
