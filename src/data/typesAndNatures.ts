import { AbilityData, NatureData, PokemonType, StatKey } from '../types/game';

export const TYPE_NAMES_TR: Record<PokemonType, string> = {
  Normal: 'Normal',
  Fire: 'Ateş',
  Water: 'Su',
  Grass: 'Çimen',
  Electric: 'Elektrik',
  Ice: 'Buz',
  Fighting: 'Dövüş',
  Poison: 'Zehir',
  Ground: 'Toprak',
  Flying: 'Uçan',
  Psychic: 'Psişik',
  Bug: 'Böcek',
  Rock: 'Kaya',
  Ghost: 'Hayalet',
  Dragon: 'Ejder',
  Dark: 'Karanlık',
  Steel: 'Çelik',
};

export const TYPE_COLORS: Record<PokemonType, { bg: string; border: string; text: string }> = {
  Normal: { bg: '#A8A77A', border: '#6D6D4E', text: '#fff' },
  Fire: { bg: '#EE8130', border: '#9C531F', text: '#fff' },
  Water: { bg: '#6390F0', border: '#445E9C', text: '#fff' },
  Grass: { bg: '#7AC74C', border: '#4E8234', text: '#fff' },
  Electric: { bg: '#F7D02C', border: '#A1871F', text: '#1e293b' },
  Ice: { bg: '#96D9D6', border: '#638D8D', text: '#0f172a' },
  Fighting: { bg: '#C22E28', border: '#7D1F1A', text: '#fff' },
  Poison: { bg: '#A33EA1', border: '#682A68', text: '#fff' },
  Ground: { bg: '#E2BF65', border: '#927D44', text: '#1e293b' },
  Flying: { bg: '#A98FF3', border: '#6D5E9C', text: '#fff' },
  Psychic: { bg: '#F95587', border: '#A13959', text: '#fff' },
  Bug: { bg: '#A6B91A', border: '#6D7815', text: '#fff' },
  Rock: { bg: '#B6A136', border: '#786824', text: '#fff' },
  Ghost: { bg: '#735797', border: '#493963', text: '#fff' },
  Dragon: { bg: '#6F35FC', border: '#4924A1', text: '#fff' },
  Dark: { bg: '#705746', border: '#49392F', text: '#fff' },
  Steel: { bg: '#B7B7CE', border: '#787887', text: '#0f172a' },
};

export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground: { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
  },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5 },
};

export function getTypeEffectiveness(
  moveType: PokemonType,
  defenderTypes: PokemonType[],
  defenderAbility?: string
): number {
  if (moveType === 'Ground' && defenderAbility === 'levitate') return 0;
  if (moveType === 'Fire' && defenderAbility === 'flash_fire') return 0;
  if (moveType === 'Water' && defenderAbility === 'water_absorb') return 0;
  if (moveType === 'Electric' && defenderAbility === 'volt_absorb') return 0;

  let mult = 1;
  for (const dt of defenderTypes) {
    const mod = TYPE_CHART[moveType]?.[dt];
    if (mod !== undefined) mult *= mod;
  }
  if ((moveType === 'Fire' || moveType === 'Ice') && defenderAbility === 'thick_fat') {
    mult *= 0.5;
  }
  return mult;
}

