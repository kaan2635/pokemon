export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type BattleStatKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'acc' | 'eva';

export type StatusCondition = 'none' | 'par' | 'brn' | 'psn' | 'tox' | 'slp' | 'frz';

export type WeatherType = 'clear' | 'rain' | 'sun' | 'sandstorm' | 'hail';

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveEffect {
  status?: StatusCondition;
  statusChance?: number; // 0-100
  statChanges?: Partial<Record<BattleStatKey, number>>;
  targetSelf?: boolean;
  statChance?: number; // 0-100, default 100 for status moves
  drainPercent?: number; // e.g., 50 heals 50% of damage dealt
  recoilPercent?: number; // e.g., 25 or 33
  healPercent?: number; // e.g., 50 heals 50% max HP
  flinchChance?: number;
  highCrit?: boolean;
  multiHit?: [number, number]; // e.g. [2, 5]
  weather?: WeatherType;
  alwaysHits?: boolean;
  ohko?: boolean;
  protect?: boolean;
  leechSeed?: boolean;
}

export interface MoveData {
  id: string;
  nameTr: string;
  nameEn: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number; // 0 means never misses
  pp: number;
  priority?: number;
  contact?: boolean;
  descTr: string;
  effect?: MoveEffect;
}

export interface NatureData {
  id: string;
  nameTr: string;
  up?: Exclude<StatKey, 'hp'>;
  down?: Exclude<StatKey, 'hp'>;
}

export interface AbilityData {
  id: string;
  nameTr: string;
  descTr: string;
}

export interface EvolutionRule {
  to: number;
  level?: number;
  item?: string; // item id like 'fire-stone', 'thunder-stone', 'metal-coat', etc.
}

export interface SpeciesData {
  id: number; // National Dex ID
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Record<StatKey, number>;
  abilities: string[];
  catchRate: number; // 3 - 255
  baseExp: number;
  evYield: Partial<Record<StatKey, number>>;
  region: 'Kanto' | 'Johto' | 'Hoenn';
  dexDescTr: string;
  learnset: Array<{ level: number; moveId: string }>;
  evolutions?: EvolutionRule[];
}

export interface MoveSlot {
  moveId: string;
  pp: number;
  maxPp: number;
}

export interface MegaFormData {
  id: string;
  baseSpeciesId: number;
  spriteId: number; // PokeAPI sprite ID (e.g. 10034)
  nameTr: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Record<StatKey, number>;
  ability: string;
  requiredItem?: string;
  requiredMove?: string;
  isPrimal?: boolean;
  descTr: string;
}

export interface PokemonInstance {
  uid: string;
  speciesId: number;
  nickname?: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  currentHp: number;
  maxHp: number;
  stats: Record<StatKey, number>;
  ivs: Record<StatKey, number>;
  evs: Record<StatKey, number>;
  nature: string;
  ability: string;
  isShiny: boolean;
  status: StatusCondition;
  sleepTurns: number;
  moves: MoveSlot[];
  heldItem?: string;
  happiness: number;
  metLocation: string;
  pokeball: string;
  // Transient in-battle states (cleared at battle end)
  megaFormId?: string;
  baseAbility?: string;
  isRaidBoss?: boolean;
}

export type ItemCategory = 'medicine' | 'balls' | 'evo_tm' | 'held_berry' | 'key';

