import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { POKEDEX } from '../data/pokedex';
import { ABILITIES, getTypeEffectiveness } from '../data/typesAndNatures';
import {
  BattleStatKey,
  MoveData,
  PokemonInstance,
  PokemonType,
  StatusCondition,
  WeatherType,
} from '../types/game';

export type StatStages = Record<BattleStatKey, number>;

export function emptyStages(): StatStages {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
}

export function stageMultiplier(stage: number, isAccEva = false): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (isAccEva) {
    return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
  }
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

export function getEffectiveSpeed(
  mon: PokemonInstance,
  stages: StatStages,
  weather: WeatherType,
  airLockActive: boolean
): number {
  let spe = Math.floor(mon.stats.spe * stageMultiplier(stages.spe));
  if (mon.status === 'par') spe = Math.floor(spe * 0.5);
  if (!airLockActive) {
    if (weather === 'rain' && mon.ability === 'swift_swim') spe *= 2;
    if (weather === 'sun' && mon.ability === 'chlorophyll') spe *= 2;
  }
  return Math.max(1, spe);
}

export interface EntryTriggerResult {
  logs: string[];
  newWeather?: WeatherType;
  foeAtkDrop?: number;
}

export function applyEntryAbilities(
  entering: PokemonInstance,
  opponent: PokemonInstance,
  currentWeather: WeatherType
): EntryTriggerResult {
  const spName = entering.nickname || POKEDEX[entering.speciesId].name;
  const oppName = opponent.nickname || POKEDEX[opponent.speciesId].name;
  const logs: string[] = [];
  let newWeather: WeatherType | undefined;
  let foeAtkDrop: number | undefined;

  if (entering.ability === 'intimidate') {
    if (opponent.ability === 'clear_body') {
      logs.push(`${spName} Gözdağı (Intimidate) yaydı ama ${oppName} Saf Gövde ile etkilenmedi!`);
    } else {
      foeAtkDrop = -1;
      logs.push(`${spName} Gözdağı (Intimidate) yeteneğiyle ${oppName} Saldırısını düşürdü!`);
    }
  } else if (entering.ability === 'drizzle' && currentWeather !== 'rain') {
    newWeather = 'rain';
    logs.push(`${spName} Sağanak Çağrısı (Drizzle) ile şiddetli yağmur başlattı!`);
  } else if (entering.ability === 'drought' && currentWeather !== 'sun') {
    newWeather = 'sun';
    logs.push(`${spName} Kuraklık Güneşi (Drought) ile kavurucu güneş açtırdı!`);
  } else if (entering.ability === 'sand_stream' && currentWeather !== 'sandstorm') {
    newWeather = 'sandstorm';
    logs.push(`${spName} Kum Fırtınası (Sand Stream) kopardı!`);
  } else if (entering.ability === 'air_lock') {
    logs.push(`${spName} Hava Kilidi (Air Lock) ile tüm hava etkilerini durdurdu!`);
  } else if (entering.ability === 'pressure') {
    logs.push(`${spName} Efsanevi Baskı (Pressure) yayıyor!`);
  }

  return { logs, newWeather, foeAtkDrop };
}

export interface DamageExecutionResult {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  attackerStages: StatStages;
  defenderStages: StatStages;
  weather: WeatherType;
  damageDealt: number;
  effectiveness: number;
  isCrit: boolean;
  missed: boolean;
  flinchedDefender: boolean;
  protectedUsed: boolean;
  seededDefender: boolean;
  logs: string[];
  vfxType?: PokemonType;
}

