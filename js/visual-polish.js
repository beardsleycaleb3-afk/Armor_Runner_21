/**
 * Visual Polish Module - Enhanced graphics and animations
 * Adds polish to obstacles, particles, and screen effects
 */

class VisualPolishModule extends GameModule {
  constructor() {
    super();
    this.screenFlashes = [];
    this.shakeIntensity = 0;
    this.glowObjects = [];
  }

  init(gameInstance) {
    super.init(gameInstance);

    this.gameInstance.modules.addEventListener('onObstacleHit', (obstacle) => {
      this.impactEffect(obstacle);
    });

    this.gameInstance.modules.addEventListener('onCollectible', (collectible) => {
      this.collectEffect(collectible);
    });

    this.gameInstance.modules.addEventListener('onPowerUpCollected', (powerup) => {
      this.powerUpEffect(powerup);
    });

    this.gameInstance.modules.addEventListener('onGameStart', () => {
      this.gameStartEffect();
    });

    this.gameInstance.modules.addEventListener('onChapterComplete', () => {
      this.victoryEffect();
    });
  }

  /**
   * Enhanced impact effect for obstacle hits
   */
  impactEffect(obstacle) {
    // Screen shake
    this.shakeScreen(0.3, 100);

    // Flash effect
    this.flashScreen(0xff3333, 150);

    // Knockback animation
    if (this.gameInstance.player) {
      const originalPos = this.gameInstance.player.mesh.position.clone();
      const direction = originalPos.clone().sub(obstacle.position).normalize();
      
      const knockback = direction.multiplyScalar(0.4);
      this.gameInstance.player.mesh.position.add(knockback);

      // Animate back
      setTimeout(() => {
        if (this.gameInstance.player) {
          this.gameInstance.player.mesh.position.copy(originalPos);
        }
      }, 50);
    }

    // Add glow to obstacle momentarily
    if (obstacle.material) {
      const originalEmissive = obstacle.material.emissive.getHex();
      const originalIntensity = obstacle.material.emissiveIntensity;
      
      obstacle.material.emissive.setHex(0xffaa00);
      obstacle.material.emissiveIntensity = 1;

      setTimeout(() => {
        if (obstacle.material) {
          obstacle.material.emissive.setHex(originalEmissive);
          obstacle.material.emissiveIntensity = originalIntensity;
        }
      }, 100);
    }

    // Particle burst
    const particles = this.gameInstance.modules.getModule('particles');
    if (particles) {
      particles.createParticles(obstacle.position, 'impact', 0xff3333, 15);
    }
  }

  /**
   * Collect effect for stars
   */
  collectEffect(collectible) {
    // Scale animation
    this.animateScale(collectible, 1.0, 1.3, 100);

    // Glow effect
    if (collectible.material) {
      const originalIntensity = collectible.material.emissiveIntensity;
      collectible.material.emissiveIntensity = 1;

      setTimeout(() => {
        if (collectible.material) {
          collectible.material.emissiveIntensity = originalIntensity;
        }
      }, 100);
    }

    // Particles
    const particles = this.gameInstance.modules.getModule('particles');
    if (particles) {
      particles.createParticles(collectible.position, 'star', 0xffff00, 12);
    }
  }

  /**
   * Power-up collection effect
   */
  powerUpEffect(powerup) {
    const colorMap = {
      shield: 0x00aaff,
      speed: 0xffaa00,
      magnet: 0xff0000,
    };

    const color = colorMap[powerup.type] || 0x00aaff;

    // Screen flash
    this.flashScreen(color, 200);

    // Screen shake
    this.shakeScreen(0.5, 150);

    // Large particle burst
    const particles = this.gameInstance.modules.getModule('particles');
    if (particles) {
      particles.createParticles(powerup.position, 'burst', color, 30);
    }

    // Add temporary glow effect
    this.addTemporaryGlow(powerup.mesh);
  }

  /**
   * Game start effect
   */
  gameStartEffect() {
    // Bright flash
    this.flashScreen(0xffffff, 300, 0.5);

    // Gentle shake
    this.shakeScreen(0.2, 200);
  }

