// Core game engine - canvas runner logic

const PLAYER_IMG_HS = new Image();
PLAYER_IMG_HS.src = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/c4cea5c9-1ffc-4a20-80ec-c166faf2155c/ea2905b4-5b62-49c8-aacd-1e69484c39a9/39d3ac55-3ee0-42c2-8b35-0fdc73a4f554.png';
const PLAYER_IMG_COL = new Image();
PLAYER_IMG_COL.src = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/c4cea5c9-1ffc-4a20-80ec-c166faf2155c/ea2905b4-5b62-49c8-aacd-1e69484c39a9/d9a0c686-c5f9-4870-892c-976d5013ef5f.png';
const DEFENDER_IMG = new Image();
DEFENDER_IMG.src = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/c4cea5c9-1ffc-4a20-80ec-c166faf2155c/ea2905b4-5b62-49c8-aacd-1e69484c39a9/f9eabea2-3cae-45fc-b7ff-3dab2fcd4076.png';
const CONE_IMG = new Image();
CONE_IMG.src = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/c4cea5c9-1ffc-4a20-80ec-c166faf2155c/ea2905b4-5b62-49c8-aacd-1e69484c39a9/ba952ef5-b44e-4c15-9fe3-4e2e03f93929.png';
const STAR_IMG = new Image();
STAR_IMG.src = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/c4cea5c9-1ffc-4a20-80ec-c166faf2155c/ea2905b4-5b62-49c8-aacd-1e69484c39a9/029b96aa-046e-41ba-9343-ce21468e0afc.png';

const DEFENDER_SPEEDS = {
  defender_slow: 1.2,
  defender_medium: 2.0,
  defender_fast: 3.0,
  defender_blitz: 4.5,
  cone: 0,
};

export class GameRunner {
  constructor(canvas, chapter, playerStats, onEnd) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.chapter = chapter;
    this.stats = { ...playerStats };
    this.onEnd = onEnd;

    this.running = false;
    this.raf = null;
    this.lastTime = 0;

    this.LANES = chapter.lanes || 4;
    this.FIELD_W = 0;
    this.FIELD_H = 0;
    this.LANE_W = 0;
    this.PLAYER_SIZE = 48;
    this.OBJ_SIZE = 44;
    this.STAR_SIZE = 28;

    // Player state
    this.playerLane = Math.floor(this.LANES / 2);
    this.playerY = 0;
    this.playerX = 0;
    this.playerTargetX = 0;
    this.sprintEnergy = 1.0;
    this.health = Math.min(3 + (this.stats.maxHealth || 0), 5);
    this.maxHealth = this.health;
    this.invincible = 0;
    this.breakTacklesLeft = this.stats.breakTackle || 0;
    this.stiffArmCooldown = 0;

    // Game state
    this.yards = 0;
    this.elapsed = 0;
    this.timeLimit = chapter.timeLimit;
    this.obstacles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.score = 0;
    this.starsEarned = 0;
    this.tackled = false;
    this.victory = false;
    this.spawnTimer = 0;
    this.starSpawnTimer = 0;
    this.scrollY = 0;
    this.fieldScrollSpeed = 120; // px/sec base

    // Input
    this.keys = {};
    this.touchDirs = {};

