import Phaser from 'phaser';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';

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
      const is2013 = StorageService.getTrackMode() === '2013';
      trackLabel.setText(is2013 ? 'Pista: Original 2013 ▾' : 'Pista: 4 Faixas (Nova) ▾');
      trackLabel.setColor(is2013 ? '#ffd24c' : '#ffffff');

      trackBg.clear();
      trackBg.fillStyle(0x141414, 0.88);
      trackBg.lineStyle(1.5, is2013 ? 0xffaa00 : 0x666666, 1);
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
