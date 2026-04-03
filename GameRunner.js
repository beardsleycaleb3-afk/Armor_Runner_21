/**
 * Pixel Gridiron - Sultan 47 Integrated Engine
 * Mashing up high-level PWA logic with low-level Geometric Physics
 */

export class GameRunner {
  constructor(canvas, chapter, playerStats, onEnd) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // Force the SNES "Pixelated" Vibe
    
    // ... [Keep your existing constructor properties] ...
    this.chapter = chapter;
    this.stats = { ...playerStats };
    this.onEnd = onEnd;

    // SULTAN 47 ADDITION: Mirror Attribute (018810 logic)
    this.playerAttr = 0x00; 
  }

  // --- OVERRIDING YOUR UPDATE LOOP WITH DOUBLING MATH ---
  update(dt) {
    if (this.tackled || this.victory) return;

    this.elapsed += dt;
    
    // GEOMETRIC SPRINT: 1*1=2 Logic
    // Instead of a linear multiplier, we calculate displacement as a 
    // power of the input energy to simulate "breaking the limit"
    const isSprinting = this.keys['ArrowUp'] || this.keys['w'] || this.touchDirs['up'];
    const sprintBase = isSprinting && this.sprintEnergy > 0 ? 2.0 : 1.0; 
    
    // Mirror Code Update: Flip sprite attribute based on movement direction
    const moveLeft = this.keys['ArrowLeft'] || this.keys['a'] || this.touchDirs['left'];
    const moveRight = this.keys['ArrowRight'] || this.keys['d'] || this.touchDirs['right'];
    
    if (moveLeft) {
        this.playerTargetX -= (12 * sprintBase);
        this.playerAttr = 0x80; // Flip X (Mirror Logic 018810)
    } 
    if (moveRight) {
        this.playerTargetX += (12 * sprintBase);
        this.playerAttr = 0x00; // Normal orientation
    }

    // ... [Keep your collision and obstacle spawn logic] ...
    this.runHardwarePhysics(dt, sprintBase);
  }

  runHardwarePhysics(dt, sprintBase) {
    const scrollSpeed = (80 + this.chapter.difficulty * 40) * sprintBase;
    this.yards += scrollSpeed * dt * 0.05;
    // ... [Rest of your yard/victory checks] ...
  }

  // --- OVERRIDING DRAW WITH MIRROR ATTRIBUTES ---
  draw() {
    const ctx = this.ctx;
    const W = this.FIELD_W;
    const H = this.FIELD_H;

    this.drawField(ctx, W, H);

    // Draw Defenders using standard logic
    for (const ob of this.obstacles) {
      this.drawObstacle(ctx, ob);
    }

    // Draw Player using Geometric Mirror Code (018810)
    this.drawPlayerHardware(ctx);
    
    // ... [Keep your HUD and Progress Bar logic] ...
  }

  drawPlayerHardware(ctx) {
    const img = this.chapter.uniform === 'hs' ? PLAYER_IMG_HS : PLAYER_IMG_COL;
    const size = this.PLAYER_SIZE;

    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    // MIRROR CODE LOGIC: Apply flip if attr bit 7 is set (0x80)
    const flipX = (this.playerAttr & 0x80) ? -1 : 1;
    ctx.scale(flipX, 1);

    if (img.complete) {
        // Draw centered but flipped
        ctx.drawImage(img, -size/2, -size/2, size, size);
    } else {
        // Fallback
        ctx.fillStyle = this.chapter.teamColor;
        ctx.fillRect(-size/2, -size/2, size, size);
    }
    ctx.restore();
  }
}
