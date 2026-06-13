# Extension Guide - Adding Features to Running Back Rising

This guide shows you how to add new features to the game without breaking existing code.

---

## 📝 Table of Extensions

1. [Add Power-Ups](#add-power-ups)
2. [Add Sound Effects](#add-sound-effects)
3. [Add Particle Effects](#add-particle-effects)
4. [Add New Obstacle Types](#add-new-obstacle-types)
5. [Add Combo System](#add-combo-system)
6. [Add Boss Levels](#add-boss-levels)

---

## Add Power-Ups

### Step 1: Create Power-Up Mesh

In `js/game.js`, add to the `Game` class:

```javascript
createPowerUp(z, lane, type = 'shield') {
    const geometry = new THREE.OctahedronGeometry(0.2, 2);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        emissive: 0x00aa00
    });
    const powerUp = new THREE.Mesh(geometry, material);
    
    powerUp.position.set(this.getLaneX(lane), 0.5, z);
    powerUp.castShadow = true;
    powerUp.userData.type = 'powerup';
    powerUp.userData.powerUpType = type;
    powerUp.userData.duration = 300; // frames
    powerUp.rotationSpeed = 0.15;
    
    this.scene.add(powerUp);
    this.collectibles.push(powerUp); // Reuse collectible array
    return powerUp;
}
```

### Step 2: Add Spawn Chance

Modify `spawnGameElements()`:

```javascript
spawnGameElements() {
    this.spawnTimer++;
    
    if (this.spawnTimer > this.spawnInterval) {
        this.spawnTimer = 0;
        
        const lane = Math.floor(Math.random() * 3);
        const rand = Math.random();
        
        if (rand < 0.5) {
            this.createObstacle(this.nextSegmentZ, lane);
        } else if (rand < 0.85) {
            this.createCollectible(this.nextSegmentZ, lane);
        } else {
            // 15% chance for power-up
            this.createPowerUp(this.nextSegmentZ, lane, 'shield');
        }
        
        this.nextSegmentZ -= 8;
    }
}
```

### Step 3: Handle Power-Up Collection

Modify `updateCollectibles()`:

```javascript
// Inside the collision detection:
if (star.userData.type === 'powerup') {
    this.activatePowerUp(star.userData.powerUpType);
    // ... remove from scene
} else if (star.userData.type === 'collectible') {
    // ... existing star collection code
}
```

### Step 4: Implement Power-Up Effects

Add to `Game` class:

```javascript
activatePowerUp(type) {
    switch(type) {
        case 'shield':
            this.playerStats.hp = this.playerStats.maxHp;
            console.log('Shield activated! HP restored');
            break;
        case 'speed':
            this.playerStats.speed *= 1.5;
            setTimeout(() => {
                this.playerStats.speed /= 1.5;
            }, 5000); // 5 second boost
            break;
        case 'magnet':
            // Auto-collect nearby stars
            this.activateMagnet();
            break;
    }
}

activateMagnet() {
    // Collect all visible stars
    this.collectibles.forEach(star => {
        if (star.userData.type === 'collectible') {
            star.userData.magnet = true;
        }
    });
}
```

---

## Add Sound Effects

### Step 1: Create Audio Manager

Create `js/audio.js`:

```javascript
class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }
    
    loadSound(name, url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds[name] = audio;
    }
    
    play(name, volume = 0.5) {
        if (!this.enabled || !this.sounds[name]) return;
        const audio = this.sounds[name].cloneNode();
        audio.volume = volume;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    toggleMute() {
        this.enabled = !this.enabled;
    }
}
```

### Step 2: Initialize in Game

```javascript
constructor() {
    // ... existing code ...
    
    this.audio = new AudioManager();
    // Note: Use sound files from your assets folder
    // this.audio.loadSound('collect', 'assets/collect.mp3');
    // this.audio.loadSound('collision', 'assets/collision.mp3');
    // this.audio.loadSound('complete', 'assets/complete.mp3');
}
```

### Step 3: Play Sounds on Events

```javascript
// When collecting star
this.audio.play('collect', 0.3);

// When hitting obstacle
this.audio.play('collision', 0.5);

// When completing chapter
this.audio.play('complete', 0.7);
```

---

## Add Particle Effects

### Step 1: Particle System

Add to `js/game.js`:

```javascript
createCollisionParticles(position, color = 0xff6600) {
    const particleCount = 8;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        
        // Random velocity
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        
        particle.life = 30; // frames
        particle.maxLife = 30;
        
        this.scene.add(particle);
        particles.push(particle);
    }
    
    return particles;
}

updateParticles() {
    // Update existing particles
    for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        
        p.position.add(p.velocity);
        p.velocity.y -= 0.1; // gravity
        p.life--;
        
        // Fade out
        p.material.opacity = p.life / p.maxLife;
        
        if (p.life <= 0) {
            this.scene.remove(p);
            this.particles.splice(i, 1);
        }
    }
}
```

### Step 2: Trigger Particles

```javascript
// In collision detection:
if (this.checkCollision(this.runner, obstacle)) {
    this.createCollisionParticles(obstacle.position, 0xff3333);
    // ... rest of collision code
}
```

---

## Add New Obstacle Types

### Step 1: Create Obstacle Variants

```javascript
createObstacle(z, lane, type = 'basic') {
    let geometry, damage;
    
    switch(type) {
        case 'cone':
            geometry = new THREE.ConeGeometry(0.2, 0.5, 8);
            damage = 15;
            break;
        case 'spike':
            geometry = new THREE.IcosahedronGeometry(0.15);
            damage = 30;
            break;
        case 'wall':
            geometry = new THREE.BoxGeometry(0.5, 0.5, 0.2);
            damage = 25;
            break;
        default:
            geometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
            damage = 20;
    }
    
    const material = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const obstacle = new THREE.Mesh(geometry, material);
    
    obstacle.position.set(this.getLaneX(lane), 0.3, z);
    obstacle.castShadow = true;
    obstacle.userData.type = 'obstacle';
    obstacle.userData.damage = damage;
    
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
    return obstacle;
}
```

### Step 2: Spawn Variants

```javascript
// In spawnGameElements():
if (rand < 0.6) {
    const obstacleTypes = ['basic', 'cone', 'spike', 'wall'];
    const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    this.createObstacle(this.nextSegmentZ, lane, randomType);
}
```

---

## Add Combo System

### Step 1: Add Combo Variables

```javascript
constructor() {
    // ... existing code ...
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 120; // frames
    this.lastStarZ = Infinity;
}
```

### Step 2: Track Star Collection

```javascript
// In updateCollectibles(), when collecting a star:
const starDistance = Math.abs(this.lastStarZ - star.position.z);

if (starDistance < 5) { // Close together = combo!
    this.comboCount++;
    this.comboTimer = this.comboMaxTime;
    star.userData.value *= (1 + this.comboCount * 0.1); // Bonus!
} else {
    this.comboCount = 0;
}

this.lastStarZ = star.position.z;
```

### Step 3: Display Combo

Add to HUD:

```html
<div class="hud-bottom">
    <div id="meterInfo">
        Distance: <span id="distanceDisplay">0</span>m
        <span id="comboDisplay" style="display:none; color: #FFD700;">
            🔥 COMBO x<span id="comboCount">0</span>
        </span>
    </div>
</div>
```

### Step 4: Update Combo Timer

```javascript
// In update():
if (this.comboCount > 0) {
    this.comboTimer--;
    document.getElementById('comboCount').textContent = this.comboCount;
    document.getElementById('comboDisplay').style.display = 'inline';
    
    if (this.comboTimer <= 0) {
        this.comboCount = 0;
        document.getElementById('comboDisplay').style.display = 'none';
    }
}
```

---

## Add Boss Levels

### Step 1: Create Boss Entity

```javascript
createBoss(z) {
    const bossGroup = new THREE.Group();
    
    // Main body (larger)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B008B });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    bossGroup.add(body);
    
    bossGroup.position.set(0, 0.5, z);
    bossGroup.userData.type = 'boss';
    bossGroup.userData.hp = 100;
    bossGroup.userData.maxHp = 100;
    bossGroup.userData.movePattern = 'sine'; // sine wave movement
    bossGroup.userData.shootTimer = 0;
    
    this.scene.add(bossGroup);
    return bossGroup;
}
```

### Step 2: Boss Behavior

```javascript
updateBoss() {
    if (!this.boss) return;
    
    // Movement pattern
    this.boss.userData.movePattern === 'sine' 
        ? this.boss.position.x = Math.sin(this.distance / 50) * 0.8
        : null;
    
    // Shoot projectiles
    this.boss.userData.shootTimer++;
    if (this.boss.userData.shootTimer > 60) {
        this.shootBossProjectile();
        this.boss.userData.shootTimer = 0;
    }
}
```

---

## 🎯 Best Practices

1. **Don't modify core loops** - Add hooks instead
2. **Use userData** for custom properties
3. **Clean up objects** when removing from scene
4. **Test thoroughly** before deploying
5. **Comment your code** for future changes
6. **Keep configuration** in `js/config.js`

---

## 📚 Related Files

- **game.js** - Main game engine
- **config.js** - Configuration values
- **index.html** - UI structure

---

Happy coding! 🚀
