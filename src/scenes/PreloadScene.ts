import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  public preload(): void {
    const { width, height } = this.scale;

    const title = this.add
      .text(width / 2, height / 2 - 40, 'ENDROID', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '28px',
        color: '#ff8800',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRoundedRect(width / 2 - 110, height / 2, 220, 20, 6);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff9900, 1);
      progressBar.fillRoundedRect(width / 2 - 106, height / 2 + 4, 212 * value, 12, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      title.destroy();
    });

    // Core images
    this.load.image('background', 'assets/images/background.jpg');
    this.load.image('street', 'assets/images/street.png');
    this.load.image('street_2013', 'assets/images/street_2013.png');
    this.load.image('button-play', 'assets/images/button-play.png');
    this.load.image('button-restart', 'assets/images/button-restart.png');
    this.load.image('score', 'assets/images/score.png');
    this.load.image('coracao', 'assets/images/coracao.png');
    this.load.image('list_scores', 'assets/images/list_scores.png');
    this.load.image('music_on', 'assets/images/music_on.png');
    this.load.image('effect_on', 'assets/images/effect_on.png');
    this.load.image('speaker_mute', 'assets/images/speaker_mute.png');
    this.load.image('left_arrow', 'assets/images/left_arrow.png');
    this.load.image('right_arrow', 'assets/images/right_arrow.png');
    this.load.image('turbo', 'assets/images/turbo.png');
    this.load.image('turbo_nuclear', 'assets/images/turbo_nuclear.png');
    this.load.image('turbo_west', 'assets/images/turbo_west.png');
    this.load.image('oil_slick', 'assets/images/oil_slick.png');
    this.load.image('future_hazard', 'assets/images/future_hazard.png');
    this.load.image('west_hazard', 'assets/images/west_hazard.png');
    this.load.image('flux_capacitor', 'assets/images/flux_capacitor.png');
    this.load.image('street_past', 'assets/images/street_past.png');
    this.load.image('street_future', 'assets/images/street_future.png');
    this.load.image('street_west', 'assets/images/street_west.png');

    // Standard cars
    this.load.image('red_car', 'assets/images/red_car.png');
    this.load.image('blue_car', 'assets/images/blue_car.png');
    this.load.image('white_car', 'assets/images/white_car.png');
    this.load.image('yellow_car', 'assets/images/yellow_car.png');

    // Vintage cars (Past mode - 1955)
    this.load.image('vintage_blue_car', 'assets/images/vintage_blue_car.png');
    this.load.image('vintage_white_car', 'assets/images/vintage_white_car.png');
    this.load.image('vintage_yellow_car', 'assets/images/vintage_yellow_car.png');

    // Future hover cars (Future mode - 2015 Skyway)
    this.load.image('future_blue_car', 'assets/images/future_blue_car.png');
    this.load.image('future_white_car', 'assets/images/future_white_car.png');
    this.load.image('future_yellow_car', 'assets/images/future_yellow_car.png');

    // Old West horse-drawn wagons (West mode - 1885)
    this.load.image('west_blue_car', 'assets/images/west_blue_car.png');
    this.load.image('west_white_car', 'assets/images/west_white_car.png');
    this.load.image('west_yellow_car', 'assets/images/west_yellow_car.png');

    // Easter Egg cars & logos
    this.load.image('car_delorean', 'assets/images/cars/delorean.png');
    this.load.image('car_delorean_flying', 'assets/images/cars/delorean_flying.png');
    this.load.image('car_delorean_west', 'assets/images/cars/delorean_west.png');
    this.load.image('logo_delorean', 'assets/images/cars/delorean-logo.png');
    this.load.image('car_herbie', 'assets/images/cars/herbie.png');
    this.load.image('logo_herbie', 'assets/images/cars/herbie-logo.png');
    this.load.image('car_speedracer', 'assets/images/cars/speedracer.png');
    this.load.image('logo_speedracer', 'assets/images/cars/speedracer-logo.png');

    // Explosion frames (1 to 9)
    for (let i = 1; i <= 9; i++) {
      this.load.image(`explode${i}`, `assets/images/explode${i}.png`);
    }

    // Audio
    this.load.audio('musica_menu', 'assets/sounds/musica_menu.mp3');
    this.load.audio('musica_fundo', 'assets/sounds/musica_fundo.mp3');
    this.load.audio('explosao', 'assets/sounds/explosao.mp3');
    this.load.audio('batida', 'assets/sounds/batida.mp3');
    this.load.audio('curva', 'assets/sounds/curva.mp3');
    this.load.audio('carro_passando_1', 'assets/sounds/carro_passando_1.mp3');
    this.load.audio('carro_passando_2', 'assets/sounds/carro_passando_2.mp3');
    this.load.audio('carro_passando_3', 'assets/sounds/carro_passando_3.mp3');
    this.load.audio('velocidade1', 'assets/sounds/velocidade1.mp3');
    this.load.audio('time_travel', 'assets/sounds/time_travel.mp3');
  }

  public create(): void {
    // Register explosion animation matching original reverse frames (6 -> 1) + full burst
    if (!this.anims.exists('explosion_anim')) {
      this.anims.create({
        key: 'explosion_anim',
        frames: [
          { key: 'explode6' },
          { key: 'explode5' },
          { key: 'explode4' },
          { key: 'explode3' },
          { key: 'explode2' },
          { key: 'explode1' },
        ],
        frameRate: 14,
        repeat: 0,
      });
    }

    this.scene.start('MenuScene');
  }
}

