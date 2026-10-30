import Phaser from 'phaser';
import { AudioService } from '../services/AudioService';
import { CAR_SKINS, StorageService } from '../services/StorageService';

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
  enemyColor: 'blue' | 'white' | 'yellow';
  pointsComputed: boolean;
  canChangeLane: boolean;
  hasChangedLane: boolean;
  changeLaneY: number;
  targetX: number;
  isDeloreanEasterEgg?: boolean;
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
  private deloreanSpawnedInRun = false;
  private isPlayingDelorean = false;
  private currentEra: 'present' | 'past' | 'future' | 'west' = 'present';
  private canJumpToNextEra = true;
  private isFluxButtonVisible = false;
  private fluxButtonContainer?: Phaser.GameObjects.Container;
  private fluxLabel?: Phaser.GameObjects.Text;
  private fluxBlinkTween?: Phaser.Tweens.Tween;

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
    const initialTrackMode = StorageService.getTrackMode();
    this.deloreanSpawnedInRun = false;
    this.isPlayingDelorean = StorageService.getSelectedCar() === 'delorean';
    this.currentEra =
      initialTrackMode === 'past'
        ? 'past'
        : initialTrackMode === 'future'
          ? 'future'
          : initialTrackMode === 'west'
            ? 'west'
            : 'present';
    this.canJumpToNextEra = true;
    this.isFluxButtonVisible = false;
    this.fluxButtonContainer = undefined;
    this.fluxLabel = undefined;
    this.fluxBlinkTween = undefined;
    this.movingDirection = 'STOPPED';
    this.leftPressed = false;
    this.rightPressed = false;
    this.lastHeroX = width / 2;
    this.stationaryTimeMs = 0;

    // Infinite Scrolling Street (Modern 4-lane, 2013 Original, Past 1955, Future Skyway, or 1885 Old West)
    const streetKey =
      initialTrackMode === '2013'
        ? 'street_2013'
        : initialTrackMode === 'past'
          ? 'street_past'
          : initialTrackMode === 'future'
            ? 'street_future'
            : initialTrackMode === 'west'
              ? 'street_west'
              : 'street';
    this.street = this.add.tileSprite(width / 2, height / 2, 320, 480, streetKey);

    // Physics groups for road items (turbo / oil slick) and enemy cars
    this.itemsGroup = this.physics.add.group();
    this.enemiesGroup = this.physics.add.group();

    // Hero Car (uses selected car skin from StorageService — or era-specific DeLorean)
    const selectedSkinId = StorageService.getSelectedCar();
    const skinCfg = CAR_SKINS[selectedSkinId] || CAR_SKINS.red;
    const isFlyingStart = this.isPlayingDelorean && this.currentEra === 'future';
    const isWestStart = this.isPlayingDelorean && this.currentEra === 'west';
    const heroTextureKey = isFlyingStart
      ? 'car_delorean_flying'
      : isWestStart
        ? 'car_delorean_west'
        : skinCfg.textureKey;

    this.heroCar = this.physics.add
      .sprite(width / 2, height - 100, heroTextureKey)
      .setDisplaySize(
        isFlyingStart ? 46 : isWestStart ? 38 : 34,
        isFlyingStart ? 58 : isWestStart ? 76 : 56
      )
      .setDepth(10);

    const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
    heroBody.setSize(
      Math.round(this.heroCar.width * (isFlyingStart ? 0.68 : isWestStart ? 0.76 : 0.94)),
      Math.round(this.heroCar.height * (isFlyingStart ? 0.90 : isWestStart ? 0.86 : 0.92)),
      true
    );
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

    // Create hidden Flux Capacitor button when piloting the DeLorean
    if (this.isPlayingDelorean) {
      this.createFluxCapacitorButton();
    }
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

    // Flux Capacitor activation at 142 KM/H (~88 MPH) when driving the DeLorean (Present -> Past -> Future -> West -> Present)
    const canActivateFlux = this.isPlayingDelorean && this.canJumpToNextEra;

    if (canActivateFlux) {
      if (currentKmh >= 142) {
        if (!this.isFluxButtonVisible) {
          this.showFluxCapacitorButton();
        }
        this.speedText.setColor('#00ffff');
      } else if (this.isFluxButtonVisible) {
        this.hideFluxCapacitorButton();
        this.speedText.setColor(
          this.currentEra === 'past' || this.currentEra === 'west' ? '#ffd27f' : '#ffffff'
        );
      }
    }

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
    const isModernTrack = StorageService.getTrackMode() !== '2013';
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

    // Easter Egg: Once player reaches 2015 points, spawn the DeLorean coming down the road!
    const shouldSpawnDelorean =
      this.points >= 2015 &&
      !this.deloreanSpawnedInRun &&
      !StorageService.isCarUnlocked('delorean');

    const y = shouldSpawnDelorean ? -180 : -Phaser.Math.Between(200, 600);
    const eraEnemyKey =
      this.currentEra === 'past'
        ? `vintage_${cfg.color}_car`
        : this.currentEra === 'future'
          ? `future_${cfg.color}_car`
          : this.currentEra === 'west'
            ? `west_${cfg.color}_car`
            : `${cfg.color}_car`;
    const textureKey = shouldSpawnDelorean ? 'car_delorean' : eraEnemyKey;
    const isWestWagon = !shouldSpawnDelorean && this.currentEra === 'west';

    const car = this.physics.add
      .sprite(x, y, textureKey)
      .setDisplaySize(isWestWagon ? 36 : 34, isWestWagon ? 68 : 56)
      .setDepth(8) as EnemySprite;

    car.carNumber = cfg.number;
    car.carVelocity = shouldSpawnDelorean ? 5 : cfg.velocity;
    car.carPoints = shouldSpawnDelorean ? 88 : cfg.points;
    car.enemyColor = cfg.color;
    car.pointsComputed = false;
    car.canChangeLane = !shouldSpawnDelorean && this.points >= 4000 && Phaser.Math.Between(1, 100) <= 38;
    car.hasChangedLane = false;
    car.changeLaneY = Phaser.Math.Between(25, 175);
    car.targetX = x;
    car.isDeloreanEasterEgg = shouldSpawnDelorean;

    if (shouldSpawnDelorean) {
      this.deloreanSpawnedInRun = true;
    }

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
    const isModernTrack = StorageService.getTrackMode() !== '2013';
    const laneCenters = [58, 126, 194, 262];
    const x = isModernTrack
      ? laneCenters[Phaser.Math.Between(0, laneCenters.length - 1)] + Phaser.Math.Between(-12, 12)
      : Phaser.Math.Between(48, 272);

    const itemType: 'turbo' | 'oil' = Phaser.Math.Between(1, 100) <= 48 ? 'turbo' : 'oil';
    const isFuture = this.currentEra === 'future';
    const isWest = this.currentEra === 'west';
    const textureKey =
      itemType === 'turbo'
        ? isFuture
          ? 'turbo_nuclear'
          : isWest
            ? 'turbo_west'
            : 'turbo'
        : isFuture
          ? 'future_hazard'
          : isWest
            ? 'west_hazard'
            : 'oil_slick';

    const item = this.physics.add
      .sprite(x, -60, textureKey)
      .setDepth(itemType === 'oil' ? 6 : 7) as RoadItemSprite;

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

      // Visual turbo feedback (Nuclear green in Future, Fiery gold in Old West, cyan otherwise)
      const isFuture = this.currentEra === 'future';
      const isWest = this.currentEra === 'west';
      this.heroCar.setTint(isFuture ? 0x66ff66 : isWest ? 0xffbb44 : 0x66eeff);
      this.time.delayedCall(350, () => {
        if (this.heroCar.active) this.heroCar.clearTint();
      });

      const popupText = isFuture
        ? '+10% NUCLEAR!'
        : isWest
          ? '+10% VAPOR 1885!'
          : '+10% TURBO!';
      const popupColor = isFuture ? '#39ff14' : isWest ? '#ffcc33' : '#00eeff';

      const popup = this.add
        .text(this.heroCar.x, this.heroCar.y - 34, popupText, {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '12px',
          color: popupColor,
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
    const hitDelorean = !!enemy.isDeloreanEasterEgg;
    enemy.destroy();

    this.hits += 1;
    this.carSpeed = this.carSpeed / 2;
    this.livesText.setText(`x${Math.max(0, this.lives - this.hits)}`);

    if (this.hits >= this.lives) {
      // Player died on this hit -> does NOT unlock the DeLorean!
      this.handleDeath();
    } else {
      AudioService.playEffect(this, 'batida', 0.9);
      this.triggerHitFlashes();

      // Player survived colliding with the DeLorean -> unlocks it for the next match!
      if (hitDelorean) {
        StorageService.unlockCar('delorean');
        StorageService.setSelectedCar('delorean');
        this.showDeloreanUnlockedBanner();
      }
    }
  }

  private showDeloreanUnlockedBanner(): void {
    const { width } = this.scale;
    this.cameras.main.flash(300, 0, 220, 255);

    const banner = this.add.container(width / 2, 130).setDepth(45);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.lineStyle(2, 0x00eeff, 1);
    bg.fillRoundedRect(-142, -34, 284, 68, 8);
    bg.strokeRoundedRect(-142, -34, 284, 68, 8);

    const logo = this.add.image(-95, 0, 'logo_delorean');
    const maxDim = Math.max(logo.width, logo.height);
    logo.setScale(52 / maxDim);

    const txt = this.add
      .text(24, 0, 'DELOREAN LIBERADO!\nDisponível na próxima partida!', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '11px',
        color: '#00eeff',
        align: 'center',
      })
      .setOrigin(0.5);

    banner.add([bg, logo, txt]);
    banner.setScale(0.2);

    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 280,
      ease: 'Back.easeOut',
      hold: 2200,
      yoyo: true,
      onComplete: () => banner.destroy(),
    });
  }

  private createFluxCapacitorButton(): void {
    const { width, height } = this.scale;
    const container = this.add.container(width / 2, height - 34).setDepth(38);
    container.setVisible(false);

    // Glowing backdrop ring around the Flux Capacitor
    const glowBg = this.add.graphics();
    glowBg.fillStyle(0x001a26, 0.88);
    glowBg.lineStyle(2, 0x00f0ff, 1);
    glowBg.fillRoundedRect(-28, -30, 56, 60, 8);
    glowBg.strokeRoundedRect(-28, -30, 56, 60, 8);

    const fluxImg = this.add.image(0, -3, 'flux_capacitor').setDisplaySize(42, 45);

    const label = this.add
      .text(0, 22, '88 MPH!', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '9px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.fluxLabel = label;

    const hitZone = this.add
      .zone(0, 0, 74, 68)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      if (this.currentEra === 'present') {
        this.triggerTimeTravelToPast();
      } else if (this.currentEra === 'past') {
        this.triggerTimeTravelToFuture();
      } else if (this.currentEra === 'future') {
        this.triggerTimeTravelToWest();
      } else if (this.currentEra === 'west') {
        this.triggerTimeTravelToPresent();
      }
    });

    container.add([glowBg, fluxImg, label, hitZone]);
    this.fluxButtonContainer = container;
  }

  private showFluxCapacitorButton(): void {
    if (!this.fluxButtonContainer) return;
    this.isFluxButtonVisible = true;
    if (this.fluxLabel) {
      const nextLabel =
        this.currentEra === 'present'
          ? '88 MPH!'
          : this.currentEra === 'past'
            ? 'FUTURO!'
            : this.currentEra === 'future'
              ? '1885!'
              : 'PRESENTE!';
      this.fluxLabel.setText(nextLabel);
    }
    this.fluxButtonContainer.setVisible(true);
    this.fluxButtonContainer.setAlpha(1);
    this.fluxButtonContainer.setScale(1);

    this.fluxBlinkTween?.stop();
    this.fluxBlinkTween = this.tweens.add({
      targets: this.fluxButtonContainer,
      alpha: { from: 1, to: 0.25 },
      scale: { from: 1.08, to: 0.94 },
      duration: 240,
      yoyo: true,
      repeat: -1,
    });
  }

  private hideFluxCapacitorButton(): void {
    this.isFluxButtonVisible = false;
    this.fluxBlinkTween?.stop();
    this.fluxBlinkTween = undefined;
    if (this.fluxButtonContainer) {
      this.fluxButtonContainer.setVisible(false);
    }
  }

  private triggerTimeTravelToPast(): void {
    if (this.currentEra !== 'present' || !this.running) return;
    this.currentEra = 'past';
    this.canJumpToNextEra = false;
    this.hideFluxCapacitorButton();
    StorageService.unlockTrack('past');

    // Play the DeLorean time-travel sound effect
    AudioService.playEffect(this, 'time_travel', 1.0);

    // Brief invulnerability during the temporal jump
    this.isInvulnerable = true;

    // Twin fire trails left on the road behind the DeLorean tires
    const leftTrail = this.add
      .rectangle(this.heroCar.x - 11, this.heroCar.y + 10, 5, 90, 0xff6600, 0.92)
      .setDepth(6);
    const rightTrail = this.add
      .rectangle(this.heroCar.x + 11, this.heroCar.y + 10, 5, 90, 0xffaa00, 0.92)
      .setDepth(6);

    this.tweens.add({
      targets: [leftTrail, rightTrail],
      y: this.heroCar.y + 150,
      alpha: 0,
      scaleY: 1.8,
      duration: 600,
      onComplete: () => {
        leftTrail.destroy();
        rightTrail.destroy();
      },
    });

    // Make the DeLorean blink/flicker with electric cyan energy
    this.heroCar.setTint(0x88ffff);
    this.tweens.add({
      targets: this.heroCar,
      alpha: 0.15,
      duration: 75,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (this.heroCar.active) {
          this.heroCar.setAlpha(1);
          this.heroCar.clearTint();
        }
        this.isInvulnerable = false;
      },
    });

    // Temporal displacement flash & swap road + cars to the Past (1955)
    this.time.delayedCall(220, () => {
      if (!this.running) return;

      this.cameras.main.flash(550, 195, 245, 255);
      this.street.setTexture('street_past');
      this.speedText.setColor('#ffd27f');

      // Ensure standard DeLorean texture & size in 1955
      const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
      this.heroCar.setTexture('car_delorean');
      this.heroCar.setDisplaySize(34, 56);
      heroBody.setSize(Math.round(this.heroCar.width * 0.94), Math.round(this.heroCar.height * 0.92), true);

      // Transform all active opponent cars on the road into vintage cars
      const activeEnemies = this.enemiesGroup.getChildren() as EnemySprite[];
      for (const enemy of activeEnemies) {
        if (enemy.active && !enemy.isDeloreanEasterEgg) {
          enemy.setTexture(`vintage_${enemy.enemyColor}_car`);
          enemy.setDisplaySize(34, 56);
        }
      }

      // Transform any active road items into standard Turbo / Oil Slick
      const activeItems = this.itemsGroup.getChildren() as RoadItemSprite[];
      for (const item of activeItems) {
        if (item.active && !item.triggered) {
          item.setTexture(item.itemType === 'turbo' ? 'turbo' : 'oil_slick');
        }
      }

      // Show retro 1955 arrival banner
      const { width } = this.scale;
      const pastBanner = this.add
        .text(width / 2, 92, '⚡ VIAGEM NO TEMPO: 1955! ⚡', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '13px',
          color: '#ffe082',
          stroke: '#3e2723',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(45);

      this.tweens.add({
        targets: pastBanner,
        y: 76,
        alpha: { from: 1, to: 0 },
        hold: 1600,
        duration: 700,
        onComplete: () => pastBanner.destroy(),
      });

      // After 3.5 seconds in the Past, allow the Flux Capacitor to activate again for the Future jump!
      this.time.delayedCall(3500, () => {
        if (this.running && this.currentEra === 'past') {
          this.canJumpToNextEra = true;
        }
      });
    });
  }

  private triggerTimeTravelToFuture(): void {
    if (this.currentEra !== 'past' || !this.running) return;
    this.currentEra = 'future';
    this.canJumpToNextEra = false;
    this.hideFluxCapacitorButton();
    StorageService.unlockTrack('future');

    // Play the DeLorean time-travel sound effect
    AudioService.playEffect(this, 'time_travel', 1.0);

    // Brief invulnerability during the temporal jump to the Future
    this.isInvulnerable = true;

    // Twin cyan/plasma skyway trails left behind the hover-converted tires
    const leftTrail = this.add
      .rectangle(this.heroCar.x - 13, this.heroCar.y + 10, 6, 95, 0x00f0ff, 0.95)
      .setDepth(6);
    const rightTrail = this.add
      .rectangle(this.heroCar.x + 13, this.heroCar.y + 10, 6, 95, 0x80ffff, 0.95)
      .setDepth(6);

    this.tweens.add({
      targets: [leftTrail, rightTrail],
      y: this.heroCar.y + 150,
      alpha: 0,
      scaleY: 1.9,
      duration: 650,
      onComplete: () => {
        leftTrail.destroy();
        rightTrail.destroy();
      },
    });

    // Make the DeLorean blink/flicker with electric cyan energy
    this.heroCar.setTint(0x88ffff);
    this.tweens.add({
      targets: this.heroCar,
      alpha: 0.15,
      duration: 75,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (this.heroCar.active) {
          this.heroCar.setAlpha(1);
          this.heroCar.clearTint();
        }
        this.isInvulnerable = false;
      },
    });

    // Temporal displacement flash & swap to Future Skyway + Flying DeLorean with open wheels!
    this.time.delayedCall(220, () => {
      if (!this.running) return;

      this.cameras.main.flash(600, 140, 240, 255);
      this.street.setTexture('street_future');
      this.speedText.setColor('#00ffff');

      // Switch player car to the Flying DeLorean with open hover-wheels (46x58 so open wheels stick out on the sides)
      const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
      this.heroCar.setTexture('car_delorean_flying');
      this.heroCar.setDisplaySize(46, 58);
      // Keep physics hitbox matched to the chassis width (not the protruding hover wheels)
      heroBody.setSize(Math.round(this.heroCar.width * 0.68), Math.round(this.heroCar.height * 0.90), true);

      // Transform all active opponent cars on the skyway into futuristic hover cars
      const activeEnemies = this.enemiesGroup.getChildren() as EnemySprite[];
      for (const enemy of activeEnemies) {
        if (enemy.active && !enemy.isDeloreanEasterEgg) {
          enemy.setTexture(`future_${enemy.enemyColor}_car`);
          enemy.setDisplaySize(34, 56);
        }
      }

      // Transform any active road items into Nuclear Turbo / Electric Storm Cloud
      const activeItems = this.itemsGroup.getChildren() as RoadItemSprite[];
      for (const item of activeItems) {
        if (item.active && !item.triggered) {
          item.setTexture(item.itemType === 'turbo' ? 'turbo_nuclear' : 'future_hazard');
        }
      }

      // Show futuristic 2015 Skyway arrival banner
      const { width } = this.scale;
      const futureBanner = this.add
        .text(width / 2, 92, '⚡ PISTA VOADORA: FUTURO! ⚡', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '13px',
          color: '#00ffff',
          stroke: '#002244',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(45);

      this.tweens.add({
        targets: futureBanner,
        y: 76,
        alpha: { from: 1, to: 0 },
        hold: 1800,
        duration: 700,
        onComplete: () => futureBanner.destroy(),
      });

      // After 3.5 seconds in the Future, allow the Flux Capacitor to activate again for the 1885 Old West jump!
      this.time.delayedCall(3500, () => {
        if (this.running && this.currentEra === 'future') {
          this.canJumpToNextEra = true;
        }
      });
    });
  }

  private triggerTimeTravelToWest(): void {
    if (this.currentEra !== 'future' || !this.running) return;
    this.currentEra = 'west';
    this.canJumpToNextEra = false;
    this.hideFluxCapacitorButton();
    StorageService.unlockTrack('west');

    // Play the DeLorean time-travel sound effect
    AudioService.playEffect(this, 'time_travel', 1.0);

    // Brief invulnerability during the temporal jump to 1885
    this.isInvulnerable = true;

    // Twin fiery golden trails as the DeLorean jumps from 2015 to 1885
    const leftTrail = this.add
      .rectangle(this.heroCar.x - 11, this.heroCar.y + 10, 5, 90, 0xff8800, 0.92)
      .setDepth(6);
    const rightTrail = this.add
      .rectangle(this.heroCar.x + 11, this.heroCar.y + 10, 5, 90, 0xffcc44, 0.92)
      .setDepth(6);

    this.tweens.add({
      targets: [leftTrail, rightTrail],
      y: this.heroCar.y + 150,
      alpha: 0,
      scaleY: 1.8,
      duration: 600,
      onComplete: () => {
        leftTrail.destroy();
        rightTrail.destroy();
      },
    });

    // Make the DeLorean blink/flicker with electric cyan energy
    this.heroCar.setTint(0x88ffff);
    this.tweens.add({
      targets: this.heroCar,
      alpha: 0.15,
      duration: 75,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (this.heroCar.active) {
          this.heroCar.setAlpha(1);
          this.heroCar.clearTint();
        }
        this.isInvulnerable = false;
      },
    });

    // Temporal displacement flash & swap to 1885 Old West dirt trail + horse-drawn wagons & horse-drawn DeLorean!
    this.time.delayedCall(220, () => {
      if (!this.running) return;

      this.cameras.main.flash(580, 255, 225, 170);
      this.street.setTexture('street_west');
      this.speedText.setColor('#ffd27f');

      // Switch player car to the DeLorean pulled by horses with wooden wagon wheels!
      const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
      this.heroCar.setTexture('car_delorean_west');
      this.heroCar.setDisplaySize(38, 76);
      heroBody.setSize(Math.round(this.heroCar.width * 0.76), Math.round(this.heroCar.height * 0.86), true);

      // Transform all active opponent vehicles into Old West horse-drawn wagons!
      const activeEnemies = this.enemiesGroup.getChildren() as EnemySprite[];
      for (const enemy of activeEnemies) {
        if (enemy.active && !enemy.isDeloreanEasterEgg) {
          enemy.setTexture(`west_${enemy.enemyColor}_car`);
          enemy.setDisplaySize(36, 68);
        }
      }

      // Transform any active road items into 1885 Steam Log Turbo / Mud Puddle
      const activeItems = this.itemsGroup.getChildren() as RoadItemSprite[];
      for (const item of activeItems) {
        if (item.active && !item.triggered) {
          item.setTexture(item.itemType === 'turbo' ? 'turbo_west' : 'west_hazard');
        }
      }

      // Show 1885 Old West arrival banner
      const { width } = this.scale;
      const westBanner = this.add
        .text(width / 2, 92, '🐎 VELHO OESTE: 1885! 🐎', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '13px',
          color: '#ffdf9e',
          stroke: '#4e2608',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(45);

      this.tweens.add({
        targets: westBanner,
        y: 76,
        alpha: { from: 1, to: 0 },
        hold: 1800,
        duration: 700,
        onComplete: () => westBanner.destroy(),
      });

      // After 3.5 seconds in the Old West, allow the Flux Capacitor to activate again to return to the Present!
      this.time.delayedCall(3500, () => {
        if (this.running && this.currentEra === 'west') {
          this.canJumpToNextEra = true;
        }
      });
    });
  }

  private triggerTimeTravelToPresent(): void {
    if (this.currentEra !== 'west' || !this.running) return;
    this.currentEra = 'present';
    this.canJumpToNextEra = false;
    this.hideFluxCapacitorButton();

    // Play the DeLorean time-travel sound effect
    AudioService.playEffect(this, 'time_travel', 1.0);

    // Brief invulnerability during the temporal jump back to the Present
    this.isInvulnerable = true;

    // Twin fire trails left behind the DeLorean
    const leftTrail = this.add
      .rectangle(this.heroCar.x - 11, this.heroCar.y + 10, 5, 90, 0xff6600, 0.92)
      .setDepth(6);
    const rightTrail = this.add
      .rectangle(this.heroCar.x + 11, this.heroCar.y + 10, 5, 90, 0xffaa00, 0.92)
      .setDepth(6);

    this.tweens.add({
      targets: [leftTrail, rightTrail],
      y: this.heroCar.y + 150,
      alpha: 0,
      scaleY: 1.8,
      duration: 600,
      onComplete: () => {
        leftTrail.destroy();
        rightTrail.destroy();
      },
    });

    // Make the DeLorean blink/flicker with electric cyan energy
    this.heroCar.setTint(0x88ffff);
    this.tweens.add({
      targets: this.heroCar,
      alpha: 0.15,
      duration: 75,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (this.heroCar.active) {
          this.heroCar.setAlpha(1);
          this.heroCar.clearTint();
        }
        this.isInvulnerable = false;
      },
    });

    // Temporal displacement flash & restore Present road, standard DeLorean, and modern opponent cars!
    this.time.delayedCall(220, () => {
      if (!this.running) return;

      this.cameras.main.flash(580, 200, 248, 255);
      const presentStreetKey = StorageService.getTrackMode() === '2013' ? 'street_2013' : 'street';
      this.street.setTexture(presentStreetKey);
      this.speedText.setColor('#ffffff');

      // Restore standard DeLorean
      const heroBody = this.heroCar.body as Phaser.Physics.Arcade.Body;
      this.heroCar.setTexture('car_delorean');
      this.heroCar.setDisplaySize(34, 56);
      heroBody.setSize(Math.round(this.heroCar.width * 0.94), Math.round(this.heroCar.height * 0.92), true);

      // Transform all active opponent vehicles back to modern cars
      const activeEnemies = this.enemiesGroup.getChildren() as EnemySprite[];
      for (const enemy of activeEnemies) {
        if (enemy.active && !enemy.isDeloreanEasterEgg) {
          enemy.setTexture(`${enemy.enemyColor}_car`);
          enemy.setDisplaySize(34, 56);
        }
      }

      // Restore active road items to standard Turbo / Oil Slick
      const activeItems = this.itemsGroup.getChildren() as RoadItemSprite[];
      for (const item of activeItems) {
        if (item.active && !item.triggered) {
          item.setTexture(item.itemType === 'turbo' ? 'turbo' : 'oil_slick');
        }
      }

      // Show return to Present banner
      const { width } = this.scale;
      const presentBanner = this.add
        .text(width / 2, 92, '⚡ DE VOLTA AO PRESENTE! ⚡', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '13px',
          color: '#00eeff',
          stroke: '#001a33',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(45);

      this.tweens.add({
        targets: presentBanner,
        y: 76,
        alpha: { from: 1, to: 0 },
        hold: 1800,
        duration: 700,
        onComplete: () => presentBanner.destroy(),
      });

      // After 3.5 seconds in the Present, allow cycling through time travel again!
      this.time.delayedCall(3500, () => {
        if (this.running && this.currentEra === 'present') {
          this.canJumpToNextEra = true;
        }
      });
    });
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
