import Phaser from 'phaser';
import { StorageService } from './StorageService';

class AudioServiceClass {
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: string | null = null;

  public playMusic(scene: Phaser.Scene, key: string): void {
    this.currentMusicKey = key;

    if (!StorageService.isMusicEnabled()) {
      this.stopMusic();
      return;
    }

    if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
      return;
    }

    this.stopMusic();

    if (scene.cache.audio.exists(key)) {
      this.currentMusic = scene.sound.add(key, {
        loop: true,
        volume: 0.75,
      });

      const webSound = this.currentMusic as Phaser.Sound.WebAudioSound;
      if (webSound.audioBuffer && webSound.audioBuffer.duration > 1) {
        // Skip the ~25ms MP3 encoder delay/padding at start & end for a 100% sample-accurate loop
        const trim = 0.026;
        this.currentMusic.addMarker({
          name: 'seamless_loop',
          start: trim,
          duration: Math.max(0.5, webSound.audioBuffer.duration - trim * 2),
          config: {
            loop: true,
            volume: 0.75,
          },
        });
        this.currentMusic.play('seamless_loop');
      } else {
        this.currentMusic.play();
      }
    }
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  public playEffect(scene: Phaser.Scene, key: string, volume = 0.9): void {
    if (!StorageService.isEffectsEnabled()) return;
    if (scene.cache.audio.exists(key)) {
      scene.sound.play(key, { volume });
    }
  }

  public createAudioButtons(
    scene: Phaser.Scene,
    musicKeyForScene?: string
  ): { musicContainer: Phaser.GameObjects.Container; effectsContainer: Phaser.GameObjects.Container } {
    const createToggle = (
      x: number,
      y: number,
      iconKey: string,
      isEnabledFn: () => boolean,
      onToggle: () => void
    ) => {
      const container = scene.add.container(x, y).setDepth(100);
      const icon = scene.add.image(0, 0, iconKey).setDisplaySize(25, 25);
      const muteBadge = scene.add.image(5, 5, 'speaker_mute').setDisplaySize(14, 14);
      const slash = scene.add.graphics();
      slash.lineStyle(2.5, 0xff2222, 1);
      slash.lineBetween(-10, -10, 10, 10);

      const updateVisual = () => {
        const enabled = isEnabledFn();
        icon.setAlpha(enabled ? 1 : 0.45);
        muteBadge.setVisible(!enabled);
        slash.setVisible(!enabled);
      };

      updateVisual();

      container.add([icon, muteBadge, slash]);
      container.setSize(30, 30);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (pointer) {
          onToggle();
          updateVisual();
        }
      });

      return container;
    };

    const effectsContainer = createToggle(
      scene.scale.width - 60,
      20,
      'effect_on',
      () => StorageService.isEffectsEnabled(),
      () => {
        StorageService.toggleEffects();
      }
    );

    const musicContainer = createToggle(
      scene.scale.width - 30,
      20,
      'music_on',
      () => StorageService.isMusicEnabled(),
      () => {
        const enabled = StorageService.toggleMusic();
        if (enabled && (musicKeyForScene || this.currentMusicKey)) {
          this.playMusic(scene, musicKeyForScene || this.currentMusicKey!);
        } else {
          this.stopMusic();
        }
      }
    );

    return { musicContainer, effectsContainer };
  }
}

export const AudioService = new AudioServiceClass();

