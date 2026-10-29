import Phaser from 'phaser';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';

interface EnemyCarConfig {
  velocity: number;
  color: 'blue' | 'white' | 'yellow';
  points: number;
  number: number;
}

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  carNumber: number;
  carVelocity: number;
  carPoints: number;
  pointsComputed: boolean;
  canChangeLane: boolean;
  hasChangedLane: boolean;
  changeLaneY: number;
  targetX: number;
}

interface RoadItemSprite extends Phaser.Physics.Arcade.Sprite {
  itemType: 'turbo' | 'oil';
  triggered: boolean;
}

const ENEMY_TYPES: EnemyCarConfig[] = [
  { velocity: 5, color: 'blue', points: 30, number: 0 },
  { velocity: 8, color: 'white', points: 50, number: 1 },
  { velocity: 3, color: 'yellow', points: 70, number: 2 },
];

export class GameScene extends Phaser.Scene {
  private street!: Phaser.GameObjects.TileSprite;
  private heroCar!: Phaser.Physics.Arcade.Sprite;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private itemsGroup!: Phaser.Physics.Arcade.Group;

  private points = 0;
  private lives = 3;
  private hits = 0;
  private carSpeed = 0;
  private convertedSpeed = 0;
  private carsExceeded = 0;
  private running = true;
  private isInvulnerable = false;
  private isSkidding = false;
  private nextItemTimerMs = 3200;

  private movingDirection: 'LEFT' | 'RIGHT' | 'STOPPED' = 'STOPPED';
  private leftPressed = false;
  private rightPressed = false;
  private lastHeroX = 160;
  private stationaryTimeMs = 0;

  // HUD
  private pointsText!: Phaser.GameObjects.Text;
  private carsExceededText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Reset state
    this.points = 0;
    this.lives = 3;
    this.hits = 0;
    this.carSpeed = 0;
    this.convertedSpeed = 0;
    this.carsExceeded = 0;
    this.running = true;
    this.isInvulnerable = false;
    this.isSkidding = false;
    this.nextItemTimerMs = Phaser.Math.Between(2800, 4800);
    this.movingDirection = 'STOPPED';
    this.leftPressed = false;
    this.rightPressed = false;
    this.lastHeroX = width / 2;
    this.stationaryTimeMs = 0;

    // Infinite Scrolling Street (4-lane modern or Original 2013)
    const streetKey = StorageService.getTrackMode() === '2013' ? 'street_2013' : 'street';
    this.street = this.add.tileSprite(width / 2, height / 2, 320, 480, streetKey);

    // Physics groups for road items (turbo / oil slick) and enemy cars
    this.itemsGroup = this.physics.add.group();
    this.enemiesGroup = this.physics.add.group();

    // Hero Car (red_car 34x56 as in original level1.lua)
    this.heroCar = this.physics.add
      .sprite(width / 2, height - 100, 'red_car')
      .setDisplaySize(34, 56)
      .setDepth(10);

    const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
    heroBody.setSize(Math.round(this.heroCar.width * 0.94), Math.round(this.heroCar.height * 0.92), true);
    heroBody.setImmovable(true);

    // Collision detectors
    this.physics.add.overlap(
      this.heroCar,
      this.enemiesGroup,
      this.onHeroEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.heroCar,
      this.itemsGroup,
      this.onHeroItemOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // HUD Elements (faithful to level1.lua positions)
    this.add.image(155, 12, 'score').setDisplaySize(40, 8).setDepth(30);
    this.add.image(25, 10, 'coracao').setDisplaySize(15, 15).setDepth(30);

    this.pointsText = this.add
      .text(155, 28, '0', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.carsExceededText = this.add
      .text(155, 52, '0', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.livesText = this.add
      .text(36, 3, `x${this.lives - this.hits}`, {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setDepth(30);

    this.speedText = this.add
      .text(6, 22, 'speed 0 KM/H', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setDepth(30);

    // Touch Arrow Controls
    const leftArrow = this.add
      .image(40, height - 30, 'left_arrow')
      .setDisplaySize(64, 64)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    const rightArrow = this.add
      .image(width - 40, height - 30, 'right_arrow')
      .setDisplaySize(64, 64)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    leftArrow.on('pointerdown', () => {
      this.leftPressed = true;
      this.movingDirection = 'LEFT';
      leftArrow.setScale(leftArrow.scaleX * 0.92, leftArrow.scaleY * 0.92);
      AudioService.playEffect(this, 'curva', 0.45);
    });
    const releaseLeft = () => {
      this.leftPressed = false;
      leftArrow.setDisplaySize(64, 64);
      this.movingDirection = this.rightPressed ? 'RIGHT' : 'STOPPED';
    };
    leftArrow.on('pointerup', releaseLeft);
    leftArrow.on('pointerout', releaseLeft);

    rightArrow.on('pointerdown', () => {
      this.rightPressed = true;
      this.movingDirection = 'RIGHT';
      rightArrow.setScale(rightArrow.scaleX * 0.92, rightArrow.scaleY * 0.92);
      AudioService.playEffect(this, 'curva', 0.45);
    });
    const releaseRight = () => {
      this.rightPressed = false;
      rightArrow.setDisplaySize(64, 64);
      this.movingDirection = this.leftPressed ? 'LEFT' : 'STOPPED';
    };
    rightArrow.on('pointerup', releaseRight);
    rightArrow.on('pointerout', releaseRight);

    // Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (!this.running) return;
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
          AudioService.playEffect(this, 'curva', 0.3);
        } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
          AudioService.playEffect(this, 'curva', 0.3);
        }
      });
    }

    // Audio buttons & background music
    AudioService.playMusic(this, 'musica_fundo');
    AudioService.createAudioButtons(this, 'musica_fundo');
  }

