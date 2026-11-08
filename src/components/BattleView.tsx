import React, { useEffect, useRef, useState } from 'react';
import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { POKEDEX } from '../data/pokedex';
import {
  ABILITIES,
  getTypeEffectiveness,
  TYPE_COLORS,
  TYPE_NAMES_TR,
} from '../data/typesAndNatures';
import { audio } from '../engine/audio';
import {
  applyEndOfTurnEffects,
  applyEntryAbilities,
  calculateCatchAttempt,
  chooseEnemyMove,
  emptyStages,
  executeMoveAction,
  getEffectiveSpeed,
  StatStages,
} from '../engine/battleEngine';
import {
  evolvePokemonInstance,
  grantExpToPokemon,
} from '../engine/pokemonFactory';
import {
  PokemonInstance,
  PokemonType,
  StatusCondition,
  TrainerData,
  WeatherType,
} from '../types/game';
import { Sparkles, ShieldAlert, Backpack, RefreshCw, Footprints, Swords } from 'lucide-react';

export interface BattleSessionConfig {
  kind: 'wild' | 'safari' | 'trainer' | 'gym' | 'elite4' | 'frontier_tower' | 'frontier_factory';
  enemyParty: PokemonInstance[];
  trainer?: TrainerData;
  weatherInitial: WeatherType;
  terrain: 'grass' | 'cave' | 'water' | 'indoor' | 'indigo';
  legendaryFlagToSetOnCatch?: string;
}

export interface BattleOutcome {
  result: 'win' | 'caught' | 'escaped' | 'lose';
  updatedParty: PokemonInstance[];
  updatedBag: Record<string, number>;
  caughtPokemon?: PokemonInstance;
  safariBallsUsed?: number;
  seenSpeciesIds: number[];
}

interface BattleViewProps {
  config: BattleSessionConfig;
  playerParty: PokemonInstance[];
  bag: Record<string, number>;
  pokedexCaught: number[];
  safariBalls: number;
  gameSpeed: 1 | 2 | 3;
  expShareAll: boolean;
  nuzlocke: boolean;
  onFinish: (outcome: BattleOutcome) => void;
}

const STATUS_BADGE: Record<StatusCondition, { label: string; bg: string } | null> = {
  none: null,
  par: { label: 'PAR', bg: '#eab308' },
  brn: { label: 'BRN', bg: '#ef4444' },
  psn: { label: 'PSN', bg: '#a855f7' },
  tox: { label: 'TOX', bg: '#7e22ce' },
  slp: { label: 'SLP', bg: '#64748b' },
  frz: { label: 'FRZ', bg: '#38bdf8' },
};

const WEATHER_LABELS: Record<WeatherType, { label: string; color: string }> = {
  clear: { label: 'Açık Hava', color: '#94a3b8' },
  sun: { label: 'Kavurucu Güneş (Ateş +%50)', color: '#fbbf24' },
  rain: { label: 'Sağanak Yağmur (Su +%50)', color: '#38bdf8' },
  sandstorm: { label: 'Kum Fırtınası (Kaya Ö.Sav +%50)', color: '#d97706' },
  hail: { label: 'Dolu Fırtınası', color: '#67e8f9' },
};

