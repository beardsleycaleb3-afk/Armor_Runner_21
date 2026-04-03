/**
 * Armor Runner 21: Main Game Loop
 * Connects all .ts modules and drives the 60FPS cycle.
 */

import { world, Entity } from './modules/ecs.js';
import { bus } from './modules/eventbus.js';
import { initGameAssets, assets } from './modules/assets.js';
import { gameMap } from './modules/map.js';
import { movement } from './modules/movement.js';
import { combat } from './modules/combat.js';
import { UIFlash } from './modules/uiflash.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const ui = new UIFlash(canvas);

let lastTime = 0;
let playerEntity: Entity | null = null;

/**
 * Initialize the World
 */
async function init() {
    console.log("Initializing Armor Runner 21 TS Engine...");
    
    // 1. Load your GitHub Assets via the AssetLoader
    await initGameAssets();

    // 2. Create the Player Entity in the ECS
    playerEntity = world.createEntity();
    world.addComponent(playerEntity, 'position', { x: 150, y: 220 });
    world.addComponent(playerEntity, 'sprite', 'run_college'); 
    world.addComponent(playerEntity, 'type', 'PLAYER');

    // 3. Setup Controls for Mobile and Desktop
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') movement.moveLeft();
        if (e.key === 'ArrowRight') movement.moveRight();
    });

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
        const touchX = e.touches[0].clientX;
        if (touchX < window.innerWidth / 2) movement.moveLeft();
        else movement.moveRight();
    });

    requestAnimationFrame(gameLoop);
}

/**
 * The Core 60FPS Loop
 */
function gameLoop(timestamp: number) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (assets.isReady()) {
        update(dt);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

function update(dt: number) {
    const gameSpeed = 5; // Standard tile scroll speed

    if (playerEntity !== null) {
        gameMap.update(gameSpeed, dt);
        movement.update(playerEntity, dt);
        combat.update(playerEntity);
        ui.update(dt);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    const bg = assets.get('bg_1');
    if (bg) ctx.drawImage(bg, 0, 0, 300, 300);

    // 2. Apply UI Effects (Shake)
    const shake = ui.getShakeOffsets();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 3. Render ECS Entities
    const renderables = world.getEntitiesWith(['position', 'sprite']);
    renderables.forEach(entity => {
        const pos = world.getComponent<{x: number, y: number}>(entity, 'position');
        const spriteName = world.getComponent<string>(entity, 'sprite');
        const img = assets.get(spriteName!);
        
        if (img && pos) {
            ctx.drawImage(img, pos.x, pos.y, 40, 40);
        }
    });

    ctx.restore();

    // 4. Draw Floating UI
    ui.draw();
}

init();