  public update(_time: number, delta: number): void {
    if (!this.running) return;

    // Normalize speed to original 30 FPS Corona SDK pacing
    const frameScale = delta / (1000 / 30);

    this.carSpeed += (0.1 / 15) * frameScale;
    const streetSpeed = this.getEffectiveSpeed(10);
    this.convertedSpeed = streetSpeed * 6;
    const currentKmh = Math.floor(this.convertedSpeed);
    this.speedText.setText(`${currentKmh} KM/H`);

    // Scroll street texture
    this.street.tilePositionY -= streetSpeed * frameScale;

    // Periodically spawn Turbo or Oil Slick on the track
    this.nextItemTimerMs -= delta;
    if (this.nextItemTimerMs <= 0) {
      this.spawnRoadItem();
      this.nextItemTimerMs = Phaser.Math.Between(3500, 6500);
    }

    // Move road items at streetSpeed (fixed to the asphalt) and clean up off-screen items
    const itemChildren = [...this.itemsGroup.getChildren()] as RoadItemSprite[];
    for (const item of itemChildren) {
      if (!item.active) continue;
      item.y += streetSpeed * frameScale;
      if (item.y - 100 > 480) {
        item.destroy();
      }
    }

    // Spawn enemies up to 3 simultaneous visible cars
    if (this.enemiesGroup.countActive(true) < 3) {
      this.spawnEnemyCar();
    }

    // Update enemy cars & remove off-screen cars properly
    const children = [...this.enemiesGroup.getChildren()] as EnemySprite[];
    for (const car of children) {
      if (!car.active) continue;

      const enemyStep = this.getEffectiveSpeed(car.carVelocity) * frameScale;
      car.y += enemyStep;

      // After 4000 points, some enemy cars change to an adjacent lane as they approach
      if (car.canChangeLane && !car.hasChangedLane && car.y >= car.changeLaneY) {
        car.hasChangedLane = true;
        const laneCenters = [58, 126, 194, 262];
        // Find current closest lane index (0..3)
        let currentLaneIdx = 0;
        let minDist = Infinity;
        laneCenters.forEach((lc, idx) => {
          const d = Math.abs(car.x - lc);
          if (d < minDist) {
            minDist = d;
            currentLaneIdx = idx;
          }
        });

        const dir = Phaser.Math.RND.pick([-1, 1]);
        let nextLaneIdx = currentLaneIdx + dir;
        if (nextLaneIdx < 0 || nextLaneIdx >= laneCenters.length) {
          nextLaneIdx = currentLaneIdx - dir;
        }

        const subOffset = Phaser.Math.RND.pick([-15, 0, 15]);
        const candidateX = laneCenters[nextLaneIdx] + subOffset;

        const blocked = children.some(
          (other) =>
            other !== car &&
            other.active &&
            Math.abs(other.x - candidateX) < 42 &&
            Math.abs(other.y - car.y) < 95
        );
        if (!blocked) {
          car.targetX = candidateX;
        }
      }

      // Execute smooth horizontal lane change and tilt enemy nose
      const dx = car.targetX - car.x;
      if (Math.abs(dx) > 1) {
        const laneStep = Math.sign(dx) * Math.min(Math.abs(dx), 3.2 * frameScale);
        car.x += laneStep;
        const desiredAngle = dx > 0 ? 12 : -12;
        car.angle = Phaser.Math.Linear(car.angle, desiredAngle, Math.min(1, 0.25 * frameScale));
      } else {
        car.x = car.targetX;
        car.angle = Phaser.Math.Linear(car.angle, 0, Math.min(1, 0.25 * frameScale));
        if (Math.abs(car.angle) < 0.2) car.angle = 0;
      }

      if (car.y > this.heroCar.y + 20 && !car.pointsComputed) {
        if (car.carNumber === 1) {
          AudioService.playEffect(this, 'carro_passando_2', 0.7);
        } else if (car.carNumber === 2) {
          AudioService.playEffect(this, 'carro_passando_3', 0.7);
        } else {
          AudioService.playEffect(this, 'carro_passando_1', 0.7);
        }
        this.incrementPoints(car.carPoints);
        car.pointsComputed = true;
      }

      // Proper cleanup (fixes original memory leak where car:removeSelf() was missing)
      if (car.y - 240 > 480) {
        car.destroy();
      }
    }

    // Horizontal movement (Keyboard + Touch)
    const moveLeft =
      this.movingDirection === 'LEFT' ||
      this.cursors?.left.isDown ||
      this.keyA?.isDown;
    const moveRight =
      this.movingDirection === 'RIGHT' ||
      this.cursors?.right.isDown ||
      this.keyD?.isDown;

    const movingSpeed = 5 * frameScale;
    let targetAngle = 0;

    if (moveRight && !moveLeft && this.heroCar.x < 280) {
      this.heroCar.x = Math.min(280, this.heroCar.x + movingSpeed);
      targetAngle = 14;
    } else if (moveLeft && !moveRight && this.heroCar.x > 40) {
      this.heroCar.x = Math.max(40, this.heroCar.x - movingSpeed);
      targetAngle = -14;
    }

    // Track whether the player is camping in one horizontal spot (e.g., on a lane line)
    if (Math.abs(this.heroCar.x - this.lastHeroX) < 3) {
      this.stationaryTimeMs += delta;
    } else {
      this.stationaryTimeMs = 0;
      this.lastHeroX = this.heroCar.x;
    }

    // Smoothly turn the front of the car toward the movement direction and straighten back to 0° (when not skidding on oil)
    if (!this.isSkidding) {
      const turnLerp = Math.min(1, 0.28 * frameScale);
      this.heroCar.angle = Phaser.Math.Linear(this.heroCar.angle, targetAngle, turnLerp);
      if (Math.abs(this.heroCar.angle) < 0.1 && targetAngle === 0) {
        this.heroCar.angle = 0;
      }
    }
  }