export function executeMoveAction(params: {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  attackerStages: StatStages;
  defenderStages: StatStages;
  move: MoveData;
  weather: WeatherType;
  defenderProtected: boolean;
}): DamageExecutionResult {
  let attacker = { ...params.attacker };
  let defender = { ...params.defender };
  const attackerStages = { ...params.attackerStages };
  const defenderStages = { ...params.defenderStages };
  let weather = params.weather;
  const move = params.move;
  const logs: string[] = [];

  const atkName = attacker.nickname || POKEDEX[attacker.speciesId].name;
  const defName = defender.nickname || POKEDEX[defender.speciesId].name;
  const atkSp = POKEDEX[attacker.speciesId];
  const defSp = POKEDEX[defender.speciesId];
  const airLock = attacker.ability === 'air_lock' || defender.ability === 'air_lock';

  // Status pre-checks (Sleep, Freeze, Paralysis)
  if (attacker.status === 'slp') {
    if (attacker.sleepTurns > 0) {
      attacker.sleepTurns -= 1;
      logs.push(`${atkName} derin uykuda...`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 1,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    } else {
      attacker.status = 'none';
      logs.push(`${atkName} uykudan uyandı!`);
    }
  }

  if (attacker.status === 'frz') {
    if (move.type === 'Fire' || Math.random() < 0.25) {
      attacker.status = 'none';
      logs.push(`${atkName} buzları eritip çözüldü!`);
    } else {
      logs.push(`${atkName} donmuş durumda, kıpırdayamıyor!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 1,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
  }

  if (attacker.status === 'par' && Math.random() < 0.25) {
    logs.push(`${atkName} felç nedeniyle hareket edemedi!`);
    return {
      attacker,
      defender,
      attackerStages,
      defenderStages,
      weather,
      damageDealt: 0,
      effectiveness: 1,
      isCrit: false,
      missed: false,
      flinchedDefender: false,
      protectedUsed: false,
      seededDefender: false,
      logs,
    };
  }

  // Deduct PP (2 if defender has Pressure)
  const ppCost = defender.ability === 'pressure' ? 2 : 1;
  attacker.moves = attacker.moves.map((ms) =>
    ms.moveId === move.id ? { ...ms, pp: Math.max(0, ms.pp - ppCost) } : ms
  );

  logs.push(`${atkName}, ${move.nameTr} kullandı!`);

  // Protect check
  if (move.effect?.protect) {
    logs.push(`${atkName} kendini koruma kalkanına aldı!`);
    return {
      attacker,
      defender,
      attackerStages,
      defenderStages,
      weather,
      damageDealt: 0,
      effectiveness: 1,
      isCrit: false,
      missed: false,
      flinchedDefender: false,
      protectedUsed: true,
      seededDefender: false,
      logs,
      vfxType: 'Normal',
    };
  }

  if (params.defenderProtected && !move.effect?.targetSelf) {
    logs.push(`${defName} Korunma kalkanıyla saldırıyı savuşturdu!`);
    return {
      attacker,
      defender,
      attackerStages,
      defenderStages,
      weather,
      damageDealt: 0,
      effectiveness: 1,
      isCrit: false,
      missed: false,
      flinchedDefender: false,
      protectedUsed: false,
      seededDefender: false,
      logs,
    };
  }

  // Accuracy check
  let effectiveAcc = move.accuracy;
  if (!airLock && weather === 'rain' && move.id === 'thunder') effectiveAcc = 0; // never misses in rain!
  if (effectiveAcc > 0 && !move.effect?.alwaysHits && !move.effect?.targetSelf) {
    const accMod = stageMultiplier(attackerStages.acc - defenderStages.eva, true);
    const hitProb = (effectiveAcc * accMod) / 100;
    if (Math.random() > hitProb) {
      logs.push(`${atkName} saldırıyı ıskaladı!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 1,
        isCrit: false,
        missed: true,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
  }

  // Absorb abilities (Water Absorb, Volt Absorb, Flash Fire, Levitate)
  if (!move.effect?.targetSelf && move.category !== 'status') {
    if (move.type === 'Water' && defender.ability === 'water_absorb') {
      const heal = Math.max(1, Math.floor(defender.maxHp * 0.25));
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      logs.push(`${defName} Su Emişi (Water Absorb) ile saldırıyı emip HP yeniledi!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 0,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
    if (move.type === 'Electric' && defender.ability === 'volt_absorb') {
      const heal = Math.max(1, Math.floor(defender.maxHp * 0.25));
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      logs.push(`${defName} Volt Emişi (Volt Absorb) ile elektriği emip HP yeniledi!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 0,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
    if (move.type === 'Ground' && defender.ability === 'levitate') {
      logs.push(`${defName} Havada Süzülme (Levitate) sayesinde Toprak saldırısından hiç etkilenmedi!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 0,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
    if (move.type === 'Fire' && defender.ability === 'flash_fire') {
      logs.push(`${defName} Alev Emişi (Flash Fire) ile ateşi yuttu!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 0,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }
  }

  let damageDealt = 0;
  let effectiveness = 1;
  let isCrit = false;
  let flinchedDefender = false;
  let seededDefender = false;

  // Damage calculation for Physical / Special moves
  if (move.category !== 'status' && move.power > 0) {
    effectiveness = getTypeEffectiveness(move.type, defSp.types, defender.ability);
    if (effectiveness === 0) {
      logs.push(`${defName} üzerinde hiçbir etkisi olmadı!`);
      return {
        attacker,
        defender,
        attackerStages,
        defenderStages,
        weather,
        damageDealt: 0,
        effectiveness: 0,
        isCrit: false,
        missed: false,
        flinchedDefender: false,
        protectedUsed: false,
        seededDefender: false,
        logs,
      };
    }

    let critChance = 1 / 16;
    if (move.effect?.highCrit) critChance = 1 / 8;
    if (attacker.heldItem === 'scope-lens') critChance *= 2;
    isCrit = Math.random() < critChance;

    const isPhys = move.category === 'physical';
    const atkStage = isCrit ? Math.max(0, isPhys ? attackerStages.atk : attackerStages.spa) : isPhys ? attackerStages.atk : attackerStages.spa;
    const defStage = isCrit ? Math.min(0, isPhys ? defenderStages.def : defenderStages.spd) : isPhys ? defenderStages.def : defenderStages.spd;

    let atkStat = (isPhys ? attacker.stats.atk : attacker.stats.spa) * stageMultiplier(atkStage);
    let defStat = (isPhys ? defender.stats.def : defender.stats.spd) * stageMultiplier(defStage);

    // Rock SpDef 1.5x in Sandstorm!
    if (!isPhys && !airLock && weather === 'sandstorm' && defSp.types.includes('Rock')) {
      defStat *= 1.5;
    }

    // Guts & Burn
    if (isPhys) {
      if (attacker.ability === 'guts' && attacker.status !== 'none') {
        atkStat *= 1.5;
      } else if (attacker.status === 'brn') {
        atkStat *= 0.5;
      }
      if (attacker.heldItem === 'choice-band') {
        atkStat *= 1.5;
      }
    }

    // Pinch abilities (Blaze, Torrent, Overgrow, Swarm)
    let power = move.power;
    const lowHp = attacker.currentHp <= Math.floor(attacker.maxHp / 3);
    if (lowHp) {
      if (
        (attacker.ability === 'blaze' && move.type === 'Fire') ||
        (attacker.ability === 'torrent' && move.type === 'Water') ||
        (attacker.ability === 'overgrow' && move.type === 'Grass') ||
        (attacker.ability === 'swarm' && move.type === 'Bug')
      ) {
        power = Math.floor(power * 1.5);
      }
    }

    // Type-boosting held items
    if (
      (attacker.heldItem === 'charcoal' && move.type === 'Fire') ||
      (attacker.heldItem === 'mystic-water' && move.type === 'Water') ||
      (attacker.heldItem === 'miracle-seed' && move.type === 'Grass') ||
      (attacker.heldItem === 'magnet' && move.type === 'Electric') ||
      (attacker.heldItem === 'metal-coat' && move.type === 'Steel')
    ) {
      power = Math.floor(power * 1.2);
    }

    const hits = move.effect?.multiHit
      ? move.effect.multiHit[0] +
        Math.floor(Math.random() * (move.effect.multiHit[1] - move.effect.multiHit[0] + 1))
      : 1;

    for (let h = 0; h < hits && defender.currentHp > 0; h++) {
      let baseDmg = Math.floor(
        Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * power * atkStat) / Math.max(1, defStat)) / 50
      ) + 2;

      // Weather modifier
      if (!airLock) {
        if (weather === 'sun') {
          if (move.type === 'Fire') baseDmg = Math.floor(baseDmg * 1.5);
          if (move.type === 'Water') baseDmg = Math.floor(baseDmg * 0.5);
        } else if (weather === 'rain') {
          if (move.type === 'Water') baseDmg = Math.floor(baseDmg * 1.5);
          if (move.type === 'Fire') baseDmg = Math.floor(baseDmg * 0.5);
        }
      }

      if (isCrit) baseDmg = Math.floor(baseDmg * 1.5);
      if (atkSp.types.includes(move.type)) baseDmg = Math.floor(baseDmg * 1.5); // STAB!
      baseDmg = Math.floor(baseDmg * effectiveness);
      const randFactor = 0.85 + Math.random() * 0.15;
      let finalHit = Math.max(1, Math.floor(baseDmg * randFactor));

      // Sturdy check (survive OHKO from full HP!)
      if (
        defender.ability === 'sturdy' &&
        defender.currentHp === defender.maxHp &&
        finalHit >= defender.currentHp
      ) {
        finalHit = defender.currentHp - 1;
        logs.push(`${defName} Kaya Sağlamlığı (Sturdy) sayesinde 1 HP ile ayakta kaldı!`);
      }

      const actual = Math.min(defender.currentHp, finalHit);
      defender.currentHp -= actual;
      damageDealt += actual;
    }

    if (hits > 1) logs.push(`Toplam ${hits} kez isabet etti!`);
    if (isCrit) logs.push('Kritik vuruş!');
    if (effectiveness >= 2) logs.push('Süper etkili oldu!');
    else if (effectiveness < 1) logs.push('Pek etkili olmadı...');

    // Drain / Recoil
    if (move.effect?.drainPercent && damageDealt > 0) {
      const drained = Math.max(1, Math.floor((damageDealt * move.effect.drainPercent) / 100));
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drained);
      logs.push(`${atkName}, ${defName} enerjisini emerek ${drained} HP yeniledi!`);
    }
    if (move.effect?.recoilPercent && damageDealt > 0) {
      const recoil = Math.max(1, Math.floor((damageDealt * move.effect.recoilPercent) / 100));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      logs.push(`${atkName} geri tepmeden ${recoil} hasar aldı!`);
    }

    // Contact Abilities (Static, Flame Body, Poison Point)
    if (move.contact && defender.currentHp > 0 && attacker.currentHp > 0 && attacker.status === 'none') {
      if (defender.ability === 'static' && !atkSp.types.includes('Electric') && Math.random() < 0.3) {
        attacker.status = 'par';
        logs.push(`${defName} Statik Elektrik yeteneğiyle ${atkName} felç oldu!`);
      } else if (defender.ability === 'flame_body' && !atkSp.types.includes('Fire') && Math.random() < 0.3) {
        attacker.status = 'brn';
        logs.push(`${defName} Alev Beden yeteneğiyle ${atkName} yandı!`);
      } else if (
        defender.ability === 'poison_point' &&
        !atkSp.types.includes('Poison') &&
        !atkSp.types.includes('Steel') &&
        Math.random() < 0.3
      ) {
        attacker.status = 'psn';
        logs.push(`${defName} Zehirli Diken yeteneğiyle ${atkName} zehirlendi!`);
      }
    }
  }

  // Secondary & Status Move Effects
  if (move.effect) {
    const sereneMult = attacker.ability === 'serene_grace' ? 2 : 1;

    if (move.effect.weather) {
      weather = move.effect.weather;
      const wMsg: Record<WeatherType, string> = {
        clear: 'Hava açıldı.',
        sun: 'Güneş ışığı kavurucu biçimde parlamaya başladı!',
        rain: 'Şiddetli yağmur yağmaya başladı!',
        sandstorm: 'Şiddetli bir kum fırtınası koptu!',
        hail: 'Dolu yağmaya başladı!',
      };
      logs.push(wMsg[weather]);
    }

    if (move.effect.healPercent && attacker.currentHp > 0) {
      const mult = move.id === 'synthesis' && !airLock && weather === 'sun' ? 0.67 : move.effect.healPercent / 100;
      const heal = Math.max(1, Math.floor(attacker.maxHp * mult));
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
      logs.push(`${atkName} sağlığını yeniledi!`);
    }

    if (move.effect.leechSeed && defender.currentHp > 0) {
      if (defSp.types.includes('Grass')) {
        logs.push(`${defName} Çimen tipi olduğu için Sülük Tohumundan etkilenmedi!`);
      } else {
        seededDefender = true;
        logs.push(`${defName} üzerine Sülük Tohumu ekildi!`);
      }
    }

    // Stat stage changes
    if (move.effect.statChanges) {
      const chance = (move.effect.statChance ?? 100) * sereneMult;
      if (Math.random() * 100 < chance) {
        const isSelf = !!move.effect.targetSelf;
        const targetStages = isSelf ? attackerStages : defenderStages;
        const targetMon = isSelf ? attacker : defender;
        const targetName = isSelf ? atkName : defName;

        if (!isSelf && targetMon.currentHp <= 0) {
          // Fainted already
        } else {
          for (const [sk, delta] of Object.entries(move.effect.statChanges) as Array<[BattleStatKey, number]>) {
            if (!isSelf && delta < 0 && targetMon.ability === 'clear_body') {
              logs.push(`${targetName} Saf Gövde ile istatistik düşüşünü engelledi!`);
              continue;
            }
            if (!isSelf && sk === 'acc' && delta < 0 && targetMon.ability === 'keen_eye') {
              logs.push(`${targetName} Keskin Göz ile isabet düşüşünü engelledi!`);
              continue;
            }
            const before = targetStages[sk];
            targetStages[sk] = Math.max(-6, Math.min(6, before + delta));
            if (targetStages[sk] !== before) {
              const statLabels: Record<BattleStatKey, string> = {
                atk: 'Saldırı',
                def: 'Savunma',
                spa: 'Özel Saldırı',
                spd: 'Özel Savunma',
                spe: 'Hız',
                acc: 'İsabet',
                eva: 'Kaçınma',
              };
              logs.push(
                `${targetName} ${statLabels[sk]} ${delta > 0 ? (delta > 1 ? 'keskin biçimde yükseldi!' : 'yükseldi!') : 'düştü!'}`
              );
            } else if (move.category === 'status') {
              logs.push(`${targetName} istatistiği daha fazla değişemez!`);
            }
          }
        }
      }
    }

    // Status condition application
    if (move.effect.status && defender.currentHp > 0) {
      const chance = (move.effect.statusChance ?? 100) * sereneMult;
      if (Math.random() * 100 < chance) {
        if (defender.status !== 'none') {
          if (move.category === 'status') logs.push(`${defName} zaten bir durum etkisinde!`);
        } else {
          const st = move.effect.status;
          const immune =
            (st === 'brn' && defSp.types.includes('Fire')) ||
            ((st === 'psn' || st === 'tox') && (defSp.types.includes('Poison') || defSp.types.includes('Steel'))) ||
            (st === 'par' && defSp.types.includes('Electric')) ||
            (st === 'frz' && defSp.types.includes('Ice'));
          if (immune) {
            if (move.category === 'status') logs.push(`${defName} bu durum etkisine karşı bağışıklı!`);
          } else {
            defender.status = st;
            if (st === 'slp') defender.sleepTurns = 1 + Math.floor(Math.random() * 3);
            const stText: Record<StatusCondition, string> = {
              none: '',
              par: 'felç (PAR) oldu!',
              brn: 'yanık (BRN) aldı!',
              psn: 'zehirlendi (PSN)!',
              tox: 'ağır toksinle (TOX) zehirlendi!',
              slp: 'uykuya daldı (SLP)!',
              frz: 'buz kesilip dondu (FRZ)!',
            };
            logs.push(`${defName} ${stText[st]}`);
          }
        }
      }
    }

    // Flinch check
    if (move.effect.flinchChance && defender.currentHp > 0 && defender.ability !== 'inner_focus') {
      if (Math.random() * 100 < move.effect.flinchChance * sereneMult) {
        flinchedDefender = true;
      }
    }
  }

  // Check Auto-Berry Activation on Defender & Attacker (Sitrus / Oran / Lum Berry — Authentic GBA!)
  const checkHeldBerry = (mon: PokemonInstance): PokemonInstance => {
    if (mon.currentHp <= 0 || !mon.heldItem) return mon;
    const mName = mon.nickname || POKEDEX[mon.speciesId].name;
    if (mon.heldItem === 'lum-berry' && mon.status !== 'none') {
      logs.push(`${mName} tuttuğu Lum Meyvesini yiyerek durum etkisinden kurtuldu!`);
      return { ...mon, status: 'none', sleepTurns: 0, heldItem: undefined };
    }
    if (mon.currentHp <= Math.floor(mon.maxHp / 2)) {
      if (mon.heldItem === 'sitrus-berry') {
        const heal = Math.max(10, Math.floor(mon.maxHp * 0.25));
        logs.push(`${mName} tuttuğu Sitrus Meyvesini yiyerek ${heal} HP yeniledi!`);
        return {
          ...mon,
          currentHp: Math.min(mon.maxHp, mon.currentHp + heal),
          heldItem: undefined,
        };
      }
      if (mon.heldItem === 'oran-berry') {
        logs.push(`${mName} tuttuğu Oran Meyvesini yiyerek 15 HP yeniledi!`);
        return {
          ...mon,
          currentHp: Math.min(mon.maxHp, mon.currentHp + 15),
          heldItem: undefined,
        };
      }
    }
    return mon;
  };

  defender = checkHeldBerry(defender);
  attacker = checkHeldBerry(attacker);

  return {
    attacker,
    defender,
    attackerStages,
    defenderStages,
    weather,
    damageDealt,
    effectiveness,
    isCrit,
    missed: false,
    flinchedDefender,
    protectedUsed: false,
    seededDefender,
    logs,
    vfxType: move.type,
  };
}

export function applyEndOfTurnEffects(params: {
  mon: PokemonInstance;
  stages: StatStages;
  opponent: PokemonInstance;
  isSeeded: boolean;
  weather: WeatherType;
  airLock: boolean;
}): { mon: PokemonInstance; stages: StatStages; opponent: PokemonInstance; logs: string[] } {
  let mon = { ...params.mon };
  const stages = { ...params.stages };
  let opponent = { ...params.opponent };
  const logs: string[] = [];
  if (mon.currentHp <= 0) return { mon, stages, opponent, logs };

  const name = mon.nickname || POKEDEX[mon.speciesId].name;
  const sp = POKEDEX[mon.speciesId];

  // Weather chip
  if (!params.airLock) {
    if (
      params.weather === 'sandstorm' &&
      !sp.types.includes('Rock') &&
      !sp.types.includes('Ground') &&
      !sp.types.includes('Steel')
    ) {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      logs.push(`${name} kum fırtınasından hırpalandı!`);
    }
  }

  // Leftovers heal
  if (mon.currentHp > 0 && mon.heldItem === 'leftovers' && mon.currentHp < mon.maxHp) {
    const heal = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
    logs.push(`${name} Artıklar (Leftovers) sayesinde biraz can yeniledi!`);
  }

  // Leech Seed
  if (mon.currentHp > 0 && params.isSeeded && opponent.currentHp > 0) {
    const drain = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.currentHp = Math.max(0, mon.currentHp - drain);
    opponent.currentHp = Math.min(opponent.maxHp, opponent.currentHp + drain);
    logs.push(`Sülük Tohumu ${name} enerjisini emdi!`);
  }

  // Burn / Poison / Toxic
  if (mon.currentHp > 0) {
    if (mon.status === 'brn') {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      logs.push(`${name} yanık acısıyla hasar aldı!`);
    } else if (mon.status === 'psn') {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      logs.push(`${name} zehirden hasar aldı!`);
    } else if (mon.status === 'tox') {
      const dmg = Math.max(1, Math.floor(mon.maxHp / 6));
      mon.currentHp = Math.max(0, mon.currentHp - dmg);
      logs.push(`${name} ağır toksinden şiddetli hasar aldı!`);
    }
  }

  // Speed Boost ability (Blaziken!)
  if (mon.currentHp > 0 && mon.ability === 'speed_boost' && stages.spe < 6) {
    stages.spe += 1;
    logs.push(`${name} Hız İvmesi (Speed Boost) ile Hızını artırdı!`);
  }

  return { mon, stages, opponent, logs };
}

// Smart GBA Trainer AI Move Selection!
export function chooseEnemyMove(
  aiMon: PokemonInstance,
  playerMon: PokemonInstance,
  aiTier: 'basic' | 'smart' | 'boss',
  aiStages: StatStages
): MoveData {
  const usable = aiMon.moves.filter((m) => m.pp > 0);
  if (usable.length === 0) return MOVES.tackle;

  if (aiTier === 'basic' && Math.random() < 0.45) {
    const pick = usable[Math.floor(Math.random() * usable.length)];
    return MOVES[pick.moveId] || MOVES.tackle;
  }

  const aiSp = POKEDEX[aiMon.speciesId];
  const plSp = POKEDEX[playerMon.speciesId];

  let bestMove = MOVES[usable[0].moveId] || MOVES.tackle;
  let bestScore = -999;

  for (const slot of usable) {
    const md = MOVES[slot.moveId];
    if (!md) continue;
    let score = 0;

    if (md.category === 'status') {
      if (md.effect?.healPercent) {
        score = aiMon.currentHp < aiMon.maxHp * 0.45 ? 130 : -30;
      } else if (md.effect?.status) {
        score = playerMon.status === 'none' && playerMon.currentHp > playerMon.maxHp * 0.4 ? 82 : -40;
      } else if (md.effect?.targetSelf && md.effect.statChanges) {
        score = aiMon.currentHp > aiMon.maxHp * 0.65 && aiStages.atk < 2 && aiStages.spa < 2 ? 78 : 10;
      } else {
        score = 35;
      }
    } else {
      const eff = getTypeEffectiveness(md.type, plSp.types, playerMon.ability);
      if (eff === 0) {
        score = -500;
      } else {
        const stab = aiSp.types.includes(md.type) ? 1.5 : 1;
        score = md.power * eff * stab;
        if (md.priority && md.priority > 0 && playerMon.currentHp < playerMon.maxHp * 0.25) {
          score += 90; // Finish off low HP target with Quick Attack / Extreme Speed!
        }
      }
    }

    score += Math.random() * (aiTier === 'boss' ? 12 : 25);
    if (score > bestScore) {
      bestScore = score;
      bestMove = md;
    }
  }

  return bestMove;
}

// Authentic GBA Catch Rate Calculator
export function calculateCatchAttempt(
  wildMon: PokemonInstance,
  ballItemId: string,
  safariCatchFactor = 1
): { caught: boolean; shakes: number } {
  const item = ITEMS[ballItemId];
  if (!item || item.id === 'master-ball') {
    return { caught: true, shakes: 3 };
  }
  const sp = POKEDEX[wildMon.speciesId];
  const ballBonus = item.ballBonus || 1;
  const statusBonus =
    wildMon.status === 'slp' || wildMon.status === 'frz'
      ? 2.2
      : wildMon.status !== 'none'
      ? 1.5
      : 1.0;

  const maxHp = wildMon.maxHp;
  const curHp = Math.max(1, wildMon.currentHp);

  // Modified GBA catch rate `a` (0..255)
  const a =
    (((3 * maxHp - 2 * curHp) * sp.catchRate * ballBonus * safariCatchFactor) / (3 * maxHp)) *
    statusBonus;

  if (a >= 255) return { caught: true, shakes: 3 };

  const shakeProb = Math.min(0.99, Math.pow(Math.max(1, a) / 255, 0.25));
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() < shakeProb) {
      shakes++;
    } else {
      return { caught: false, shakes: Math.min(3, shakes) };
    }
  }
  return { caught: true, shakes: 3 };
}
