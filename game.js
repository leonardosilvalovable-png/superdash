// Super Dash - Main Game Engine

class SuperDash {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Game States
    this.states = {
      MENU: 'menu',
      LEVEL_SELECT: 'level_select',
      PLAYING: 'playing',
      CHARACTER_SELECT: 'character_select',
      SETTINGS: 'settings',
      GAMEOVER: 'gameover',
      WIN: 'win'
    };
    this.currentState = this.states.MENU;
    
    // Player Configuration
    this.player = {
      x: 100,
      y: 0,
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      isGrounded: false,
      rotation: 0,
      mode: 'cube', // 'cube' or 'ship'
      color: '#eab308', // Yellow default
      face: 'smiley', // Smiley face default
      trail: 'particles',
      isDead: false
    };

    // Physics constants
    this.physics = {
      gravity: 0.65,
      shipGravity: 0.35,
      jumpForce: -12.5,
      shipThrust: -0.7,
      maxFallSpeed: 15,
      maxShipSpeed: 7,
      gridSize: 50,
      floorY: 440 // floor y coordinate
    };

    // Camera
    this.cameraX = 0;
    this.cameraOffsetX = 150; // Player distance from left edge

    // Controls
    this.keys = {};
    this.isActionPressed = false;
    this.lastActionPressed = false; // For single-press detection (like rings)
    
    // Settings
    this.settings = {
      musicVolume: 0.8,
      sfxEnabled: true,
      musicEnabled: true,
      practiceMode: false,
      speedPreset: 'normal' // 'slow', 'normal', 'fast'
    };

    // Level progression
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.progressPercent = 0;
    this.highScores = [0, 0, 0]; // Records for levels 1, 2, 3

    // Practice mode checkpoints
    this.checkpoints = [];
    this.lastCheckpointTime = 0;

    // Visual Effects Arrays
    this.particles = [];
    this.trailParticles = [];
    this.bgParticles = [];
    
    // Customization preview rotation for animated feel
    this.previewRotation = 0;

    // Load High Scores from LocalStorage
    this.loadData();
    
    // Bind UI Events
    this.bindUIEvents();
    
    // Initialize loops
    this.initCanvasSize();
    this.initBgParticles();
    