  private getEffectiveSpeed(baseValue: number): number {
    return baseValue + this.carSpeed;
  }

  private spawnEnemyCar(): void {
    const typeIndex = Phaser.Math.Between(0, ENEMY_TYPES.length - 1);
    const cfg = ENEMY_TYPES[typeIndex];
    const isModernTrack = StorageService.getTrackMode() === 'modern';
    const laneCenters = [58, 126, 194, 262];

    const pickX = () => {
      if (isModernTrack) {
        // Each lane is 68px wide; ±16px places the car's side right against the dashed line without crossing it
        const laneTrajectories = [-16, 0, 16];

        // If player is camping in one spot for > 1s, pick the lane/side closest to the player (still inside the lane!)
        if (this.stationaryTimeMs > 1000) {
          this.stationaryTimeMs = 0;
          let bestX = laneCenters[0];
          let bestDist = Infinity;
          for (const lc of laneCenters) {
            for (const offset of laneTrajectories) {
              const candidate = lc + offset;
              const d = Math.abs(candidate - this.heroCar.x);
              if (d < bestDist) {
                bestDist = d;
                bestX = candidate;
              }
            }
          }
          return bestX + Phaser.Math.Between(-2, 2);
        }

        const laneCenter = laneCenters[Phaser.Math.Between(0, laneCenters.length - 1)];
        const trajectoryOffset = Phaser.Math.RND.pick(laneTrajectories);
        return laneCenter + trajectoryOffset + Phaser.Math.Between(-2, 2);
      }
      return Phaser.Math.Between(40, 280);
    };

    // Pick a non-overlapping X lane
    let x = pickX();
    const activeCars = this.enemiesGroup.getChildren() as EnemySprite[];
    for (let attempt = 0; attempt < 6; attempt++) {
      const tooClose = activeCars.some((other) => Math.abs(other.x - x) < 42 && other.y < 80);
      if (!tooClose) break;
      x = pickX();
    }

    const y = -Phaser.Math.Between(200, 600);
    const car = this.physics.add
      .sprite(x, y, `${cfg.color}_car`)
      .setDisplaySize(34, 56)
      .setDepth(8) as EnemySprite;

    car.carNumber = cfg.number;
    car.carVelocity = cfg.velocity;
    car.carPoints = cfg.points;
    car.pointsComputed = false;
    car.canChangeLane = this.points >= 4000 && Phaser.Math.Between(1, 100) <= 38;
    car.hasChangedLane = false;
    car.changeLaneY = Phaser.Math.Between(25, 175);
    car.targetX = x;

    this.enemiesGroup.add(car);
    const body = car.body as Phaser.Physics.Arcade.Body;
    body.setSize(Math.round(car.width * 0.94), Math.round(car.height * 0.92), true);
  }

