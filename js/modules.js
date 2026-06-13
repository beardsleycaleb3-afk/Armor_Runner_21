// ============================================================================
// MODULAR PLUGIN SYSTEM - For Easy Feature Integration
// ============================================================================
// This allows particle effects, leaderboards, and other features to integrate
// seamlessly without cluttering the main game engine

class GameModule {
    constructor(game) {
        this.game = game;
    }

    init() {}
    update() {}
    onGameStart() {}
    onGamePause() {}
    onGameResume() {}
    onChapterComplete() {}
    onCollectible(collectible) {}
    onObstacleHit(obstacle) {}
    cleanup() {}
}

class ModuleManager {
    constructor(game) {
        this.game = game;
        this.modules = [];
        this.moduleMap = {};
    }

    register(name, moduleClass) {
        const module = new moduleClass(this.game);
        module.init();
        this.modules.push(module);
        this.moduleMap[name] = module;
        console.log(`[Module] Registered: ${name}`);
        return module;
    }

    getModule(name) {
        return this.moduleMap[name];
    }

    update() {
        this.modules.forEach(m => m.update());
    }

    broadcast(event, ...args) {
        this.modules.forEach(m => {
            if (typeof m[event] === 'function') {
                m[event](...args);
            }
        });
    }

    cleanup() {
        this.modules.forEach(m => m.cleanup());
        this.modules = [];
        this.moduleMap = {};
    }
}

// ============================================================================
// PARTICLE EFFECTS MODULE
// ============================================================================

class ParticleEffect extends GameModule {
    init() {
        this.particles = [];
    }

    createParticles(position, type = 'burst', color = 0xff6600, count = 8) {
        const particles = [];

        for (let i = 0; i < count; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(position);

            // Different burst patterns
            let velocity;
            if (type === 'burst') {
                const angle = (i / count) * Math.PI * 2;
                const radius = 0.15;
                velocity = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.random() * 1.5,
                    Math.sin(angle) * radius
                );
            } else if (type === 'star') {
                velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 0.5
                );
            } else {
                velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 1,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 1
                );
            }

            particle.velocity = velocity;
            particle.life = 60; // frames
            particle.maxLife = 60;
            particle.type = type;

            this.game.scene.add(particle);
            particles.push(particle);
        }

        this.particles.push(...particles);
        return particles;
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.position.add(p.velocity);
            p.velocity.y -= 0.15; // gravity
            p.life--;

            // Fade out
            p.material.opacity = p.life / p.maxLife;
            p.material.transparent = true;

            // Scale down
            const scale = p.life / p.maxLife;
            p.scale.setScalar(scale);

            if (p.life <= 0) {
                this.game.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }

    onCollectible(collectible) {
        // Gold particles for collectibles
        this.createParticles(collectible.position, 'star', 0xffff00, 6);
    }

    onObstacleHit(obstacle) {
        // Red impact particles
        this.createParticles(obstacle.position, 'burst', 0xff3333, 10);
    }

    cleanup() {
        this.particles.forEach(p => this.game.scene.remove(p));
        this.particles = [];
    }
}

// ============================================================================
// LEADERBOARD / SCOREBOARD MODULE
// ============================================================================

class LeaderboardModule extends GameModule {
    init() {
        this.scores = this.loadScores();
        this.currentScore = 0;
        this.currentChapterStars = 0;
    }

    onGameStart() {
        this.currentScore = 0;
        this.currentChapterStars = 0;
    }

    onCollectible(collectible) {
        const value = collectible.userData.value || 10;
        this.currentScore += value;
        this.currentChapterStars += value;
    }

    onChapterComplete() {
        // Save score if it's a high score
        const totalScore = this.game.playerStats.totalStars + this.currentScore;
        
        this.scores.push({
            chapter: this.game.playerStats.chapter,
            score: this.currentScore,
            stars: this.currentChapterStars,
            distance: Math.floor(this.game.currentChapterDistance),
            timestamp: Date.now(),
            era: Math.ceil(this.game.playerStats.chapter / 3.33)
        });

        // Keep only top 50 scores
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 50);

