# Module System Documentation - Seamless Feature Integration

## Overview

Running Back Rising now uses a **modular plugin system** that makes it incredibly easy to add new features without touching the core game engine. All features like particle effects, leaderboards, combos, and visual effects are implemented as modules that integrate seamlessly.

---

## Architecture

### Module System Flow

```
Game Loop
    ↓
[Update Game Logic]
    ↓
[Broadcast Events] → Module Manager
    ↓
[All Modules Listen]
    ├→ ParticleEffect Module
    ├→ LeaderboardModule
    ├→ ComboModule
    └→ VisualEffectsModule
    ↓
[Each Module Updates]
    ↓
[Render]
```

### Core Concepts

1. **GameModule** - Base class for all modules
2. **ModuleManager** - Manages registration and communication
3. **Event Broadcasting** - Game broadcasts events, modules listen
4. **Lifecycle Hooks** - Modules have init, update, cleanup methods

---

## ✅ Built-In Modules

### 1. ParticleEffect Module

**Purpose:** Create visual particle bursts for events  
**File:** `js/modules.js`  
**Auto-integrated:** Yes

**Features:**
- Burst particles on collectible pickup
- Impact particles on obstacle hit
- Customizable colors and patterns
- Gravity physics
- Fade-out effect

**Usage:**
```javascript
// Get the module
const particles = game.modules.getModule('particles');

// Create custom particles
particles.createParticles(position, type, color, count);
// type: 'burst', 'star', 'impact'
// color: hex color (0xff6600)
// count: number of particles
```

**Events it listens to:**
- `onCollectible` - Creates gold star particles
- `onObstacleHit` - Creates red impact particles

---

### 2. LeaderboardModule

**Purpose:** Track scores and store persistent high scores  
**File:** `js/modules.js`  
**Auto-integrated:** Yes

**Features:**
- Saves top 50 scores to localStorage
- Tracks per-chapter best scores
- Tracks per-era best scores
- Displays as HTML table
- Auto-persists across sessions

**Usage:**
```javascript
// Get the module
const leaderboard = game.modules.getModule('leaderboard');

// Get top 10 scores
const top10 = leaderboard.getTopScores(10);

// Get best score for specific chapter
const best = leaderboard.getChapterBest(1);

// Get HTML display
const html = leaderboard.getStatsHtml();
```

**Storage:**
- Saved in `localStorage['running_back_scores']`
- Format: JSON array of score objects
- Persists across browser sessions

---

### 3. ComboModule

**Purpose:** Reward consecutive collectible pickups  
**File:** `js/modules.js`  
**Auto-integrated:** Yes

**Features:**
- Tracks consecutive collectible pickups
- Increases star value on combos
- Displays combo counter in HUD
- Creates celebration particles every 5x combo
- Auto-resets if gap between pickups too long

**Usage:**
```javascript
// Get the module
const combo = game.modules.getModule('combo');

// Get current combo count
const count = combo.getCombo();
```

**Combo Mechanics:**
- Pickup within 8m of last pickup = combo +1
- Each combo level increases star value by 10%
- Timeout: 120 frames (2 seconds at 60 FPS)
- Every 5x combo shows celebration particle burst

---

### 4. VisualEffectsModule

**Purpose:** Screen flashes and visual feedback  
**File:** `js/modules.js`  
**Auto-integrated:** Yes

**Features:**
- Screen flash on obstacle hit
- Knockback animation on runner
- Customizable flash color and duration
- Smooth fade-in/out

**Usage:**
```javascript
// Get the module
const effects = game.modules.getModule('effects');

// Flash screen
effects.flashScreen(color, duration);
// color: hex (0xff3333)
// duration: milliseconds
```

**Events it listens to:**
- `onObstacleHit` - Flashes red and knockbacks runner

---

## 🔧 How to Create a New Module

### Step 1: Define Your Module Class

```javascript
class MyNewModule extends GameModule {
    init() {
        // Initialize your module
        // Called once when game starts
        this.data = {};
    }
    
    update() {
        // Called every frame during gameplay
        // Update animations, timers, etc.
    }
    
    onGameStart() {
        // Called when player starts a chapter
    }
    
    onGamePause() {
        // Called when game pauses
    }
    
    onGameResume() {
        // Called when game resumes
    }
    
    onChapterComplete() {
        // Called when chapter finishes
    }
    
    onCollectible(collectible) {
        // Called when star is collected
        // collectible = the collected item
    }
    
    onObstacleHit(obstacle) {
        // Called when runner hits obstacle
        // obstacle = the obstacle hit
    }
    
    cleanup() {
        // Called when module is being removed
        // Clean up any resources
    }
}
```

### Step 2: Add to modules.js

```javascript
// Add your class definition to js/modules.js
// (already contains all the module base classes)
```

### Step 3: Register in Game

In `game.js`, the `initializeModules()` method:

```javascript
initializeModules() {
    // Register all game modules
    this.modules.register('particles', ParticleEffect);
    this.modules.register('leaderboard', LeaderboardModule);
    this.modules.register('combo', ComboModule);
    this.modules.register('effects', VisualEffectsModule);
    
    // YOUR NEW MODULE
    this.modules.register('myfeature', MyNewModule);
}
```

### Step 4: Use Your Module

```javascript
// Anywhere in the code
const myModule = game.modules.getModule('myfeature');
myModule.doSomething();
```

---

## 📡 Event System

### Available Events

The game broadcasts these events to all modules:

| Event | When | Parameters |
|-------|------|------------|
| `init` | Module registers | None |
| `update` | Every frame | None |
| `onGameStart` | Chapter starts | None |
| `onGamePause` | Game paused | None |
| `onGameResume` | Game resumed | None |
| `onChapterComplete` | Chapter completed | None |
| `onCollectible` | Star collected | collectible (THREE.Mesh) |
| `onObstacleHit` | Runner hit obstacle | obstacle (THREE.Mesh) |
| `cleanup` | Module removed | None |