  private incrementPoints(carPoints: number): void {
    this.points += carPoints;
    this.carsExceeded += 1;
    this.pointsText.setText(String(this.points));
    this.carsExceededText.setText(String(this.carsExceeded));
  }

  private spawnRoadItem(): void {
    const isModernTrack = StorageService.getTrackMode() === 'modern';
    const laneCenters = [58, 126, 194, 262];
    const x = isModernTrack
      ? laneCenters[Phaser.Math.Between(0, laneCenters.length - 1)] + Phaser.Math.Between(-12, 12)
      : Phaser.Math.Between(48, 272);

    const itemType: 'turbo' | 'oil' = Phaser.Math.Between(1, 100) <= 48 ? 'turbo' : 'oil';
    const textureKey = itemType === 'turbo' ? 'turbo' : 'oil_slick';

    const item = this.physics.add
      .sprite(x, -60, textureKey)
      .setDepth(itemType === 'oil' ? 5 : 7) as RoadItemSprite;

    item.itemType = itemType;
    item.triggered = false;

    this.itemsGroup.add(item);
    const body = item.body as Phaser.Physics.Arcade.Body;
    body.setSize(Math.round(item.width * 0.85), Math.round(item.height * 0.85), true);
  }

  private onHeroItemOverlap(_hero: Phaser.GameObjects.GameObject, itemObj: Phaser.GameObjects.GameObject): void {
    if (!this.running) return;
    const item = itemObj as RoadItemSprite;
    if (!item.active || item.triggered) return;

    if (item.itemType === 'turbo') {
      item.triggered = true;
      item.destroy();

      // Increase effective speed by +10%
      const currentEffective = this.getEffectiveSpeed(10);
      this.carSpeed += currentEffective * 0.1;

      AudioService.playEffect(this, 'velocidade1', 0.8);

      // Visual turbo feedback
      this.heroCar.setTint(0x66eeff);
      this.time.delayedCall(350, () => {
        if (this.heroCar.active) this.heroCar.clearTint();
      });

      const popup = this.add
        .text(this.heroCar.x, this.heroCar.y - 34, '+10% TURBO!', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '12px',
          color: '#00eeff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(35);

      this.tweens.add({
        targets: popup,
        y: popup.y - 28,
        alpha: 0,
        duration: 650,
        onComplete: () => popup.destroy(),
      });
    } else if (item.itemType === 'oil') {
      item.triggered = true;

      // Same sound as turning + reduce speed like a hit
      AudioService.playEffect(this, 'curva', 0.95);
      this.carSpeed = this.carSpeed / 2;

      // Skid / fishtail animation
      this.isSkidding = true;
      const skidDir = Phaser.Math.RND.pick([-1, 1]);
      const targetSkidX = Phaser.Math.Clamp(this.heroCar.x + skidDir * 22, 40, 280);

      this.tweens.add({
        targets: this.heroCar,
        x: targetSkidX,
        duration: 320,
        ease: 'Sine.easeOut',
      });

      this.tweens.chain({
        targets: this.heroCar,
        tweens: [
          { angle: 28 * skidDir, duration: 130 },
          { angle: -24 * skidDir, duration: 160 },
          { angle: 14 * skidDir, duration: 140 },
          { angle: 0, duration: 130 },
        ],
        onComplete: () => {
          this.isSkidding = false;
        },
      });
    }
  }

  private onHeroEnemyCollision(_hero: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    if (!this.running || this.isInvulnerable) return;

    const enemy = enemyObj as EnemySprite;
    enemy.destroy();

    this.hits += 1;
    this.carSpeed = this.carSpeed / 2;
    this.livesText.setText(`x${Math.max(0, this.lives - this.hits)}`);

    if (this.hits >= this.lives) {
      this.handleDeath();
    } else {
      AudioService.playEffect(this, 'batida', 0.9);
      this.triggerHitFlashes();
    }
  }

  private triggerHitFlashes(): void {
    this.isInvulnerable = true;
    this.tweens.add({
      targets: this.heroCar,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (this.heroCar.active) {
          this.heroCar.setAlpha(1);
        }
        this.isInvulnerable = false;
      },
    });
  }

  private handleDeath(): void {
    this.running = false;
    this.heroCar.setVisible(false);
    AudioService.playEffect(this, 'explosao', 1.0);

    const explosion = this.add
      .sprite(this.heroCar.x, this.heroCar.y, 'explode6')
      .setDepth(25);

    explosion.play('explosion_anim');

    // Wait for explosion animation to finish before transitioning to GameOverScene
    explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameOverScene', {
          points: this.points,
        });
      });
    });
  }
}
