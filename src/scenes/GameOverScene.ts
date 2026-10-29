import Phaser from 'phaser';
import { AudioService } from '../services/AudioService';
import { CarSkinId, ScoreEntry, StorageService } from '../services/StorageService';

interface GameOverData {
  points: number;
  car?: CarSkinId;
}

export class GameOverScene extends Phaser.Scene {
  private scoreboardVisible = false;
  private boardContainer!: Phaser.GameObjects.Container;
  private rowsContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  public create(data: GameOverData): void {
    const { width, height } = this.scale;
    const gameScore = data?.points ?? 0;
    const usedCar = data?.car ?? StorageService.getSelectedCar();

    this.scoreboardVisible = false;
    this.scrollY = 0;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Background
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

    // Save score BEFORE reading leaderboard (fixes legacy dead.lua bug)
    const { isNewRecord, rankIndex } = StorageService.addScore(gameScore, usedCar);
    const scores = StorageService.getScores();

    const msg = isNewRecord ? `New record ${gameScore}` : `Total points ${gameScore}`;
    this.add
      .text(width / 2, 24, msg, {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '20px',
        color: isNewRecord ? '#ffd24c' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Player Name Badge (click to edit name)
    const playerText = this.add
      .text(width / 2, 48, `Piloto: ${StorageService.getPlayerName()} ✎`, {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '12px',
        color: '#cccccc',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playerText.on('pointerdown', () => {
      const newName = window.prompt('Digite seu nome para o ranking (máx. 15 letras):', StorageService.getPlayerName());
      if (newName !== null && newName.trim().length > 0) {
        StorageService.setPlayerName(newName);
        playerText.setText(`Piloto: ${StorageService.getPlayerName()} ✎`);
      }
    });

    // Scoreboard TableView equivalent
    this.createScoreboardTable(scores, rankIndex);

    // "score board" button + icon (matching dead.lua layout)
    const scoreBoardGroup = this.add.container(width / 2, height - 95);
    const listScoresText = this.add
      .text(-12, 0, 'score board', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const scoreBtn = this.add
      .image(listScoresText.width / 2 + 6, 0, 'list_scores')
      .setDisplaySize(20, 24);

    scoreBoardGroup.add([listScoresText, scoreBtn]);
    scoreBoardGroup.setSize(130, 32);
    scoreBoardGroup.setInteractive({ useHandCursor: true });

    scoreBoardGroup.on('pointerdown', () => {
      this.toggleScoreboard();
    });

    // Restart Button
    const playBtn = this.add
      .image(width * 0.5, height - 48, 'button-restart')
      .setDisplaySize(154, 40)
      .setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setTint(0xdddddd));
    playBtn.on('pointerout', () => playBtn.clearTint());
    playBtn.on('pointerdown', () => playBtn.setScale(0.95));
    playBtn.on('pointerup', () => {
      playBtn.setScale(1);
      this.restartGame();
    });

    // Menu link
    const menuBtn = this.add
      .text(width / 2, height - 14, 'Voltar ao Menu', {
        fontFamily: 'DroidLogo, sans-serif',
        fontSize: '11px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffd24c'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#aaaaaa'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.restartGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.restartGame());
  }

  private createScoreboardTable(scores: ScoreEntry[], highlightIndex: number): void {
    const tableTop = 117;
    const tableWidth = 320;
    const tableHeight = 209;
    const rowHeight = 40;

    this.boardContainer = this.add.container(0, tableTop).setAlpha(0).setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.96);
    bg.fillRect(0, 0, tableWidth, tableHeight);
    this.boardContainer.add(bg);

    this.rowsContainer = this.add.container(0, 0);
    this.boardContainer.add(this.rowsContainer);

    // Mask for scrolling inside the 320x209 table area
    const maskShape = this.make.graphics({ x: 0, y: tableTop });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 0, tableWidth, tableHeight);
    const mask = maskShape.createGeometryMask();
    this.rowsContainer.setMask(mask);

    scores.forEach((entry, idx) => {
      const y = idx * rowHeight;
      const rowBg = this.add.graphics();
      rowBg.fillStyle(idx === highlightIndex ? 0xfff3cd : idx % 2 === 0 ? 0xffffff : 0xf4f4f4, 1);
      rowBg.fillRect(0, y, tableWidth, rowHeight - 1);
      rowBg.lineStyle(1, 0xdddddd, 1);
      rowBg.lineBetween(0, y + rowHeight - 1, tableWidth, y + rowHeight - 1);

      const numberText = this.add
        .text(15, y + rowHeight * 0.5, `#${idx + 1} - `, {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '16px',
          color: '#000000',
        })
        .setOrigin(0, 0.5);

      const nameText = this.add
        .text(15 + numberText.width, y + rowHeight * 0.5, entry.name, {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '16px',
          color: '#000000',
        })
        .setOrigin(0, 0.5);

      const scoreText = this.add
        .text(tableWidth - 20, y + rowHeight * 0.5, String(entry.value), {
          fontFamily: 'DroidLogo, sans-serif',
          fontSize: '16px',
          color: '#000000',
          fontStyle: idx === highlightIndex ? 'bold' : 'normal',
        })
        .setOrigin(1, 0.5);

      this.rowsContainer.add([rowBg, numberText, nameText, scoreText]);
    });

    this.maxScrollY = Math.max(0, scores.length * rowHeight - tableHeight);

    // Mouse wheel & touch drag scrolling
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _dx: number, dy: number) => {
      if (!this.scoreboardVisible || this.maxScrollY <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy * 0.5, -this.maxScrollY, 0);
      this.rowsContainer.y = this.scrollY;
    });

    let dragStartY = 0;
    let initialScrollY = 0;
    const dragZone = this.add
      .zone(tableWidth / 2, tableHeight / 2, tableWidth, tableHeight)
      .setInteractive();
    this.boardContainer.add(dragZone);

    dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragStartY = pointer.y;
      initialScrollY = this.scrollY;
    });

    dragZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.scoreboardVisible || this.maxScrollY <= 0) return;
      const deltaY = pointer.y - dragStartY;
      this.scrollY = Phaser.Math.Clamp(initialScrollY + deltaY, -this.maxScrollY, 0);
      this.rowsContainer.y = this.scrollY;
    });
  }

  private toggleScoreboard(): void {
    AudioService.playEffect(this, 'curva', 0.4);
    this.scoreboardVisible = !this.scoreboardVisible;
    this.tweens.add({
      targets: this.boardContainer,
      alpha: this.scoreboardVisible ? 1 : 0,
      duration: 300,
    });
  }

  private restartGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}