    // Start game loop
    this.lastTime = 0;
    requestAnimationFrame((t) => this.loop(t));
  }

  // DATA SAVING/LOADING
  loadData() {
    const savedScores = localStorage.getItem('superdash_records');
    if (savedScores) {
      try {
        this.highScores = JSON.parse(savedScores);
      } catch (e) {
        console.error("Error loading scores", e);
      }
    }
    const savedSkinColor = localStorage.getItem('superdash_skin_color');
    if (savedSkinColor) this.player.color = savedSkinColor;
    const savedSkinFace = localStorage.getItem('superdash_skin_face');
    if (savedSkinFace) this.player.face = savedSkinFace;
    const savedSkinTrail = localStorage.getItem('superdash_skin_trail');
    if (savedSkinTrail) this.player.trail = savedSkinTrail;
  }

  saveData() {
    localStorage.setItem('superdash_records', JSON.stringify(this.highScores));
    localStorage.setItem('superdash_skin_color', this.player.color);
    localStorage.setItem('superdash_skin_face', this.player.face);
    localStorage.setItem('superdash_skin_trail', this.player.trail);
  }

  // CANVAS & VIEWPORT
  initCanvasSize() {
    // Canvas dimensions are fixed to 960x540 internally, scaled via CSS
    this.canvas.width = 960;
    this.canvas.height = 540;
  }

  initBgParticles() {
    this.bgParticles = [];
    for (let i = 0; i < 40; i++) {
      this.bgParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.physics.floorY - 50),
        size: Math.random() * 3 + 1,
        speedX: -(Math.random() * 0.5 + 0.2),
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  // STATE TRANSITIONS
  changeState(newState) {
    // Deactivate all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    this.currentState = newState;
    
    // Hide HUD overlay by default
    document.getElementById('hud-overlay').classList.remove('active');

    // UI overlays based on states
    if (newState === this.states.MENU) {
      document.getElementById('main-menu-screen').classList.add('active');
      window.audioSynth.stopMusic();
    } 
    else if (newState === this.states.LEVEL_SELECT) {
      this.updateLevelCard();
      document.getElementById('level-select-screen').classList.add('active');
    } 
    else if (newState === this.states.CHARACTER_SELECT) {
      document.getElementById('character-select-screen').classList.add('active');
      this.drawCharacterPreview();
    } 
    else if (newState === this.states.SETTINGS) {
      document.getElementById('settings-screen').classList.add('active');
      // Set UI state values
      document.getElementById('check-setting-music').checked = this.settings.musicEnabled;
      document.getElementById('check-setting-sfx').checked = this.settings.sfxEnabled;
      document.getElementById('check-setting-practice').checked = this.settings.practiceMode;
      document.getElementById('slider-setting-volume').value = this.settings.musicVolume;
      
      // Update active speed button
      document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.dataset.speed === this.settings.speedPreset) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } 
    else if (newState === this.states.PLAYING) {
      this.startLevel();
      
      document.getElementById('hud-overlay').classList.add('active');
      document.getElementById('hud-level-name').innerText = this.currentLevel.name;
      
      // Setup practice hud items
      const practiceBadge = document.getElementById('hud-practice-badge');
      const checkpointsHud = document.getElementById('hud-practice-checkpoints');
      
      if (this.settings.practiceMode) {
        practiceBadge.classList.add('active');
        checkpointsHud.classList.add('active');
        checkpointsHud.innerText = `Checkpoints: 0`;
      } else {
        practiceBadge.classList.remove('active');
        checkpointsHud.classList.remove('active');
      }
    } 
    else if (newState === this.states.GAMEOVER) {
      document.getElementById('game-over-screen').classList.add('active');
      document.getElementById('crash-percentage').innerText = `${Math.floor(this.progressPercent)}%`;
      window.audioSynth.stopMusic();
    } 
    else if (newState === this.states.WIN) {
      document.getElementById('level-completed-screen').classList.add('active');
      document.getElementById('win-level-name').innerText = this.currentLevel.name;
      
      // If there's a next level, show next level button
      const nextBtn = document.getElementById('btn-win-next');
      if (this.currentLevelIndex < window.LEVELS.length - 1) {
        nextBtn.style.display = 'block';
      } else {
        nextBtn.style.display = 'none';
      }
      
      window.audioSynth.stopMusic();
      window.audioSynth.playWin();
    }
  }

  // LEVEL SELECTION LOGIC
  updateLevelCard() {
    const level = window.LEVELS[this.currentLevelIndex];
    document.getElementById('card-level-num').innerText = `Nivel ${this.currentLevelIndex + 1}`;
    document.getElementById('card-level-name').innerText = level.name;
    
    const diffBadge = document.getElementById('card-level-diff');
    diffBadge.innerText = level.difficulty;
    diffBadge.className = 'level-difficulty'; // Reset
    
    if (level.difficulty === 'Fácil') diffBadge.classList.add('diff-easy');
    else if (level.difficulty === 'Normal') diffBadge.classList.add('diff-normal');
    else diffBadge.classList.add('diff-hard');

    const record = this.highScores[this.currentLevelIndex] || 0;
    document.getElementById('card-level-record').innerText = `${record}%`;
    document.getElementById('card-level-progress-fill').style.width = `${record}%`;
  }

  startLevel() {
    // Force blur active buttons and focus window to allow spacebar to jump
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.focus();

    this.currentLevel = window.LEVELS[this.currentLevelIndex];
    this.player.x = 100;
    this.player.y = this.physics.floorY - this.player.height;
    this.player.vx = this.currentLevel.speed;
    
    // Apply speed settings multiplier
    if (this.settings.speedPreset === 'slow') this.player.vx *= 0.8;
    else if (this.settings.speedPreset === 'fast') this.player.vx *= 1.25;

    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.rotation = 0;
    this.player.mode = 'cube';
    this.player.isDead = false;
    
    this.cameraX = 0;
    this.progressPercent = 0;
    this.checkpoints = [];
    this.particles = [];
    this.trailParticles = [];
    
    // Initialize audioSynth
    window.audioSynth.resume();
    window.audioSynth.startMusic(this.currentLevel.musicIdx);
  }

  restartCurrentLevel() {
    this.changeState(this.states.PLAYING);
  }

  crashPlayer() {
    if (this.player.isDead) return;
    this.player.isDead = true;
    window.audioSynth.playCrash();
    
    // Create explosion particles
    const color = this.player.color;
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() * 2 - 1) * 8,
        vy: (Math.random() * 2 - 1) * 8,
        size: Math.random() * 8 + 4,
        color: color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015,
        rotate: Math.random() * 0.1,
        angle: Math.random() * Math.PI * 2
      });
    }

    if (this.settings.practiceMode && this.checkpoints.length > 0) {
      // Instant respawn in practice mode at last checkpoint
      setTimeout(() => {
        this.respawnAtLastCheckpoint();
      }, 700);
    } else {
      // Show game over screen in normal mode
      // Save highscore
      if (this.progressPercent > (this.highScores[this.currentLevelIndex] || 0)) {
        this.highScores[this.currentLevelIndex] = Math.floor(this.progressPercent);
        this.saveData();
      }
      setTimeout(() => {
        this.changeState(this.states.GAMEOVER);
      }, 800);
    }
  }

  // PRACTICE MODE CHECKPOINTS
  placeCheckpoint() {
    if (!this.settings.practiceMode || this.player.isDead) return;
    
    // Limit checkpoints pacing to avoid spam
    const now = Date.now();
    if (now - this.lastCheckpointTime < 300) return;
    this.lastCheckpointTime = now;

    this.checkpoints.push({
      x: this.player.x,
      y: this.player.y,
      vy: this.player.vy,
      mode: this.player.mode,
      cameraX: this.cameraX,
      rotation: this.player.rotation,
      progress: this.progressPercent
    });

    document.getElementById('hud-practice-checkpoints').innerText = `Checkpoints: ${this.checkpoints.length}`;
    window.audioSynth.playPad(); // Small chime to confirm checkpoint placement
  }

  removeLastCheckpoint() {
    if (this.checkpoints.length > 0) {
      this.checkpoints.pop();
      document.getElementById('hud-practice-checkpoints').innerText = `Checkpoints: ${this.checkpoints.length}`;
      window.audioSynth.playJump();
    }
  }

  respawnAtLastCheckpoint() {
    if (this.checkpoints.length === 0) {
      this.startLevel();
      return;
    }
    
    const cp = this.checkpoints[this.checkpoints.length - 1];
    this.player.x = cp.x;
    this.player.y = cp.y;
    this.player.vy = cp.vy;
    this.player.mode = cp.mode;
    this.player.rotation = cp.rotation;
    this.player.isDead = false;
    
    this.cameraX = cp.cameraX;
    this.progressPercent = cp.progress;
    this.particles = [];
    this.trailParticles = [];
  }

  // INPUT & KEYBOARD / MOUSE HANDLING
  bindUIEvents() {
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Canvas Tap/Click to jump/thrust
    const triggerActionStart = (e) => {
      e.preventDefault();
      if (this.currentState === this.states.PLAYING) {
        this.isActionPressed = true;
      }
    };

    const triggerActionEnd = (e) => {
      e.preventDefault();
      if (this.currentState === this.states.PLAYING) {
        this.isActionPressed = false;
      }
    };

    this.canvas.addEventListener('mousedown', triggerActionStart);
    this.canvas.addEventListener('mouseup', triggerActionEnd);
    this.canvas.addEventListener('touchstart', triggerActionStart);
    this.canvas.addEventListener('touchend', triggerActionEnd);

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      // Jump triggers
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.isActionPressed = true;
        e.preventDefault();
      }

      // Practice mode hotkeys during gameplay
      if (this.currentState === this.states.PLAYING && this.settings.practiceMode) {
        if (e.code === 'KeyZ') { // Place checkpoint
          this.placeCheckpoint();
        }
        if (e.code === 'KeyX') { // Delete checkpoint
          this.removeLastCheckpoint();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.isActionPressed = false;
      }
    });

    // UI SCREEN NAVIGATION BUTTONS
    
    // Main Menu Buttons
    document.getElementById('btn-main-play').addEventListener('click', () => {
      window.audioSynth.resume();
      this.changeState(this.states.LEVEL_SELECT);
    });

    document.getElementById('btn-menu-char').addEventListener('click', () => {
      window.audioSynth.resume();
      this.changeState(this.states.CHARACTER_SELECT);
    });

    document.getElementById('btn-menu-settings').addEventListener('click', () => {
      window.audioSynth.resume();
      this.changeState(this.states.SETTINGS);
    });

    // Level Selection screen buttons
    document.getElementById('btn-level-back').addEventListener('click', () => {
      this.changeState(this.states.MENU);
    });

    document.getElementById('btn-level-prev').addEventListener('click', () => {
      this.currentLevelIndex--;
      if (this.currentLevelIndex < 0) this.currentLevelIndex = window.LEVELS.length - 1;
      this.updateLevelCard();
      window.audioSynth.playJump();
    });

    document.getElementById('btn-level-next').addEventListener('click', () => {
      this.currentLevelIndex++;
      if (this.currentLevelIndex >= window.LEVELS.length) this.currentLevelIndex = 0;
      this.updateLevelCard();
      window.audioSynth.playJump();
    });

    document.getElementById('btn-play-selected').addEventListener('click', () => {
      this.changeState(this.states.PLAYING);
    });

    // Settings screen buttons
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.changeState(this.states.MENU);
    });

    document.getElementById('check-setting-music').addEventListener('change', (e) => {
      this.settings.musicEnabled = e.target.checked;
      if (!this.settings.musicEnabled) {
        window.audioSynth.stopMusic();
      }
    });

    document.getElementById('check-setting-sfx').addEventListener('change', (e) => {
      this.settings.sfxEnabled = e.target.checked;
      window.audioSynth.sfxEnabled = this.settings.sfxEnabled;
    });

    document.getElementById('check-setting-practice').addEventListener('change', (e) => {
      this.settings.practiceMode = e.target.checked;
    });

    document.getElementById('slider-setting-volume').addEventListener('input', (e) => {
      this.settings.musicVolume = parseFloat(e.target.value);
      window.audioSynth.setMusicVolume(this.settings.musicVolume);
      window.audioSynth.setSFXVolume(this.settings.musicVolume);
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.settings.speedPreset = btn.dataset.speed;
        window.audioSynth.playJump();
      });
    });

    // Character customization screen selections
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.player.color = opt.dataset.color;
        this.saveData();
        this.drawCharacterPreview();
        window.audioSynth.playJump();
      });
    });

    document.querySelectorAll('.face-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.face-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.player.face = opt.dataset.face;
        this.saveData();
        this.drawCharacterPreview();
        window.audioSynth.playJump();
      });
    });

    document.querySelectorAll('.trail-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.trail-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.player.trail = opt.dataset.trail;
        this.saveData();
        window.audioSynth.playJump();
      });
    });

    document.getElementById('btn-char-back').addEventListener('click', () => {
      this.changeState(this.states.MENU);
    });

    // Game Over Retry/Menu
    document.getElementById('btn-crash-retry').addEventListener('click', () => {
      this.restartCurrentLevel();
    });
    
    document.getElementById('btn-crash-menu').addEventListener('click', () => {
      this.changeState(this.states.MENU);
    });

    // Win Screen Retry/Menu/Next
    document.getElementById('btn-win-retry').addEventListener('click', () => {
      this.restartCurrentLevel();
    });
    
    document.getElementById('btn-win-menu').addEventListener('click', () => {
      this.changeState(this.states.MENU);
    });

    document.getElementById('btn-win-next').addEventListener('click', () => {
      this.currentLevelIndex++;
      if (this.currentLevelIndex < window.LEVELS.length) {
        this.changeState(this.states.PLAYING);
      } else {
        this.changeState(this.states.MENU);
      }
    });

    // Sync skins visually with active selections in DOM
    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(opt => {
        if (opt.dataset.color === this.player.color) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      document.querySelectorAll('.face-option').forEach(opt => {
        if (opt.dataset.face === this.player.face) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      document.querySelectorAll('.trail-option').forEach(opt => {
        if (opt.dataset.trail === this.player.trail) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
    }, 100);
  }

  // CHARACTER PREVIEW IN SELECTION SCREEN
  drawCharacterPreview() {
    const canvas = document.getElementById('char-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw centered cube
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(this.previewRotation);
    
    this.drawCube(ctx, -30, -30, 60, 60, this.player.color, this.player.face);
    
    ctx.restore();
  }

  // GAME LOOP
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = (timestamp - this.lastTime) / 16.666; // Normalized delta time
    this.lastTime = timestamp;

    if (this.currentState === this.states.PLAYING) {
      this.update(dt);
      this.render();
    } else if (this.currentState === this.states.CHARACTER_SELECT) {
      // Rotate preview block slowly
      this.previewRotation += 0.015;
      this.drawCharacterPreview();
    } else if (this.currentState === this.states.MENU || this.currentState === this.states.LEVEL_SELECT || this.currentState === this.states.SETTINGS) {
      // Just render the background to look alive
      this.updateBgParticles(dt);
      this.renderMenuBackground();
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  // BACKGROUND AND PARTICLES
  updateBgParticles(dt) {
    this.bgParticles.forEach(p => {
      p.x += p.speedX * dt;
      if (p.x < -10) {
        p.x = this.canvas.width + 10;
        p.y = Math.random() * (this.physics.floorY - 50);
      }
    });
  }

  // GAME UPDATE (PHYSICS & COLLISIONS)
  update(dt) {
    if (this.player.isDead) {
      this.updateParticles(dt);
      return;
    }

    // 1. Move Player Horizontally
    this.player.x += this.player.vx * dt;
    
    // Camera scroll tracking player position
    this.cameraX = this.player.x - this.cameraOffsetX;

    // Check Win/Finish Condition
    const finishLineX = this.currentLevel.length * this.physics.gridSize;
    if (this.player.x >= finishLineX) {
      this.saveWinProgress();
      this.changeState(this.states.WIN);
      return;
    }

    // Progress percentage
    this.progressPercent = Math.min(100, (this.player.x / finishLineX) * 100);
    document.getElementById('hud-progress-fill').style.width = `${this.progressPercent}%`;
    document.getElementById('hud-progress-text').innerText = `${Math.floor(this.progressPercent)}%`;

    // 2. Physics & Gravity based on mode
    if (this.player.mode === 'cube') {
      // Cube gravity
      this.player.vy += this.physics.gravity * dt;
      if (this.player.vy > this.physics.maxFallSpeed) this.player.vy = this.physics.maxFallSpeed;
      
      // Tap to Jump
      if (this.isActionPressed && this.player.isGrounded) {
        this.player.vy = this.physics.jumpForce;
        window.audioSynth.playJump();
        
        // Spawn jump blast particles
        this.createJumpParticles();
      }

      this.player.y += this.player.vy * dt;
      this.player.isGrounded = false;

      // Smooth cube rotation animation in mid-air
      if (!this.player.isGrounded) {
        // Rotates by 90 degrees (Math.PI/2) per vertical speed cycle, looks cool
        this.player.rotation += 0.08 * dt;
      } else {
        // Snap rotation to nearest 90-degree angle when grounded
        const nearest90 = Math.round(this.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        this.player.rotation += (nearest90 - this.player.rotation) * 0.3 * dt;
      }

    } else if (this.player.mode === 'ship') {
      // Ship Mode physics
      if (this.isActionPressed) {
        this.player.vy += this.physics.shipThrust * dt;
        if (this.player.vy < -this.physics.maxShipSpeed) this.player.vy = -this.physics.maxShipSpeed;
        
        // Spawn thrust particles
        if (Math.random() < 0.35) {
          this.trailParticles.push({
            x: this.player.x,
            y: this.player.y + this.player.height/2 + (Math.random() * 10 - 5),
            vx: -3 - Math.random() * 2,
            vy: Math.random() * 2 - 1,
            size: Math.random() * 6 + 2,
            color: '#ec4899', // Pink smoke
            alpha: 1.0,
            decay: 0.04
          });
        }
      } else {
        this.player.vy += this.physics.shipGravity * dt;
        if (this.player.vy > this.physics.maxShipSpeed) this.player.vy = this.physics.maxShipSpeed;
      }

      this.player.y += this.player.vy * dt;
      this.player.isGrounded = false;

      // Tilts smoothly based on vertical velocity
      this.player.rotation = this.player.vy * 0.05;
    }

    // 3. Ground Collision
    if (this.player.y + this.player.height >= this.physics.floorY) {
      this.player.y = this.physics.floorY - this.player.height;
      this.player.vy = 0;
      this.player.isGrounded = true;
      
      // In ship mode, hitting ground does not crash unless it's spiked (it just slides)
    }

    // Ceiling Collision for Ship
    if (this.player.y <= 0) {
      this.player.y = 0;
      this.player.vy = 0;
      if (this.player.mode === 'ship') {
        // Crashing ceiling in ship mode can be deadly depending on map, but let's just block it
      }
    }

    // 4. Object Collisions & Resolutions
    const startObjCol = Math.max(0, Math.floor(this.cameraX / this.physics.gridSize) - 2);
    const endObjCol = Math.min(this.currentLevel.length, startObjCol + 25);
    
    // Auto-Checkpoint in Practice Mode (Every 1.5 seconds when grounded safely)
    if (this.settings.practiceMode && this.player.isGrounded) {
      const timeNow = Date.now();
      if (timeNow - this.lastCheckpointTime > 1600) {
        // Verify there is no hazard nearby
        let hazardNear = false;
        for (let i = 0; i < this.currentLevel.objects.length; i++) {
          const obj = this.currentLevel.objects[i];
          if ((obj.type === 's' || obj.type === 'su') && Math.abs(obj.x - (this.player.x / this.physics.gridSize)) < 4) {
            hazardNear = true;
            break;
          }
        }
        if (!hazardNear) {
          this.placeCheckpoint();
        }
      }
    }

    // Check all objects in level
    this.currentLevel.objects.forEach(obj => {
      // Only check collisions if object is nearby the camera viewport
      if (obj.x < startObjCol || obj.x > endObjCol) return;

      const blockWidth = this.physics.gridSize;
      const blockHeight = this.physics.gridSize;
      
      // Object Bounding Box
      const oLeft = obj.x * this.physics.gridSize;
      const oRight = oLeft + blockWidth;
      const oTop = this.physics.floorY - (obj.y + 1) * this.physics.gridSize;
      const oBottom = oTop + blockHeight;

      // Player Bounding Box
      const pLeft = this.player.x;
      const pRight = pLeft + this.player.width;
      const pTop = this.player.y;
      const pBottom = pTop + this.player.height;

      // Helper check AABB overlap
      const isColliding = (pLeft < oRight && pRight > oLeft && pTop < oBottom && pBottom > oTop);

      if (!isColliding) return;

      // Collision Actions based on type
      if (obj.type === 'b') {
        // Solid block collision resolution
        // Determine overlap sides
        const overlapX = Math.min(pRight - oLeft, oRight - pLeft);
        const overlapY = Math.min(pBottom - oTop, oBottom - pTop);

        if (overlapX > overlapY) {
          // Vertical collision
          if (this.player.vy >= 0 && pBottom - this.player.vy * dt <= oTop + 8) {
            // Landed on top
            this.player.y = oTop - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
          } else {
            // Hit bottom of block - crash
            this.crashPlayer();
          }
        } else {
          // Horizontal collision - hit the side (instant crash)
          this.crashPlayer();
        }
      } 
      else if (obj.type === 's') {
        // Spike collision (instant crash)
        // Draw slightly smaller hitbox for spikes to make it fair
        const paddingX = this.player.width * 0.15;
        const paddingY = this.player.height * 0.15;
        if (pLeft + paddingX < oRight && pRight - paddingX > oLeft && pTop + paddingY < oBottom) {
          this.crashPlayer();
        }
      } 
      else if (obj.type === 'su') {
        // Ceiling spike
        const paddingX = this.player.width * 0.15;
        const paddingY = this.player.height * 0.15;
        if (pLeft + paddingX < oRight && pRight - paddingX > oLeft && pBottom - paddingY > oTop) {
          this.crashPlayer();
        }
      } 
      else if (obj.type === 'p') {
        // Jump Pad (launch upwards)
        const overlapX = Math.min(pRight - oLeft, oRight - pLeft);
        if (this.player.vy >= 0 && pBottom <= oTop + 15) {
          this.player.vy = -17.5; // High launch!
          this.player.isGrounded = false;
          window.audioSynth.playPad();
          this.createPadParticles(oLeft + blockWidth/2, oTop);
        }
      } 
      else if (obj.type === 'r') {
        // Jump Ring (mid-air jump trigger)
        // Detect if action key is pressed in this overlap frame (prevent continuous holding)
        if (this.isActionPressed && !this.lastActionPressed) {
          this.player.vy = -13.0; // Mid-air jump boost
          this.player.isGrounded = false;
          window.audioSynth.playPad();
          this.createPadParticles(oLeft + blockWidth/2, oTop + blockHeight/2);
          
          // Force button state to consumed so it doesn't double-trigger
          this.lastActionPressed = true;
        }
      } 
      else if (obj.type === 'portal_ship') {
        if (this.player.mode !== 'ship') {
          this.player.mode = 'ship';
          this.player.rotation = 0;
          this.player.vy = -3; // slight bump up
          window.audioSynth.playPad();
          this.createPortalParticles(oLeft + blockWidth/2, oTop + blockHeight/2);
        }
      } 
      else if (obj.type === 'portal_cube') {
        if (this.player.mode !== 'cube') {
          this.player.mode = 'cube';
          this.player.rotation = 0;
          this.player.vy = 0;
          window.audioSynth.playPad();
          this.createPortalParticles(oLeft + blockWidth/2, oTop + blockHeight/2);
        }
      }
    });

    this.lastActionPressed = this.isActionPressed;

    // 5. Update Particle effects
    this.updateParticles(dt);
    this.updateTrail(dt);
    this.updateBgParticles(dt);
  }

  saveWinProgress() {
    this.highScores[this.currentLevelIndex] = 100;
    this.saveData();
  }

  // PARTICLE SYSTEMS
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.2 * dt; // gravity
      p.alpha -= p.decay * dt;
      if (p.angle !== undefined) p.angle += p.rotate * dt;
      
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateTrail(dt) {
    // Spawn player movement trail
    if (!this.player.isDead) {
      if (this.player.trail === 'particles') {
        if (Math.random() < 0.4) {
          this.trailParticles.push({
            x: this.player.x + (Math.random() * 5),
            y: this.player.y + this.player.height - 2 - Math.random() * 5,
            vx: -this.player.vx * 0.2 + (Math.random() - 0.5),
            vy: Math.random() * -1,
            size: Math.random() * 8 + 3,
            color: this.player.color,
            alpha: 0.8,
            decay: 0.03
          });
        }
      } else if (this.player.trail === 'ghost') {
        // Spawn ghost image of player every few frames
        if (Math.random() < 0.15) {
          this.trailParticles.push({
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height,
            rotation: this.player.rotation,
            color: this.player.color,
            alpha: 0.45,
            decay: 0.05,
            isGhost: true
          });
        }
      }
    }

    // Process trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      if (p.isGhost) {
        p.alpha -= p.decay * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay * dt;
      }
      
      if (p.alpha <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  }

  createJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.trailParticles.push({
        x: this.player.x + 10 + Math.random() * 20,
        y: this.player.y + this.player.height,
        vx: -3 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 6 + 3,
        color: '#ffffff',
        alpha: 0.8,
        decay: 0.04
      });
    }
  }

  createPadParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        size: Math.random() * 6 + 3,
        color: '#10b981', // green glowing sparks
        alpha: 1.0,
        decay: 0.03
      });
    }
  }

  createPortalParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 3 - 2,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 8 + 2,
        color: '#f97316', // Orange portal sparks
        alpha: 1.0,
        decay: 0.03
      });
    }
  }

  // RENDERING FUNCTIONS
  render() {
    // 1. Clear Screen
    this.ctx.fillStyle = this.currentLevel.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Draw Moving Background Grid
    this.drawBackgroundGrid();

    // 3. Draw Level Objects (Translate camera space)
    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    this.drawLevelObjects();

    // 4. Draw Player Trails
    this.drawTrails();

    // 5. Draw Player
    if (!this.player.isDead) {
      this.ctx.save();
      this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
      this.ctx.rotate(this.player.rotation);
      
      if (this.player.mode === 'cube') {
        this.drawCube(this.ctx, -this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height, this.player.color, this.player.face);
      } else {
        this.drawShip(this.ctx, -this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height, this.player.color, this.player.face);
      }
      this.ctx.restore();
    }

    // 6. Draw Explosion Particles
    this.drawExplosionParticles();

    this.ctx.restore(); // Restore camera translation

    // 7. Draw Foreground Floor (Always static at bottom)
    this.drawFloor();
  }

  renderMenuBackground() {
    this.ctx.fillStyle = '#060a12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw neon floating lines or simple grids
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    this.ctx.lineWidth = 2;
    const size = 60;
    
    for (let x = 0; x < this.canvas.width; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Background floating stars/particles
    this.bgParticles.forEach(p => {
      this.ctx.save();
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawBackgroundGrid() {
    const gridSize = 60;
    const startX = Math.floor(this.cameraX / gridSize) * gridSize;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    // Draw vertical grid lines moving with camera (slower for parallax)
    const parallaxX = this.cameraX * 0.4;
    const pStartX = Math.floor(parallaxX / gridSize) * gridSize;
    for (let x = pStartX; x < pStartX + this.canvas.width + gridSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - parallaxX, 0);
      this.ctx.lineTo(x - parallaxX, this.physics.floorY);
      this.ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y < this.physics.floorY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Parallax background mountain outline
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    const peakInterval = 240;
    const mStartX = Math.floor(this.cameraX * 0.25 / peakInterval) * peakInterval;
    const pX = this.cameraX * 0.25;

    for (let x = mStartX - peakInterval; x < mStartX + this.canvas.width + peakInterval * 2; x += peakInterval) {
      const rx = x - pX;
      this.ctx.lineTo(rx, 220);
      this.ctx.lineTo(rx + peakInterval/2, 160);
      this.ctx.lineTo(rx + peakInterval, 220);
    }
    this.ctx.stroke();
  }

  drawFloor() {
    const floorY = this.physics.floorY;
    const height = this.canvas.height - floorY;
    
    // Gradient floor
    const grad = this.ctx.createLinearGradient(0, floorY, 0, this.canvas.height);
    grad.addColorStop(0, this.currentLevel ? this.currentLevel.floorColor : '#0f172a');
    grad.addColorStop(1, '#020617');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, floorY, this.canvas.width, height);

    // Glowing Neon line top of floor
    this.ctx.shadowColor = this.currentLevel ? this.currentLevel.accentColor : '#38bdf8';
    this.ctx.shadowBlur = 15;
    this.ctx.strokeStyle = this.currentLevel ? this.currentLevel.accentColor : '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, floorY);
    this.ctx.lineTo(this.canvas.width, floorY);
    this.ctx.stroke();

    // Reset shadow blur
    this.ctx.shadowBlur = 0;

    // Grid details on floor
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    // Parallax stripes on floor
    const floorParallax = this.cameraX % 40;
    for (let x = -floorParallax; x < this.canvas.width + 40; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, floorY);
      this.ctx.lineTo(x - 20, this.canvas.height);
      this.ctx.stroke();
    }
  }

  drawLevelObjects() {
    const accent = this.currentLevel.accentColor;
    
    this.currentLevel.objects.forEach(obj => {
      const x = obj.x * this.physics.gridSize;
      const y = this.physics.floorY - (obj.y + 1) * this.physics.gridSize;
      const size = this.physics.gridSize;

      if (obj.type === 'b') {
        // Draw normal solid block (Square neon boxes)
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        this.ctx.strokeStyle = accent;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

        // Internal cross details
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, y + 8);
        this.ctx.lineTo(x + size - 8, y + size - 8);
        this.ctx.moveTo(x + size - 8, y + 8);
        this.ctx.lineTo(x + 8, y + size - 8);
        this.ctx.stroke();
      } 
      else if (obj.type === 's') {
        // Normal Spike (Triangle)
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size);
        this.ctx.lineTo(x + size / 2, y + 6);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.closePath();
        this.ctx.fill();

        // Neon outline
        this.ctx.strokeStyle = '#f87171';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
      } 
      else if (obj.type === 'su') {
        // Ceiling Spike (pointing down)
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + size / 2, y + size - 6);
        this.ctx.lineTo(x + size, y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = '#f87171';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
      } 
      else if (obj.type === 'p') {
        // Jump Pad (launch pad)
        // Draw glowing pad base
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(x + 5, y + size - 12, size - 10, 12);
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 5, y + size - 12, size - 10, 12);
        
        // Draw green launching arc
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size - 12, 14, Math.PI, 0);
        this.ctx.fill();
      } 
      else if (obj.type === 'r') {
        // Jump Ring
        this.ctx.save();
        // Inner pulsing circle
        const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 12;
        this.ctx.strokeStyle = '#34d399';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, 14 * scale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Outer concentric ring
        this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, 22, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      } 
      else if (obj.type === 'portal_ship') {
        // Portal to Ship (Orange glowing oval)
        this.ctx.save();
        this.ctx.shadowColor = '#f97316';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
        this.ctx.strokeStyle = '#f97316';
        this.ctx.lineWidth = 4;
        
        // Draw Oval Portal
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/2, 18, size * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Portal arrows pointing in
        this.ctx.strokeStyle = '#fed7aa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2 - 6, y + size/2 - 20);
        this.ctx.lineTo(x + size/2 + 2, y + size/2);
        this.ctx.lineTo(x + size/2 - 6, y + size/2 + 20);
        this.ctx.stroke();

        this.ctx.restore();
      } 
      else if (obj.type === 'portal_cube') {
        // Portal back to Cube (Blue glowing oval)
        this.ctx.save();
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 4;
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/2, 18, size * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.strokeStyle = '#bfdbfe';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2 - 6, y + size/2 - 20);
        this.ctx.lineTo(x + size/2 + 2, y + size/2);
        this.ctx.lineTo(x + size/2 - 6, y + size/2 + 20);
        this.ctx.stroke();

        this.ctx.restore();
      }
    });

    // Draw Finish Line Checkered Barrier
    const finishX = this.currentLevel.length * this.physics.gridSize;
    const totalH = this.physics.floorY;
    const boxSz = 20;
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.7;
    for (let fY = 0; fY < totalH; fY += boxSz) {
      const colIdx = Math.floor(fY / boxSz) % 2;
      this.ctx.fillStyle = (colIdx === 0) ? '#ffffff' : '#000000';
      this.ctx.fillRect(finishX, fY, boxSz, boxSz);
      this.ctx.fillStyle = (colIdx === 1) ? '#ffffff' : '#000000';
      this.ctx.fillRect(finishX + boxSz, fY, boxSz, boxSz);
    }
    
    // Draw vertical glow rod
    this.ctx.restore();
    this.ctx.save();
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 20;
    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(finishX, 0);
    this.ctx.lineTo(finishX, this.physics.floorY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawTrails() {
    this.trailParticles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      if (p.isGhost) {
        // Draw ghost image rotated
        this.ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        this.ctx.rotate(p.rotation);
        
        if (this.player.mode === 'cube') {
          this.drawCube(this.ctx, -p.width / 2, -p.height / 2, p.width, p.height, p.color, this.player.face, true);
        } else {
          this.drawShip(this.ctx, -p.width / 2, -p.height / 2, p.width, p.height, p.color, this.player.face, true);
        }
      } else {
        // Draw small glowing square/circle particles
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });
  }

  drawExplosionParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);
      
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      
      this.ctx.restore();
    });
  }

  // PLAYER CUBE DRAWING LOGIC (INCLUDING HAND-DRAWN YELLOW SMILEY FACE)
  drawCube(ctx, x, y, w, h, color, face, isGhost = false) {
    // 1. Draw Cube Base
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    // Thick border outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = isGhost ? 1.5 : 3.5;
    ctx.strokeRect(x, y, w, h);

    // Internal corner details for classic GD style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x + 4, y + 4, 6, 6);
    ctx.fillRect(x + w - 10, y + 4, 6, 6);
    ctx.fillRect(x + 4, y + h - 10, 6, 6);
    ctx.fillRect(x + w - 10, y + h - 10, 6, 6);

    if (isGhost) return; // Don't draw complex face on ghost trails

    // 2. Draw Customizable Faces
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    
    // Relative coordinates based on size
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    if (face === 'smiley') {
      // Yellow Smiley Face (Hand-drawn design style)
      // Eyes (tall vertical ovals)
      ctx.beginPath();
      ctx.ellipse(centerX - 9, centerY - 5, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 9, centerY - 5, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big smiling mouth
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 1, 12, 0, Math.PI, false);
      ctx.stroke();

      // Cheek lines (small vertical endings on smile)
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - 1);
      ctx.lineTo(centerX - 12, centerY + 3);
      ctx.moveTo(centerX + 12, centerY - 1);
      ctx.lineTo(centerX + 12, centerY + 3);
      ctx.stroke();
    } 
    else if (face === 'angry') {
      // Slanted angry eyebrows and ovals
      ctx.beginPath();
      ctx.ellipse(centerX - 8, centerY - 3, 3, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 8, centerY - 3, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 14, centerY - 12);
      ctx.lineTo(centerX - 3, centerY - 7);
      ctx.moveTo(centerX + 14, centerY - 12);
      ctx.lineTo(centerX + 3, centerY - 7);
      ctx.stroke();

      // Frown
      ctx.beginPath();
      ctx.arc(centerX, centerY + 13, 7, Math.PI, 0, false);
      ctx.stroke();
    } 
    else if (face === 'cool') {
      // Sunglasses
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(centerX - 16, centerY - 10);
      ctx.lineTo(centerX + 16, centerY - 10);
      ctx.lineTo(centerX + 12, centerY);
      ctx.lineTo(centerX + 2, centerY);
      ctx.lineTo(centerX - 2, centerY);
      ctx.lineTo(centerX - 12, centerY);
      ctx.closePath();
      ctx.fill();

      // Glasses bridge
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 3, centerY - 8);
      ctx.lineTo(centerX + 3, centerY - 8);
      ctx.stroke();

      // Smirk mouth
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY + 9);
      ctx.quadraticCurveTo(centerX - 3, centerY + 13, centerX + 6, centerY + 7);
      ctx.stroke();
    } 
    else if (face === 'normal') {
      // Regular eyes
      ctx.beginPath();
      ctx.arc(centerX - 8, centerY - 5, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 8, centerY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Flat mouth
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY + 8);
      ctx.lineTo(centerX + 10, centerY + 8);
      ctx.stroke();
    } 
    else if (face === 'winking') {
      // Left normal eye, right winking curve
      ctx.beginPath();
      ctx.ellipse(centerX - 8, centerY - 5, 3.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wink curve
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX + 8, centerY - 3, 5, Math.PI, 0, false);
      ctx.stroke();

      // Happy smile
      ctx.beginPath();
      ctx.arc(centerX, centerY + 4, 8, 0, Math.PI, false);
      ctx.stroke();
    } 
    else if (face === 'dead') {
      // X X eyes
      ctx.lineWidth = 3.5;
      // Left X
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - 10);
      ctx.lineTo(centerX - 4, centerY - 2);
      ctx.moveTo(centerX - 4, centerY - 10);
      ctx.lineTo(centerX - 12, centerY - 2);
      // Right X
      ctx.moveTo(centerX + 4, centerY - 10);
      ctx.lineTo(centerX + 12, centerY - 2);
      ctx.moveTo(centerX + 12, centerY - 10);
      ctx.lineTo(centerX + 4, centerY - 2);
      ctx.stroke();

      // Squiggly mouth
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY + 9);
      ctx.lineTo(centerX - 6, centerY + 6);
      ctx.lineTo(centerX, centerY + 9);
      ctx.lineTo(centerX + 6, centerY + 6);
      ctx.lineTo(centerX + 12, centerY + 9);
      ctx.stroke();
    }
  }

  // RENDER VEHICLE SHIP MODE
  drawShip(ctx, x, y, w, h, color, face, isGhost = false) {
    // Draw ship vessel body (wedge spaceship shape)
    ctx.fillStyle = color;
    
    // Path for a neat sleek spaceship rocket
    ctx.beginPath();
    ctx.moveTo(x + w, y + h / 2); // Nose tip
    ctx.lineTo(x, y); // Top wing back
    ctx.lineTo(x + 8, y + h / 2); // Center back inner
    ctx.lineTo(x, y + h); // Bottom wing back
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = isGhost ? 1.5 : 3.5;
    ctx.stroke();

    // Rocket thruster exhaust box
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 4, y + h / 2 - 6, 8, 12);
    ctx.strokeRect(x - 4, y + h / 2 - 6, 8, 12);

    if (isGhost) return;

    // Draw little cube passenger passenger passenger
    ctx.save();
    ctx.translate(x + w * 0.35, y + h * 0.4);
    ctx.scale(0.5, 0.5); // Smaller passenger cube
    this.drawCube(ctx, -20, -20, 40, 40, color, face);
    ctx.restore();

    // Glass cockpit bubble canopy
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + w * 0.45, y + h * 0.38, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// Instantiate game after page has loaded fully
window.addEventListener('DOMContentLoaded', () => {
  window.superDash = new SuperDash();
});