  /**
   * Victory effect for chapter completion
   */
  victoryEffect() {
    // Triple flash
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.flashScreen(0xffff00, 200);
      }, i * 300);
    }

    // Shake pattern
    this.shakeScreen(0.3, 400);

    // Victory particle burst
    const particles = this.gameInstance.modules.getModule('particles');
    if (particles && this.gameInstance.player) {
      particles.createParticles(this.gameInstance.player.mesh.position, 'burst', 0xffff00, 50);
    }
  }

  /**
   * Screen shake effect
   */
  shakeScreen(intensity, duration) {
    this.shakeIntensity = intensity;
    const startTime = Date.now();
    const originalCameraPos = this.gameInstance.camera.position.clone();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        // Apply random shake
        this.gameInstance.camera.position.x = originalCameraPos.x + (Math.random() - 0.5) * intensity;
        this.gameInstance.camera.position.y = originalCameraPos.y + (Math.random() - 0.5) * intensity;

        requestAnimationFrame(shake);
      } else {
        // Return to original position
        this.gameInstance.camera.position.copy(originalCameraPos);
        this.shakeIntensity = 0;
      }
    };

    requestAnimationFrame(shake);
  }

  /**
   * Screen flash effect
   */
  flashScreen(color, duration, alpha = 0.7) {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / (duration / 2));

      // Calculate opacity curve (up then down)
      let opacity;
      if (progress < 0.5) {
        opacity = alpha * (progress * 2);
      } else {
        opacity = alpha * (2 - progress * 2);
      }

      // Clear and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${opacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (elapsed < duration) {
        requestAnimationFrame(render);
      }
    };

    // Add as overlay element
    if (!this.flashOverlay) {
      this.flashOverlay = document.createElement('div');
      this.flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
      `;
      document.body.appendChild(this.flashOverlay);
    }

    this.flashOverlay.innerHTML = '';
    this.flashOverlay.appendChild(canvas);

    render();

    setTimeout(() => {
      this.flashOverlay.innerHTML = '';
    }, duration);
  }

  /**
   * Scale animation helper
   */
  animateScale(object, startScale, endScale, duration) {
    const startTime = Date.now();
    const originalScale = object.scale.x;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      object.scale.set(
        startScale + (endScale - startScale) * progress,
        startScale + (endScale - startScale) * progress,
        startScale + (endScale - startScale) * progress
      );

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        object.scale.set(originalScale, originalScale, originalScale);
      }
    };

    animate();
  }

  /**
   * Add temporary glow effect
   */
  addTemporaryGlow(mesh) {
    if (mesh.material) {
      const originalEmissive = mesh.material.emissive.getHex();
      const originalIntensity = mesh.material.emissiveIntensity;

      // Glow animation
      const startTime = Date.now();
      const duration = 500;

      const glow = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          // Pulsing glow
          const intensity = 0.5 + Math.sin(progress * Math.PI * 4) * 0.5;
          mesh.material.emissiveIntensity = originalIntensity + intensity;
          requestAnimationFrame(glow);
        } else {
          mesh.material.emissive.setHex(originalEmissive);
          mesh.material.emissiveIntensity = originalIntensity;
        }
      };

      glow();
    }
  }

  /**
   * Add obstacle-specific polish
   */
  polishObstacle(obstacle) {
    // Make obstacles have more visual presence
    if (obstacle.material) {
      obstacle.material.emissive.setHex(0x440000);
      obstacle.material.emissiveIntensity = 0.3;
    }

    // Add slight rotation
    obstacle.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
  }

  /**
   * Pulse effect for collectibles
   */
  pulseCollectible(collectible) {
    let pulse = 0;
    const animate = () => {
      pulse += 0.1;
      const scale = 1 + Math.sin(pulse) * 0.1;
      collectible.scale.set(scale, scale, scale);

      if (this.gameInstance && this.gameInstance.gameState === 'playing') {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * Update each frame
   */
  update() {
    // Can add per-frame visual updates here if needed
  }

  cleanup() {
    if (this.flashOverlay) {
      this.flashOverlay.remove();
    }
    this.screenFlashes = [];
    this.glowObjects = [];
  }
}
