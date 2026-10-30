import Phaser from 'phaser';
import { AudioService } from '../services/AudioService';
import { CAR_SKINS, CarSkinId, StorageService } from '../services/StorageService';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

    // Audio controls
    AudioService.playMusic(this, 'musica_menu');
    AudioService.createAudioButtons(this, 'musica_menu');

    // Show vehicle selector only if at least one Easter Egg car (e.g. DeLorean) has been unlocked
    const unlockedSkins = (['red', 'delorean'] as CarSkinId[]).filter((id) =>
      StorageService.isCarUnlocked(id)
    );

    if (unlockedSkins.length > 1) {
      const carBtnContainer = this.add.container(width * 0.5, height - 140);
      const carBg = this.add.graphics();
      const carPreview = this.add.image(-68, 0, 'red_car').setDisplaySize(16, 26);
      const carLabel = this.add
        .text(10, 0, '', {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '12px',
          color: '#00eeff',
        })
        .setOrigin(0.5);

      const updateCarVisual = () => {
        const selected = StorageService.getSelectedCar();
        const cfg = CAR_SKINS[selected] || CAR_SKINS.red;
        carPreview.setTexture(cfg.textureKey).setDisplaySize(16, 26);
        carLabel.setText(`Carro: ${cfg.name} ▾`);
        carLabel.setColor(selected === 'delorean' ? '#00eeff' : '#ffffff');

        carBg.clear();
        carBg.fillStyle(0x141414, 0.88);
        carBg.lineStyle(1.5, selected === 'delorean' ? 0x00eeff : 0x666666, 1);
        carBg.fillRoundedRect(-96, -15, 192, 30, 6);
        carBg.strokeRoundedRect(-96, -15, 192, 30, 6);
      };

      updateCarVisual();
      carBtnContainer.add([carBg, carPreview, carLabel]);
      carBtnContainer.setSize(192, 30);
      carBtnContainer.setInteractive({ useHandCursor: true });

      carBtnContainer.on('pointerdown', () => {
        const current = StorageService.getSelectedCar();
        const idx = unlockedSkins.indexOf(current);
        const next = unlockedSkins[(idx + 1) % unlockedSkins.length];
        StorageService.setSelectedCar(next);
        AudioService.playEffect(this, 'carro_passando_2', 0.6);
        updateCarVisual();
      });
    }

    // Track selector toggle ("4 Faixas" vs "Original 2013")
    const trackBtnContainer = this.add.container(width * 0.5, height - 102);
    const trackBg = this.add.graphics();
    const trackLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const updateTrackVisual = () => {
      const mode = StorageService.getTrackMode();
      let labelText = 'Pista: 4 Faixas (Nova) ▾';
      let textColor = '#ffffff';
      let borderColor = 0x666666;

      if (mode === '2013') {
        labelText = 'Pista: Original 2013 ▾';
        textColor = '#ffd24c';
        borderColor = 0xffaa00;
      } else if (mode === 'past') {
        labelText = 'Pista: Passado (1955) ▾';
        textColor = '#ffe082';
        borderColor = 0xc8963e;
      } else if (mode === 'future') {
        labelText = 'Pista: Futuro (Voadora) ▾';
        textColor = '#00ffff';
        borderColor = 0x00e5ff;
      } else if (mode === 'west') {
        labelText = 'Pista: Velho Oeste (1885) ▾';
        textColor = '#ffca80';
        borderColor = 0xc87a32;
      }

      trackLabel.setText(labelText);
      trackLabel.setColor(textColor);

      trackBg.clear();
      trackBg.fillStyle(0x141414, 0.88);
      trackBg.lineStyle(1.5, borderColor, 1);
      trackBg.fillRoundedRect(-96, -15, 192, 30, 6);
      trackBg.strokeRoundedRect(-96, -15, 192, 30, 6);
    };

    updateTrackVisual();
    trackBtnContainer.add([trackBg, trackLabel]);
    trackBtnContainer.setSize(192, 30);
    trackBtnContainer.setInteractive({ useHandCursor: true });

    trackBtnContainer.on('pointerdown', () => {
      StorageService.toggleTrackMode();
      AudioService.playEffect(this, 'curva', 0.45);
      updateTrackVisual();
    });

    // Play Button (faithful to menu.lua: width=154, height=40, y = height - 55)
    const playBtn = this.add
      .image(width * 0.5, height - 55, 'button-play')
      .setDisplaySize(154, 40)
      .setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setTint(0xdddddd));
    playBtn.on('pointerout', () => playBtn.clearTint());
    playBtn.on('pointerdown', () => {
      playBtn.setScale(0.95);
    });
    playBtn.on('pointerup', () => {
      playBtn.setDisplaySize(154, 40);
      this.startGame();
    });

    // Keyboard shortcut (Enter/Space to start)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        this.startGame();
      }
    });
  }

  private startGame(): void {
    AudioService.stopMusic();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}