export const NATURES: Record<string, NatureData> = {
  hardy: { id: 'hardy', nameTr: 'Dayanıklı (Dengeli)' },
  lonely: { id: 'lonely', nameTr: 'Yalnız (+Sal / -Sav)', up: 'atk', down: 'def' },
  brave: { id: 'brave', nameTr: 'Cesur (+Sal / -Hız)', up: 'atk', down: 'spe' },
  adamant: { id: 'adamant', nameTr: 'İnatçı (+Sal / -Ö.Sal)', up: 'atk', down: 'spa' },
  naughty: { id: 'naughty', nameTr: 'Yaramaz (+Sal / -Ö.Sav)', up: 'atk', down: 'spd' },
  bold: { id: 'bold', nameTr: 'Gözüpek (+Sav / -Sal)', up: 'def', down: 'atk' },
  docile: { id: 'docile', nameTr: 'Uysal (Dengeli)' },
  relaxed: { id: 'relaxed', nameTr: 'Rahat (+Sav / -Hız)', up: 'def', down: 'spe' },
  impish: { id: 'impish', nameTr: 'Afacan (+Sav / -Ö.Sal)', up: 'def', down: 'spa' },
  lax: { id: 'lax', nameTr: 'Gevşek (+Sav / -Ö.Sav)', up: 'def', down: 'spd' },
  timid: { id: 'timid', nameTr: 'Ürkek (+Hız / -Sal)', up: 'spe', down: 'atk' },
  hasty: { id: 'hasty', nameTr: 'Aceleci (+Hız / -Sav)', up: 'spe', down: 'def' },
  serious: { id: 'serious', nameTr: 'Ciddi (Dengeli)' },
  jolly: { id: 'jolly', nameTr: 'Neşeli (+Hız / -Ö.Sal)', up: 'spe', down: 'spa' },
  naive: { id: 'naive', nameTr: 'Saf (+Hız / -Ö.Sav)', up: 'spe', down: 'spd' },
  modest: { id: 'modest', nameTr: 'Mütevazı (+Ö.Sal / -Sal)', up: 'spa', down: 'atk' },
  mild: { id: 'mild', nameTr: 'Yumuşak (+Ö.Sal / -Sav)', up: 'spa', down: 'def' },
  quiet: { id: 'quiet', nameTr: 'Sakin (+Ö.Sal / -Hız)', up: 'spa', down: 'spe' },
  bashful: { id: 'bashful', nameTr: 'Utangaç (Dengeli)' },
  rash: { id: 'rash', nameTr: 'Atılgan (+Ö.Sal / -Ö.Sav)', up: 'spa', down: 'spd' },
  calm: { id: 'calm', nameTr: 'Dingin (+Ö.Sav / -Sal)', up: 'spd', down: 'atk' },
  gentle: { id: 'gentle', nameTr: 'Nazik (+Ö.Sav / -Sav)', up: 'spd', down: 'def' },
  sassy: { id: 'sassy', nameTr: 'Dikbaşlı (+Ö.Sav / -Hız)', up: 'spd', down: 'spe' },
  careful: { id: 'careful', nameTr: 'Temkinli (+Ö.Sav / -Ö.Sal)', up: 'spd', down: 'spa' },
  quirky: { id: 'quirky', nameTr: 'Kendine Has (Dengeli)' },
};

export const NATURE_LIST = Object.values(NATURES);

export function getNatureMultiplier(natureId: string, stat: Exclude<StatKey, 'hp'>): number {
  const n = NATURES[natureId];
  if (!n) return 1;
  if (n.up === stat) return 1.1;
  if (n.down === stat) return 0.9;
  return 1;
}

