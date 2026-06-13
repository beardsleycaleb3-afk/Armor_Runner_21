/**
 * Power-ups System Module
 * Handles shield, speed, and magnet power-up mechanics
 * Integrates with game state and particles
 */

class PowerUpModule extends GameModule {
  constructor() {
    super();
    this.activePowerUps = new Map(); // powerupId -> { type, endTime, effect }
    this.spawnRate = 0.02; // 2% chance per collectible spawn
  }

  init(gameInstance) {
    super.init(gameInstance);
    
    // Listen for collectible pickups - chance to spawn power-ups
    this.gameInstance.modules.addEventListener('onCollectible', (star) => {
      if (Math.random() < this.spawnRate && this.activePowerUps.size < 3) {
        this.spawnPowerUp(star);
      }
    });

    // Listen for power-up collisions
    this.gameInstance.modules.addEventListener('onPowerUpCollected', (powerup) => {
      this.activatePowerUp(powerup);
    });
  }

  /**
   * Spawn a random power-up near a collected star position
   */
  spawnPowerUp(star) {
    const types = ['shield', 'speed', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerup = {
      id: `powerup_${Date.now()}_${Math.random()}`,
      type: type,
      position: new THREE.Vector3(
        star.position.x,
        star.position.y + 0.3,
        star.position.z
      ),
      geometry: this.createPowerUpGeometry(type),
      material: this.createPowerUpMaterial(type),
      mesh: null,
      rotation: 0,
      collected: false,
    };

    powerup.mesh = new THREE.Mesh(powerup.geometry, powerup.material);
    powerup.mesh.position.copy(powerup.position);
    powerup.mesh.castShadow = true;
    powerup.mesh.receiveShadow = true;
    
    this.gameInstance.scene.add(powerup.mesh);
    
    // Store in game instance
    if (!this.gameInstance.powerups) {
      this.gameInstance.powerups = [];
    }
    this.gameInstance.powerups.push(powerup);

    // Broadcast creation
    this.gameInstance.modules.broadcast('onPowerUpSpawned', powerup);
  }

  /**
   * Create geometry for power-up based on type
   */
  createPowerUpGeometry(type) {
    switch(type) {
      case 'shield':
        // Shield - octahedron
        return new THREE.OctahedronGeometry(0.25, 2);
      case 'speed':
        // Speed - thin cylinder (lightning bolt-like)
        return new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
      case 'magnet':
        // Magnet - cylinder with split
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12)));
        return group;
      default:
        return new THREE.IcosahedronGeometry(0.2);
    }
  }

  /**
   * Create material for power-up based on type
   */
  createPowerUpMaterial(type) {
    const materials = {
      shield: new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x0055ff,
        emissiveIntensity: 0.5,
      }),
      speed: new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0xff6600,
        emissiveIntensity: 0.6,
      }),
      magnet: new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xaa0000,
        emissiveIntensity: 0.5,
      }),
    };
    
    return materials[type] || materials.shield;
  }

  /**
   * Activate a collected power-up
   */
  activatePowerUp(powerup) {
    const duration = 8000; // 8 seconds
    const now = Date.now();
    const endTime = now + duration;

    this.activePowerUps.set(powerup.id, {
      type: powerup.type,
      endTime: endTime,
      effect: this.createEffect(powerup.type),
    });

    // Create visual effect
    this.gameInstance.modules.broadcast('onPowerUpActivated', powerup);

    // Create particles
    const particle = this.gameInstance.modules.getModule('particles');
    if (particle) {
      particle.createParticles(powerup.mesh.position, 'burst', this.getColorForType(powerup.type), 20);
    }

    // Apply game effect
    switch(powerup.type) {
      case 'shield':
        if (!this.gameInstance.player.shieldActive) {
          this.gameInstance.player.shieldActive = true;
          this.gameInstance.player.shieldEndTime = endTime;
        }
        break;
      case 'speed':
        this.gameInstance.speedBoostEndTime = endTime;
        this.gameInstance.baseSpeed = GAME_CONFIG.GAME_SPEED * 1.5; // 50% faster
        break;
      case 'magnet':
        this.gameInstance.magnetEndTime = endTime;
        break;
    }
  }

  /**
   * Create activation effect object
   */
  createEffect(type) {
    return {
      type: type,
      particles: 10,
      intensity: 0.8,
    };
  }

  /**
   * Get color for power-up type
   */
  getColorForType(type) {
    const colors = {
      shield: 0x00aaff,
      speed: 0xffaa00,
      magnet: 0xff0000,
    };
    return colors[type] || 0x00aaff;
  }

  /**
   * Update power-ups each frame
   */
  update() {
    if (!this.gameInstance.powerups) return;

    const now = Date.now();

    // Update power-up rotation and position
    for (let i = this.gameInstance.powerups.length - 1; i >= 0; i--) {
      const powerup = this.gameInstance.powerups[i];
      
      if (!powerup.collected) {
        // Rotate power-up
        powerup.rotation += 0.05;
        powerup.mesh.rotation.y = powerup.rotation;
        
        // Bob up and down
        powerup.mesh.position.y = powerup.position.y + Math.sin(Date.now() * 0.005) * 0.15;

        // Check collision with runner
        if (this.checkPowerUpCollision(powerup)) {
          this.collectPowerUp(powerup, now);
        }

        // Remove if off-screen
        if (powerup.mesh.position.z < -15) {
          this.gameInstance.scene.remove(powerup.mesh);
          this.gameInstance.powerups.splice(i, 1);
        }
      }
    }

    // Update active power-up durations
    this.activePowerUps.forEach((effect, id) => {
      if (now > effect.endTime) {
        this.deactivatePowerUp(id);
      }
    });

    // Update player shield visual
    if (this.gameInstance.player.shieldActive) {
      this.updateShieldVisual();
    }
  }

  /**
   * Check if power-up collides with runner
   */
  checkPowerUpCollision(powerup) {
    const distance = this.gameInstance.player.mesh.position.distanceTo(powerup.mesh.position);
    return distance < 0.5;
  }

  /**
   * Collect a power-up
   */
  collectPowerUp(powerup, now) {
    powerup.collected = true;
    
    this.gameInstance.modules.broadcast('onPowerUpCollected', powerup);
    
    this.gameInstance.scene.remove(powerup.mesh);
    
    // Remove from array
    const index = this.gameInstance.powerups.indexOf(powerup);
    if (index > -1) {
      this.gameInstance.powerups.splice(index, 1);
    }
  }

  /**
   * Deactivate a power-up effect
   */
  deactivatePowerUp(id) {
    const effect = this.activePowerUps.get(id);
    if (!effect) return;

    switch(effect.type) {
      case 'shield':
        this.gameInstance.player.shieldActive = false;
        break;
      case 'speed':
        this.gameInstance.baseSpeed = GAME_CONFIG.GAME_SPEED;
        break;
      case 'magnet':
        // Magnet effect ends naturally
        break;
    }

    this.activePowerUps.delete(id);
    this.gameInstance.modules.broadcast('onPowerUpExpired', { id, type: effect.type });
  }

  /**
   * Update shield visual effect around player
   */
  updateShieldVisual() {
    if (!this.gameInstance.player.shieldMesh) {
      // Create shield mesh
      const geometry = new THREE.IcosahedronGeometry(0.5, 4);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        wireframe: true,
        emissive: 0x0055ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.4,
      });
      
      this.gameInstance.player.shieldMesh = new THREE.Mesh(geometry, material);
      this.gameInstance.scene.add(this.gameInstance.player.shieldMesh);
    }

    // Update shield position and rotation
    this.gameInstance.player.shieldMesh.position.copy(this.gameInstance.player.mesh.position);
    this.gameInstance.player.shieldMesh.rotation.x += 0.02;
    this.gameInstance.player.shieldMesh.rotation.y += 0.03;

    // Pulse effect
    const pulse = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
    this.gameInstance.player.shieldMesh.material.opacity = pulse;
  }

  /**
   * Get active power-ups info for HUD
   */
  getActiveInfo() {
    const now = Date.now();
    const info = [];

    this.activePowerUps.forEach((effect, id) => {
      const remaining = Math.max(0, (effect.endTime - now) / 1000);
      info.push({
        type: effect.type,
        remaining: remaining.toFixed(1),
      });
    });

    return info;
  }

  cleanup() {
    if (this.gameInstance.player && this.gameInstance.player.shieldMesh) {
      this.gameInstance.scene.remove(this.gameInstance.player.shieldMesh);
    }
    this.activePowerUps.clear();
  }
}
