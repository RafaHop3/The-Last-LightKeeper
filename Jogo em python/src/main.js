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
    em.addComponent(entity, 'Orb', {});
};

const enemyPrefab = (entity, em) => {
    em.addComponent(entity, 'Position', { x: 0, y: 0 });
    em.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });
    em.addComponent(entity, 'Renderable', { color: '#ff3333', radius: 15 });
    em.addComponent(entity, 'Health', { current: 50, max: 50 });
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

            gameState.advanceCircle();
            circleManager.loadCircle(nextCircle);
            hudSystem.addNotification?.(`⚔5️ Círculo ${nextCircle}: ${CIRCLE_CONFIGS[nextCircle]?.name}`, '#ff8800', 3000);
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
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    switch (circleNumber) {
        case 1: // LIMBO - Gray fog
            {
                ctx.fillStyle = '#1a1a22';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 12; i++) {
                    const px = (Math.sin(t * 0.15 + i * 1.7) * 0.5 + 0.5) * GAME_WIDTH;
                    const py = (Math.cos(t * 0.1 + i * 2.3) * 0.5 + 0.5) * GAME_HEIGHT;
                    const r = 80 + Math.sin(t * 0.5 + i) * 30;
                    const alpha = 0.04 + Math.sin(t * 0.3 + i) * 0.02;
                    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
                    grad.addColorStop(0, `rgba(140,140,160,${alpha})`);
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                }
                break;
            }
        case 2: // LUST - Pink swirling wind
            {
                ctx.fillStyle = '#1a0a1e';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 20; i++) {
                    const x1 = -100 + ((t * 60 + i * 55) % (GAME_WIDTH + 200));
                    const y1 = (Math.sin(t * 0.4 + i * 0.8) * 100 + i * 37) % GAME_HEIGHT;
                    const alpha = 0.06 + Math.sin(t + i) * 0.03;
                    ctx.strokeStyle = `rgba(255,100,180,${alpha})`;
                    ctx.lineWidth = 1.5 + Math.sin(t + i) * 1;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.bezierCurveTo(x1 + 100, y1 - 40, x1 + 150, y1 + 40, x1 + 220, y1);
                    ctx.stroke();
                }
                break;
            }
        case 3: // GLUTTONY - Brown mud/rain
            {
                ctx.fillStyle = '#1a1008';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 30; i++) {
                    const x = (i * 37 + t * 10) % GAME_WIDTH;
                    const yStart = ((t * 80 + i * 23) % (GAME_HEIGHT + 20)) - 20;
                    const alpha = 0.1 + Math.sin(i * 1.3) * 0.05;
                    ctx.strokeStyle = `rgba(100,60,20,${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, yStart);
                    ctx.lineTo(x - 2, yStart + 18);
                    ctx.stroke();
                }
                break;
            }
        case 4: // GREED - Gold shimmer
            {
                ctx.fillStyle = '#120e00';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 50; i++) {
                    const sx = ((i * 137.5) % GAME_WIDTH);
                    const sy = ((i * 91.3) % GAME_HEIGHT);
                    const pa = 0.3 + Math.sin(t * 3 + i * 0.7) * 0.3;
                    const ps = 1 + Math.sin(t * 2 + i) * 0.5;
                    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, ps * 4);
                    grad.addColorStop(0, `rgba(255,215,0,${pa})`);
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(sx, sy, ps * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
        case 5: // WRATH - Fire at base
            {
                ctx.fillStyle = '#140000';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 16; i++) {
                    const fx = (i / 16) * (GAME_WIDTH + 40) - 20;
                    const fh = 60 + Math.sin(t * 4 + i * 1.3) * 40 + Math.sin(t * 7 + i) * 20;
                    const alpha = 0.3 + Math.sin(t * 3 + i) * 0.1;
                    const grad = ctx.createLinearGradient(fx, GAME_HEIGHT, fx, GAME_HEIGHT - fh);
                    grad.addColorStop(0, `rgba(255,80,0,${alpha})`);
                    grad.addColorStop(0.5, `rgba(255,160,0,${alpha * 0.5})`);
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.fillRect(fx - 20, GAME_HEIGHT - fh, 40, fh);
                }
                break;
            }
        case 6: // HERESY - Flaming tomb columns
            {
                ctx.fillStyle = '#0a0500';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 0; i < 8; i++) {
                    const tx = 80 + i * 120;
                    const th = 150 + Math.sin(t * 2 + i) * 30;
                    const alpha = 0.2 + Math.sin(t * 1.5 + i * 0.7) * 0.1;
                    // Tomb stone
                    ctx.fillStyle = `rgba(40,20,10,${alpha * 2})`;
                    ctx.fillRect(tx - 15, GAME_HEIGHT - th, 30, th);
                    // Flame
                    const fGrad = ctx.createLinearGradient(tx, GAME_HEIGHT - th - 30, tx, GAME_HEIGHT - th);
                    fGrad.addColorStop(0, 'transparent');
                    fGrad.addColorStop(0.4, `rgba(255,120,0,${alpha})`);
                    fGrad.addColorStop(1, `rgba(255,60,0,${alpha * 1.5})`);
                    ctx.fillStyle = fGrad;
                    ctx.fillRect(tx - 10, GAME_HEIGHT - th - 30, 20, 30);
                }
                break;
            }
        case 7: // VIOLENCE - Blood river waves
            {
                ctx.fillStyle = '#0d0000';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let w = 0; w < 5; w++) {
                    const yBase = 400 + w * 60 + Math.sin(t * 0.5 + w) * 20;
                    const alpha = 0.1 + w * 0.04;
                    ctx.fillStyle = `rgba(120,0,0,${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(0, yBase);
                    for (let x = 0; x <= GAME_WIDTH; x += 20) {
                        const y = yBase + Math.sin((x / GAME_WIDTH) * Math.PI * 4 + t * 1.5 + w * 0.5) * 15;
                        ctx.lineTo(x, y);
                    }
                    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
                    ctx.lineTo(0, GAME_HEIGHT);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            }
        case 8: // FRAUD - Purple spiral void
            {
                ctx.fillStyle = '#060010';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                for (let i = 1; i <= 8; i++) {
                    const r = 60 + i * 45 + Math.sin(t * 0.4 + i * 0.6) * 15;
                    const alpha = 0.06 - i * 0.005;
                    if (alpha <= 0) break;
                    ctx.strokeStyle = `rgba(140,0,220,${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, t * (i % 2 === 0 ? 0.3 : -0.3), t * (i % 2 === 0 ? 0.3 : -0.3) + Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
        case 9: // TREACHERY - Ice cracks
            {
                ctx.fillStyle = '#020d1a';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                // Ice sheen
                const iceGrad = ctx.createLinearGradient(0, GAME_HEIGHT * 0.6, 0, GAME_HEIGHT);
                iceGrad.addColorStop(0, 'rgba(0,180,220,0.04)');
                iceGrad.addColorStop(1, 'rgba(0,220,255,0.10)');
                ctx.fillStyle = iceGrad;
                ctx.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
                // Frost cracks
                for (let i = 0; i < 12; i++) {
                    const cx2 = (i * 97 + 50) % GAME_WIDTH;
                    const cy2 = GAME_HEIGHT * 0.65 + ((i * 61) % (GAME_HEIGHT * 0.3));
                    const alpha = 0.08 + Math.sin(t * 0.5 + i) * 0.03;
                    ctx.strokeStyle = `rgba(160,240,255,${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(cx2, cy2);
                    ctx.lineTo(cx2 + 30 + Math.sin(i) * 20, cy2 + 20 + Math.cos(i * 1.4) * 15);
                    ctx.moveTo(cx2, cy2);
                    ctx.lineTo(cx2 - 20 + Math.cos(i * 0.7) * 15, cy2 + 15);
                    ctx.stroke();
                }
                break;
            }
        default:
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

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

        // Bullet lifetime management — release expired bullets back to pool
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
                // Convert player world position → screen position using camera offset
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
