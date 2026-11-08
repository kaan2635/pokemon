import { MOVES } from '../data/moves';
import { POKEDEX, POKEDEX_LIST } from '../data/pokedex';
import { getNatureMultiplier, NATURE_LIST } from '../data/typesAndNatures';
import { MegaFormData, MoveSlot, PokemonInstance, StatKey } from '../types/game';

export function expForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(Math.pow(level, 3));
}

export function computeStatsFromBase(
  baseStats: Record<StatKey, number>,
  level: number,
  ivs: Record<StatKey, number>,
  evs: Record<StatKey, number>,
  natureId: string
): Record<StatKey, number> {
  const hp =
    Math.floor(((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * level) / 100) +
    level +
    10;

  const calcOther = (key: Exclude<StatKey, 'hp'>) => {
    const raw =
      Math.floor(((2 * baseStats[key] + ivs[key] + Math.floor(evs[key] / 4)) * level) / 100) + 5;
    return Math.max(5, Math.floor(raw * getNatureMultiplier(natureId, key)));
  };

  return {
    hp,
    atk: calcOther('atk'),
    def: calcOther('def'),
    spa: calcOther('spa'),
    spd: calcOther('spd'),
    spe: calcOther('spe'),
  };
}

export function computeStats(
  speciesId: number,
  level: number,
  ivs: Record<StatKey, number>,
  evs: Record<StatKey, number>,
  natureId: string
): Record<StatKey, number> {
  const sp = POKEDEX[speciesId];
  return computeStatsFromBase(sp.baseStats, level, ivs, evs, natureId);
}

export interface CreatePokemonOptions {
  isStarter?: boolean;
  dexNavBoost?: boolean;
  forceShiny?: boolean;
  heldItem?: string;
  customMoves?: string[];
  customAbility?: string;
  customNature?: string;
  metLocation?: string;
  pokeball?: string;
  perfectIvs?: boolean;
}

export function createPokemon(
  speciesId: number,
  level: number,
  opts: CreatePokemonOptions = {}
): PokemonInstance {
  const sp = POKEDEX[speciesId] || POKEDEX[25];
  const randIv = () =>
    opts.perfectIvs
      ? 31
      : opts.isStarter || opts.dexNavBoost
      ? 18 + Math.floor(Math.random() * 14)
      : Math.floor(Math.random() * 32);

  const ivs: Record<StatKey, number> = {
    hp: randIv(),
    atk: randIv(),
    def: randIv(),
    spa: randIv(),
    spd: randIv(),
    spe: randIv(),
  };

  const evs: Record<StatKey, number> = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const nature =
    opts.customNature || NATURE_LIST[Math.floor(Math.random() * NATURE_LIST.length)].id;
  const ability =
    opts.customAbility || sp.abilities[Math.floor(Math.random() * sp.abilities.length)] || 'keen_eye';

  const shinyThreshold = opts.forceShiny ? 1 : opts.dexNavBoost ? 1 / 45 : 1 / 220;
  const isShiny = Math.random() < shinyThreshold;

  const stats = computeStats(sp.id, level, ivs, evs, nature);

  let chosenMoveIds: string[] = [];
  if (opts.customMoves && opts.customMoves.length > 0) {
    chosenMoveIds = opts.customMoves.filter((m) => MOVES[m]).slice(0, 4);
  } else {
    const eligible = sp.learnset.filter((l) => l.level <= level).map((l) => l.moveId);
    const unique = Array.from(new Set(eligible));
    chosenMoveIds = unique.slice(-4);
    if (chosenMoveIds.length === 0) {
      chosenMoveIds = [sp.learnset[0]?.moveId || 'tackle'];
    }
  }

  const moves: MoveSlot[] = chosenMoveIds.map((id) => {
    const md = MOVES[id] || MOVES.tackle;
    return { moveId: md.id, pp: md.pp, maxPp: md.pp };
  });

  return {
    uid: `${sp.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speciesId: sp.id,
    level,
    exp: expForLevel(level),
    nextLevelExp: expForLevel(level + 1),
    currentHp: stats.hp,
    maxHp: stats.hp,
    stats,
    ivs,
    evs,
    nature,
    ability,
    isShiny,
    status: 'none',
    sleepTurns: 0,
    moves,
    heldItem: opts.heldItem,
    happiness: opts.isStarter ? 120 : 70,
    metLocation: opts.metLocation || 'Kanto',
    pokeball: opts.pokeball || 'poke-ball',
  };
}

export function recalculatePokemonStats(mon: PokemonInstance): PokemonInstance {
  const newStats = computeStats(mon.speciesId, mon.level, mon.ivs, mon.evs, mon.nature);
  const hpDiff = Math.max(0, newStats.hp - mon.maxHp);
  const newHp = mon.currentHp > 0 ? Math.min(newStats.hp, mon.currentHp + hpDiff) : 0;
  return {
    ...mon,
    stats: newStats,
    maxHp: newStats.hp,
    currentHp: newHp,
  };
}

export function healPokemonFull(mon: PokemonInstance): PokemonInstance {
  const clean = revertMegaTransformation(mon);
  const stats = computeStats(clean.speciesId, clean.level, clean.ivs, clean.evs, clean.nature);
  return {
    ...clean,
    stats,
    maxHp: stats.hp,
    currentHp: stats.hp,
    status: 'none',
    sleepTurns: 0,
    moves: clean.moves.map((m) => ({ ...m, pp: m.maxPp })),
  };
}

export function applyMegaTransformation(
  mon: PokemonInstance,
  mega: MegaFormData
): PokemonInstance {
  const megaStats = computeStatsFromBase(mega.baseStats, mon.level, mon.ivs, mon.evs, mon.nature);
  const hpRatio = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 1;
  const newCurrentHp = mon.currentHp > 0 ? Math.max(1, Math.round(megaStats.hp * hpRatio)) : 0;

  return {
    ...mon,
    megaFormId: mega.id,
    baseAbility: mon.baseAbility || mon.ability,
    ability: mega.ability,
    stats: megaStats,
    maxHp: megaStats.hp,
    currentHp: newCurrentHp,
  };
}

export function revertMegaTransformation(mon: PokemonInstance): PokemonInstance {
  if (!mon.megaFormId && !mon.isRaidBoss) return mon;
  const restoredAbility = mon.baseAbility || mon.ability;
  const baseStats = computeStats(mon.speciesId, mon.level, mon.ivs, mon.evs, mon.nature);
  const hpRatio = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 0;
  const restoredHp = mon.currentHp > 0 ? Math.max(1, Math.min(baseStats.hp, Math.round(baseStats.hp * hpRatio))) : 0;

  const copy: PokemonInstance = {
    ...mon,
    ability: restoredAbility,
    stats: baseStats,
    maxHp: baseStats.hp,
    currentHp: restoredHp,
  };
  delete copy.megaFormId;
  delete copy.baseAbility;
  delete copy.isRaidBoss;
  return copy;
}

export function createRaidBossPokemon(speciesId: number, level: number): PokemonInstance {
  const base = createPokemon(speciesId, level, {
    perfectIvs: true,
    dexNavBoost: true,
    metLocation: 'Maksimum Akın İni',
  });
  const raidHp = Math.round(base.maxHp * 2.2);
  return {
    ...base,
    maxHp: raidHp,
    currentHp: raidHp,
    isRaidBoss: true,
  };
}

export interface LevelUpOutcome {
  updated: PokemonInstance;
  levelsGained: number;
  autoLearnedMoves: string[];
  pendingLearnMoves: string[];
  evolveToSpeciesId?: number;
}

export function grantExpToPokemon(
  mon: PokemonInstance,
  expGain: number,
  evYield?: Partial<Record<StatKey, number>>
): LevelUpOutcome {
  if (mon.level >= 100) {
    return { updated: mon, levelsGained: 0, autoLearnedMoves: [], pendingLearnMoves: [] };
  }

  // Apply EV yield (max 252 per stat, 510 total)
  const evs = { ...mon.evs };
  let totalEv = Object.values(evs).reduce((a, b) => a + b, 0);
  if (evYield && totalEv < 510) {
    for (const k of Object.keys(evYield) as StatKey[]) {
      const add = evYield[k] || 0;
      if (add > 0 && evs[k] < 252 && totalEv < 510) {
        const delta = Math.min(add, 252 - evs[k], 510 - totalEv);
        evs[k] += delta;
        totalEv += delta;
      }
    }
  }

  let curLevel = mon.level;
  const newExp = Math.min(expForLevel(100), mon.exp + expGain);
  let levelsGained = 0;
  const sp = POKEDEX[mon.speciesId];
  const moves = [...mon.moves];
  const autoLearnedMoves: string[] = [];
  const pendingLearnMoves: string[] = [];

  while (curLevel < 100 && newExp >= expForLevel(curLevel + 1)) {
    curLevel++;
    levelsGained++;
    const levelMoves = sp.learnset.filter((l) => l.level === curLevel).map((l) => l.moveId);
    for (const mid of levelMoves) {
      if (moves.some((m) => m.moveId === mid) || pendingLearnMoves.includes(mid)) continue;
      const md = MOVES[mid];
      if (!md) continue;
      if (moves.length < 4) {
        moves.push({ moveId: mid, pp: md.pp, maxPp: md.pp });
        autoLearnedMoves.push(mid);
      } else {
        pendingLearnMoves.push(mid);
      }
    }
  }

  let updated: PokemonInstance = {
    ...mon,
    level: curLevel,
    exp: newExp,
    nextLevelExp: expForLevel(Math.min(100, curLevel + 1)),
    evs,
    moves,
    happiness: Math.min(255, mon.happiness + levelsGained * 4),
  };
  updated = recalculatePokemonStats(updated);

  let evolveToSpeciesId: number | undefined;
  if (levelsGained > 0 && sp.evolutions) {
    const lvEvo = sp.evolutions.find((e) => e.level !== undefined && curLevel >= e.level);
    if (lvEvo) evolveToSpeciesId = lvEvo.to;
  }

  return {
    updated,
    levelsGained,
    autoLearnedMoves,
    pendingLearnMoves,
    evolveToSpeciesId,
  };
}

export function evolvePokemonInstance(
  mon: PokemonInstance,
  targetSpeciesId: number
): { evolved: PokemonInstance; learnedMoves: string[] } {
  const newSp = POKEDEX[targetSpeciesId];
  if (!newSp) return { evolved: mon, learnedMoves: [] };

  const newAbility = newSp.abilities.includes(mon.ability)
    ? mon.ability
    : newSp.abilities[0] || mon.ability;

  const moves = [...mon.moves];
  const learnedMoves: string[] = [];
  // Check moves learned right at evolution level
  for (const entry of newSp.learnset) {
    if (entry.level === mon.level && !moves.some((m) => m.moveId === entry.moveId)) {
      const md = MOVES[entry.moveId];
      if (md && moves.length < 4) {
        moves.push({ moveId: md.id, pp: md.pp, maxPp: md.pp });
        learnedMoves.push(md.id);
      }
    }
  }

  let evolved: PokemonInstance = {
    ...mon,
    speciesId: targetSpeciesId,
    ability: newAbility,
    moves,
  };
  evolved = recalculatePokemonStats(evolved);
  return { evolved, learnedMoves };
}

export function scalePokemonToLevel50(mon: PokemonInstance): PokemonInstance {
  const lv = 50;
  const stats = computeStats(mon.speciesId, lv, mon.ivs, mon.evs, mon.nature);
  return {
    ...mon,
    level: lv,
    stats,
    maxHp: stats.hp,
    currentHp: stats.hp,
    status: 'none',
    sleepTurns: 0,
    moves: mon.moves.map((m) => ({ ...m, pp: m.maxPp })),
  };
}

// Generate 6 strong Lv.50 Battle Factory rental Pokemon!
export function generateBattleFactoryPool(): PokemonInstance[] {
  const strongPool = POKEDEX_LIST.filter((sp) => {
    const bst = Object.values(sp.baseStats).reduce((a, b) => a + b, 0);
    return bst >= 455 && bst <= 600 && sp.catchRate >= 25;
  });
  const shuffled = [...strongPool].sort(() => Math.random() - 0.5).slice(0, 6);
  const heldOptions = ['sitrus-berry', 'lum-berry', 'leftovers', 'choice-band', 'scope-lens', 'charcoal'];
  return shuffled.map((sp, i) =>
    createPokemon(sp.id, 50, {
      perfectIvs: true,
      heldItem: heldOptions[i % heldOptions.length],
      metLocation: 'Savaş Fabrikası',
    })
  );
}
