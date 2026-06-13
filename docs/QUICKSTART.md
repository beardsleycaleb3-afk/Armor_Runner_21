# Quick Start Guide

## 🚀 Get Started in 60 Seconds

### 1. **Open the Game**
   ```
   Open index.html in your web browser
   ```
   That's it! The game loads everything from CDN.

### 2. **Play**
   - Click **"START GAME"** button
   - **Swipe left or right** on your screen to dodge obstacles
   - **Collect yellow stars** for points and upgrades
   - **Avoid red obstacles** or you lose HP

### 3. **Complete a Chapter**
   - Run the required distance (shown in chapter info)
   - When you reach the goal, you advance
   - **Upgrade your stats** with collected stars
   - Repeat for all 10 chapters!

---

## 📋 What You Have

### Files:
- **index.html** - Main game page (run this in browser)
- **js/game.js** - Game engine (don't modify unless you know what you're doing)
- **js/config.js** - Easy customization options
- **IMPLEMENTATION.md** - Full technical documentation

### Game Features:
✅ 3D Graphics (350x550 mobile-optimized)  
✅ Touch Controls (swipe to change lanes)  
✅ 3-Lane Runner System  
✅ 10 Chapters with Progressive Difficulty  
✅ RPG Stat Upgrades  
✅ Star Collection System  
✅ HP/Damage System  

---

## 🎮 Controls Quick Reference

| Action | Control |
|--------|---------|
| Change Lanes | **Swipe Left/Right** |
| Pause | **Press Space** (keyboard only) |
| Dodge | **Move out of the way!** |
| Collect Stars | **Run over them** |

---

## 🎨 Easy Customization

### Make It Harder/Easier
Edit `js/config.js`:
```javascript
SPAWN_INTERVAL: 30,  // Lower = more obstacles (harder)
                     // Higher = fewer obstacles (easier)
```

### Change Colors
Edit `js/config.js` → `COLORS` section:
```javascript
OBSTACLE: 0xff3333,      // Red (hex color code)
COLLECTIBLE: 0xffff00,   // Yellow
```

### Adjust Difficulty Curve
Edit `js/config.js` → `CHAPTER_DISTANCES`:
```javascript
CHAPTER_DISTANCES: [
    500,    // Chapter 1 (easier)
    1000,   // Chapter 2 (increase distance for harder)
    // ...
]
```

### Change Upgrade Costs
Edit `js/config.js` → `UPGRADE_COSTS`:
```javascript
MAX_HP: 50,          // Cost in stars
SPEED: 50,
DODGE: 75,
STAR_MULTIPLIER: 100
```

---

## 🐛 Troubleshooting

### Game Won't Load
- Make sure you have internet (CDN loads Three.js)
- Try a different browser
- Check browser console (F12) for errors

### Touch Controls Don't Work
- Try keyboard arrow keys instead
- Make sure you're swiping, not just tapping
- Try a different browser

### Game Runs Slow
- Close other browser tabs
- Reduce screen brightness
- Try reducing spawn rate in config.js

### Want to Test Quickly?
Add to browser console (F12):
```javascript
// Skip to upgrade screen
game.showUpgradeScreen();

// Give yourself stars
game.playerStats.totalStars = 1000;

// Increase game speed
game.playerStats.speed *= 2;

// Full HP
game.playerStats.hp = game.playerStats.maxHp;
```

---

## 📖 Next Steps

1. **Play** a few chapters to understand the game
2. **Customize** colors and difficulty in `js/config.js`
3. **Read** `IMPLEMENTATION.md` for technical details
4. **Extend** with new features like:
   - Sound effects
   - Power-ups
   - Particle effects
   - Different characters

---

## 🎯 Game Loop Overview

```
START
  ↓
[Main Menu] ← Choose Chapter
  ↓
[Playing] ← Dodge obstacles, collect stars
  ↓
[Chapter Complete?]
  ├─→ NO → Continue playing
  └─→ YES → [Upgrade Screen]
              ↓
        [Select Upgrades]
          ↓
      [Repeat]
```

---

## 💡 Pro Tips

1. **Focus on dodging** - Damage is more dangerous than missing stars
2. **Collect all stars** - They power your upgrades
3. **Prioritize HP first** - More health = more chances to complete
4. **Speed matters** - Faster runner = more time to collect
5. **Dodge is OP** - Reduces damage by up to 50%!

---

## ❓ Have Questions?

See `IMPLEMENTATION.md` for:
- Detailed technical documentation
- Architecture explanation
- How to add new features
- Performance optimization tips

Good luck, and enjoy Running Back Rising! 🏈⭐
