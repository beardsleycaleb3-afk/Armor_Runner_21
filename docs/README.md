# Armor_Runner_21 - Running Back Rising

A 3D segmented runner game with RPG progression elements. Play as a football running back rising through 10 chapters across three eras. Built with Three.js for beautiful 3D graphics and optimized for 350x550 mobile resolution with touch controls.

## ⚡ Quick Start

1. Open `index.html` in a modern web browser
2. Click "START GAME"
3. Swipe left/right to dodge obstacles
4. Collect yellow stars, avoid red obstacles
5. Complete chapters to unlock upgrades

[📖 Full Quick Start Guide](QUICKSTART.md)

## 🎮 Game Features

- **3D Graphics** - WebGL-rendered with Three.js
- **Touch Controls** - Swipe-based lane switching
- **3-Lane Runner** - Smooth lane transitions
- **10 Chapters** - Progressive difficulty across 3 eras
- **RPG System** - Collect stars, upgrade stats
- **Obstacles & Collectibles** - Dodge and collect procedurally
- **HP System** - Damage taken, dodge stat reduces it
- **Stat Upgrades** - Between-chapter progression (HP, Speed, Dodge, Star Multiplier)

## 📁 Project Structure

```
├── index.html              # Game entry point (OPEN THIS)
├── js/
│   ├── game.js            # Core game engine (3D, logic, UI)
│   └── config.js          # Easy configuration (modify this!)
├── QUICKSTART.md          # ⭐ Start here!
├── IMPLEMENTATION.md      # Technical documentation
├── EXTENSIONS.md          # How to add new features
├── DESIGN.md              # Original game design
└── assets/                # Game assets folder
```

## 🎯 How to Play

| Input | Action |
|-------|--------|
| **Swipe Left** | Move to right lane |
| **Swipe Right** | Move to left lane |
| **Arrow Keys** | Lane switching (keyboard) |
| **Space** | Pause/Resume |

## 🚀 How to Customize

All easy customizations go in `js/config.js`:

```javascript
// Change difficulty (lower = harder)
SPAWN_INTERVAL: 30

// Adjust chapter distances
CHAPTER_DISTANCES: [500, 700, 1000, ...]

// Modify upgrade costs
UPGRADE_COSTS: { MAX_HP: 50, SPEED: 50, ... }

// Change colors
COLORS: { OBSTACLE: 0xff3333, ... }
```

For advanced changes, see [EXTENSIONS.md](EXTENSIONS.md).

## 📊 Game Progression

10 chapters across 3 eras:
- **Era 1** (Ch 1-3): High school years
- **Era 2** (Ch 4-6): College years  
- **Era 3** (Ch 7-10): Professional years

Each chapter has increasing distance goals and difficulty.

## 🔧 System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (Three.js loaded from CDN)
- Touch screen or keyboard/mouse
- JavaScript enabled

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get playing in 60 seconds
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical deep-dive
- [EXTENSIONS.md](EXTENSIONS.md) - Add features to the game
- [DESIGN.md](DESIGN.md) - Original game design document

## 🛠️ Development

### Project Technologies
- **Three.js** - 3D graphics engine
- **HTML5** - Game container
- **CSS3** - Responsive UI styling
- **Vanilla JavaScript** - Game logic

### Browser Support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Android)

## 🐛 Troubleshooting

**Game won't load?**
- Check internet connection (CDN for Three.js)
- Try a different browser
- Check browser console (F12) for errors

**Touch controls not working?**
- Try keyboard arrow keys
- Ensure you're swiping, not tapping
- Try different browser

**Game too easy/hard?**
- Adjust `SPAWN_INTERVAL` in config.js
- Modify `CHAPTER_DISTANCES` for easier/harder chapters

## 🎨 Customization Guide

### Change Game Colors
Edit `js/config.js` → `COLORS` section with hex values.

### Adjust Difficulty
- `SPAWN_INTERVAL` - Lower = more obstacles
- `OBSTACLE_SPAWN_CHANCE` - Higher = more obstacles
- `CHAPTER_DISTANCES` - Longer distances = harder

### Modify Upgrade System
Edit `js/config.js` → `UPGRADE_COSTS` and `UPGRADE_INCREASES`.

## 🚀 Future Enhancements

Popular additions:
- [ ] Sound effects & music
- [ ] Particle effects
- [ ] Power-up items
- [ ] Combo system
- [ ] Leaderboard
- [ ] Different characters
- [ ] Boss fights
- [ ] Mobile app version

See [EXTENSIONS.md](EXTENSIONS.md) for code examples!

## 📝 License

Free to use, modify, and distribute.

## 📞 Questions?

Refer to documentation files:
1. Start with [QUICKSTART.md](QUICKSTART.md)
2. Check [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical help
3. See [EXTENSIONS.md](EXTENSIONS.md) to add features

---

**Version:** 1.0  
**Last Updated:** 2026-06-13  
**Status:** Fully Playable ✅