export const ABILITIES: Record<string, AbilityData> = {
  overgrow: {
    id: 'overgrow',
    nameTr: 'Aşırı Büyüme',
    descTr: 'HP %33 altına düştüğünde Çimen tipi saldırıların gücünü %50 artırır.',
  },
  blaze: {
    id: 'blaze',
    nameTr: 'Alev Yüreği',
    descTr: 'HP %33 altına düştüğünde Ateş tipi saldırıların gücünü %50 artırır.',
  },
  torrent: {
    id: 'torrent',
    nameTr: 'Coşkun Akıntı',
    descTr: 'HP %33 altına düştüğünde Su tipi saldırıların gücünü %50 artırır.',
  },
  swarm: {
    id: 'swarm',
    nameTr: 'Böcek Sürüsü',
    descTr: 'HP %33 altına düştüğünde Böcek tipi saldırıların gücünü %50 artırır.',
  },
  intimidate: {
    id: 'intimidate',
    nameTr: 'Gözdağı',
    descTr: 'Savaşa girdiğinde rakibin Saldırı istatistiğini 1 kademe düşürür.',
  },
  levitate: {
    id: 'levitate',
    nameTr: 'Havada Süzülme',
    descTr: 'Toprak tipi saldırılardan hiç hasar almaz.',
  },
  sturdy: {
    id: 'sturdy',
    nameTr: 'Kaya Sağlamlığı',
    descTr: 'Tam candayken tek vuruşta bayılmaz, en az 1 HP ile ayakta kalır.',
  },
  static: {
    id: 'static',
    nameTr: 'Statik Elektrik',
    descTr: 'Temas eden rakibi %30 ihtimalle felç (PAR) bırakır.',
  },
  flame_body: {
    id: 'flame_body',
    nameTr: 'Alev Beden',
    descTr: 'Temas eden rakibi %30 ihtimalle yakar (BRN).',
  },
  poison_point: {
    id: 'poison_point',
    nameTr: 'Zehirli Diken',
    descTr: 'Temas eden rakibi %30 ihtimalle zehirler (PSN).',
  },
  swift_swim: {
    id: 'swift_swim',
    nameTr: 'Hızlı Yüzücü',
    descTr: 'Yağmurlu havada Hız istatistiği iki katına çıkar.',
  },
  chlorophyll: {
    id: 'chlorophyll',
    nameTr: 'Klorofil',
    descTr: 'Güneşli havada Hız istatistiği iki katına çıkar.',
  },
  drizzle: {
    id: 'drizzle',
    nameTr: 'Sağanak Çağrısı',
    descTr: 'Savaşa girdiğinde şiddetli yağmur başlatır (Kyogre imzası).',
  },
  drought: {
    id: 'drought',
    nameTr: 'Kuraklık Güneşi',
    descTr: 'Savaşa girdiğinde kavurucu güneş başlatır (Groudon imzası).',
  },
  sand_stream: {
    id: 'sand_stream',
    nameTr: 'Kum Fırtınası',
    descTr: 'Savaşa girdiğinde kum fırtınası başlatır.',
  },
  air_lock: {
    id: 'air_lock',
    nameTr: 'Hava Kilidi',
    descTr: 'Tüm hava durumu etkilerini nötralize eder (Rayquaza imzası).',
  },
  guts: {
    id: 'guts',
    nameTr: 'Azim',
    descTr: 'Durum etkisi (Yanık/Zehir/Felç) altındayken Saldırı %50 artar, yanık cezası işlemez.',
  },
  thick_fat: {
    id: 'thick_fat',
    nameTr: 'Kalın Katman',
    descTr: 'Ateş ve Buz tipi saldırılardan alınan hasarı %50 azaltır.',
  },
  flash_fire: {
    id: 'flash_fire',
    nameTr: 'Alev Emişi',
    descTr: 'Ateş saldırılarından hasar almaz, aksine alev gücüyle beslenir.',
  },
  water_absorb: {
    id: 'water_absorb',
    nameTr: 'Su Emişi',
    descTr: 'Su saldırılarından hasar almak yerine HP yeniler.',
  },
  volt_absorb: {
    id: 'volt_absorb',
    nameTr: 'Volt Emişi',
    descTr: 'Elektrik saldırılarından hasar almak yerine HP yeniler.',
  },
  speed_boost: {
    id: 'speed_boost',
    nameTr: 'Hız İvmesi',
    descTr: 'Her turun sonunda Hız istatistiği 1 kademe yükselir.',
  },
  clear_body: {
    id: 'clear_body',
    nameTr: 'Saf Gövde',
    descTr: 'Rakibin istatistik düşürme etkilerini tamamen engeller.',
  },
  keen_eye: {
    id: 'keen_eye',
    nameTr: 'Keskin Göz',
    descTr: 'İsabet oranının düşürülmesini engeller.',
  },
  natural_cure: {
    id: 'natural_cure',
    nameTr: 'Doğal Şifa',
    descTr: 'Savaştan çıkınca veya değiştirilince durum bozukluklarını iyileştirir.',
  },
  inner_focus: {
    id: 'inner_focus',
    nameTr: 'İçsel Odak',
    descTr: 'Ürperme (Flinch) etkisine karşı tam bağışıklık sağlar.',
  },
  serene_grace: {
    id: 'serene_grace',
    nameTr: 'İlahi Zarafet',
    descTr: 'Saldırıların ikincil etki ihtimallerini ikiye katlar.',
  },
  pressure: {
    id: 'pressure',
    nameTr: 'Efsanevi Baskı',
    descTr: 'Rakibin kullandığı saldırıların PP tüketimini iki katına çıkarır.',
  },
};

export const STAT_NAMES_TR: Record<StatKey, string> = {
  hp: 'Can (HP)',
  atk: 'Saldırı',
  def: 'Savunma',
  spa: 'Özel Sal.',
  spd: 'Özel Sav.',
  spe: 'Hız',
};