    // Resize
    this.resize();
    this.initInput();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.FIELD_W = w;
    this.FIELD_H = h;
    this.LANE_W = w / this.LANES;
    this.playerY = h * 0.75;
    this.playerX = this.LANE_W * this.playerLane + this.LANE_W / 2;
    this.playerTargetX = this.playerX;
  }

  initInput() {
    this._keydown = (e) => {
      this.keys[e.key] = true;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s',' '].includes(e.key)) e.preventDefault();
    };
    this._keyup = (e) => { this.keys[e.key] = false; };
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);

    // Touch buttons
    document.querySelectorAll('.touch-btn').forEach(btn => {
      const dir = btn.dataset.dir;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.touchDirs[dir] = true; });
      btn.addEventListener('pointerup', (e) => { e.preventDefault(); this.touchDirs[dir] = false; });
      btn.addEventListener('pointercancel', () => { this.touchDirs[dir] = false; });
    });

    // Canvas swipe
    let touchStartX = 0;
    this.canvas.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    this.canvas.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 30) this.moveLane(dx > 0 ? 1 : -1);
    }, { passive: true });

    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
  }

  destroy() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('resize', this._resize);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.tackled || this.victory) return;

    this.elapsed += dt;
    const timeLeft = this.timeLimit - this.elapsed;

    // Sprint energy
    const isSprinting = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.touchDirs['up'];
    const sprintMult = isSprinting && this.sprintEnergy > 0 ? 1.8 : 1.0;
    if (isSprinting && this.sprintEnergy > 0) {
      this.sprintEnergy = Math.max(0, this.sprintEnergy - dt * 0.5);
    } else {
      const regenRate = 0.3 * (1 + (this.stats.sprintRegen || 0));
      this.sprintEnergy = Math.min(1, this.sprintEnergy + dt * regenRate);
    }

    // Lateral movement
    const moveLeft = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchDirs['left'];
    const moveRight = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchDirs['right'];
    const lateralMult = 1 + (this.stats.lateralSpeed || 0);
    const laneSnap = 12 * lateralMult * sprintMult;

    if (moveLeft) this.playerTargetX -= laneSnap;
    if (moveRight) this.playerTargetX += laneSnap;

    // Clamp to lanes
    const minX = this.LANE_W * 0.5;
    const maxX = this.FIELD_W - this.LANE_W * 0.5;
    this.playerTargetX = Math.max(minX, Math.min(maxX, this.playerTargetX));

    // Smooth follow
    this.playerX += (this.playerTargetX - this.playerX) * 0.2;

    // Field scroll / yards
    const baseSpeed = 80 + this.chapter.difficulty * 40;
    const scrollSpeed = baseSpeed * sprintMult;
    this.scrollY = (this.scrollY + scrollSpeed * dt) % 80;
    this.yards += scrollSpeed * dt * 0.05;

    // Victory check
    if (this.yards >= this.chapter.targetYards) {
      this.victory = true;
      this.starsEarned = this.calcStars();
      setTimeout(() => this.finish(), 600);
      return;
    }

    // Time out
    if (timeLeft <= 0) {
      this.victory = this.yards >= this.chapter.targetYards * 0.5;
      this.starsEarned = this.victory ? 1 : 0;
      setTimeout(() => this.finish(), 300);
      return;
    }

    // Spawn obstacles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      const spawnRate = Math.max(0.4, 1.5 - this.elapsed * 0.03);
      this.spawnTimer = spawnRate;
    }

    // Spawn stars
    this.starSpawnTimer -= dt;
    if (this.starSpawnTimer <= 0) {
      this.spawnStar();
      this.starSpawnTimer = 2.5 + Math.random() * 2;
    }

    // Move obstacles
    const defSlow = 1 - (this.stats.defenderSlow || 0);
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      if (ob.type === 'cone') {
        ob.y += scrollSpeed * dt * 0.8;
        // Cones drift toward player slightly
        const dx = this.playerX - ob.x;
        ob.x += Math.sign(dx) * 0.5;
      } else {
        ob.y += scrollSpeed * dt * 0.5;
        // Defenders move toward player
        const dxToPlayer = this.playerX - ob.x;
        ob.x += Math.sign(dxToPlayer) * ob.speed * defSlow * dt * 60;
        ob.x = Math.max(20, Math.min(this.FIELD_W - 20, ob.x));
        ob.wobble = (ob.wobble || 0) + dt * 3;
      }

      // Off screen
      if (ob.y > this.FIELD_H + 60) {
        this.obstacles.splice(i, 1);
        continue;
      }

      // Collision
      if (this.invincible > 0) continue;
      const hitShrink = 1 - (this.stats.hitboxShrink || 0);
      const hitSize = this.OBJ_SIZE * 0.5 * hitShrink;
      const px = this.playerX, py = this.playerY;
      if (Math.abs(ob.x - px) < hitSize + 16 && Math.abs(ob.y - py) < hitSize + 16) {
        this.handleHit(ob, i);
      }
    }

    // Move pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.y += scrollSpeed * dt * 0.6;
      pk.bob = (pk.bob || 0) + dt * 4;
      if (pk.y > this.FIELD_H + 30) {
        this.pickups.splice(i, 1);
        continue;
      }
      if (Math.abs(pk.x - this.playerX) < 30 && Math.abs(pk.y - this.playerY) < 30) {
        this.score += pk.value;
        this.starsEarned += pk.value;
        this.addFloat(pk.x, pk.y, `⭐+${pk.value}`, '#f59e0b');
        this.pickups.splice(i, 1);
      }
    }

    // Stiff arm cooldown
    this.stiffArmCooldown = Math.max(0, this.stiffArmCooldown - dt);
    // Stiff arm input
    if ((this.keys[' '] || this.keys['Enter']) && this.stiffArmCooldown <= 0 && (this.stats.stiffArm || 0) > 0) {
      this.doStiffArm();
    }

    // Invincibility frames
    this.invincible = Math.max(0, this.invincible - dt);

    // Update HUD
    this.updateHUD(timeLeft);

    // Float texts update
    // (handled by CSS animation, just keep list clean)
  }

  handleHit(ob, idx) {
    if (ob.type === 'cone') {
      // Cones just slow you
      this.sprintEnergy = Math.max(0, this.sprintEnergy - 0.3);
      this.addFloat(this.playerX, this.playerY - 30, 'TRIPPED!', '#f97316');
      this.invincible = 0.5;
      this.obstacles.splice(idx, 1);
    } else {
      if (this.breakTacklesLeft > 0) {
        this.breakTacklesLeft--;
        this.addFloat(this.playerX, this.playerY - 30, '💪 BROKE FREE!', '#22c55e');
        this.invincible = 1.0;
        this.obstacles.splice(idx, 1);
        return;
      }
      this.health--;
      this.invincible = 1.5;
      this.addFloat(this.playerX, this.playerY - 30, `TACKLED! ❤️${this.health}`, '#ef4444');
      if (this.health <= 0) {
        this.tackled = true;
        this.starsEarned = Math.max(0, this.calcStars() - 1);
        setTimeout(() => this.finish(), 600);
      }
    }
  }

  doStiffArm() {
    this.stiffArmCooldown = 3;
    let stunned = 0;
    for (const ob of this.obstacles) {
      const dist = Math.hypot(ob.x - this.playerX, ob.y - this.playerY);
      if (dist < 100 && ob.type !== 'cone') {
        ob.y -= 120;
        ob.x += (Math.random() - 0.5) * 80;
        stunned++;
      }
    }
    if (stunned > 0) this.addFloat(this.playerX, this.playerY - 40, `🦾 STIFF ARM ×${stunned}`, '#f97316');
  }

  moveLane(dir) {
    const newLane = Math.max(0, Math.min(this.LANES - 1, this.playerLane + dir));
    if (newLane !== this.playerLane) {
      this.playerLane = newLane;
      this.playerTargetX = this.LANE_W * newLane + this.LANE_W / 2;
    }
  }

  spawnObstacle() {
    const typePool = this.chapter.obstacleTypes;
    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const laneIdx = Math.floor(Math.random() * this.LANES);
    const x = this.LANE_W * laneIdx + this.LANE_W / 2 + (Math.random() - 0.5) * this.LANE_W * 0.4;
    this.obstacles.push({
      type,
      x,
      y: -30,
      speed: (DEFENDER_SPEEDS[type] || 1) * this.chapter.difficulty,
      wobble: 0
    });
  }

  spawnStar() {
    const laneIdx = Math.floor(Math.random() * this.LANES);
    const x = this.LANE_W * laneIdx + this.LANE_W / 2;
    const value = Math.random() < 0.2 ? 3 : 1;
    this.pickups.push({ x, y: -20, value, bob: 0 });
  }

  calcStars() {
    const thresholds = this.chapter.starThresholds;
    if (this.yards >= thresholds[2]) return 3;
    if (this.yards >= thresholds[1]) return 2;
    if (this.yards >= thresholds[0]) return 1;
    return 0;
  }

  updateHUD(timeLeft) {
    const yardsEl = document.getElementById('hud-yards');
    const timerEl = document.getElementById('hud-timer');
    const scoreEl = document.getElementById('hud-score');
    const healthEl = document.getElementById('hud-health');
    const sprintEl = document.getElementById('sprint-bar');
    const stageEl = document.getElementById('hud-stage');

    if (yardsEl) yardsEl.textContent = `${Math.floor(this.yards)} / ${this.chapter.targetYards} YDS`;
    if (timerEl) {
      const tl = Math.max(0, timeLeft);
      timerEl.textContent = `⏱ ${tl.toFixed(1)}s`;
      timerEl.style.color = tl < 8 ? '#ef4444' : 'white';
    }
    if (scoreEl) scoreEl.textContent = `⭐ ${this.score}`;
    if (healthEl) {
      let hearts = '';
      for (let i = 0; i < this.maxHealth; i++) hearts += i < this.health ? '❤️' : '🖤';
      healthEl.textContent = hearts;
    }
    if (sprintEl) sprintEl.style.width = `${this.sprintEnergy * 100}%`;
    if (stageEl) stageEl.textContent = `${this.chapter.era} — ${this.chapter.name}`;

    const hintEl = document.getElementById('hud-hint');
    if (hintEl) {
      if (this.stiffArmCooldown > 0 && (this.stats.stiffArm || 0) > 0) {
        hintEl.textContent = `Stiff Arm: ${this.stiffArmCooldown.toFixed(1)}s`;
      } else if ((this.stats.stiffArm || 0) > 0) {
        hintEl.textContent = 'SPACE = Stiff Arm!';
      } else {
        hintEl.textContent = '';
      }
    }
  }

  addFloat(x, y, text, color) {
    const gameRoot = document.getElementById('screen-game');
    if (!gameRoot) return;
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translateX(-50%)';
    gameRoot.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  finish() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.onEnd({
      yards: Math.floor(this.yards),
      starsEarned: Math.max(0, this.starsEarned + this.calcStars()),
      score: this.score,
      health: this.health,
      victory: this.victory && !this.tackled,
      tackled: this.tackled,
      timeTaken: this.elapsed
    });
  }

  // ─── DRAW ─────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    const W = this.FIELD_W;
    const H = this.FIELD_H;

    // Field background
    this.drawField(ctx, W, H);

    // Pickups (stars)
    for (const pk of this.pickups) {
      const bobY = Math.sin(pk.bob) * 5;
      if (STAR_IMG.complete) {
        ctx.drawImage(STAR_IMG, pk.x - this.STAR_SIZE / 2, pk.y - this.STAR_SIZE / 2 + bobY, this.STAR_SIZE, this.STAR_SIZE);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pk.x, pk.y + bobY, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // Glow
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.abs(Math.sin(pk.bob)) * 0.2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pk.x, pk.y + bobY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Obstacles
    for (const ob of this.obstacles) {
      this.drawObstacle(ctx, ob);
    }

    // Player
    this.drawPlayer(ctx, W, H);

    // Invincibility flash
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, this.PLAYER_SIZE * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Victory / tackled overlay
    if (this.victory || this.tackled) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = this.tackled ? '#000' : 'rgba(0,80,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.font = 'bold 48px Arial Black';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.tackled ? '#ef4444' : '#22c55e';
      ctx.fillText(this.tackled ? '💔 TACKLED' : '🏈 SCORE!', W / 2, H / 2);
      ctx.restore();
    }

    // Yard progress bar at top
    const progressW = (this.yards / this.chapter.targetYards) * W;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, 8);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, Math.min(progressW, W), 8);
    ctx.restore();
  }

  drawField(ctx, W, H) {
    // Base grass
    const grassGrad = ctx.createLinearGradient(0, 0, 0, H);
    grassGrad.addColorStop(0, '#1a4a1a');
    grassGrad.addColorStop(0.5, '#1e5c1e');
    grassGrad.addColorStop(1, '#174117');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, W, H);

    // Alternating grass stripes
    const stripeH = 80;
    const offset = this.scrollY % (stripeH * 2);
    for (let y = -stripeH * 2 + offset; y < H + stripeH; y += stripeH * 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, y, W, stripeH);
    }

    // Yard lines
    const lineSpacing = 80;
    const lineOffset = this.scrollY % lineSpacing;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let y = lineOffset - lineSpacing; y < H + lineSpacing; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Lane dividers (dashed)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([20, 20]);
    const dashOffset = this.scrollY % 40;
    ctx.lineDashOffset = -dashOffset;
    for (let i = 1; i < this.LANES; i++) {
      const lx = this.LANE_W * i;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // End zone indicator
    const targetFrac = this.yards / this.chapter.targetYards;
    if (targetFrac > 0.85) {
      const alpha = Math.min(1, (targetFrac - 0.85) / 0.15);
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, W, 30);
      ctx.restore();
      ctx.save();
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(34,197,94,${alpha})`;
      ctx.fillText('🏆 END ZONE APPROACHING!', W / 2, 20);
      ctx.restore();
    }

    // Team color end zone glow at top
    ctx.save();
    ctx.globalAlpha = 0.15;
    const tc = this.chapter.teamColor || '#dc2626';
    ctx.fillStyle = tc;
    ctx.fillRect(0, 0, W, 60);
    ctx.restore();
  }

  drawObstacle(ctx, ob) {
    ctx.save();
    if (ob.type === 'cone') {
      if (CONE_IMG.complete && CONE_IMG.naturalWidth) {
        ctx.drawImage(CONE_IMG, ob.x - this.OBJ_SIZE / 2, ob.y - this.OBJ_SIZE / 2, this.OBJ_SIZE, this.OBJ_SIZE);
      } else {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(ob.x, ob.y - 20);
        ctx.lineTo(ob.x - 14, ob.y + 12);
        ctx.lineTo(ob.x + 14, ob.y + 12);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      const wobbleX = Math.sin(ob.wobble) * 3;
      ctx.translate(ob.x + wobbleX, ob.y);
      if (DEFENDER_IMG.complete && DEFENDER_IMG.naturalWidth) {
        ctx.drawImage(DEFENDER_IMG, -this.OBJ_SIZE / 2, -this.OBJ_SIZE / 2, this.OBJ_SIZE, this.OBJ_SIZE);
      } else {
        // Fallback: draw simple defender shape
        const speedColors = {
          defender_slow: '#3b82f6',
          defender_medium: '#f59e0b',
          defender_fast: '#ef4444',
          defender_blitz: '#8b5cf6',
        };
        ctx.fillStyle = speedColors[ob.type] || '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);
      }
      // Shadow/label for fast defenders
      if (ob.type === 'defender_blitz') {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLITZ', 0, this.OBJ_SIZE / 2 + 8);
      }
    }
    ctx.restore();
  }

  drawPlayer(ctx, W, H) {
    const img = this.chapter.uniform === 'hs' ? PLAYER_IMG_HS : PLAYER_IMG_COL;
    ctx.save();
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, this.playerX - this.PLAYER_SIZE / 2, this.playerY - this.PLAYER_SIZE / 2, this.PLAYER_SIZE, this.PLAYER_SIZE);
    } else {
      ctx.fillStyle = this.chapter.teamColor || '#dc2626';
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏈', this.playerX, this.playerY);
    }
    // Sprint aura
    if (this.sprintEnergy < 0.1) {
      // flashing red ring
    } else {
      const sprintGlowAlpha = 0.15 + Math.abs(Math.sin(performance.now() / 300)) * 0.1;
      ctx.globalAlpha = sprintGlowAlpha;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, this.PLAYER_SIZE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.playerX, this.playerY + this.PLAYER_SIZE / 2 - 6, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