export interface ItemData {
  id: string;
  nameTr: string;
  sprite: string; // filename in /sprites/items/
  category: ItemCategory;
  price: number;
  bpPrice?: number;
  coinPrice?: number;
  descTr: string;
  usableInBattle?: boolean;
  usableInParty?: boolean;
  healHp?: number; // 9999 for full
  healStatus?: StatusCondition | 'all';
  revivePercent?: number;
  ballBonus?: number;
  evoStone?: boolean;
  tmMoveId?: string;
  natureMint?: string;
  rareCandy?: boolean;
  ppRestore?: number;
  repelSteps?: number;
  megaStoneFor?: number;
  abilityCapsule?: boolean;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface WarpPoint {
  x: number;
  y: number;
  toMap: string;
  toX: number;
  toY: number;
  toDir?: Direction;
  reqFlag?: string;
  reqBadges?: number;
  lockedMsgTr?: string;
}

export interface NpcData {
  id: string;
  nameTr: string;
  x: number;
  y: number;
  dir: Direction;
  spriteType:
    | 'oak'
    | 'mom'
    | 'rival'
    | 'nurse'
    | 'mart'
    | 'youngster'
    | 'lass'
    | 'bugcatcher'
    | 'hiker'
    | 'rocket'
    | 'magma'
    | 'gymleader'
    | 'gentleman'
    | 'scientist'
    | 'sailor'
    | 'guard'
    | 'champion'
    | 'legendary'
    | 'guildmaster';
  legendarySpeciesId?: number;
  legendaryLevel?: number;
  dialogueTr: string[];
  afterDefeatDialogueTr?: string[];
  role?:
    | 'healer'
    | 'mart'
    | 'stone_mart'
    | 'tm_mart'
    | 'bp_mart'
    | 'mega_mart'
    | 'oak_starter'
    | 'trainer'
    | 'gym_leader'
    | 'elite_four'
    | 'fossil_revive'
    | 'nature_guru'
    | 'ferry_captain'
    | 'safari_warden'
    | 'rescue_board'
    | 'pinball_arcade'
    | 'battle_tower'
    | 'battle_factory'
    | 'gift_npc'
    | 'quiz_gate'
    | 'legendary_boss';
  trainerId?: string;
  sightRange?: number;
  giftItem?: { itemId: string; count: number; flag: string; msgTr: string };
  giftPokemon?: { speciesId: number; level: number; flag: string; msgTr: string };
  quiz?: { questionTr: string; options: string[]; answerIdx: number; flag: string };
  hideIfFlag?: string;
  showIfFlag?: string;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  itemId: string;
  count: number;
}

export interface SignData {
  x: number;
  y: number;
  textTr: string[];
}

export interface EncounterEntry {
  speciesId: number;
  minLv: number;
  maxLv: number;
  weight: number;
}

export interface MapData {
  id: string;
  nameTr: string;
  subtitleTr: string;
  region: 'Kanto' | 'Sevii & Sınır';
  music: 'pallet' | 'route' | 'city' | 'cave' | 'lavender' | 'gym' | 'indigo' | 'frontier';
  weather: WeatherType;
  isIndoor?: boolean;
  isCave?: boolean;
  flySpot?: { x: number; y: number };
  healSpot?: { mapId: string; x: number; y: number };
  rows: string[];
  warps: WarpPoint[];
  npcs: NpcData[];
  groundItems: GroundItem[];
  signs: SignData[];
  grassEncounters?: EncounterEntry[];
  waterEncounters?: EncounterEntry[];
  fishEncounters?: EncounterEntry[];
}

export interface TrainerPartySpec {
  speciesId: number;
  level: number;
  heldItem?: string;
  moves?: string[];
  ability?: string;
  nature?: string;
}

export interface TrainerData {
  id: string;
  nameTr: string;
  titleTr: string;
  spriteType: NpcData['spriteType'];
  rewardMoney: number;
  badgeId?: string;
  badgeNameTr?: string;
  tmReward?: string;
  aiTier: 'basic' | 'smart' | 'boss';
  healItems?: string[];
  introTr: string;
  defeatTr: string;
  party: TrainerPartySpec[];
}

export interface RescueQuest {
  id: string;
  titleTr: string;
  clientSpeciesId: number;
  clientNameTr: string;
  locationTr: string;
  descTr: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  type: 'catch_species' | 'catch_type' | 'defeat_count' | 'reach_badge' | 'visit_map';
  targetSpeciesId?: number;
  targetType?: PokemonType;
  targetCount?: number;
  targetBadgeId?: string;
  targetMapId?: string;
  rewardMoney: number;
  rewardRescuePts: number;
  rewardItem: { itemId: string; count: number };
}

export type DifficultyMode = 'normal' | 'emerald_hard';

export interface GameSettings {
  gameSpeed: 1 | 2 | 3;
  soundEnabled: boolean;
  musicVolume: number;
  autoRun: boolean;
  difficulty: DifficultyMode;
  nuzlocke: boolean;
  expShareAll: boolean;
}

export interface SaveState {
  version: number;
  playerName: string;
  rivalName: string;
  starterSpeciesId: number;
  mapId: string;
  x: number;
  y: number;
  dir: Direction;
  isSurfing: boolean;
  isBiking: boolean;
  lastHealSpot: { mapId: string; x: number; y: number };
  party: PokemonInstance[];
  pcBox: PokemonInstance[];
  bag: Record<string, number>;
  money: number;
  battlePoints: number;
  coins: number;
  badges: string[];
  visitedMaps: string[];
  defeatedTrainers: string[];
  collectedGroundItems: string[];
  flags: Record<string, boolean>;
  pokedexSeen: number[];
  pokedexCaught: number[];
  repelSteps: number;
  vsSeekerCharge: number; // 0..100
  pokeVialCharges?: number; // 0..3 portable heals
  safariSteps: number;
  safariBalls: number;
  completedQuests: string[];
  activeQuestProgress: Record<string, number>;
  rescuePoints: number;
  towerBestStreak: number;
  factoryBestStreak: number;
  totalBattlesWon: number;
  playSeconds: number;
  settings: GameSettings;
}