export const BattleView: React.FC<BattleViewProps> = ({
  config,
  playerParty,
  bag,
  pokedexCaught,
  safariBalls,
  gameSpeed,
  expShareAll,
  onFinish,
}) => {
  const isFrontier = config.kind === 'frontier_tower' || config.kind === 'frontier_factory';
  const isSafari = config.kind === 'safari';
  const isWild = config.kind === 'wild' || config.kind === 'safari';

  const firstAliveIdx = Math.max(
    0,
    playerParty.findIndex((m) => m.currentHp > 0)
  );

  const [party, setParty] = useState<PokemonInstance[]>(() =>
    playerParty.map((m) => ({ ...m, moves: m.moves.map((mv) => ({ ...mv })) }))
  );
  const [enemyTeam, setEnemyTeam] = useState<PokemonInstance[]>(() =>
    config.enemyParty.map((m) => ({ ...m, moves: m.moves.map((mv) => ({ ...mv })) }))
  );
  const [playerIdx, setPlayerIdx] = useState<number>(firstAliveIdx);
  const [enemyIdx, setEnemyIdx] = useState<number>(0);

  const [playerStages, setPlayerStages] = useState<StatStages>(emptyStages());
  const [enemyStages, setEnemyStages] = useState<StatStages>(emptyStages());
  const [playerSeeded, setPlayerSeeded] = useState(false);
  const [enemySeeded, setEnemySeeded] = useState(false);
  const [weather, setWeather] = useState<WeatherType>(config.weatherInitial);

  const [curBag, setCurBag] = useState<Record<string, number>>({ ...bag });
  const [curSafariBalls, setCurSafariBalls] = useState<number>(safariBalls);
  const [safariCatchMod, setSafariCatchMod] = useState<number>(1);
  const [safariFleeMod, setSafariFleeMod] = useState<number>(1);
  const [enemyHealsLeft, setEnemyHealsLeft] = useState<string[]>(
    config.trainer?.healItems ? [...config.trainer.healItems] : []
  );
  const [seenIds, setSeenIds] = useState<Set<number>>(
    () => new Set([config.enemyParty[0].speciesId])
  );

  const [menuMode, setMenuMode] = useState<'root' | 'fight' | 'bag' | 'party' | 'force_switch'>('root');
  const [busy, setBusy] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');

  // Visual Animation States
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'enter' | 'idle' | 'attack' | 'hit' | 'faint' | 'caught'>('enter');
  const [vfx, setVfx] = useState<{ target: 'enemy' | 'player'; type: PokemonType } | null>(null);
  const [pokeballAnim, setPokeballAnim] = useState<{
    sprite: string;
    phase: 'throw' | 'shake1' | 'shake2' | 'shake3' | 'caught';
  } | null>(null);

  // Move Learn & Evolution Prompts
  const [moveLearnPrompt, setMoveLearnPrompt] = useState<{
    partyIndex: number;
    moveId: string;
  } | null>(null);
  const moveLearnResolverRef = useRef<((updatedMon: PokemonInstance) => void) | null>(null);

  const [evoBanner, setEvoBanner] = useState<{
    fromId: number;
    toId: number;
  } | null>(null);

  const speedDiv = gameSpeed === 3 ? 2.6 : gameSpeed === 2 ? 1.8 : 1;
  const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, Math.max(90, Math.floor(ms / speedDiv))));

  const activePlayer = party[playerIdx];
  const activeEnemy = enemyTeam[enemyIdx];
  const playerSp = POKEDEX[activePlayer.speciesId];
  const enemySp = POKEDEX[activeEnemy.speciesId];

  // Initial Battle Intro & Entry Ability Triggers!
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeEnemy.isShiny) audio.playSfx('shiny');
      if (config.trainer) {
        setMessage(`${config.trainer.titleTr} ${config.trainer.nameTr}: "${config.trainer.introTr}"`);
        await wait(1400);
        if (cancelled) return;
        setMessage(`${config.trainer.nameTr}, ${enemySp.name} (Lv.${activeEnemy.level}) gönderdi!`);
      } else {
        setMessage(
          `Vahşi ${activeEnemy.isShiny ? '✨ PARLAK (SHINY) ' : ''}${enemySp.name} (Lv.${activeEnemy.level}) belirdi!`
        );
      }
      await wait(900);
      if (cancelled) return;
      setEnemyAnim('idle');

      if (!isSafari) {
        setMessage(`Göreyim seni, ${activePlayer.nickname || playerSp.name}!`);
        await wait(700);
        if (cancelled) return;

        // Entry abilities for both sides
        let w = config.weatherInitial;
        const pEntry = applyEntryAbilities(activePlayer, activeEnemy, w);
        if (pEntry.newWeather) w = pEntry.newWeather;
        if (pEntry.foeAtkDrop) {
          setEnemyStages((st) => ({ ...st, atk: Math.max(-6, st.atk + pEntry.foeAtkDrop!) }));
        }
        for (const l of pEntry.logs) {
          setMessage(l);
          await wait(750);
        }

        const eEntry = applyEntryAbilities(activeEnemy, activePlayer, w);
        if (eEntry.newWeather) w = eEntry.newWeather;
        if (eEntry.foeAtkDrop) {
          setPlayerStages((st) => ({ ...st, atk: Math.max(-6, st.atk + eEntry.foeAtkDrop!) }));
        }
        for (const l of eEntry.logs) {
          setMessage(l);
          await wait(750);
        }
        setWeather(w);
      }

      if (!cancelled) {
        setMessage(`Ne yapacaksın?`);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Award EXP, Check Level-Up, 5th Move Choice & Evolution!
  const handleEnemyDefeated = async (
    curParty: PokemonInstance[],
    curPIdx: number,
    defeatedEnemy: PokemonInstance
  ): Promise<PokemonInstance[]> => {
    audio.playSfx('faint');
    setEnemyAnim('faint');
    const eName = POKEDEX[defeatedEnemy.speciesId].name;
    setMessage(`Rakip ${eName} bayıldı!`);
    await wait(900);

    if (isFrontier) {
      return curParty; // No EXP in Level 50 Battle Frontier
    }

    const defSp = POKEDEX[defeatedEnemy.speciesId];
    const trainerBonus = isWild ? 1 : 1.5;
    const baseExpGain = Math.max(
      18,
      Math.floor((defSp.baseExp * defeatedEnemy.level * trainerBonus) / 5)
    );

    const updatedParty = [...curParty];
    for (let i = 0; i < updatedParty.length; i++) {
      const m = updatedParty[i];
      if (m.currentHp <= 0) continue;
      if (i !== curPIdx && !expShareAll) continue;

      const gain = i === curPIdx ? baseExpGain : Math.max(10, Math.floor(baseExpGain * 0.55));
      const outcome = grantExpToPokemon(m, gain, i === curPIdx ? defSp.evYield : undefined);
      updatedParty[i] = outcome.updated;

      if (i === curPIdx) {
        setMessage(`${m.nickname || POKEDEX[m.speciesId].name} ${gain} EXP kazandı!`);
        setParty([...updatedParty]);
        await wait(650);
      }

      if (outcome.levelsGained > 0) {
        audio.playSfx('level_up');
        const mName = updatedParty[i].nickname || POKEDEX[updatedParty[i].speciesId].name;
        setMessage(`${mName} Seviye ${updatedParty[i].level} oldu!`);
        setParty([...updatedParty]);
        await wait(850);

        for (const learned of outcome.autoLearnedMoves) {
          setMessage(`${mName} yeni hamle öğrendi: ${MOVES[learned]?.nameTr}!`);
          await wait(750);
        }

        for (const pendingMove of outcome.pendingLearnMoves) {
          const updatedMon = await new Promise<PokemonInstance>((resolve) => {
            moveLearnResolverRef.current = resolve;
            setMoveLearnPrompt({ partyIndex: i, moveId: pendingMove });
          });
          updatedParty[i] = updatedMon;
          setParty([...updatedParty]);
        }

        if (outcome.evolveToSpeciesId) {
          const fromId = updatedParty[i].speciesId;
          const toId = outcome.evolveToSpeciesId;
          setEvoBanner({ fromId, toId });
          audio.playSfx('catch_success');
          setMessage(`Ne?! ${POKEDEX[fromId].name} evrim geçiriyor!`);
          await wait(1600);
          const { evolved, learnedMoves } = evolvePokemonInstance(updatedParty[i], toId);
          updatedParty[i] = evolved;
          setParty([...updatedParty]);
          setMessage(`Tebrikler! ${POKEDEX[fromId].name}, ${POKEDEX[toId].name} olarak evrimleşti!`);
          await wait(1300);
          setEvoBanner(null);
          for (const lm of learnedMoves) {
            setMessage(`${POKEDEX[toId].name}, ${MOVES[lm]?.nameTr} öğrendi!`);
            await wait(750);
          }
        }
      }
    }

    return updatedParty;
  };

  const advanceAfterEnemyFaint = async (
    nextParty: PokemonInstance[],
    curEnemyTeam: PokemonInstance[],
    curEIdx: number
  ) => {
    const nextEnemyIdx = curEnemyTeam.findIndex((m, idx) => idx > curEIdx && m.currentHp > 0);
    if (nextEnemyIdx === -1) {
      // VICTORY!
      audio.playBgm('victory');
      if (config.trainer) {
        setMessage(`${config.trainer.titleTr} ${config.trainer.nameTr} mağlup edildi!`);
        await wait(1000);
        setMessage(`${config.trainer.nameTr}: "${config.trainer.defeatTr}"`);
        await wait(1300);
      } else {
        setMessage(`Savaşı kazandın!`);
        await wait(750);
      }
      // Natural Cure heal on exit
      const finalParty = nextParty.map((m) =>
        m.ability === 'natural_cure' && m.currentHp > 0 ? { ...m, status: 'none' as const, sleepTurns: 0 } : m
      );
      onFinish({
        result: 'win',
        updatedParty: finalParty,
        updatedBag: curBag,
        safariBallsUsed: safariBalls - curSafariBalls,
        seenSpeciesIds: Array.from(seenIds),
      });
      return;
    }

    // Trainer sends next Pokemon!
    const nextFoe = curEnemyTeam[nextEnemyIdx];
    const nextFoeSp = POKEDEX[nextFoe.speciesId];
    const updatedSeen = new Set(seenIds);
    updatedSeen.add(nextFoe.speciesId);
    setSeenIds(updatedSeen);

    setEnemyIdx(nextEnemyIdx);
    setEnemyStages(emptyStages());
    setEnemySeeded(false);
    setEnemyAnim('enter');
    setMessage(`${config.trainer?.nameTr || 'Rakip'}, ${nextFoeSp.name} (Lv.${nextFoe.level}) sahaya sürdü!`);
    await wait(900);
    setEnemyAnim('idle');

    const eEntry = applyEntryAbilities(nextFoe, nextParty[playerIdx], weather);
    if (eEntry.newWeather) setWeather(eEntry.newWeather);
    if (eEntry.foeAtkDrop) {
      setPlayerStages((st) => ({ ...st, atk: Math.max(-6, st.atk + eEntry.foeAtkDrop!) }));
    }
    for (const l of eEntry.logs) {
      setMessage(l);
      await wait(700);
    }

    setMenuMode('root');
    setMessage('Ne yapacaksın?');
    setBusy(false);
  };

  // Execute one side's attack!
  const performAttackStep = async (
    side: 'player' | 'enemy',
    moveId: string,
    pMon: PokemonInstance,
    eMon: PokemonInstance,
    pStg: StatStages,
    eStg: StatStages,
    curWeather: WeatherType,
    defProtected: boolean
  ) => {
    const move = MOVES[moveId] || MOVES.tackle;
    if (side === 'player') {
      setPlayerAnim('attack');
    } else {
      setEnemyAnim('attack');
    }
    await wait(240);
    if (side === 'player') setPlayerAnim('idle');
    else setEnemyAnim('idle');

    const res = executeMoveAction({
      attacker: side === 'player' ? pMon : eMon,
      defender: side === 'player' ? eMon : pMon,
      attackerStages: side === 'player' ? pStg : eStg,
      defenderStages: side === 'player' ? eStg : pStg,
      move,
      weather: curWeather,
      defenderProtected: defProtected,
    });

    if (!res.missed && res.damageDealt > 0) {
      setVfx({ target: side === 'player' ? 'enemy' : 'player', type: move.type });
      audio.playSfx(res.effectiveness >= 2 ? 'super_hit' : 'hit');
      if (side === 'player') setEnemyAnim('hit');
      else setPlayerAnim('hit');
      await wait(360);
      setVfx(null);
      if (side === 'player') setEnemyAnim('idle');
      else setPlayerAnim('idle');
    }

    const nextPlayer = side === 'player' ? res.attacker : res.defender;
    const nextEnemy = side === 'player' ? res.defender : res.attacker;
    const nextPStg = side === 'player' ? res.attackerStages : res.defenderStages;
    const nextEStg = side === 'player' ? res.defenderStages : res.attackerStages;

    setParty((prev) => prev.map((m, idx) => (idx === playerIdx ? nextPlayer : m)));
    setEnemyTeam((prev) => prev.map((m, idx) => (idx === enemyIdx ? nextEnemy : m)));
    setPlayerStages(nextPStg);
    setEnemyStages(nextEStg);
    setWeather(res.weather);
    if (res.seededDefender) {
      if (side === 'player') setEnemySeeded(true);
      else setPlayerSeeded(true);
    }

    for (const log of res.logs) {
      setMessage(log);
      await wait(680);
    }

    return {
      pMon: nextPlayer,
      eMon: nextEnemy,
      pStg: nextPStg,
      eStg: nextEStg,
      weather: res.weather,
      flinched: res.flinchedDefender,
      protectedUsed: res.protectedUsed,
    };
  };

  // Full Turn Orchestrator when Player picks a Move!
  const handleSelectMove = async (moveId: string) => {
    if (busy) return;
    setBusy(true);
    setMenuMode('root');

    let pMon = { ...party[playerIdx] };
    let eMon = { ...enemyTeam[enemyIdx] };
    let pStg = { ...playerStages };
    let eStg = { ...enemyStages };
    let curW = weather;

    // Check if Enemy Boss Trainer wants to use a Healing Item first!
    let enemyUsedHealItem = false;
    if (
      config.trainer &&
      enemyHealsLeft.length > 0 &&
      eMon.currentHp > 0 &&
      eMon.currentHp <= eMon.maxHp * 0.3
    ) {
      const healId = enemyHealsLeft[0];
      const itemDef = ITEMS[healId];
      setEnemyHealsLeft((prev) => prev.slice(1));
      enemyUsedHealItem = true;
      const healAmt = itemDef?.healHp === 9999 ? eMon.maxHp : itemDef?.healHp || 60;
      eMon = {
        ...eMon,
        currentHp: Math.min(eMon.maxHp, eMon.currentHp + healAmt),
        status: itemDef?.healStatus === 'all' ? 'none' : eMon.status,
      };
      setEnemyTeam((prev) => prev.map((m, idx) => (idx === enemyIdx ? eMon : m)));
      audio.playSfx('heal');
      setMessage(`${config.trainer.nameTr}, ${itemDef?.nameTr || 'İksir'} kullandı!`);
      await wait(850);
    }

    const pMove = MOVES[moveId] || MOVES.tackle;
    const eMove = chooseEnemyMove(eMon, pMon, config.trainer?.aiTier || 'smart', eStg);

    const airLock = pMon.ability === 'air_lock' || eMon.ability === 'air_lock';
    const pPrio = pMove.priority || 0;
    const ePrio = enemyUsedHealItem ? 99 : eMove.priority || 0;
    const pSpe = getEffectiveSpeed(pMon, pStg, curW, airLock);
    const eSpe = getEffectiveSpeed(eMon, eStg, curW, airLock);

    const playerFirst =
      enemyUsedHealItem ? false : pPrio !== ePrio ? pPrio > ePrio : pSpe >= eSpe;

    let playerProt = false;
    let enemyProt = false;

    if (playerFirst) {
      const s1 = await performAttackStep('player', pMove.id, pMon, eMon, pStg, eStg, curW, false);
      pMon = s1.pMon;
      eMon = s1.eMon;
      pStg = s1.pStg;
      eStg = s1.eStg;
      curW = s1.weather;
      playerProt = s1.protectedUsed;

      if (eMon.currentHp > 0 && pMon.currentHp > 0 && !enemyUsedHealItem) {
        if (s1.flinched) {
          setMessage(`${POKEDEX[eMon.speciesId].name} ürperdi ve saldırı yapamadı!`);
          await wait(750);
        } else {
          const s2 = await performAttackStep(
            'enemy',
            eMove.id,
            pMon,
            eMon,
            pStg,
            eStg,
            curW,
            playerProt
          );
          pMon = s2.pMon;
          eMon = s2.eMon;
          pStg = s2.pStg;
          eStg = s2.eStg;
          curW = s2.weather;
        }
      } else if (s1.flinched) {
        // enemy fainted already
      }
    } else {
      if (!enemyUsedHealItem) {
        const s1 = await performAttackStep('enemy', eMove.id, pMon, eMon, pStg, eStg, curW, false);
        pMon = s1.pMon;
        eMon = s1.eMon;
        pStg = s1.pStg;
        eStg = s1.eStg;
        curW = s1.weather;
        enemyProt = s1.protectedUsed;

        if (pMon.currentHp > 0 && eMon.currentHp > 0) {
          if (s1.flinched) {
            setMessage(`${pMon.nickname || POKEDEX[pMon.speciesId].name} ürperdi ve saldıramadı!`);
            await wait(750);
          } else {
            const s2 = await performAttackStep(
              'player',
              pMove.id,
              pMon,
              eMon,
              pStg,
              eStg,
              curW,
              enemyProt
            );
            pMon = s2.pMon;
            eMon = s2.eMon;
            pStg = s2.pStg;
            eStg = s2.eStg;
            curW = s2.weather;
          }
        }
      } else if (pMon.currentHp > 0 && eMon.currentHp > 0) {
        const s2 = await performAttackStep('player', pMove.id, pMon, eMon, pStg, eStg, curW, false);
        pMon = s2.pMon;
        eMon = s2.eMon;
        pStg = s2.pStg;
        eStg = s2.eStg;
        curW = s2.weather;
      }
    }

    // End of Turn Effects (Weather, Leftovers, Leech Seed, Burn/Poison, Speed Boost)
    if (pMon.currentHp > 0 && eMon.currentHp > 0) {
      const eotP = applyEndOfTurnEffects({
        mon: pMon,
        stages: pStg,
        opponent: eMon,
        isSeeded: playerSeeded,
        weather: curW,
        airLock: pMon.ability === 'air_lock' || eMon.ability === 'air_lock',
      });
      pMon = eotP.mon;
      pStg = eotP.stages;
      eMon = eotP.opponent;
      setParty((prev) => prev.map((m, idx) => (idx === playerIdx ? pMon : m)));
      setEnemyTeam((prev) => prev.map((m, idx) => (idx === enemyIdx ? eMon : m)));
      setPlayerStages(pStg);
      for (const l of eotP.logs) {
        setMessage(l);
        await wait(620);
      }

      if (eMon.currentHp > 0 && pMon.currentHp > 0) {
        const eotE = applyEndOfTurnEffects({
          mon: eMon,
          stages: eStg,
          opponent: pMon,
          isSeeded: enemySeeded,
          weather: curW,
          airLock: pMon.ability === 'air_lock' || eMon.ability === 'air_lock',
        });
        eMon = eotE.mon;
        eStg = eotE.stages;
        pMon = eotE.opponent;
        setParty((prev) => prev.map((m, idx) => (idx === playerIdx ? pMon : m)));
        setEnemyTeam((prev) => prev.map((m, idx) => (idx === enemyIdx ? eMon : m)));
        setEnemyStages(eStg);
        for (const l of eotE.logs) {
          setMessage(l);
          await wait(620);
        }
      }
    }

    // Check Faints!
    let workingParty = party.map((m, idx) => (idx === playerIdx ? pMon : m));
    const workingEnemyTeam = enemyTeam.map((m, idx) => (idx === enemyIdx ? eMon : m));

    if (eMon.currentHp <= 0) {
      workingParty = await handleEnemyDefeated(workingParty, playerIdx, eMon);
      setParty(workingParty);
      if (pMon.currentHp > 0) {
        await advanceAfterEnemyFaint(workingParty, workingEnemyTeam, enemyIdx);
        return;
      }
    }

    if (workingParty[playerIdx].currentHp <= 0) {
      audio.playSfx('faint');
      setPlayerAnim('faint');
      setMessage(`${workingParty[playerIdx].nickname || POKEDEX[workingParty[playerIdx].speciesId].name} bayıldı!`);
      await wait(950);

      const hasAlive = workingParty.some((m) => m.currentHp > 0);
      if (!hasAlive) {
        setMessage('Kullanılabilir hiç Pokémonun kalmadı! Gözlerin kararıyor...');
        await wait(1200);
        onFinish({
          result: 'lose',
          updatedParty: workingParty,
          updatedBag: curBag,
          safariBallsUsed: safariBalls - curSafariBalls,
          seenSpeciesIds: Array.from(seenIds),
        });
        return;
      }

      setMenuMode('force_switch');
      setMessage('Savaşa devam etmek için bir Pokémon seç!');
      setBusy(false);
      return;
    }

    setMessage('Ne yapacaksın?');
    setBusy(false);
  };

  // Enemy free attack after Player Switches, Uses Medicine, Fails Catch, or Fails Run!
  const runEnemyFreeAttack = async (curParty: PokemonInstance[], newPIdx: number) => {
    const pMon = { ...curParty[newPIdx] };
    const eMon = { ...enemyTeam[enemyIdx] };
    if (eMon.currentHp <= 0 || pMon.currentHp <= 0) {
      setBusy(false);
      return;
    }
    const eMove = chooseEnemyMove(eMon, pMon, config.trainer?.aiTier || 'smart', enemyStages);
    const step = await performAttackStep(
      'enemy',
      eMove.id,
      pMon,
      eMon,
      emptyStages(),
      enemyStages,
      weather,
      false
    );

    const updatedParty = curParty.map((m, idx) => (idx === newPIdx ? step.pMon : m));
    setParty(updatedParty);

    if (step.pMon.currentHp <= 0) {
      audio.playSfx('faint');
      setPlayerAnim('faint');
      setMessage(`${step.pMon.nickname || POKEDEX[step.pMon.speciesId].name} bayıldı!`);
      await wait(900);
      if (!updatedParty.some((m) => m.currentHp > 0)) {
        onFinish({
          result: 'lose',
          updatedParty,
          updatedBag: curBag,
          seenSpeciesIds: Array.from(seenIds),
        });
        return;
      }
      setMenuMode('force_switch');
      setMessage('Yeni bir Pokémon seç!');
      setBusy(false);
      return;
    }

    setMessage('Ne yapacaksın?');
    setBusy(false);
  };

  // Switch Pokemon
  const handleSwitchPokemon = async (targetIdx: number) => {
    if (busy || targetIdx === playerIdx || party[targetIdx].currentHp <= 0) return;
    const wasForced = menuMode === 'force_switch';
    setBusy(true);
    setMenuMode('root');

    // Natural Cure on outgoing Pokemon
    const nextParty = party.map((m, idx) =>
      idx === playerIdx && m.ability === 'natural_cure' && m.currentHp > 0
        ? { ...m, status: 'none' as const, sleepTurns: 0 }
        : m
    );
    setParty(nextParty);

    setPlayerIdx(targetIdx);
    setPlayerStages(emptyStages());
    setPlayerSeeded(false);
    setPlayerAnim('idle');

    const newMon = nextParty[targetIdx];
    setMessage(`İleri, ${newMon.nickname || POKEDEX[newMon.speciesId].name}!`);
    await wait(750);

    const pEntry = applyEntryAbilities(newMon, activeEnemy, weather);
    if (pEntry.newWeather) setWeather(pEntry.newWeather);
    if (pEntry.foeAtkDrop) {
      setEnemyStages((st) => ({ ...st, atk: Math.max(-6, st.atk + pEntry.foeAtkDrop!) }));
    }
    for (const l of pEntry.logs) {
      setMessage(l);
      await wait(700);
    }

    if (!wasForced) {
      await runEnemyFreeAttack(nextParty, targetIdx);
    } else {
      // Check if enemy had also fainted simultaneously
      if (enemyTeam[enemyIdx].currentHp <= 0) {
        await advanceAfterEnemyFaint(nextParty, enemyTeam, enemyIdx);
      } else {
        setMessage('Ne yapacaksın?');
        setBusy(false);
      }
    }
  };

  // Use Bag Item (Poké Ball or Medicine)
  const handleUseItem = async (itemId: string, targetPartyIdx?: number) => {
    if (busy) return;
    const item = ITEMS[itemId];
    if (!item) return;

    // Poké Ball Throw!
    if (item.category === 'balls') {
      if (!isWild) {
        setMessage('Başka bir eğitmenin Pokémonuna top atamazsın!');
        return;
      }
      setBusy(true);
      setMenuMode('root');

      if (isSafari) {
        setCurSafariBalls((b) => Math.max(0, b - 1));
      } else {
        setCurBag((prev) => {
          const copy = { ...prev, [itemId]: (prev[itemId] || 1) - 1 };
          if (copy[itemId] <= 0) delete copy[itemId];
          return copy;
        });
      }

      audio.playSfx('ball_throw');
      setMessage(`${item.nameTr} fırlatıldı!`);
      setPokeballAnim({ sprite: item.sprite, phase: 'throw' });
      await wait(550);

      const { caught, shakes } = calculateCatchAttempt(activeEnemy, itemId, safariCatchMod);
      const phases: Array<'shake1' | 'shake2' | 'shake3'> = ['shake1', 'shake2', 'shake3'];
      for (let s = 0; s < shakes; s++) {
        audio.playSfx('ball_shake');
        setPokeballAnim({ sprite: item.sprite, phase: phases[s] });
        await wait(580);
      }

      if (caught) {
        audio.playSfx('catch_success');
        setPokeballAnim({ sprite: item.sprite, phase: 'caught' });
        setEnemyAnim('caught');
        setMessage(`Harika! ${enemySp.name} başarıyla yakalandı!!`);
        await wait(1400);

        const caughtInstance: PokemonInstance = {
          ...activeEnemy,
          pokeball: itemId,
        };
        const nextBag = { ...curBag };
        if (!isSafari) {
          nextBag[itemId] = (nextBag[itemId] || 1) - 1;
          if (nextBag[itemId] <= 0) delete nextBag[itemId];
        }
        onFinish({
          result: 'caught',
          updatedParty: party,
          updatedBag: nextBag,
          caughtPokemon: caughtInstance,
          safariBallsUsed: isSafari ? safariBalls - (curSafariBalls - 1) : 0,
          seenSpeciesIds: Array.from(seenIds),
        });
        return;
      } else {
        setPokeballAnim(null);
        setMessage(
          shakes >= 3
            ? `Ah! Çok yaklaşmıştın ama ${enemySp.name} son anda toptan çıktı!`
            : `Olamaz! ${enemySp.name} Poké Topundan kurtuldu!`
        );
        await wait(850);

        if (isSafari) {
          await checkSafariWildTurn(curSafariBalls - 1);
        } else {
          await runEnemyFreeAttack(party, playerIdx);
        }
      }
      return;
    }

    // Medicine on a Party Member
    const tIdx = targetPartyIdx ?? playerIdx;
    const target = party[tIdx];
    if (!target) return;

    if (item.revivePercent && target.currentHp > 0) {
      setMessage('Canlandırıcı yalnızca bayılmış Pokémon üzerinde kullanılabilir!');
      return;
    }
    if (!item.revivePercent && target.currentHp <= 0) {
      setMessage('Bayılmış bir Pokémona önce Canlandırıcı (Revive) vermelisin!');
      return;
    }

    setBusy(true);
    setMenuMode('root');
    const nextBag = { ...curBag, [itemId]: (curBag[itemId] || 1) - 1 };
    if (nextBag[itemId] <= 0) delete nextBag[itemId];
    setCurBag(nextBag);

    let updatedTarget = { ...target };
    if (item.revivePercent) {
      updatedTarget.currentHp = Math.max(1, Math.floor((target.maxHp * item.revivePercent) / 100));
      updatedTarget.status = 'none';
    } else {
      if (item.healHp) {
        updatedTarget.currentHp =
          item.healHp >= 9999
            ? target.maxHp
            : Math.min(target.maxHp, target.currentHp + item.healHp);
      }
      if (item.healStatus) {
        if (
          item.healStatus === 'all' ||
          item.healStatus === target.status ||
          (item.healStatus === 'psn' && target.status === 'tox')
        ) {
          updatedTarget.status = 'none';
          updatedTarget.sleepTurns = 0;
        }
      }
    }

    const nextParty = party.map((m, idx) => (idx === tIdx ? updatedTarget : m));
    setParty(nextParty);
    audio.playSfx('heal');
    setMessage(`${POKEDEX[target.speciesId].name} üzerinde ${item.nameTr} kullanıldı!`);
    await wait(850);

    await runEnemyFreeAttack(nextParty, playerIdx);
  };

  // Safari Zone Special Actions (Bait / Rock)
  const checkSafariWildTurn = async (ballsLeft: number) => {
    if (ballsLeft <= 0) {
      setMessage('Safari Topların tükendi! Safari turu sona erdi.');
      await wait(1000);
      onFinish({
        result: 'escaped',
        updatedParty: party,
        updatedBag: curBag,
        safariBallsUsed: safariBalls,
        seenSpeciesIds: Array.from(seenIds),
      });
      return;
    }
    const fleeProb = Math.min(0.65, 0.16 * safariFleeMod);
    if (Math.random() < fleeProb) {
      setMessage(`Vahşi ${enemySp.name} çalıların arasına kaçtı!`);
      await wait(1000);
      onFinish({
        result: 'escaped',
        updatedParty: party,
        updatedBag: curBag,
        safariBallsUsed: safariBalls - ballsLeft,
        seenSpeciesIds: Array.from(seenIds),
      });
      return;
    }
    setMessage(`${enemySp.name} dikkatle seni izliyor...`);
    setBusy(false);
  };

  const handleSafariBait = async () => {
    if (busy) return;
    setBusy(true);
    setSafariFleeMod((f) => Math.max(0.35, f * 0.6));
    setSafariCatchMod((c) => Math.max(0.8, c * 0.9));
    setMessage(`${enemySp.name} önüne lezzetli PokéBlok Yemi attın! İştahla yiyor, kaçma ihtimali düştü!`);
    await wait(850);
    await checkSafariWildTurn(curSafariBalls);
  };

  const handleSafariRock = async () => {
    if (busy) return;
    setBusy(true);
    setSafariCatchMod((c) => Math.min(3.0, c * 1.55));
    setSafariFleeMod((f) => Math.min(2.6, f * 1.45));
    setMessage(`${enemySp.name} yakınına taş fırlattın! Yakalanması kolaylaştı ama ürküp kaçabilir!`);
    await wait(850);
    await checkSafariWildTurn(curSafariBalls);
  };

  // Run Action
  const handleRun = async () => {
    if (busy) return;
    if (!isWild) {
      setMessage('Eğitmen savaşından kaçamazsın!');
      return;
    }
    setBusy(true);
    if (isSafari || activePlayer.stats.spe >= activeEnemy.stats.spe || Math.random() < 0.78) {
      audio.playSfx('cancel');
      setMessage('Güvenli bir şekilde uzaklaştın!');
      await wait(700);
      onFinish({
        result: 'escaped',
        updatedParty: party,
        updatedBag: curBag,
        safariBallsUsed: isSafari ? safariBalls - curSafariBalls : 0,
        seenSpeciesIds: Array.from(seenIds),
      });
    } else {
      setMessage('Kaçamadın!');
      await wait(700);
      await runEnemyFreeAttack(party, playerIdx);
    }
  };

  const hpBarColor = (cur: number, max: number) => {
    const r = cur / Math.max(1, max);
    if (r > 0.5) return 'bg-emerald-400';
    if (r > 0.2) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const terrainGradient = {
    grass: 'from-sky-400 via-emerald-300 to-emerald-600',
    water: 'from-sky-500 via-cyan-400 to-blue-700',
    cave: 'from-stone-800 via-amber-950 to-stone-900',
    indoor: 'from-slate-700 via-slate-600 to-slate-800',
    indigo: 'from-indigo-950 via-purple-900 to-slate-900',
  }[config.terrain];

  const isAlreadyCaught = pokedexCaught.includes(activeEnemy.speciesId);
  const expCurrBase = Math.pow(activePlayer.level, 3);
  const expNextBase = Math.pow(activePlayer.level + 1, 3);
  const expRatio =
    activePlayer.level >= 100
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            ((activePlayer.exp - expCurrBase) / Math.max(1, expNextBase - expCurrBase)) * 100
          )
        );

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-slate-900 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Weather & Battle Mode Bar */}
        <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            {config.trainer
              ? `${config.trainer.titleTr} ${config.trainer.nameTr}`
              : isSafari
              ? `GBA SAFARİ BÖLGESİ (Kalan Top: ${curSafariBalls})`
              : 'Vahşi Pokémon Karşılaşması'}
          </div>
          <div className="font-semibold" style={{ color: WEATHER_LABELS[weather].color }}>
            ☁ {WEATHER_LABELS[weather].label}
          </div>
        </div>

        {/* GBA BATTLE STAGE */}
        <div
          className={`relative h-64 sm:h-80 w-full bg-gradient-to-b ${terrainGradient} overflow-hidden select-none`}
        >
          {/* Weather Overlay on Battle Canvas */}
          {weather === 'sun' && (
            <div className="absolute inset-0 bg-amber-300/20 pointer-events-none" />
          )}
          {weather === 'rain' && (
            <div className="absolute inset-0 bg-blue-950/25 pointer-events-none" />
          )}
          {weather === 'sandstorm' && (
            <div className="absolute inset-0 bg-amber-700/25 pointer-events-none" />
          )}

          {/* ENEMY STATUS CARD (Top Left - Authentic GBA Cream Frame!) */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-10 w-56 sm:w-64 bg-amber-50/95 border-[3px] border-slate-800 rounded-xl px-3 py-2 shadow-lg text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-black text-xs sm:text-sm truncate">
                {activeEnemy.isShiny && <span className="text-amber-500">✨</span>}
                <span>{enemySp.name}</span>
                {isAlreadyCaught && isWild && (
                  <img
                    src="/sprites/items/poke-ball.png"
                    alt="Yakalandı"
                    title="Pokédex'te Kayıtlı!"
                    className="w-4 h-4 inline"
                  />
                )}
              </div>
              <span className="font-black text-xs text-slate-700">Lv.{activeEnemy.level}</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-black bg-slate-800 text-amber-300 px-1 rounded">HP</span>
              <div className="flex-1 h-2.5 bg-slate-300 rounded-full overflow-hidden border border-slate-600">
                <div
                  className={`h-full transition-all duration-300 ${hpBarColor(
                    activeEnemy.currentHp,
                    activeEnemy.maxHp
                  )}`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (activeEnemy.currentHp / activeEnemy.maxHp) * 100)
                    )}%`,
                  }}
                />
              </div>
              {STATUS_BADGE[activeEnemy.status] && (
                <span
                  style={{ backgroundColor: STATUS_BADGE[activeEnemy.status]!.bg }}
                  className="text-[9px] font-black text-white px-1.5 py-0.5 rounded"
                >
                  {STATUS_BADGE[activeEnemy.status]!.label}
                </span>
              )}
            </div>

            {/* Enemy Trainer Party Pokeballs */}
            {config.trainer && (
              <div className="flex items-center gap-1 mt-1.5">
                {enemyTeam.map((em, i) => (
                  <span
                    key={em.uid + i}
                    className={`w-2.5 h-2.5 rounded-full border border-slate-800 ${
                      em.currentHp > 0 ? 'bg-red-500' : 'bg-slate-400 opacity-50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ENEMY PLATFORM & GBA SPRITE (Top Right) */}
          <div className="absolute top-12 right-6 sm:right-16 flex flex-col items-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              {/* Ground Oval */}
              <div className="absolute bottom-2 w-32 sm:w-40 h-9 rounded-full bg-black/25 border-2 border-white/30" />

              {/* Enemy Sprite */}
              {enemyAnim !== 'caught' && (
                <img
                  src={
                    activeEnemy.isShiny
                      ? `/sprites/shiny/${activeEnemy.speciesId}.png`
                      : `/sprites/front/${activeEnemy.speciesId}.png`
                  }
                  alt={enemySp.name}
                  style={{ imageRendering: 'pixelated' }}
                  className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 object-contain transition-all duration-200 ${
                    enemyAnim === 'enter'
                      ? 'scale-110 -translate-y-2'
                      : enemyAnim === 'attack'
                      ? '-translate-x-5 translate-y-2 scale-105'
                      : enemyAnim === 'hit'
                      ? 'opacity-30 translate-x-3'
                      : enemyAnim === 'faint'
                      ? 'translate-y-12 opacity-0'
                      : 'animate-pulse'
                  }`}
                />
              )}

              {/* Poké Ball Catch Animation */}
              {pokeballAnim && (
                <img
                  src={`/sprites/items/${pokeballAnim.sprite}`}
                  alt="Pokeball"
                  style={{ imageRendering: 'pixelated' }}
                  className={`z-20 w-12 h-12 object-contain transition-transform duration-200 ${
                    pokeballAnim.phase === 'throw'
                      ? '-translate-y-6 scale-110'
                      : pokeballAnim.phase === 'shake1'
                      ? '-rotate-12'
                      : pokeballAnim.phase === 'shake2'
                      ? 'rotate-12'
                      : pokeballAnim.phase === 'caught'
                      ? 'brightness-125 drop-shadow-[0_0_12px_rgba(250,204,21,0.95)]'
                      : ''
                  }`}
                />
              )}

              {/* Elemental Hit VFX Burst on Enemy */}
              {vfx?.target === 'enemy' && (
                <div
                  style={{ backgroundColor: TYPE_COLORS[vfx.type].bg }}
                  className="absolute inset-4 rounded-full opacity-75 animate-ping z-20"
                />
              )}
            </div>
          </div>

          {/* PLAYER PLATFORM & BACK SPRITE (Bottom Left) */}
          {!isSafari && (
            <div className="absolute bottom-0 left-6 sm:left-16 flex flex-col items-center">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-end justify-center">
                <div className="absolute bottom-1 w-36 sm:w-44 h-9 rounded-full bg-black/25 border-2 border-white/30" />
                <img
                  src={`/sprites/back/${activePlayer.speciesId}.png`}
                  alt={playerSp.name}
                  style={{ imageRendering: 'pixelated' }}
                  className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 object-contain transition-all duration-200 ${
                    playerAnim === 'attack'
                      ? 'translate-x-6 -translate-y-3 scale-105'
                      : playerAnim === 'hit'
                      ? 'opacity-30 -translate-x-3'
                      : playerAnim === 'faint'
                      ? 'translate-y-12 opacity-0'
                      : ''
                  }`}
                />
                {vfx?.target === 'player' && (
                  <div
                    style={{ backgroundColor: TYPE_COLORS[vfx.type].bg }}
                    className="absolute inset-4 rounded-full opacity-75 animate-ping z-20"
                  />
                )}
              </div>
            </div>
          )}

          {/* PLAYER STATUS CARD (Bottom Right - Authentic GBA Cream Frame + Blue EXP Bar!) */}
          {!isSafari && (
            <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-6 z-10 w-60 sm:w-72 bg-amber-50/95 border-[3px] border-slate-800 rounded-xl px-3 py-2 shadow-lg text-slate-900">
              <div className="flex items-center justify-between">
                <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1">
                  {activePlayer.isShiny && <span className="text-amber-500">✨</span>}
                  <span>{activePlayer.nickname || playerSp.name}</span>
                </div>
                <span className="font-black text-xs text-slate-700">Lv.{activePlayer.level}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-black bg-slate-800 text-amber-300 px-1 rounded">HP</span>
                <div className="flex-1 h-2.5 bg-slate-300 rounded-full overflow-hidden border border-slate-600">
                  <div
                    className={`h-full transition-all duration-300 ${hpBarColor(
                      activePlayer.currentHp,
                      activePlayer.maxHp
                    )}`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (activePlayer.currentHp / activePlayer.maxHp) * 100)
                      )}%`,
                    }}
                  />
                </div>
                {STATUS_BADGE[activePlayer.status] && (
                  <span
                    style={{ backgroundColor: STATUS_BADGE[activePlayer.status]!.bg }}
                    className="text-[9px] font-black text-white px-1.5 py-0.5 rounded"
                  >
                    {STATUS_BADGE[activePlayer.status]!.label}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mt-1">
                <span className="text-[10px] text-slate-500 truncate">
                  {ABILITIES[activePlayer.ability]?.nameTr}
                  {activePlayer.heldItem ? ` • ${ITEMS[activePlayer.heldItem]?.nameTr}` : ''}
                </span>
                <span>
                  {activePlayer.currentHp} / {activePlayer.maxHp}
                </span>
              </div>

              {/* GBA Blue EXP Bar */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-black text-sky-700">EXP</span>
                <div className="flex-1 h-1.5 bg-slate-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${expRatio}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Evolution Overlay inside Stage */}
          {evoBanner && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center gap-3 text-white">
              <div className="flex items-center gap-6">
                <img
                  src={`/sprites/front/${evoBanner.fromId}.png`}
                  alt=""
                  style={{ imageRendering: 'pixelated' }}
                  className="w-24 h-24 opacity-60"
                />
                <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
                <img
                  src={`/sprites/front/${evoBanner.toId}.png`}
                  alt=""
                  style={{ imageRendering: 'pixelated' }}
                  className="w-28 h-28 drop-shadow-[0_0_16px_rgba(250,204,21,0.9)]"
                />
              </div>
              <div className="text-lg font-black text-amber-300">EVRİM GEÇİRİYOR!</div>
            </div>
          )}
        </div>

        {/* BOTTOM GBA DIALOGUE & ACTION PANEL */}
        <div className="bg-slate-900 border-t-4 border-slate-700 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[155px]">
          {/* Left Dialogue Box */}
          <div className="md:col-span-5 bg-slate-950 border-2 border-teal-500/60 rounded-xl p-3 flex flex-col justify-between">
            <p className="text-sm sm:text-base font-bold text-slate-100 leading-snug">{message}</p>
            {menuMode !== 'root' && menuMode !== 'force_switch' && !busy && (
              <button
                onClick={() => setMenuMode('root')}
                className="self-start mt-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                ← Geri Dön
              </button>
            )}
          </div>

          {/* Right Action Area */}
          <div className="md:col-span-7">
            {/* SAFARI ZONE CONTROLS */}
            {isSafari ? (
              <div className="grid grid-cols-2 gap-2.5 h-full">
                <button
                  disabled={busy || curSafariBalls <= 0}
                  onClick={() => handleUseItem('safari-ball')}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow"
                >
                  <img src="/sprites/items/safari-ball.png" alt="" className="w-6 h-6" />
                  SAFARİ TOPU ({curSafariBalls})
                </button>
                <button
                  disabled={busy}
                  onClick={handleSafariBait}
                  className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-sm"
                >
                  🍎 YEM AT (Sakinleştir)
                </button>
                <button
                  disabled={busy}
                  onClick={handleSafariRock}
                  className="p-3 rounded-xl bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm"
                >
                  🪨 TAŞ AT (Yakalama Artır)
                </button>
                <button
                  disabled={busy}
                  onClick={handleRun}
                  className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-black text-sm"
                >
                  🏃 KAÇ
                </button>
              </div>
            ) : menuMode === 'root' ? (
              /* STANDARD 4 GBA ROOT BUTTONS */
              <div className="grid grid-cols-2 gap-2.5 h-full">
                <button
                  disabled={busy}
                  onClick={() => setMenuMode('fight')}
                  className="p-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 border-2 border-red-400 text-white font-black text-base flex items-center justify-center gap-2 shadow"
                >
                  <Swords className="w-5 h-5" />
                  SAVAŞ
                </button>
                <button
                  disabled={busy || isFrontier}
                  onClick={() => setMenuMode('bag')}
                  title={isFrontier ? 'Savaş Sınırında çanta eşyası kullanılamaz!' : ''}
                  className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 border-2 border-amber-400 text-white font-black text-base flex items-center justify-center gap-2 shadow"
                >
                  <Backpack className="w-5 h-5" />
                  ÇANTA {isFrontier ? '(Yasak)' : ''}
                </button>
                <button
                  disabled={busy}
                  onClick={() => setMenuMode('party')}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 border-2 border-emerald-400 text-white font-black text-base flex items-center justify-center gap-2 shadow"
                >
                  <RefreshCw className="w-5 h-5" />
                  POKÉMON
                </button>
                <button
                  disabled={busy || !isWild}
                  onClick={handleRun}
                  className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 border-2 border-sky-400 text-white font-black text-base flex items-center justify-center gap-2 shadow"
                >
                  <Footprints className="w-5 h-5" />
                  KAÇ
                </button>
              </div>
            ) : menuMode === 'fight' ? (
              /* 4 MOVE BUTTONS WITH GBA TYPE + EFFECTIVENESS PREVIEW! */
              <div className="grid grid-cols-2 gap-2">
                {activePlayer.moves.map((slot) => {
                  const md = MOVES[slot.moveId] || MOVES.tackle;
                  const tc = TYPE_COLORS[md.type];
                  const eff =
                    md.category === 'status'
                      ? null
                      : getTypeEffectiveness(md.type, enemySp.types, activeEnemy.ability);

                  return (
                    <button
                      key={slot.moveId}
                      disabled={busy || slot.pp <= 0}
                      onClick={() => handleSelectMove(slot.moveId)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border-2 text-left transition flex flex-col justify-between"
                      style={{ borderColor: tc.bg }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-xs sm:text-sm text-white truncate">
                          {md.nameTr}
                        </span>
                        <span
                          style={{ backgroundColor: tc.bg, color: tc.text }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                        >
                          {TYPE_NAMES_TR[md.type]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                        <span>
                          {md.category === 'physical' ? '💥' : md.category === 'special' ? '🌀' : '✨'}{' '}
                          {md.power > 0 ? `${md.power} Güç` : 'Durum'} • PP {slot.pp}/{slot.maxPp}
                        </span>
                        {eff !== null && eff !== 1 && (
                          <span
                            className={`font-black text-[10px] px-1 rounded ${
                              eff >= 2
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : eff === 0
                                ? 'bg-red-500/30 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {eff >= 2 ? `Süper (${eff}x)` : eff === 0 ? 'Etkisiz (0x)' : `Az (${eff}x)`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : menuMode === 'bag' ? (
              /* IN-BATTLE BAG ITEMS */
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {Object.entries(curBag)
                  .filter(([id, cnt]) => cnt > 0 && ITEMS[id]?.usableInBattle)
                  .map(([id, cnt]) => {
                    const it = ITEMS[id];
                    return (
                      <button
                        key={id}
                        disabled={busy || (it.category === 'balls' && !isWild)}
                        onClick={() => handleUseItem(id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600 flex items-center gap-2 text-left"
                      >
                        <img
                          src={`/sprites/items/${it.sprite}`}
                          alt=""
                          style={{ imageRendering: 'pixelated' }}
                          className="w-7 h-7 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {it.nameTr} x{cnt}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{it.descTr}</div>
                        </div>
                      </button>
                    );
                  })}
                {Object.entries(curBag).filter(([id, cnt]) => cnt > 0 && ITEMS[id]?.usableInBattle)
                  .length === 0 && (
                  <div className="col-span-2 text-xs text-slate-400 p-3 text-center">
                    Çantanda savaş içinde kullanılabilir eşya kalmadı.
                  </div>
                )}
              </div>
            ) : (
              /* PARTY SWITCH MENU (party or force_switch) */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {party.map((m, idx) => {
                  const sp = POKEDEX[m.speciesId];
                  const isActive = idx === playerIdx;
                  return (
                    <button
                      key={m.uid}
                      disabled={busy || isActive || m.currentHp <= 0}
                      onClick={() => handleSwitchPokemon(idx)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 ${
                        isActive
                          ? 'bg-emerald-950/70 border-emerald-400'
                          : m.currentHp <= 0
                          ? 'bg-slate-950/60 border-red-900/50 opacity-50'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
                      }`}
                    >
                      <img
                        src={`/sprites/icons/${m.speciesId}.png`}
                        alt=""
                        style={{ imageRendering: 'pixelated' }}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {m.nickname || sp.name}
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Lv.{m.level} • {m.currentHp}/{m.maxHp}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5TH MOVE REPLACEMENT MODAL */}
      {moveLearnPrompt && (() => {
        const mon = party[moveLearnPrompt.partyIndex];
        const newMd = MOVES[moveLearnPrompt.moveId];
        if (!mon || !newMd) return null;
        const resolveChoice = (replaceIdx: number | null) => {
          const resolver = moveLearnResolverRef.current;
          moveLearnResolverRef.current = null;
          setMoveLearnPrompt(null);
          if (!resolver) return;
          if (replaceIdx === null) {
            resolver(mon);
          } else {
            const nextMoves = mon.moves.map((sl, idx) =>
              idx === replaceIdx ? { moveId: newMd.id, pp: newMd.pp, maxPp: newMd.pp } : sl
            );
            resolver({ ...mon, moves: nextMoves });
          }
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-300 font-black text-base">
                <ShieldAlert className="w-5 h-5" />
                {POKEDEX[mon.speciesId].name} yeni bir hamle öğrenmek istiyor: {newMd.nameTr}!
              </div>
              <p className="text-xs text-slate-300">
                Yeni Hamle:{' '}
                <span className="font-bold text-white">
                  {newMd.nameTr} ({TYPE_NAMES_TR[newMd.type]} • {newMd.power || 'Durum'} Güç)
                </span>{' '}
                — {newMd.descTr}
              </p>
              <div className="text-xs text-slate-400 font-semibold">
                Unutulacak hamleyi seçin (veya vazgeçin):
              </div>
              <div className="space-y-2">
                {mon.moves.map((sl, idx) => {
                  const oldMd = MOVES[sl.moveId];
                  return (
                    <button
                      key={sl.moveId}
                      onClick={() => resolveChoice(idx)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-400 flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{oldMd?.nameTr}</div>
                        <div className="text-[11px] text-slate-400">{oldMd?.descTr}</div>
                      </div>
                      <span className="text-xs font-bold text-amber-300 shrink-0 ml-2">
                        Değiştir →
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => resolveChoice(null)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                {newMd.nameTr} Öğrenmekten Vazgeç
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
