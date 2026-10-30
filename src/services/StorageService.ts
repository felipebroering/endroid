export type CarSkinId = 'red' | 'herbie' | 'delorean' | 'speedracer';
export type TrackMode = 'modern' | '2013' | 'past' | 'future' | 'west';

export interface CarSkinConfig {
  id: CarSkinId;
  name: string;
  textureKey: string;
  logoKey?: string;
  width: number;
  height: number;
  moveSpeed: number;
  bonusLives: number;
  canJump: boolean;
  hint: string;
  unlockMessage: string;
}

export const CAR_SKINS: Record<CarSkinId, CarSkinConfig> = {
  red: {
    id: 'red',
    name: 'Endroid GT',
    textureKey: 'red_car',
    width: 34,
    height: 56,
    moveSpeed: 5,
    bonusLives: 0,
    canJump: false,
    hint: 'Carro padrão',
    unlockMessage: 'Endroid GT pronto!',
  },
  herbie: {
    id: 'herbie',
    name: 'Herbie #53',
    textureKey: 'car_herbie',
    logoKey: 'logo_herbie',
    width: 34,
    height: 64,
    moveSpeed: 5.5,
    bonusLives: 1,
    canJump: false,
    hint: 'Easter Egg: Ultrapasse 53 carros ou digite 53',
    unlockMessage: 'HERBIE #53 DESBLOQUEADO! (+1 Vida & +530 pts)',
  },
  delorean: {
    id: 'delorean',
    name: 'DeLorean DMC-12',
    textureKey: 'car_delorean',
    logoKey: 'logo_delorean',
    width: 34,
    height: 64,
    moveSpeed: 6,
    bonusLives: 0,
    canJump: false,
    hint: 'Easter Egg: Atinja 88 KM/H ou digite 88',
    unlockMessage: '88 KM/H! DELOREAN DESBLOQUEADO! (Salto Temporal +880 pts)',
  },
  speedracer: {
    id: 'speedracer',
    name: 'Mach 5',
    textureKey: 'car_speedracer',
    logoKey: 'logo_speedracer',
    width: 32,
    height: 66,
    moveSpeed: 6.8,
    bonusLives: 0,
    canJump: true,
    hint: 'Easter Egg: 1000 pts sem bater, 110 KM/H ou digite MACH5',
    unlockMessage: 'GO SPEED RACER! MACH 5 DESBLOQUEADO! (Espaço = Pulo)',
  },
};

export interface ScoreEntry {
  name: string;
  value: number;
  date: number;
  car?: CarSkinId;
}

interface GameSettings {
  music: boolean;
  effects: boolean;
  playerName: string;
  selectedCar: CarSkinId;
  trackMode: TrackMode;
  unlockedCars: Record<CarSkinId, boolean>;
  unlockedTracks: Record<TrackMode, boolean>;
}

const SETTINGS_KEY = 'endroid_settings_v2';
const SCORES_KEY = 'endroid_scores_v2';

class StorageServiceClass {
  private settings: GameSettings;
  private scores: ScoreEntry[];

  constructor() {
    this.settings = this.loadSettings();
    this.saveSettings();
    this.scores = this.loadScores();
  }

  private getDefaultPlayerName(): string {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
    if (/Macintosh/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Player 1';
  }

  private loadSettings(): GameSettings {
    const defaults: GameSettings = {
      music: true,
      effects: true,
      playerName: this.getDefaultPlayerName(),
      selectedCar: 'red',
      trackMode: 'modern',
      unlockedCars: {
        red: true,
        herbie: false,
        delorean: false,
        speedracer: false,
      },
      unlockedTracks: {
        modern: true,
        '2013': true,
        past: false,
        future: false,
        west: false,
      },
    };

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        unlockedCars: {
          ...defaults.unlockedCars,
          ...(parsed.unlockedCars || {}),
        },
        unlockedTracks: {
          ...defaults.unlockedTracks,
          ...(parsed.unlockedTracks || {}),
        },
      };
    } catch {
      return defaults;
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage quota errors
    }
  }

  private loadScores(): ScoreEntry[] {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.value - a.value);
      }
      return [];
    } catch {
      return [];
    }
  }

  public isMusicEnabled(): boolean {
    return this.settings.music;
  }

  public isEffectsEnabled(): boolean {
    return this.settings.effects;
  }

  public toggleMusic(): boolean {
    this.settings.music = !this.settings.music;
    this.saveSettings();
    return this.settings.music;
  }

  public toggleEffects(): boolean {
    this.settings.effects = !this.settings.effects;
    this.saveSettings();
    return this.settings.effects;
  }

  public getPlayerName(): string {
    return this.settings.playerName;
  }

  public setPlayerName(name: string): void {
    const clean = name.trim().slice(0, 15) || this.getDefaultPlayerName();
    this.settings.playerName = clean;
    this.saveSettings();
  }

  public getSelectedCar(): CarSkinId {
    return this.settings.selectedCar;
  }

  public getTrackMode(): TrackMode {
    return this.settings.trackMode || 'modern';
  }

  public isTrackUnlocked(track: TrackMode): boolean {
    return !!this.settings.unlockedTracks?.[track];
  }

  public unlockTrack(track: TrackMode): boolean {
    const wasUnlocked = !!this.settings.unlockedTracks?.[track];
    this.settings.unlockedTracks[track] = true;
    this.saveSettings();
    return !wasUnlocked;
  }

  public getUnlockedTracks(): TrackMode[] {
    const order: TrackMode[] = ['modern', '2013', 'past', 'future', 'west'];
    return order.filter((t) => this.isTrackUnlocked(t));
  }

  public toggleTrackMode(): TrackMode {
    const unlocked = this.getUnlockedTracks();
    const currentIdx = unlocked.indexOf(this.getTrackMode());
    const nextIdx = (currentIdx + 1) % unlocked.length;
    this.settings.trackMode = unlocked[nextIdx] || 'modern';
    this.saveSettings();
    return this.settings.trackMode;
  }

  public setSelectedCar(car: CarSkinId): void {
    if (this.settings.unlockedCars[car]) {
      this.settings.selectedCar = car;
      this.saveSettings();
    }
  }

  public isCarUnlocked(car: CarSkinId): boolean {
    return !!this.settings.unlockedCars[car];
  }

  public unlockCar(car: CarSkinId): boolean {
    const wasUnlocked = this.settings.unlockedCars[car];
    this.settings.unlockedCars[car] = true;
    this.saveSettings();
    return !wasUnlocked;
  }

  public getScores(): ScoreEntry[] {
    return [...this.scores];
  }

  public getHighScore(): number {
    return this.scores.length > 0 ? this.scores[0].value : 0;
  }

  public addScore(value: number, car: CarSkinId = this.settings.selectedCar): {
    isNewRecord: boolean;
    rankIndex: number;
  } {
    const previousHigh = this.getHighScore();
    const isNewRecord = this.scores.length > 0 ? value > previousHigh : value > 0;

    const entry: ScoreEntry = {
      name: this.settings.playerName.slice(0, 15),
      value,
      date: Date.now(),
      car,
    };

    this.scores.push(entry);
    this.scores.sort((a, b) => b.value - a.value);
    if (this.scores.length > 25) {
      this.scores = this.scores.slice(0, 25);
    }

    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(this.scores));
    } catch {
      // Ignore storage errors
    }

    const rankIndex = this.scores.indexOf(entry);
    return { isNewRecord, rankIndex };
  }
}

export const StorageService = new StorageServiceClass();