### Broadcasting Custom Events

In the game:
```javascript
// Broadcast to all modules
this.modules.broadcast('eventName', param1, param2, ...);
```

In a module:
```javascript
// Listen for custom events by implementing the method
myEventName(param1, param2) {
    // Handle event
}
```

---

## 🎨 Example: Create a Power-Up Module

```javascript
// Add to js/modules.js

class PowerUpModule extends GameModule {
    init() {
        this.activePowerUps = [];
    }
    
    activatePowerUp(type) {
        const powerUp = {
            type: type,
            startTime: Date.now(),
            duration: 5000 // 5 seconds
        };
        this.activePowerUps.push(powerUp);
        
        switch(type) {
            case 'shield':
                this.game.playerStats.hp = this.game.playerStats.maxHp;
                break;
            case 'speed':
                this.game.playerStats.speed *= 1.5;
                break;
        }
    }
    
    update() {
        const now = Date.now();
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            if (now - powerUp.startTime > powerUp.duration) {
                // Deactivate
                if (powerUp.type === 'speed') {
                    this.game.playerStats.speed /= 1.5;
                }
                this.activePowerUps.splice(i, 1);
            }
        }
    }
    
    onCollectible(collectible) {
        // 20% chance to be a power-up
        if (Math.random() < 0.2) {
            const types = ['shield', 'speed'];
            this.activatePowerUp(types[Math.floor(Math.random() * types.length)]);
        }
    }
}

// Register in game.js initializeModules():
// this.modules.register('powerups', PowerUpModule);
```

---

## 🎁 Example: Create a Sound Effects Module

```javascript
// Add to js/modules.js

class SoundModule extends GameModule {
    init() {
        this.sounds = {};
        this.enabled = true;
        this.loadSounds();
    }
    
    loadSounds() {
        // Preload sound files
        // this.sounds['collect'] = new Audio('assets/collect.mp3');
        // this.sounds['hit'] = new Audio('assets/hit.mp3');
        // etc.
    }
    
    playSound(name, volume = 0.5) {
        if (!this.enabled || !this.sounds[name]) return;
        const audio = this.sounds[name].cloneNode();
        audio.volume = volume;
        audio.play().catch(e => console.log('Audio failed:', e));
    }
    
    onCollectible(collectible) {
        this.playSound('collect', 0.3);
    }
    
    onObstacleHit(obstacle) {
        this.playSound('hit', 0.6);
    }
    
    onChapterComplete() {
        this.playSound('victory', 0.8);
    }
}

// Register in game.js:
// this.modules.register('sound', SoundModule);
```

---

## 🎯 Example: Create a Boost/Difficulty Module

```javascript
// Add to js/modules.js

class DifficultyModule extends GameModule {
    init() {
        this.baseSpawnInterval = this.game.spawnInterval;
        this.chapterDifficulty = 1.0;
    }
    
    onGameStart() {
        // Increase difficulty per chapter
        const chapter = this.game.playerStats.chapter;
        this.chapterDifficulty = 1.0 + (chapter - 1) * 0.15;
        this.game.spawnInterval = Math.floor(this.baseSpawnInterval / this.chapterDifficulty);
    }
    
    update() {
        // Could add difficulty curve based on distance
        const progress = this.game.currentChapterDistance / 500; // scale to 500m
        const curveMultiplier = 1.0 + (progress * 0.2); // increase by 20% over chapter
        this.game.spawnInterval = Math.floor(this.baseSpawnInterval / (this.chapterDifficulty * curveMultiplier));
    }
}

// Register in game.js:
// this.modules.register('difficulty', DifficultyModule);
```

---

## 📊 Best Practices

1. **Keep Modules Independent** - Don't have modules depend on each other
2. **Use Events** - Broadcast instead of direct calls
3. **Clean Up** - Always implement cleanup() to remove resources
4. **Get Module Reference** - Use `game.modules.getModule('name')`
5. **Follow Naming** - Use camelCase for module names
6. **Document Events** - Add comments about which events module listens to
7. **Error Handling** - Gracefully handle missing resources
8. **Performance** - Be mindful in update() - it's called every frame

---

## 🔍 Debugging Modules

### Log Module Registration

```javascript
// In modules.js, ModuleManager.register() already logs:
console.log(`[Module] Registered: ${name}`);
```

### Check Active Modules

```javascript
// In browser console
console.log(game.modules.modules);
console.log(game.modules.moduleMap);
```

### Test a Module Directly

```javascript
// In browser console
const particles = game.modules.getModule('particles');
particles.createParticles(game.runner.position, 'burst', 0xffff00, 15);
```

---

## 📁 File Organization

```
js/
├── game.js          ← Core engine
├── modules.js       ← All module classes
├── config.js        ← Configuration
└── [future modules could go here]
```

**Note:** All modules are in `modules.js` for simplicity. As the game grows, you can create separate files:
```
js/modules/
├── particle-effects.js
├── leaderboard.js
├── combo.js
└── visual-effects.js
```

---

## 🚀 Quick Start: Add a Feature

1. **Create your module class** in `js/modules.js`
2. **Implement needed methods** (init, update, event handlers)
3. **Register in game.js** `initializeModules()`
4. **Use it!** Get via `game.modules.getModule('name')`

That's it! No core game changes needed! 🎉

---

## 📚 Next Steps

Popular features to add:
- [ ] Sound effects module
- [ ] Power-ups module
- [ ] Difficulty scaling module
- [ ] Achievements/badges module
- [ ] Tutorial/help module
- [ ] Analytics/stats module

See examples above for each!

---

**Happy modding!** 🛠️✨
