# Running Back Rising - 3D RPG Runner

A mobile-friendly 3D infinite runner game with RPG progression elements. Play as a football running back rising through 10 chapters across three eras.

## 📋 Project Overview

**Game Type:** Segmented 3D Runner with RPG Progression  
**Dimensions:** 350x550 (mobile-optimized)  
**Controls:** Touch/Swipe for lane switching  
**Genre:** Hybrid RPG + Endless Runner

### Core Features

- **3D Graphics** - Built with Three.js for smooth 3D rendering
- **Lane System** - 3-lane runner with smooth switching mechanics
- **Touch Controls** - Swipe left/right to dodge obstacles
- **RPG Progression** - 10 chapters across 3 eras with stat upgrades
- **Collectible System** - Stars for currency and upgrades
- **Damage System** - HP-based health with dodge stat
- **Upgrade Shop** - Between-chapter stat progression (HP, Speed, Dodge, Star Multiplier)

## 🎮 How to Play

1. **Open** `index.html` in a modern web browser
2. **Click "START GAME"** to begin Chapter 1
3. **Swipe Left/Right** to change lanes and dodge obstacles
4. **Collect Yellow Stars** for points and currency
5. **Avoid Red Obstacles** - they damage you!
6. **Complete Chapter** - reach the distance goal before running out of HP
7. **Upgrade** - spend collected stars to enhance stats between chapters

### Controls

| Input | Action |
|-------|--------|
| **Swipe Left** | Switch to right lane |
| **Swipe Right** | Switch to left lane |
| **Arrow Keys** | Lane switching (keyboard) |
| **Space** | Pause/Resume |

## 📁 Project Structure

```
Armor_Runner_21/
├── index.html                 # Main game page
├── js/
│   └── game.js               # Core game engine
├── README.md                 # This file
├── DESIGN.md                 # Original design doc
└── assets/
    ├── backdrops/            # Background assets
    ├── defenders/            # Defender sprites
    ├── endzones/             # End zone assets
    ├── grass/                # Grass textures
    ├── items/                # Collectible items
    ├── powerups/             # Power-up assets
    └── runner/               # Player sprites
```

## 🏗️ Game Architecture

### Classes & Systems

#### Game Class (game.js)
Main game controller handling:
- Scene and renderer initialization
- Game loop and animation
- Player input handling
- Game state management
- Collision detection

#### Player Stats (RPG System)
```javascript
playerStats = {
    chapter: 1-10
    era: 1-3
    maxHp: 100+
    hp: current health
    speed: movement speed multiplier
    dodge: damage reduction multiplier
    starMultiplier: currency gain multiplier
    totalStars: accumulated currency
}
```

#### Game States
- `menu` - Main menu
- `playing` - Active gameplay
- `pause` - Paused
- `gameover` - Chapter failed or completed
- `upgrade` - Between-chapter upgrades

## 🎯 Chapters & Progression

| Chapter | Name | Distance | Era |
|---------|------|----------|-----|
| 1 | High School Freshman | 500m | 1 |
| 2 | Sophomore Year | 700m | 1 |
| 3 | Junior Breakout | 1000m | 1 |
| 4 | Senior Season | 1200m | 2 |
| 5 | College Prospect | 1500m | 2 |
| 6 | Freshman Games | 2000m | 2 |
| 7 | Championship Run | 2500m | 3 |
| 8 | Draft Showcase | 3000m | 3 |
| 9 | Pro Debut | 3500m | 3 |
| 10 | Bowl Champion | 4000m | 3 |

## ⚙️ Customization Guide

### Modify Game Difficulty

Edit spawn rate in `game.js`:
```javascript
this.spawnInterval = 30; // Lower = more obstacles
```

### Adjust Lane Configuration

Change number of lanes (currently 3):
```javascript
// In getLaneX() - modify calculation
const laneWidth = 1;
return (lane - 1) * laneWidth - laneWidth;
```

### Add New Obstacle Types

Add to `createObstacle()` method:
```javascript
// Add visual variation
const colors = [0xff3333, 0xff6600, 0xcc00cc];
material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
```

### Modify Upgrade Costs

Edit `showUpgradeScreen()` method:
```javascript
const upgrades = [
    { name: 'Max HP', stat: 'maxHp', increase: 20, cost: 50 }, // Change cost
    // ...
];
```

## 🔧 Technical Details

### Dependencies
- **Three.js** - 3D graphics rendering (loaded from CDN)

### Browser Support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### Performance Optimizations
- Object pooling for obstacles/collectibles
- Efficient collision detection
- Scene cleanup for off-screen objects
- GPU-accelerated rendering

## 🎨 Visual System

### 3D Models
- **Runner** - Capsule body + sphere head with shield effect
- **Obstacles** - Red boxes
- **Collectibles** - Yellow spinning spheres (stars)
- **Ground** - Green segmented planes

### Lighting
- Ambient light for general illumination
- Directional light with shadows
- Point light for depth perception

### Colors & Styling
- **Primary:** Gold (#FFD700) - UI, stars
- **Grass:** Dark Green (#2d6a4f) - Ground
- **Runner:** Orange (#ff6600) - Player character
- **Obstacles:** Red (#ff3333) - Enemies
- **UI:** Gold borders with dark backgrounds

## 🐛 Debugging & Testing

### Enable Console Logs
Add to `game.js`:
```javascript
console.log('Score:', this.score);
console.log('HP:', this.playerStats.hp);
console.log('Position:', this.runner.position);
```

### Test Upgrades
In browser console:
```javascript
game.playerStats.totalStars = 1000; // Add stars
game.showUpgradeScreen(); // Show upgrade menu
```

### Modify Game Speed
```javascript
// Slow motion
game.playerStats.speed *= 0.5;

// Speed up
game.playerStats.speed *= 2;
```

## 🚀 Future Enhancements

- [ ] Sound effects and music
- [ ] Particle effects for collisions
- [ ] Power-up items (shields, speed boost)
- [ ] Combo system for collecting consecutive items
- [ ] Leaderboard/high scores
- [ ] Team color switching per era
- [ ] Boss battles at chapter ends
- [ ] Multiple character skins
- [ ] Touch feedback (haptics)
- [ ] Replay system
- [ ] Mobile app wrapper

## 📱 Mobile Deployment

### For Web Hosting
1. Upload all files to web server
2. Ensure index.html is accessible
3. Three.js loads from CDN automatically

### For App Store/Play Store
- Wrap with frameworks like Cordova or Flutter WebView
- Add manifest.json for PWA support
- Implement local storage for progress

## 📞 Support & Contributions

- Report bugs in GitHub issues
- Suggest features for future releases
- Contribute asset improvements
- Help optimize performance

---

**Version:** 1.0  
**Last Updated:** 2026-06-13  
**License:** Free to modify and redistribute
