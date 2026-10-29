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

  private points = 0;
  private lives = 3;
  private hits = 0;
  private carSpeed = 0;
  private convertedSpeed = 0;
  private carsExceeded = 0;
  private running = true;
  private isInvulnerable = false;

  private movingDirection: 'LEFT' | 'RIGHT' | 'STOPPED' = 'STOPPED';
  private leftPressed = false;
  private rightPressed = false;

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
    this.movingDirection = 'STOPPED';
    this.leftPressed = false;
    this.rightPressed = false;

    // Infinite Scrolling Street (4-lane modern or Original 2013)
    const streetKey = StorageService.getTrackMode() === '2013' ? 'street_2013' : 'street';
    this.street = this.add.tileSprite(width / 2, height / 2, 320, 480, streetKey);

    // Physics group for enemy cars
    this.enemiesGroup = this.physics.add.group();

    // Hero Car (red_car 34x56 as in original level1.lua)
    this.heroCar = this.physics.add
      .sprite(width / 2, height - 100, 'red_car')
      .setDisplaySize(34, 56)
      .setDepth(10);

    const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
    heroBody.setSize(this.heroCar.width * 0.75, this.heroCar.height * 0.8);
    heroBody.setImmovable(true);

    // Collision detector
    this.physics.add.overlap(
      this.heroCar,
      this.enemiesGroup,
      this.onHeroEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    // Smoothly turn the front of the car toward the movement direction and straighten back to 0°
    const turnLerp = Math.min(1, 0.28 * frameScale);
    this.heroCar.angle = Phaser.Math.Linear(this.heroCar.angle, targetAngle, turnLerp);
    if (Math.abs(this.heroCar.angle) < 0.1 && targetAngle === 0) {
      this.heroCar.angle = 0;
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
        const laneCenter = laneCenters[Phaser.Math.Between(0, laneCenters.length - 1)];
        return laneCenter + Phaser.Math.Between(-6, 6);
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

    this.enemiesGroup.add(car);
    const body = car.body as Phaser.Physics.Arcade.Body;
    body.setSize(car.width * 0.75, car.height * 0.8);
  }

  private incrementPoints(carPoints: number): void {
    this.points += carPoints;
    this.carsExceeded += 1;
    this.pointsText.setText(String(this.points));
    this.carsExceededText.setText(String(this.carsExceeded));
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