        this.saveScores();
    }

    saveScores() {
        try {
            localStorage.setItem('running_back_scores', JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Could not save scores:', e);
        }
    }

    loadScores() {
        try {
            const saved = localStorage.getItem('running_back_scores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Could not load scores:', e);
            return [];
        }
    }

    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }

    getChapterBest(chapterNum) {
        const chapterScores = this.scores.filter(s => s.chapter === chapterNum);
        return chapterScores.length > 0 ? chapterScores[0] : null;
    }

    getEraBest(era) {
        const eraScores = this.scores.filter(s => s.era === era);
        return eraScores.length > 0 ? eraScores[0] : null;
    }

    getStatsHtml() {
        const top10 = this.getTopScores(10);
        if (top10.length === 0) {
            return '<div class="info-text">No scores yet. Play to set records!</div>';
        }

        let html = '<div style="font-size: 12px; max-height: 250px; overflow-y: auto;">';
        html += '<table style="width: 100%; text-align: left;">';
        html += '<tr style="border-bottom: 1px solid #666;"><th>#</th><th>Ch</th><th>Score</th><th>Dist</th></tr>';

        top10.forEach((score, idx) => {
            html += `<tr style="border-bottom: 1px solid #333;">
                <td>${idx + 1}</td>
                <td>${score.chapter}</td>
                <td>${score.score}</td>
                <td>${score.distance}m</td>
            </tr>`;
        });

        html += '</table></div>';
        return html;
    }

    update() {
        // Update current score in game stats if needed
        if (this.game.gameState === 'playing') {
            this.game.score = this.currentScore;
        }
    }
}

// ============================================================================
// COMBO SYSTEM MODULE
// ============================================================================

class ComboModule extends GameModule {
    init() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 120; // frames
        this.lastStarZ = Infinity;
    }

    onGameStart() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastStarZ = Infinity;
    }

    onCollectible(collectible) {
        const starDistance = Math.abs(this.lastStarZ - collectible.position.z);

        if (starDistance < 8) {
            this.comboCount++;
            this.comboTimer = this.comboMaxTime;
            const bonusMultiplier = 1 + this.comboCount * 0.1;
            collectible.userData.value = Math.floor(collectible.userData.value * bonusMultiplier);

            // Particle burst for combo!
            if (this.comboCount % 5 === 0) {
                const particles = this.game.modules.getModule('particles');
                if (particles) {
                    particles.createParticles(collectible.position, 'burst', 0x00ff00, 15);
                }
            }
        } else {
            this.comboCount = 0;
        }

        this.lastStarZ = collectible.position.z;
    }

    update() {
        if (this.comboCount > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Update UI
        const comboDisplay = document.getElementById('comboDisplay');
        const comboCount = document.getElementById('comboCount');
        if (comboDisplay && comboCount && this.comboCount > 0) {
            comboDisplay.style.display = 'inline';
            comboCount.textContent = this.comboCount;
        } else if (comboDisplay) {
            comboDisplay.style.display = 'none';
        }
    }

    getCombo() {
        return this.comboCount;
    }
}

// ============================================================================
// VISUAL EFFECTS MODULE (Flashes, color changes, etc.)
// ============================================================================

class VisualEffectsModule extends GameModule {
    init() {
        this.screenFlash = null;
    }

    flashScreen(color = 0xff0000, duration = 100) {
        // Create a flash overlay
        if (!this.screenFlash) {
            const geometry = new THREE.PlaneGeometry(10, 10);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0
            });
            this.screenFlash = new THREE.Mesh(geometry, material);
            this.screenFlash.position.z = -0.5;
            this.game.scene.add(this.screenFlash);
        }

        this.screenFlash.material.color.setHex(color);
        this.screenFlash.material.opacity = 0.5;

        setTimeout(() => {
            if (this.screenFlash) {
                this.screenFlash.material.opacity = 0;
            }
        }, duration);
    }

    onObstacleHit(obstacle) {
        this.flashScreen(0xff3333, 150);
        
        // Knockback effect on runner
        if (this.game.runner) {
            const originalX = this.game.runner.position.x;
            this.game.runner.position.x += (Math.random() - 0.5) * 0.3;
            
            setTimeout(() => {
                if (this.game.runner) {
                    this.game.runner.position.x = originalX;
                }
            }, 50);
        }
    }

    cleanup() {
        if (this.screenFlash) {
            this.game.scene.remove(this.screenFlash);
        }
    }
}
