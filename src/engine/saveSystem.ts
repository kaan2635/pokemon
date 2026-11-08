import { DifficultyMode, SaveState } from '../types/game';

const STORAGE_KEY = 'pokemon_kizil_zumrut_save_v1';

export function createNewSaveState(
  playerName = 'Red',
  rivalName = 'Blue',
  difficulty: DifficultyMode = 'normal',
  nuzlocke = false
): SaveState {
  return {
    version: 1,
    playerName: playerName.trim() || 'Red',
    rivalName: rivalName.trim() || 'Blue',
    starterSpeciesId: 0,
    mapId: 'player_house',
    x: 5,
    y: 5,
    dir: 'down',
    isSurfing: false,
    isBiking: false,
    lastHealSpot: { mapId: 'pallet_town', x: 6, y: 5 },
    party: [],
    pcBox: [],
    bag: {
      potion: 5,
      'poke-ball': 5,
      'oran-berry': 2,
      'mega-ring': 1,
      'ability-capsule': 1,
    },
    money: 3000,
    battlePoints: 0,
    coins: 50,
    badges: [],
    visitedMaps: ['player_house', 'pallet_town'],
    defeatedTrainers: [],
    collectedGroundItems: [],
    flags: {},
    pokedexSeen: [],
    pokedexCaught: [],
    repelSteps: 0,
    vsSeekerCharge: 60,
    pokeVialCharges: 3,
    safariSteps: 0,
    safariBalls: 0,
    completedQuests: [],
    activeQuestProgress: {},
    rescuePoints: 0,
    towerBestStreak: 0,
    factoryBestStreak: 0,
    totalBattlesWon: 0,
    playSeconds: 0,
    settings: {
      gameSpeed: 1,
      soundEnabled: true,
      musicVolume: 0.3,
      autoRun: true,
      difficulty,
      nuzlocke,
      expShareAll: true,
    },
  };
}

export function loadSaveFromStorage(): SaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveState;
    if (!parsed || typeof parsed !== 'object' || !parsed.mapId || !Array.isArray(parsed.party)) {
      return null;
    }
    if (!parsed.bag) parsed.bag = {};
    if (!parsed.bag['mega-ring']) parsed.bag['mega-ring'] = 1;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSaveToStorage(state: SaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function hasSavedGame(): boolean {
  return loadSaveFromStorage() !== null;
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
