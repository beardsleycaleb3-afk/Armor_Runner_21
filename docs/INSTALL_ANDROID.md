# Install Running Back Rising on Your Android Phone

## 🚀 Quick Installation (2 Steps)

### Step 1: Open Game in Browser
- Open Chrome, Firefox, or Edge on your Android phone
- Visit the game URL

### Step 2: Install App
- Look for **"Install app"** notification at top/bottom
- Or tap **Menu (⋮)** → **"Install app"**
- Tap **Install**

**Done!** ✅ App is now on your home screen

---

## 🎮 Launch the App

1. **Tap the app icon** on your home screen
2. App opens in **fullscreen mode** (no browser UI)
3. **Portrait orientation** is locked (rotate won't change it)
4. Enjoy the game! 🏈⭐

---

## ✨ Features

### Installed App
✅ **Fullscreen** - No browser address bar  
✅ **Standalone** - Feels like a native app  
✅ **Offline** - Works without internet (after first load)  
✅ **Fast** - Instant launch from cache  
✅ **Portrait** - Locked to portrait orientation  
✅ **Dynamic Height** - Uses full screen height (DVH)  

### Offline Gameplay
- After installing, the game is **fully cached**
- Play **anywhere, anytime**
- No internet connection needed
- Leaderboard works offline (local storage)

---

## 📱 Browser Support

| Browser | Android | Support |
|---------|---------|---------|
| Chrome | 5.0+ | ✅ Full |
| Firefox | 68+ | ✅ Full |
| Edge | 18+ | ✅ Full |
| Samsung Internet | 5.0+ | ✅ Full |
| Opera | 46+ | ✅ Full |

**iOS Safari:** Shortcut mode (limited PWA support)

---

## 🔧 If Install Prompt Doesn't Appear

### Wait 30+ Seconds
The install prompt appears ~30 seconds after opening the game.

### Check Manifest
Verify manifest.json is loading:
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Look for **Manifest** in left menu
4. Should show no errors

### Hard Refresh
- **Android Chrome:** Swipe down on address bar → Pull to refresh
- **Or:** Ctrl+Shift+R (if using keyboard)

### Clear Browser Cache
Settings → Apps → Chrome (or your browser) → Storage → Clear Cache

---

## 🎯 What Gets Cached?

When you install, these files are cached:
```
✓ index.html (game page)
✓ js/game.js (game engine)
✓ js/modules.js (features)
✓ js/config.js (settings)
✓ manifest.json (app metadata)
✓ assets/icon_192.jpg (app icon)
```

**Total Size:** ~50 KB  
**Cache Limit:** Up to 50 MB available

---

## 📊 After Installation

### Your Home Screen
- App icon with "Running Back Rising"
- Long-press for shortcuts:
  - **Start Game** - Begin immediately
  - **View Scores** - See leaderboard

### App Menu
- Separate from browser
- Independent app experience
- Can be uninstalled like any app

### Storage
- Uses device storage (~50 KB)
- Separate from browser data
- Persistent across updates

---

## 🔄 Updates

### Automatic Updates
Service Worker checks for updates **every minute**:
- Downloads new game code
- Caches it in background
- Applies on next launch

### Force Update
In game, open console (F12):
```javascript
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_CACHE'
});
```

Then restart the app.

---

## 🛠️ Troubleshooting

### "Install app" button not showing?
- ✓ Wait 30+ seconds
- ✓ Hard refresh (Ctrl+Shift+R)
- ✓ Try different browser (Chrome usually best)
- ✓ Clear browser cache

### App crashes or won't load?
- ✓ Force stop and restart app
- ✓ Clear app cache in settings
- ✓ Uninstall and reinstall

### Offline mode not working?
- ✓ App must be fully installed first
- ✓ Wait for Service Worker to activate (~10 seconds)
- ✓ Check DevTools → Application → Service Workers

### Portrait mode won't lock?
- ✓ Only works in fullscreen (should be auto)
- ✓ Some devices don't support orientation lock
- ✓ Manually rotate to portrait and use one-handed

### Game freezes?
- ✓ Close other apps to free memory
- ✓ Restart your phone
- ✓ Update Chrome/Firefox

---

## 🎮 Pro Tips

### Faster Gameplay
- **Install the app** for instant loads
- Runs from cache (no network latency)
- ~500ms launch time

### Save Data
- Leaderboard automatically saved
- Stats persist between sessions
- Local storage on your device

### Battery Life
- Uses less battery than browser version
- No background ads or tracking
- Efficient caching system

### Internet Savings
- Download once, play offline
- No ongoing data usage
- ~50 KB initial download

---

## 📊 Storage Usage

| Item | Size |
|------|------|
| Game code | ~20 KB |
| Game modules | ~16 KB |
| Config/metadata | ~2 KB |
| Icon/assets | ~12 KB |
| **Total** | **~50 KB** |

**Device Storage Needed:** 100+ MB free  
(Most devices have 100s of GB)

---

## 🔐 Privacy & Security

### What's NOT Sent
- ❌ No user tracking
- ❌ No analytics
- ❌ No ads
- ❌ No data collection
- ❌ No phone home calls

### What IS Stored Locally
- ✅ Your scores (local device)
- ✅ Game progress (local device)
- ✅ Settings (local device)

**Everything stays on your phone!** 🔒

---

## 📞 Need Help?

### Check These Files
- **PWA.md** - Detailed PWA guide
- **QUICKSTART.md** - How to play
- **IMPLEMENTATION.md** - Technical details

### Common Issues
1. **Won't install?** → Clear browser cache, wait 30 seconds
2. **Won't load offline?** → Service Worker needs time to activate
3. **Screen rotation?** → Orientation locked to portrait (intentional)
4. **Performance?** → Close other apps, restart device

---

## 🚀 Install Now!

On your Android phone:

1. **Open browser** (Chrome recommended)
2. **Visit game URL**
3. **Look for install prompt**
4. **Tap Install** ✓
5. **Play!** 🎮

---

**Enjoy Running Back Rising!** 🏈⭐

---

**Version:** 1.1  
**Last Updated:** 2026-06-13  
**PWA Ready:** ✅ Full Support on Android
