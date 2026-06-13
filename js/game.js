// ============================================================================
// RUNNING BACK RISING - 3D RPG Runner
// 350x550 Touch-Controlled Segmented Runner with RPG Elements
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.container = document.getElementById('gameContainer');
        
        // Game dimensions
        this.width = 350;
        this.height = 550;
        
        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a4d2e);
        
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 1.5, 4);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: false 
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 3, 2);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'upgrade', 'gameover'
        
        // Player stats (RPG elements)
        this.playerStats = {
            chapter: 1,
            era: 1, // 1-3 corresponding to eras
            maxHp: 100,
            hp: 100,
            speed: 0.3,
            acceleration: 0.02,
            dodge: 1.0,
            starMultiplier: 1.0,
            totalStars: 0,
            totalScore: 0
        };
        
        // Chapter goals
        this.chapterGoals = [
            { name: 'High School Freshman', distance: 500 },
            { name: 'Sophomore Year', distance: 700 },
            { name: 'Junior Breakout', distance: 1000 },
            { name: 'Senior Season', distance: 1200 },
            { name: 'College Prospect', distance: 1500 },
            { name: 'Freshman Games', distance: 2000 },
            { name: 'Championship Run', distance: 2500 },
            { name: 'Draft Showcase', distance: 3000 },
            { name: 'Pro Debut', distance: 3500 },
            { name: 'Bowl Champion', distance: 4000 }
        ];
        
        // Game session data
        this.score = 0;
        this.distance = 0;
        this.spawnedSegments = [];
        this.obstacles = [];
        this.collectibles = [];
        this.currentChapterDistance = 0;
        this.chapterStarsCollected = 0;
        
        // Runner
        this.runner = null;
        this.currentLane = 1; // 0, 1, 2 (left, center, right)
        this.targetLane = 1;
        this.laneSwitchSmoothing = 0.15;
        
        // Input
        this.touchStartX = 0;
        this.touchStartTime = 0;
        this.keys = {};
        
        // Spawn control
        this.spawnTimer = 0;
        this.spawnInterval = 30; // frames between spawns
        this.nextSegmentZ = 0;
        
        // Module system
        this.modules = new ModuleManager(this);
        
        // Setup
        this.setupLights();
        this.createRunner();
        this.createGround();
        this.setupInputs();
        this.updateChapterInfo();
        this.initializeModules();
        
        // Start animation loop
        this.animate();
    }
    
    setupLights() {
        // Additional lighting for better visibility
        const frontLight = new THREE.PointLight(0xffffff, 0.3);
        frontLight.position.set(0, 2, 5);
        this.scene.add(frontLight);
    }
    
    createRunner() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.95;
        head.castShadow = true;
        group.add(head);
        
        // Shield effect (RPG element)
        const shieldGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const shieldMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00aaff, 
            transparent: true, 
            opacity: 0.3,
            wireframe: true
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.y = 0.5;
        shield.userData.isShield = true;
        group.add(shield);
        
        group.position.set(0, 0, 0);
        group.castShadow = true;
        group.userData.speed = 0;
        group.userData.direction = new THREE.Vector3(0, 0, -1);
        
        this.runner = group;
        this.scene.add(group);
    }
    
    createGround() {
        // Create multiple ground segments
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
        
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(3, 0.2, 4);
            const ground = new THREE.Mesh(geometry, groundMaterial);
            ground.position.z = -i * 4;
            ground.receiveShadow = true;
            ground.castShadow = true;
            this.scene.add(ground);
            this.spawnedSegments.push(ground);
        }
    }
    
    createObstacle(z, lane) {
        const geometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        const material = new THREE.MeshStandardMaterial({ color: 0xff3333 });
        const obstacle = new THREE.Mesh(geometry, material);
        
        obstacle.position.set(this.getLaneX(lane), 0.3, z);
        obstacle.castShadow = true;
        obstacle.userData.type = 'obstacle';
        obstacle.userData.damage = 20;
        
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
        return obstacle;
    }
    
    createCollectible(z, lane) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00 });
        const star = new THREE.Mesh(geometry, material);
        
        star.position.set(this.getLaneX(lane), 0.5, z);
        star.castShadow = true;
        star.userData.type = 'collectible';
        star.userData.value = Math.floor(10 * this.playerStats.starMultiplier);
        star.rotationSpeed = 0.1;
        
        this.scene.add(star);
        this.collectibles.push(star);
        return star;
    }
    
    getLaneX(lane) {
        const laneWidth = 1;
        return (lane - 1) * laneWidth - laneWidth;
    }
    
    setupInputs() {
        // Touch controls ONLY - mobile-first design
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
        this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
        this.container.addEventListener('touchmove', (e) => e.preventDefault(), false);
    }
    
    handleTouchStart(e) {
        if (this.gameState !== 'playing') return;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartTime = Date.now();
    }
    
    handleTouchEnd(e) {
        if (this.gameState !== 'playing') return;
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - this.touchStartX;
        const timeDiff = Date.now() - this.touchStartTime;
        
        // Detect swipe
        if (timeDiff < 300 && Math.abs(diffX) > 30) {
            if (diffX < 0) {
                // Swipe left
                this.targetLane = Math.min(2, this.targetLane + 1);
            } else {
                // Swipe right
                this.targetLane = Math.max(0, this.targetLane - 1);
            }
        }
    }
    
    initializeModules() {
        // Register all game modules
        this.modules.register('particles', ParticleEffect);
        this.modules.register('leaderboard', LeaderboardModule);
        this.modules.register('combo', ComboModule);
        this.modules.register('effects', VisualEffectsModule);
    }
    
    spawnGameElements() {
        this.spawnTimer++;
        
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            
            const lane = Math.floor(Math.random() * 3);
            const rand = Math.random();
            
            if (rand < 0.6) {
                this.createObstacle(this.nextSegmentZ, lane);
            } else {
                this.createCollectible(this.nextSegmentZ, lane);
            }
            
            this.nextSegmentZ -= 8;
        }
    }
    
    updateRunner() {
        if (!this.runner) return;
        
        // Smooth lane switching
        this.currentLane += (this.targetLane - this.currentLane) * this.laneSwitchSmoothing;
        this.runner.position.x = this.getLaneX(this.currentLane);
        
        // Forward movement
        this.runner.userData.speed = this.playerStats.speed;
        this.runner.position.z -= this.runner.userData.speed;
        
        // Update distance
        this.distance += this.runner.userData.speed;
        this.currentChapterDistance += this.runner.userData.speed;
    }
    
    updateCollectibles() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const star = this.collectibles[i];
            star.rotation.y += star.rotationSpeed;
            
            // Remove if off-screen
            if (star.position.z > this.runner.position.z + 5) {
                this.scene.remove(star);
                this.collectibles.splice(i, 1);
                continue;
            }
            
            // Check collision with runner
            if (this.checkCollision(this.runner, star)) {
                const value = star.userData.value;
                this.score += value;
                this.chapterStarsCollected += value;
                this.playerStats.totalStars += value;
                
                // Broadcast to modules
                this.modules.broadcast('onCollectible', star);
                
                this.scene.remove(star);
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Remove if off-screen
            if (obstacle.position.z > this.runner.position.z + 5) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Check collision with runner
            if (this.checkCollision(this.runner, obstacle)) {
                const damage = Math.floor(obstacle.userData.damage * (2 - this.playerStats.dodge));
                this.playerStats.hp -= damage;
                
                // Broadcast to modules
                this.modules.broadcast('onObstacleHit', obstacle);
                
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
                
                // Flash effect
                this.runner.children[0].material.emissive.setHex(0xff0000);
                setTimeout(() => {
                    if (this.runner && this.runner.children[0]) {
                        this.runner.children[0].material.emissive.setHex(0x000000);
                    }
                }, 100);
                
                if (this.playerStats.hp <= 0) {
                    this.endChapter(false);
                }
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        const distance = obj1.position.distanceTo(obj2.position);
        return distance < 0.4;
    }
    
    updateChapterInfo() {
        const chapter = this.chapterGoals[this.playerStats.chapter - 1];
        const goal = chapter ? chapter.distance : 4000;
        const era = Math.ceil(this.playerStats.chapter / 3.33);
        
        document.getElementById('chapterInfo').textContent = 
            `Chapter ${this.playerStats.chapter}: ${chapter ? chapter.name : 'Unknown'} (Era ${era})`;
        
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        const stats = `
            <div class="stat-item"><strong>HP:</strong> ${this.playerStats.maxHp}</div>
            <div class="stat-item"><strong>Speed:</strong> ${(this.playerStats.speed * 100).toFixed(0)}%</div>
            <div class="stat-item"><strong>Dodge:</strong> ${(this.playerStats.dodge * 100).toFixed(0)}%</div>
            <div class="stat-item"><strong>Stars:</strong> ${this.playerStats.totalStars}</div>
        `;
        document.getElementById('playerStats').innerHTML = stats;
    }
    
    startGame() {
        this.hideAllMenus();
        this.gameState = 'playing';
        
        // Reset for new chapter
        this.score = 0;
        this.distance = 0;
        this.currentChapterDistance = 0;
        this.chapterStarsCollected = 0;
        this.playerStats.hp = this.playerStats.maxHp;
        
        // Clear existing obstacles and collectibles
        this.obstacles.forEach(o => this.scene.remove(o));
        this.collectibles.forEach(c => this.scene.remove(c));
        this.obstacles = [];
        this.collectibles = [];
        
        // Reset runner position
        if (this.runner) {
            this.runner.position.set(0, 0, 0);
        }
        this.currentLane = 1;
        this.targetLane = 1;
        this.nextSegmentZ = 0;
        this.spawnTimer = 0;
        
        // Broadcast to modules
        this.modules.broadcast('onGameStart');
    }
    
    endChapter(success) {
        this.gameState = 'gameover';
        
        if (success) {
            // Calculate rewards
            const bonusStars = Math.floor(this.chapterStarsCollected * 1.5);
            this.playerStats.totalStars += bonusStars;
            
            // Broadcast to modules
            this.modules.broadcast('onChapterComplete');
            
            // Advance to next chapter
            if (this.playerStats.chapter < 10) {
                this.playerStats.chapter++;
            }
            
            this.showUpgradeScreen();
        } else {
            // Failed chapter
            const stats = `
                Distance: ${Math.floor(this.currentChapterDistance)}m<br>
                Stars Collected: ${this.chapterStarsCollected}<br>
                <br>You were defeated by the defense!
            `;
            document.getElementById('gameOverStats').innerHTML = stats;
            document.getElementById('gameOverScreen').classList.add('active');
        }
    }
    
    showUpgradeScreen() {
        const chapter = this.chapterGoals[this.playerStats.chapter - 1];
        const upgrades = [
            { name: 'Max HP', stat: 'maxHp', increase: 20, cost: 50 },
            { name: 'Speed', stat: 'speed', increase: 0.05, cost: 50 },
            { name: 'Dodge', stat: 'dodge', increase: 0.1, cost: 75 },
            { name: 'Star Multiplier', stat: 'starMultiplier', increase: 0.2, cost: 100 }
        ];
        
        let upgradeHTML = `<strong>Stars Earned:</strong> ${this.chapterStarsCollected}<br><strong>Total Stars:</strong> ${this.playerStats.totalStars}<br><br>`;
        
        upgrades.forEach((upgrade, idx) => {
            const canAfford = this.playerStats.totalStars >= upgrade.cost;
            const className = canAfford ? 'stat-upgrade' : 'stat-upgrade' + ' disabled';
            upgradeHTML += `
                <div class="${className}">
                    <div>
                        <strong>${upgrade.name}</strong><br>
                        <small>Cost: ${upgrade.cost} ⭐</small>
                    </div>
                    <button onclick="game.purchaseUpgrade('${upgrade.stat}', ${upgrade.increase}, ${upgrade.cost})" 
                            ${!canAfford ? 'disabled' : ''}>Buy</button>
                </div>
            `;
        });
        
        document.getElementById('upgradeInfo').innerHTML = 
            `Great! You completed the chapter! Upgrade your stats with stars.`;
        document.getElementById('upgradeOptions').innerHTML = upgradeHTML;
        document.getElementById('upgradeScreen').classList.add('active');
        this.updateChapterInfo();
    }
    
    purchaseUpgrade(stat, increase, cost) {
        if (this.playerStats.totalStars >= cost) {
            this.playerStats.totalStars -= cost;
            this.playerStats[stat] += increase;
            
            // Refresh upgrade screen
            this.showUpgradeScreen();
        }
    }
    
    showMainMenu() {
        this.hideAllMenus();
        this.gameState = 'menu';
        document.getElementById('mainMenu').classList.add('active');
        this.updateChapterInfo();
    }
    
    hideAllMenus() {
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('upgradeScreen').classList.remove('active');
        document.getElementById('gameOverScreen').classList.remove('active');
        document.getElementById('leaderboardScreen').classList.remove('active');
    }
    
    toggleLeaderboard() {
        const leaderboard = document.getElementById('leaderboardScreen');
        const main = document.getElementById('mainMenu');
        
        if (leaderboard.classList.contains('active')) {
            leaderboard.classList.remove('active');
            main.classList.add('active');
        } else {
            main.classList.remove('active');
            leaderboard.classList.add('active');
            this.updateLeaderboardDisplay();
        }
    }
    
    updateLeaderboardDisplay() {
        const leaderboardModule = this.modules.getModule('leaderboard');
        if (leaderboardModule) {
            document.getElementById('leaderboardContent').innerHTML = leaderboardModule.getStatsHtml();
        }
    }
    
    update() {
        if (this.gameState !== 'playing') {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        this.updateRunner();
        this.spawnGameElements();
        this.updateCollectibles();
        this.updateObstacles();
        
        // Update all modules
        this.modules.update();
        
        // Check chapter goal
        const chapter = this.chapterGoals[this.playerStats.chapter - 1];
        if (chapter && this.currentChapterDistance >= chapter.distance) {
            this.endChapter(true);
        }
        
        // Update HUD
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('starDisplay').textContent = this.chapterStarsCollected;
        document.getElementById('hpDisplay').textContent = this.playerStats.hp;
        document.getElementById('distanceDisplay').textContent = Math.floor(this.currentChapterDistance);
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    animate = () => {
        requestAnimationFrame(this.animate);
        this.update();
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
    game.showMainMenu();
});
