import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BagAndMartModal } from './components/BagAndMartModal';
import { BattleFrontierModal } from './components/BattleFrontierModal';
import { BattleOutcome, BattleSessionConfig, BattleView } from './components/BattleView';
import { PartyAndBoxModal } from './components/PartyAndBoxModal';
import { PinballModal } from './components/PinballModal';
import { PokedexModal } from './components/PokedexModal';
import { PokeNavModal } from './components/PokeNavModal';
import { isQuestReadyToClaim, RescueBoardModal } from './components/RescueBoardModal';
import { StarterLabModal } from './components/StarterLabModal';
import { TitleScreen } from './components/TitleScreen';
import { ITEMS } from './data/items';
import { LEDGE_DOWN_TILE, MAPS, WALKABLE_TILES, WATER_TILE } from './data/maps';
import { MOVES } from './data/moves';
import { POKEDEX } from './data/pokedex';
import { RESCUE_QUESTS } from './data/quests';
import { getRivalStarterLine, GYM_BADGES, TRAINERS } from './data/trainersAndGyms';
import { NATURE_LIST } from './data/typesAndNatures';
import { audio } from './engine/audio';
import {
  createPokemon,
  evolvePokemonInstance,
  generateBattleFactoryPool,
  grantExpToPokemon,
  healPokemonFull,
  recalculatePokemonStats,
  scalePokemonToLevel50,
} from './engine/pokemonFactory';
import {
  createNewSaveState,
  loadSaveFromStorage,
  writeSaveToStorage,
} from './engine/saveSystem';
import { isNpcVisible, renderOverworld } from './engine/tileRenderer';
import {
  DifficultyMode,
  Direction,
  EncounterEntry,
  NpcData,
  PokemonInstance,
  RescueQuest,
  SaveState,
  TrainerData,
} from './types/game';
import {
  Award,
  Backpack,
  Bike,
  BookOpen,
  Compass,
  Download,
  FastForward,
  Save,
  ScrollText,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FrontierRunState {
  mode: 'tower' | 'factory';
  round: number;
  maxRounds: number;
  team: PokemonInstance[];
  lastEnemyTeam?: PokemonInstance[];
  awaitingSwap?: boolean;
}

export default function App() {
  const [save, setSave] = useState<SaveState | null>(null);
  const [existingSave, setExistingSave] = useState<SaveState | null>(() => loadSaveFromStorage());

  // Modals & Overlays
  const [activeModal, setActiveModal] = useState<
    | null
    | 'starter_lab'
    | 'party'
    | 'bag'
    | 'mart'
    | 'stone_mart'
    | 'tm_mart'
    | 'bp_mart'
    | 'pokenav'
    | 'pokedex'
    | 'rescue'
    | 'pinball'
    | 'frontier_tower'
    | 'frontier_factory'
    | 'ferry'
    | 'fossil'
    | 'nature_guru'
  >(null);

  const [dialogueQueue, setDialogueQueue] = useState<
    Array<{ speaker?: string; text: string; onDone?: () => void }>
  >([]);
  const [quizPrompt, setQuizPrompt] = useState<{
    questionTr: string;
    options: string[];
    answerIdx: number;
    flag: string;
  } | null>(null);
  const [toast, setToast] = useState<string>('');

  // Active Battle Session
  const [battleConfig, setBattleConfig] = useState<BattleSessionConfig | null>(null);
  const [pendingTrainerFlag, setPendingTrainerFlag] = useState<string | null>(null);
  const [frontierRun, setFrontierRun] = useState<FrontierRunState | null>(null);

  // Canvas & Smooth Overworld Movement Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const saveRef = useRef<SaveState | null>(null);
  saveRef.current = save;

  const moveStateRef = useRef({
    renderX: 5,
    renderY: 5,
    fromX: 5,
    fromY: 5,
    toX: 5,
    toY: 5,
    followerX: 5,
    followerY: 4,
    moving: false,
    progress: 0,
    shiftHeld: false,
    heldDirs: new Set<Direction>(),
    alertNpcId: null as string | null,
    tick: 0,
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Sync Audio & Auto-Save
  useEffect(() => {
    if (!save) {
      audio.playBgm('title');
      return;
    }
    audio.setSettings(save.settings.soundEnabled, save.settings.musicVolume);
    if (battleConfig) {
      if (
        battleConfig.kind === 'gym' ||
        battleConfig.kind === 'elite4' ||
        battleConfig.kind === 'frontier_tower' ||
        battleConfig.kind === 'frontier_factory'
      ) {
        audio.playBgm('battle_gym');
      } else if (battleConfig.kind === 'trainer') {
        audio.playBgm('battle_trainer');
      } else {
        audio.playBgm('battle_wild');
      }
    } else {
      const m = MAPS[save.mapId];
      audio.playBgm(m?.music || 'pallet');
    }
    writeSaveToStorage(save);
    setExistingSave(save);
  }, [save, battleConfig]);

  // Sync render coordinates when map or save initializes
  const syncPositionImmediate = useCallback((x: number, y: number) => {
    const ms = moveStateRef.current;
    ms.renderX = x;
    ms.renderY = y;
    ms.fromX = x;
    ms.fromY = y;
    ms.toX = x;
    ms.toY = y;
    ms.followerX = x;
    ms.followerY = y;
    ms.moving = false;
    ms.progress = 0;
  }, []);

  const pushDialogue = useCallback(
    (lines: string[], speaker?: string, onDone?: () => void) => {
      if (lines.length === 0) {
        onDone?.();
        return;
      }
      setDialogueQueue(
        lines.map((text, i) => ({
          speaker,
          text,
          onDone: i === lines.length - 1 ? onDone : undefined,
        }))
      );
    },
    []
  );

  const advanceDialogue = useCallback(() => {
    setDialogueQueue((prev) => {
      if (prev.length === 0) return prev;
      audio.playSfx('select');
      const [first, ...rest] = prev;
      if (rest.length === 0 && first.onDone) {
        setTimeout(() => first.onDone?.(), 0);
      }
      return rest;
    });
  }, []);

  // Build Trainer Party with Rival Starter & Difficulty Adjustments
  const buildTrainerEnemyParty = useCallback(
    (trainer: TrainerData, curSave: SaveState): PokemonInstance[] => {
      const [r1, r2, r3] = getRivalStarterLine(curSave.starterSpeciesId || 1);
      const levelBump = curSave.settings.difficulty === 'emerald_hard' ? 2 : 0;

      return trainer.party.map((spec) => {
        let sid = spec.speciesId;
        // Substitute Rival's counter-starter line dynamically!
        if (trainer.id === 'rival_lab') sid = r1;
        else if (trainer.id === 'rival_cerulean' && spec.speciesId === 5) sid = r2;
        else if (
          (trainer.id === 'rival_lavender' || trainer.id === 'champion_blue') &&
          spec.speciesId === 6
        ) {
          sid = r3;
        }
        return createPokemon(sid, spec.level + levelBump, {
          heldItem: spec.heldItem,
          customMoves: spec.moves,
          customAbility: spec.ability,
          customNature: spec.nature,
          perfectIvs: trainer.aiTier === 'boss',
          metLocation: MAPS[curSave.mapId]?.nameTr,
        });
      });
    },
    []
  );

  const startTrainerBattle = useCallback(
    (trainerId: string, curSave: SaveState, flagOnWin?: string) => {
      const tr = TRAINERS[trainerId];
      if (!tr) return;
      if (curSave.party.length === 0 || !curSave.party.some((m) => m.currentHp > 0)) {
        showToast('Savaşabilecek sağlıklı bir Pokémonun yok!');
        return;
      }
      const m = MAPS[curSave.mapId];
      const enemyParty = buildTrainerEnemyParty(tr, curSave);
      const kind: BattleSessionConfig['kind'] = tr.badgeId
        ? 'gym'
        : trainerId.startsWith('e4_') || trainerId === 'champion_blue'
        ? 'elite4'
        : 'trainer';

      setPendingTrainerFlag(flagOnWin || trainerId);
      setBattleConfig({
        kind,
        enemyParty,
        trainer: tr,
        weatherInitial: m.weather,
        terrain: m.id === 'indigo_plateau' ? 'indigo' : m.isCave ? 'cave' : m.isIndoor ? 'indoor' : 'grass',
      });
    },
    [buildTrainerEnemyParty, showToast]
  );

  const triggerWildEncounter = useCallback(
    (
      pool: EncounterEntry[],
      curSave: SaveState,
      opts?: { dexNavSpeciesId?: number; isSafari?: boolean }
    ) => {
      if (pool.length === 0 || curSave.party.length === 0) return;
      let chosen = pool[0];
      if (opts?.dexNavSpeciesId) {
        chosen = pool.find((e) => e.speciesId === opts.dexNavSpeciesId) || {
          speciesId: opts.dexNavSpeciesId,
          minLv: 10,
          maxLv: 15,
          weight: 100,
        };
      } else {
        const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
        let r = Math.random() * totalWeight;
        for (const e of pool) {
          r -= e.weight;
          if (r <= 0) {
            chosen = e;
            break;
          }
        }
      }

      const lv =
        chosen.minLv + Math.floor(Math.random() * Math.max(1, chosen.maxLv - chosen.minLv + 1));

      // Repel check (unless DexNav!)
      if (!opts?.dexNavSpeciesId && curSave.repelSteps > 0 && lv < curSave.party[0].level) {
        return;
      }

      const m = MAPS[curSave.mapId];
      const wildMon = createPokemon(chosen.speciesId, lv, {
        dexNavBoost: !!opts?.dexNavSpeciesId,
        metLocation: m.nameTr,
      });

      setPendingTrainerFlag(null);
      setBattleConfig({
        kind: opts?.isSafari || curSave.mapId === 'safari_zone' ? 'safari' : 'wild',
        enemyParty: [wildMon],
        weatherInitial: m.weather,
        terrain: curSave.isSurfing ? 'water' : m.isCave ? 'cave' : 'grass',
      });
    },
    []
  );

  // Check if an undefeated Trainer sees the player!
  const checkTrainerSight = useCallback(
    (curSave: SaveState): boolean => {
      const m = MAPS[curSave.mapId];
      if (!m) return false;
      for (const npc of m.npcs) {
        if (!isNpcVisible(npc, curSave.flags)) continue;
        if (npc.role !== 'trainer' || !npc.trainerId || !npc.sightRange) continue;
        if (curSave.defeatedTrainers.includes(npc.trainerId)) continue;

        const dx = curSave.x - npc.x;
        const dy = curSave.y - npc.y;
        let inSight = false;
        if (npc.dir === 'down' && dx === 0 && dy > 0 && dy <= npc.sightRange) inSight = true;
        if (npc.dir === 'up' && dx === 0 && dy < 0 && -dy <= npc.sightRange) inSight = true;
        if (npc.dir === 'right' && dy === 0 && dx > 0 && dx <= npc.sightRange) inSight = true;
        if (npc.dir === 'left' && dy === 0 && dx < 0 && -dx <= npc.sightRange) inSight = true;

        if (inSight) {
          // Verify line of sight has no solid walls
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          const sx = Math.sign(dx);
          const sy = Math.sign(dy);
          let blocked = false;
          for (let s = 1; s < steps; s++) {
            const ch = m.rows[npc.y + sy * s]?.[npc.x + sx * s];
            if (!ch || !WALKABLE_TILES.has(ch)) blocked = true;
          }
          if (!blocked) {
            moveStateRef.current.alertNpcId = npc.id;
            audio.playSfx('select');
            setTimeout(() => {
              moveStateRef.current.alertNpcId = null;
              pushDialogue(npc.dialogueTr, npc.nameTr, () => {
                startTrainerBattle(npc.trainerId!, curSave);
              });
            }, 420);
            return true;
          }
        }
      }
      return false;
    },
    [pushDialogue, startTrainerBattle]
  );

  // Helper to add a Gift/Caught/Fossil Pokemon to Party or PC Box
  const addPokemonToSave = (curSave: SaveState, mon: PokemonInstance): { nextSave: SaveState; whereTr: string } => {
    const seen = Array.from(new Set([...curSave.pokedexSeen, mon.speciesId]));
    const caught = Array.from(new Set([...curSave.pokedexCaught, mon.speciesId]));
    if (curSave.party.length < 6) {
      return {
        nextSave: {
          ...curSave,
          party: [...curSave.party, mon],
          pokedexSeen: seen,
          pokedexCaught: caught,
        },
        whereTr: 'takımına katıldı',
      };
    }
    return {
      nextSave: {
        ...curSave,
        pcBox: [...curSave.pcBox, mon],
        pokedexSeen: seen,
        pokedexCaught: caught,
      },
      whereTr: 'Taşınabilir PC Kutusuna aktarıldı',
    };
  };

  // Interact (`A` button / Z / Enter / Space)
  const handleInteract = useCallback(() => {
    const curSave = saveRef.current;
    if (!curSave || battleConfig || activeModal || quizPrompt) return;
    if (dialogueQueue.length > 0) {
      advanceDialogue();
      return;
    }
    if (moveStateRef.current.moving) return;

    const dirDelta: Record<Direction, [number, number]> = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    const [dx, dy] = dirDelta[curSave.dir];
    const tx = curSave.x + dx;
    const ty = curSave.y + dy;
    const m = MAPS[curSave.mapId];
    if (!m) return;

    // 1. Ground Item Check
    const gi = m.groundItems.find(
      (g) => g.x === tx && g.y === ty && !curSave.collectedGroundItems.includes(g.id)
    );
    if (gi) {
      audio.playSfx('catch_success');
      const it = ITEMS[gi.itemId];
      setSave((prev) =>
        prev
          ? {
              ...prev,
              bag: { ...prev.bag, [gi.itemId]: (prev.bag[gi.itemId] || 0) + gi.count },
              collectedGroundItems: [...prev.collectedGroundItems, gi.id],
            }
          : prev
      );
      pushDialogue([`${it?.nameTr || gi.itemId} x${gi.count} buldun ve çantana koydun!`]);
      return;
    }

    // 2. NPC Check
    const npc: NpcData | undefined = m.npcs.find(
      (n) => n.x === tx && n.y === ty && isNpcVisible(n, curSave.flags)
    );
    if (npc) {
      audio.playSfx('select');

      if (npc.role === 'oak_starter') {
        if (!curSave.flags.has_starter) {
          pushDialogue(npc.dialogueTr, npc.nameTr, () => setActiveModal('starter_lab'));
        } else {
          const healed = curSave.party.map(healPokemonFull);
          setSave((p) => (p ? { ...p, party: healed, pokeVialCharges: 3 } : p));
          audio.playSfx('heal');
          pushDialogue(
            [
              `Harika gidiyorsun ${curSave.playerName}! Şu ana dek Pokédex'te ${curSave.pokedexCaught.length} tür yakaladın ve ${curSave.badges.length} rozet kazandın!`,
              'Yorgun görünen Pokémonlarını da laboratuvar makinemde hemen iyileştirdim!',
            ],
            npc.nameTr
          );
        }
        return;
      }

      if (npc.role === 'healer') {
        audio.playSfx('heal');
        const healedParty = curSave.party.map(healPokemonFull);
        const healSpot = m.healSpot || curSave.lastHealSpot;
        setSave((prev) =>
          prev
            ? {
                ...prev,
                party: healedParty,
                pokeVialCharges: 3,
                lastHealSpot: healSpot,
              }
            : prev
        );
        pushDialogue(npc.dialogueTr, npc.nameTr);
        return;
      }

      if (
        npc.role === 'mart' ||
        npc.role === 'stone_mart' ||
        npc.role === 'tm_mart' ||
        npc.role === 'bp_mart'
      ) {
        setActiveModal(npc.role);
        return;
      }

      if (npc.role === 'rescue_board') {
        setActiveModal('rescue');
        return;
      }

      if (npc.role === 'pinball_arcade') {
        setActiveModal('pinball');
        return;
      }

      if (npc.role === 'battle_tower') {
        setActiveModal('frontier_tower');
        return;
      }

      if (npc.role === 'battle_factory') {
        setActiveModal('frontier_factory');
        return;
      }

      if (npc.role === 'ferry_captain') {
        setActiveModal('ferry');
        return;
      }

      if (npc.role === 'fossil_revive') {
        setActiveModal('fossil');
        return;
      }

      if (npc.role === 'nature_guru') {
        setActiveModal('nature_guru');
        return;
      }

      if (npc.role === 'quiz_gate' && npc.quiz) {
        setQuizPrompt(npc.quiz);
        return;
      }

      if (npc.role === 'legendary_boss' && npc.legendarySpeciesId) {
        const legMon = createPokemon(npc.legendarySpeciesId, npc.legendaryLevel || 55, {
          perfectIvs: true,
          metLocation: m.nameTr,
        });
        pushDialogue(npc.dialogueTr, npc.nameTr, () => {
          setBattleConfig({
            kind: 'wild',
            enemyParty: [legMon],
            weatherInitial: m.weather,
            terrain: m.id === 'sevii_frontier' ? 'indigo' : 'cave',
            legendaryFlagToSetOnCatch: `caught_${npc.legendarySpeciesId}`,
          });
        });
        return;
      }

      if (npc.role === 'gift_npc') {
        if (npc.giftItem && !curSave.flags[npc.giftItem.flag]) {
          audio.playSfx('catch_success');
          const giData = npc.giftItem;
          setSave((prev) =>
            prev
              ? {
                  ...prev,
                  bag: {
                    ...prev.bag,
                    [giData.itemId]: (prev.bag[giData.itemId] || 0) + giData.count,
                  },
                  flags: { ...prev.flags, [giData.flag]: true },
                }
              : prev
          );
          pushDialogue([giData.msgTr], npc.nameTr);
          return;
        }
        if (npc.giftPokemon && !curSave.flags[npc.giftPokemon.flag]) {
          audio.playSfx('catch_success');
          const gp = npc.giftPokemon;
          const giftMon = createPokemon(gp.speciesId, gp.level, {
            isStarter: true,
            metLocation: m.nameTr,
          });
          setSave((prev) => {
            if (!prev) return prev;
            const { nextSave } = addPokemonToSave(prev, giftMon);
            return {
              ...nextSave,
              flags: { ...nextSave.flags, [gp.flag]: true },
            };
          });
          pushDialogue([gp.msgTr], npc.nameTr);
          return;
        }
        pushDialogue(npc.dialogueTr, npc.nameTr);
        return;
      }

      if (npc.role === 'trainer' || npc.role === 'gym_leader' || npc.role === 'elite_four') {
        const tid = npc.trainerId!;
        const alreadyBeat = curSave.defeatedTrainers.includes(tid);
        if (alreadyBeat && npc.role !== 'elite_four') {
          pushDialogue(npc.afterDefeatDialogueTr || npc.dialogueTr, npc.nameTr);
        } else {
          pushDialogue(npc.dialogueTr, npc.nameTr, () => startTrainerBattle(tid, curSave));
        }
        return;
      }

      pushDialogue(npc.dialogueTr, npc.nameTr);
      return;
    }

    // 3. Sign Check
    const sign = m.signs.find((s) => s.x === tx && s.y === ty);
    if (sign) {
      audio.playSfx('select');
      pushDialogue(sign.textTr, 'Tabela');
      return;
    }

    // 4. Follower Pokémon Chat! (Emerald Seaglass / Pokémon Yellow tribute!)
    const ms = moveStateRef.current;
    if (
      curSave.party.length > 0 &&
      Math.round(ms.followerX) === tx &&
      Math.round(ms.followerY) === ty &&
      !curSave.isSurfing
    ) {
      const lead = curSave.party[0];
      const sp = POKEDEX[lead.speciesId];
      const moods = [
        `${lead.nickname || sp.name} neşeyle etrafında zıplıyor ve sana gülümsüyor! ♥`,
        `${lead.nickname || sp.name} kararlı gözlerle ufka bakıyor; bir sonraki savaşa tamamen hazır!`,
        `${lead.nickname || sp.name} sevgiyle omzuna başını yasladı! (Mutluluk: ${lead.happiness}/255)`,
      ];
      audio.playSfx('select');
      pushDialogue([moods[Math.floor(Math.random() * moods.length)]], lead.nickname || sp.name);
      return;
    }

    // 5. Fishing Rod Check when facing Water '~'!
    const targetTile = m.rows[ty]?.[tx];
    if (
      targetTile === WATER_TILE &&
      !curSave.isSurfing &&
      (curSave.bag['super-rod'] || curSave.bag['old-rod'])
    ) {
      const fishPool = m.fishEncounters || m.waterEncounters || [];
      if (fishPool.length > 0) {
        audio.playSfx('ball_throw');
        pushDialogue(['Oltayı suya savurdun... Tık! Oltaya güçlü bir Pokémon takıldı!'], 'Balıkçılık', () => {
          triggerWildEncounter(fishPool, curSave);
        });
      } else {
        pushDialogue(['Bu suda şu an balık görünmüyor.']);
      }
    }
  }, [
    activeModal,
    advanceDialogue,
    battleConfig,
    dialogueQueue.length,
    pushDialogue,
    quizPrompt,
    startTrainerBattle,
    triggerWildEncounter,
  ]);

  // Attempt One Grid Step in Direction `dir`
  const attemptStep = useCallback(
    (dir: Direction) => {
      const curSave = saveRef.current;
      const ms = moveStateRef.current;
      if (
        !curSave ||
        ms.moving ||
        ms.alertNpcId ||
        battleConfig ||
        activeModal ||
        quizPrompt ||
        dialogueQueue.length > 0
      ) {
        return;
      }

      const m = MAPS[curSave.mapId];
      if (!m) return;

      const delta: Record<Direction, [number, number]> = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
      };
      const [dx, dy] = delta[dir];
      const nx = curSave.x + dx;
      const ny = curSave.y + dy;

      const h = m.rows.length;
      const w = m.rows[0].length;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
        if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
        return;
      }

      // Check NPC collision
      const blockingNpc = m.npcs.find(
        (n) => n.x === nx && n.y === ny && isNpcVisible(n, curSave.flags)
      );
      if (blockingNpc) {
        if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
        return;
      }

      // Check Sign collision
      if (m.signs.some((s) => s.x === nx && s.y === ny)) {
        if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
        return;
      }

      // Check Ground Item collision (pick up via interact, don't walk over Pokéball)
      if (
        m.groundItems.some(
          (g) => g.x === nx && g.y === ny && !curSave.collectedGroundItems.includes(g.id)
        )
      ) {
        if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
        return;
      }

      const destTile = m.rows[ny][nx];

      // One-way Ledge Jump ('v' when moving down!)
      if (destTile === LEDGE_DOWN_TILE && dir === 'down' && ny + 1 < h) {
        const landY = ny + 1;
        if (WALKABLE_TILES.has(m.rows[landY][nx])) {
          ms.fromX = curSave.x;
          ms.fromY = curSave.y;
          ms.toX = nx;
          ms.toY = landY;
          ms.moving = true;
          ms.progress = 0;
          setSave((p) => (p ? { ...p, dir: 'down' } : p));
          return;
        }
      }

      // Water Surf Check
      let nextSurfing = curSave.isSurfing;
      if (destTile === WATER_TILE) {
        const canSurf =
          !!curSave.bag['surf-board'] ||
          !!curSave.bag['tm-surf'] ||
          curSave.badges.includes('soul') ||
          curSave.party.some((pm) => pm.moves.some((mv) => mv.moveId === 'surf'));
        if (!canSurf) {
          if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
          return;
        }
        nextSurfing = true;
      } else if (WALKABLE_TILES.has(destTile)) {
        nextSurfing = false;
      } else {
        // Solid tile
        if (curSave.dir !== dir) setSave((p) => (p ? { ...p, dir } : p));
        return;
      }

      // Check Warp on Destination Tile BEFORE stepping if locked!
      const warp = m.warps.find((wp) => wp.x === nx && wp.y === ny);
      if (warp) {
        if (warp.reqFlag && !curSave.flags[warp.reqFlag]) {
          audio.playSfx('bump');
          setSave((p) => (p ? { ...p, dir } : p));
          pushDialogue([warp.lockedMsgTr || 'Bu yol şu an kapalı!']);
          return;
        }
        if (warp.reqBadges && curSave.badges.length < warp.reqBadges) {
          audio.playSfx('bump');
          setSave((p) => (p ? { ...p, dir } : p));
          pushDialogue([warp.lockedMsgTr || `Bu geçit için ${warp.reqBadges} Rozet gerekiyor!`]);
          return;
        }
      }

      // Start Smooth Step!
      ms.fromX = curSave.x;
      ms.fromY = curSave.y;
      ms.toX = nx;
      ms.toY = ny;
      ms.moving = true;
      ms.progress = 0;
      if (curSave.dir !== dir || curSave.isSurfing !== nextSurfing) {
        setSave((p) => (p ? { ...p, dir, isSurfing: nextSurfing, isBiking: nextSurfing ? false : p.isBiking } : p));
      }
    },
    [activeModal, battleConfig, dialogueQueue.length, pushDialogue, quizPrompt]
  );

  // Keyboard Listeners
  useEffect(() => {
    const keyToDir: Record<string, Direction> = {
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      audio.unlock();
      if (!saveRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Shift') moveStateRef.current.shiftHeld = true;

      const d = keyToDir[e.key];
      if (d && !activeModal && !battleConfig) {
        e.preventDefault();
        moveStateRef.current.heldDirs.add(d);
        return;
      }

      if ((e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') && !activeModal && !battleConfig) {
        e.preventDefault();
        handleInteract();
        return;
      }

      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        if (activeModal) setActiveModal(null);
        return;
      }

      if (!battleConfig && dialogueQueue.length === 0) {
        if (e.key === 'p' || e.key === 'P') {
          setActiveModal((m) => (m === 'pokenav' ? null : 'pokenav'));
        } else if (e.key === 'b' || e.key === 'B') {
          const cs = saveRef.current;
          if (cs && cs.bag.bicycle && !MAPS[cs.mapId]?.isIndoor && !cs.isSurfing) {
            setSave((prev) => (prev ? { ...prev, isBiking: !prev.isBiking } : prev));
            showToast(cs.isBiking ? 'Bisikletten indin.' : 'Yarış Bisikletine bindin! 🚲');
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') moveStateRef.current.shiftHeld = false;
      const d = keyToDir[e.key];
      if (d) moveStateRef.current.heldDirs.delete(d);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeModal, battleConfig, dialogueQueue.length, handleInteract, showToast]);

  // Clear held keys when modal/battle opens
  useEffect(() => {
    if (activeModal || battleConfig || dialogueQueue.length > 0) {
      moveStateRef.current.heldDirs.clear();
    }
  }, [activeModal, battleConfig, dialogueQueue.length]);

  // Complete a Step & Trigger Warps / Sight / Wild Encounters!
  const finishStep = useCallback(
    (nx: number, ny: number) => {
      const curSave = saveRef.current;
      if (!curSave) return;
      const m = MAPS[curSave.mapId];
      if (!m) return;

      // Check Warp!
      const warp = m.warps.find((wp) => wp.x === nx && wp.y === ny);
      if (warp) {
        const destMap = MAPS[warp.toMap];
        if (destMap) {
          syncPositionImmediate(warp.toX, warp.toY);
          const enteringSafari = warp.toMap === 'safari_zone' && curSave.mapId !== 'safari_zone';
          const nextSave: SaveState = {
            ...curSave,
            mapId: warp.toMap,
            x: warp.toX,
            y: warp.toY,
            dir: warp.toDir || curSave.dir,
            isBiking: destMap.isIndoor ? false : curSave.isBiking,
            isSurfing: destMap.rows[warp.toY]?.[warp.toX] === WATER_TILE,
            visitedMaps: Array.from(new Set([...curSave.visitedMaps, warp.toMap])),
            safariBalls: enteringSafari ? 30 : curSave.safariBalls,
            safariSteps: enteringSafari ? 400 : curSave.safariSteps,
          };
          setSave(nextSave);
          if (enteringSafari) {
            showToast('Safari Bölgesine hoş geldin! 30 Safari Topu verildi!');
          }
          return;
        }
      }

      // Normal Tile Arrival
      let nextRepel = curSave.repelSteps;
      if (nextRepel > 0) {
        nextRepel -= 1;
        if (nextRepel === 0) showToast('Kovucu Sprey etkisi sona erdi!');
      }

      const nextVsCharge = Math.min(60, curSave.vsSeekerCharge + 1);
      const nextSave: SaveState = {
        ...curSave,
        x: nx,
        y: ny,
        repelSteps: nextRepel,
        vsSeekerCharge: nextVsCharge,
      };
      setSave(nextSave);

      // 1. Check Trainer Line of Sight!
      if (checkTrainerSight(nextSave)) return;

      // 2. Check Wild Encounters on 'g' (Tall Grass), 'c' (Cave floor), or '~' (Water)!
      const landedTile = m.rows[ny]?.[nx];
      if (landedTile === 'g' || (m.isCave && landedTile === 'c')) {
        if (m.grassEncounters && Math.random() < 0.13) {
          triggerWildEncounter(m.grassEncounters, nextSave);
        }
      } else if (landedTile === WATER_TILE && m.waterEncounters) {
        if (Math.random() < 0.09) {
          triggerWildEncounter(m.waterEncounters, nextSave);
        }
      }
    },
    [checkTrainerSight, showToast, syncPositionImmediate, triggerWildEncounter]
  );

  // Main 60fps Overworld Canvas Loop
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const curSave = saveRef.current;
      const cvs = canvasRef.current;
      const ms = moveStateRef.current;
      ms.tick += 1;

      if (curSave && cvs && !battleConfig) {
        // Handle Continuous Step Input when Idle
        if (!ms.moving && ms.heldDirs.size > 0 && !activeModal && dialogueQueue.length === 0 && !quizPrompt) {
          const dirs = Array.from(ms.heldDirs);
          const lastDir = dirs[dirs.length - 1];
          attemptStep(lastDir);
        }

        // Advance Smooth Step Interpolation
        if (ms.moving) {
          const isRunning = curSave.settings.autoRun || ms.shiftHeld;
          const baseTilesPerSec = curSave.isBiking ? 9.5 : isRunning ? 6.8 : 4.2;
          const speedMult = curSave.settings.gameSpeed === 3 ? 1.6 : curSave.settings.gameSpeed === 2 ? 1.3 : 1;
          ms.progress += dt * baseTilesPerSec * speedMult;

          if (ms.progress >= 1) {
            ms.renderX = ms.toX;
            ms.renderY = ms.toY;
            ms.followerX = ms.fromX;
            ms.followerY = ms.fromY;
            ms.moving = false;
            ms.progress = 0;
            finishStep(ms.toX, ms.toY);
          } else {
            ms.renderX = ms.fromX + (ms.toX - ms.fromX) * ms.progress;
            ms.renderY = ms.fromY + (ms.toY - ms.fromY) * ms.progress;
          }
        }

        const ctx = cvs.getContext('2d');
        const map = MAPS[curSave.mapId];
        if (ctx && map) {
          renderOverworld({
            ctx,
            canvasWidth: cvs.width,
            canvasHeight: cvs.height,
            map,
            playerX: ms.renderX,
            playerY: ms.renderY,
            playerDir: curSave.dir,
            isMoving: ms.moving,
            isRunning: curSave.settings.autoRun || ms.shiftHeld,
            isBiking: curSave.isBiking,
            isSurfing: curSave.isSurfing,
            followerSpeciesId: curSave.party[0]?.speciesId,
            followerX: ms.followerX,
            followerY: ms.followerY,
            collectedItems: new Set(curSave.collectedGroundItems),
            defeatedTrainers: new Set(curSave.defeatedTrainers),
            flags: curSave.flags,
            weather: map.weather,
            tick: ms.tick,
            alertNpcId: ms.alertNpcId,
          });
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeModal, attemptStep, battleConfig, dialogueQueue.length, finishStep, quizPrompt]);

  // ==================== BATTLE FINISH HANDLER ====================
  const handleBattleFinish = (outcome: BattleOutcome) => {
    const cfg = battleConfig;
    setBattleConfig(null);
    if (!save || !cfg) return;

    const seenSet = new Set([...save.pokedexSeen, ...outcome.seenSpeciesIds]);

    // Handle Emerald Battle Frontier Runs!
    if (frontierRun && (cfg.kind === 'frontier_tower' || cfg.kind === 'frontier_factory')) {
      if (outcome.result === 'win') {
        const isFinalBoss = frontierRun.round >= frontierRun.maxRounds;
        const bpEarned = isFinalBoss ? 25 : 6;
        const newBestTower =
          frontierRun.mode === 'tower'
            ? Math.max(save.towerBestStreak, frontierRun.round)
            : save.towerBestStreak;
        const newBestFactory =
          frontierRun.mode === 'factory'
            ? Math.max(save.factoryBestStreak, frontierRun.round)
            : save.factoryBestStreak;

        setSave((prev) =>
          prev
            ? {
                ...prev,
                battlePoints: prev.battlePoints + bpEarned,
                towerBestStreak: newBestTower,
                factoryBestStreak: newBestFactory,
                totalBattlesWon: prev.totalBattlesWon + 1,
                pokedexSeen: Array.from(seenSet),
              }
            : prev
        );

        if (isFinalBoss) {
          setFrontierRun(null);
          pushDialogue(
            [
              `İNANILMAZ ZAFER! Zümrüt Savaş Sınırı Beynini alt ettin ve +${bpEarned} BP kazandın!`,
              'BP Mağazasından Seçim Bandı, Artıklar veya Usta Topu alabilirsin!',
            ],
            'Zümrüt Savaş Sınırı'
          );
        } else if (frontierRun.mode === 'factory') {
          // Offer Battle Factory Rental Swap before next round!
          setFrontierRun({
            ...frontierRun,
            team: frontierRun.team.map(healPokemonFull),
            lastEnemyTeam: cfg.enemyParty.map(healPokemonFull),
            awaitingSwap: true,
          });
          showToast(`${frontierRun.round}. Tur kazanıldı! +${bpEarned} BP!`);
        } else {
          const nextRound = frontierRun.round + 1;
          const nextFr: FrontierRunState = {
            ...frontierRun,
            round: nextRound,
            team: frontierRun.team.map(healPokemonFull),
          };
          setFrontierRun(nextFr);
          pushDialogue(
            [`Savaş Kulesi ${frontierRun.round}. Maç kazanıldı (+${bpEarned} BP)! Sıradaki rakip geliyor!`],
            'Savaş Kulesi',
            () => launchFrontierMatch(nextFr)
          );
        }
      } else {
        setFrontierRun(null);
        pushDialogue(
          ['Turnuva serin sona erdi! Takımın dinlendirildi, istediğin an tekrar deneyebilirsin.'],
          'Zümrüt Savaş Sınırı'
        );
      }
      return;
    }

    // Standard Kanto / Sevii Adventure Battle Outcome
    if (outcome.result === 'lose') {
      // Black out -> Warp to last Pokemon Center & heal party!
      const spot = save.lastHealSpot;
      syncPositionImmediate(spot.x, spot.y);
      const healed = outcome.updatedParty.map(healPokemonFull);
      const penalty = Math.min(save.money, 250);
      setSave({
        ...save,
        mapId: spot.mapId,
        x: spot.x,
        y: spot.y,
        isSurfing: false,
        party: healed,
        pokeVialCharges: 3,
        bag: outcome.updatedBag,
        money: save.money - penalty,
        pokedexSeen: Array.from(seenSet),
      });
      pushDialogue([
        `Tüm Pokémonların yorgun düştü! Hızla son uğradığın Pokémon Merkezine döndün ve takımın iyileştirildi.`,
      ]);
      return;
    }

    let nextSave: SaveState = {
      ...save,
      party: outcome.updatedParty,
      bag: outcome.updatedBag,
      safariBalls: Math.max(0, save.safariBalls - (outcome.safariBallsUsed || 0)),
      pokedexSeen: Array.from(seenSet),
      totalBattlesWon:
        outcome.result === 'win' || outcome.result === 'caught'
          ? save.totalBattlesWon + 1
          : save.totalBattlesWon,
    };

    const extraMessages: string[] = [];

    if (outcome.result === 'caught' && outcome.caughtPokemon) {
      const added = addPokemonToSave(nextSave, outcome.caughtPokemon);
      nextSave = added.nextSave;
      extraMessages.push(
        `${POKEDEX[outcome.caughtPokemon.speciesId].name} Pokédex'e kaydedildi ve ${added.whereTr}!`
      );
      if (cfg.legendaryFlagToSetOnCatch) {
        nextSave = {
          ...nextSave,
          flags: { ...nextSave.flags, [cfg.legendaryFlagToSetOnCatch]: true },
        };
      }
    }

    if (outcome.result === 'win' && cfg.trainer) {
      const tr = cfg.trainer;
      nextSave.money += tr.rewardMoney;
      extraMessages.push(`Ödül olarak ₽${tr.rewardMoney} kazandın!`);

      if (pendingTrainerFlag && !nextSave.defeatedTrainers.includes(pendingTrainerFlag)) {
        nextSave.defeatedTrainers = [...nextSave.defeatedTrainers, pendingTrainerFlag];
      }

      // Specific Story Flags!
      const nextFlags = { ...nextSave.flags };
      if (tr.id === 'rival_lab') nextFlags.defeated_rival_lab = true;
      if (tr.id === 'rival_cerulean') nextFlags.defeated_rival_cerulean = true;
      if (tr.id === 'rival_lavender') nextFlags.defeated_rival_lavender = true;
      if (tr.id === 'dojo_master') nextFlags.defeated_dojo = true;
      if (tr.id === 'rocket_celadon_boss') {
        nextFlags.defeated_rocket_celadon = true;
        nextSave.bag = {
          ...nextSave.bag,
          'silph-scope': 1,
          'surf-board': 1,
        };
        extraMessages.push(
          'Giovanni kaçarken Silph Dürbünü ve Zümrüt Sörf Tahtasını düşürdü! Artık denizlerde yüzebilirsin!'
        );
      }

      if (tr.badgeId && !nextSave.badges.includes(tr.badgeId)) {
        nextSave.badges = [...nextSave.badges, tr.badgeId];
        nextFlags[`badge_${tr.badgeId}`] = true;
        if (nextSave.badges.length >= 7) {
          nextFlags.has_7_badges = true;
          extraMessages.push(
            '7 Rozete ulaştın! Viridian Şehrindeki gizemli 8. Salonun kapıları artık açık!'
          );
        }
        extraMessages.push(`🏅 TEBRİKLER! ${tr.badgeNameTr} kazandın!`);
      }

      if (tr.tmReward) {
        nextSave.bag = { ...nextSave.bag, [tr.tmReward]: 1 };
        extraMessages.push(`${ITEMS[tr.tmReward]?.nameTr} çantana eklendi!`);
      }

      if (tr.id === 'champion_blue') {
        nextFlags.is_champion = true;
        nextSave.party = nextSave.party.map(healPokemonFull);
        extraMessages.push(
          '👑 ŞAMPİYONLAR SALONUNA ADINI YAZDIRDIN! Artık Kanto & GBA Efsaneler Şampiyonusun! Cerulean Mağarasında Mewtwo uyandı!'
        );
      }

      nextSave.flags = nextFlags;
    }

    setSave(nextSave);
    setPendingTrainerFlag(null);
    if (extraMessages.length > 0) {
      pushDialogue(extraMessages);
    }
  };

  // Launch a Battle Frontier Round
  const launchFrontierMatch = (fr: FrontierRunState) => {
    const isBoss = fr.round >= fr.maxRounds;
    let enemyParty: PokemonInstance[];
    let trainer: TrainerData;

    if (isBoss) {
      trainer = fr.mode === 'tower' ? TRAINERS.frontier_anabel : TRAINERS.frontier_noland;
      enemyParty = trainer.party.map((sp) =>
        createPokemon(sp.speciesId, 50, {
          perfectIvs: true,
          heldItem: sp.heldItem,
          customMoves: sp.moves,
          metLocation: 'Zümrüt Sınırı',
        })
      );
    } else {
      enemyParty = generateBattleFactoryPool().slice(0, 3);
      trainer = {
        id: `frontier_challenger_${fr.round}`,
        nameTr: `Sınır Ustası #${fr.round}`,
        titleTr: fr.mode === 'tower' ? 'Kule Meydan Okuyucusu' : 'Fabrika Stratejisti',
        spriteType: 'gentleman',
        rewardMoney: 0,
        aiTier: 'boss',
        introTr: `${fr.round}. Tur başlıyor! Lv.50 dengesinde en iyi strateji kazansın!`,
        defeatTr: 'Mükemmel bir taktik hamleydi!',
        party: [],
      };
    }

    setBattleConfig({
      kind: fr.mode === 'tower' ? 'frontier_tower' : 'frontier_factory',
      enemyParty,
      trainer,
      weatherInitial: 'clear',
      terrain: 'indigo',
    });
  };

  // ==================== ITEM / PARTY / SHOP CALLBACKS ====================
  const handleUseItemOnParty = (partyIdx: number, itemId: string, replaceMoveIdx?: number): string => {
    if (!save) return '';
    const mon = save.party[partyIdx];
    const it = ITEMS[itemId];
    if (!mon || !it) return 'Geçersiz seçim.';
    const sp = POKEDEX[mon.speciesId];

    // 1. Rare Candy
    if (it.rareCandy) {
      if (mon.level >= 100) return `${sp.name} zaten Seviye 100!`;
      const needed = mon.nextLevelExp - mon.exp;
      const out = grantExpToPokemon(mon, needed);
      let updatedMon = out.updated;
      let msg = `${sp.name} Seviye ${updatedMon.level} oldu!`;
      if (out.evolveToSpeciesId) {
        const evo = evolvePokemonInstance(updatedMon, out.evolveToSpeciesId);
        updatedMon = evo.evolved;
        msg += ` Ve ${POKEDEX[out.evolveToSpeciesId].name} olarak evrimleşti!`;
      }
      audio.playSfx('level_up');
      setSave((prev) => {
        if (!prev) return prev;
        const nextBag = { ...prev.bag, [itemId]: (prev.bag[itemId] || 1) - 1 };
        if (nextBag[itemId] <= 0) delete nextBag[itemId];
        const nextParty = prev.party.map((m, i) => (i === partyIdx ? updatedMon : m));
        const caught = Array.from(new Set([...prev.pokedexCaught, updatedMon.speciesId]));
        const seen = Array.from(new Set([...prev.pokedexSeen, updatedMon.speciesId]));
        return { ...prev, party: nextParty, bag: nextBag, pokedexCaught: caught, pokedexSeen: seen };
      });
      return msg;
    }

    // 2. Evolution Stone / Metal Coat
    if (it.evoStone) {
      const rule = sp.evolutions?.find((e) => e.item === itemId);
      if (!rule) return `${it.nameTr}, ${sp.name} üzerinde etki göstermiyor.`;
      const { evolved } = evolvePokemonInstance(mon, rule.to);
      audio.playSfx('catch_success');
      setSave((prev) => {
        if (!prev) return prev;
        const nextBag = { ...prev.bag, [itemId]: (prev.bag[itemId] || 1) - 1 };
        if (nextBag[itemId] <= 0) delete nextBag[itemId];
        const nextParty = prev.party.map((m, i) => (i === partyIdx ? evolved : m));
        return {
          ...prev,
          party: nextParty,
          bag: nextBag,
          pokedexCaught: Array.from(new Set([...prev.pokedexCaught, rule.to])),
          pokedexSeen: Array.from(new Set([...prev.pokedexSeen, rule.to])),
        };
      });
      return `Tebrikler! ${sp.name}, ${POKEDEX[rule.to].name} olarak evrimleşti!`;
    }

    // 3. Reusable TM!
    if (it.tmMoveId) {
      const md = MOVES[it.tmMoveId];
      if (!md) return 'Hamle bulunamadı.';
      if (mon.moves.some((m) => m.moveId === md.id)) {
        return `${sp.name} zaten ${md.nameTr} biliyor!`;
      }
      let nextMoves = [...mon.moves];
      if (nextMoves.length < 4) {
        nextMoves.push({ moveId: md.id, pp: md.pp, maxPp: md.pp });
      } else if (replaceMoveIdx !== undefined) {
        nextMoves = nextMoves.map((sl, idx) =>
          idx === replaceMoveIdx ? { moveId: md.id, pp: md.pp, maxPp: md.pp } : sl
        );
      } else {
        return '4 hamle dolu!';
      }
      audio.playSfx('level_up');
      setSave((prev) =>
        prev
          ? {
              ...prev,
              party: prev.party.map((m, i) => (i === partyIdx ? { ...m, moves: nextMoves } : m)),
            }
          : prev
      );
      return `${sp.name}, ${md.nameTr} hamlesini öğrendi!`;
    }

    // 4. Healing / Revive Medicine
    if (it.revivePercent) {
      if (mon.currentHp > 0) return `${sp.name} baygın değil!`;
      const newHp = Math.max(1, Math.floor((mon.maxHp * it.revivePercent) / 100));
      audio.playSfx('heal');
      setSave((prev) => {
        if (!prev) return prev;
        const nextBag = { ...prev.bag, [itemId]: (prev.bag[itemId] || 1) - 1 };
        if (nextBag[itemId] <= 0) delete nextBag[itemId];
        return {
          ...prev,
          bag: nextBag,
          party: prev.party.map((m, i) =>
            i === partyIdx ? { ...m, currentHp: newHp, status: 'none' } : m
          ),
        };
      });
      return `${sp.name} canlandırıldı!`;
    }

    if (it.healHp || it.healStatus) {
      if (mon.currentHp <= 0) return 'Baygın Pokémona önce Canlandırıcı vermelisin.';
      const needHp = it.healHp && mon.currentHp < mon.maxHp;
      const needSt = it.healStatus && mon.status !== 'none';
      if (!needHp && !needSt) return `${sp.name} zaten tam sağlıklı!`;

      const nextHp = it.healHp
        ? it.healHp >= 9999
          ? mon.maxHp
          : Math.min(mon.maxHp, mon.currentHp + it.healHp)
        : mon.currentHp;
      const nextSt =
        it.healStatus === 'all' ||
        it.healStatus === mon.status ||
        (it.healStatus === 'psn' && mon.status === 'tox')
          ? 'none'
          : mon.status;

      audio.playSfx('heal');
      setSave((prev) => {
        if (!prev) return prev;
        const nextBag = { ...prev.bag, [itemId]: (prev.bag[itemId] || 1) - 1 };
        if (nextBag[itemId] <= 0) delete nextBag[itemId];
        return {
          ...prev,
          bag: nextBag,
          party: prev.party.map((m, i) =>
            i === partyIdx ? { ...m, currentHp: nextHp, status: nextSt, sleepTurns: 0 } : m
          ),
        };
      });
      return `${sp.name} iyileştirildi!`;
    }

    return 'Eşya kullanılamadı.';
  };

  // ==================== TITLE SCREEN IF NO ACTIVE SESSION ====================
  if (!save) {
    return (
      <TitleScreen
        existingSave={existingSave}
        onContinue={() => {
          audio.unlock();
          if (existingSave) {
            syncPositionImmediate(existingSave.x, existingSave.y);
            setSave(existingSave);
          }
        }}
        onStartNew={(pName: string, rName: string, diff: DifficultyMode, nuz: boolean) => {
          audio.unlock();
          const fresh = createNewSaveState(pName, rName, diff, nuz);
          syncPositionImmediate(fresh.x, fresh.y);
          setSave(fresh);
          pushDialogue(
            [
              `POKÉMON KIZIL ZÜMRÜT dünyasına hoş geldin ${fresh.playerName}!`,
              `Kanto'nun klasik macerası; Hoenn'in Zümrüt Savaş Sınırı, Yetenekler, Doğalar, PokéNav, Safari ve Kurtarma Loncasıyla tek bir dev GBA deneyiminde birleşti!`,
              `Önce evinden çıkıp güneydoğudaki mavi çatılı Prof. Oak Laboratuvarına uğrayarak 9 başlangıç Pokémonundan birini seç!`,
            ],
            'Prof. Oak'
          );
        }}
        onImportSave={(imported) => {
          audio.unlock();
          syncPositionImmediate(imported.x, imported.y);
          setSave(imported);
        }}
      />
    );
  }

  const curMap = MAPS[save.mapId] || MAPS.pallet_town;
  const readyQuestCount = RESCUE_QUESTS.filter(
    (q) => !save.completedQuests.includes(q.id) && isQuestReadyToClaim(q, save).ready
  ).length;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* TOP GBA HUD BAR */}
      <header className="px-2.5 sm:px-4 py-2 bg-slate-900 border-b-2 border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Location & Badges */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-emerald-600 text-white font-black text-xs tracking-wide shrink-0">
            GBA
          </div>
          <div className="min-w-0">
            <div className="font-black text-xs sm:text-sm text-white truncate">
              {curMap.nameTr}
            </div>
            <div className="text-[10px] text-slate-400 truncate hidden sm:block">
              {curMap.subtitleTr}
            </div>
          </div>
        </div>

        {/* Center Quick Party Status Strip */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          {save.party.length === 0 ? (
            <span className="text-[11px] text-amber-300 font-semibold px-2">
              Prof. Oak&apos;tan ilk Pokémonunu seç!
            </span>
          ) : (
            save.party.map((m) => (
              <button
                key={m.uid}
                onClick={() => setActiveModal('party')}
                title={`${POKEDEX[m.speciesId].name} Lv.${m.level} (${m.currentHp}/${m.maxHp})`}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800"
              >
                <img src={`/sprites/icons/${m.speciesId}.png`} alt="" className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-[10px] font-bold text-white leading-none">L{m.level}</div>
                  <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full ${
                        m.currentHp / m.maxHp > 0.5
                          ? 'bg-emerald-400'
                          : m.currentHp > 0
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(m.currentHp / m.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right GBA Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-black text-xs">
            ₽{save.money.toLocaleString('tr-TR')}
          </span>
          <span
            onClick={() => {
              setActiveModal('pokenav');
            }}
            className="cursor-pointer px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-black text-xs flex items-center gap-1"
            title="Kazanılan Salon Rozetleri"
          >
            <Award className="w-3.5 h-3.5" />
            {save.badges.length}/8
          </span>

          <button
            onClick={() => setActiveModal('party')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Takım &amp; PC</span>
          </button>

          {save.party.length > 0 && (
            <button
              onClick={() => {
                const charges = save.pokeVialCharges ?? 3;
                if (charges <= 0) {
                  showToast('Poké Matara boş (0/3)! Herhangi bir Hemşire Joy ile konuşarak doldur.');
                  return;
                }
                audio.playSfx('heal');
                setSave((p) =>
                  p
                    ? {
                        ...p,
                        party: p.party.map(healPokemonFull),
                        pokeVialCharges: (p.pokeVialCharges ?? 3) - 1,
                      }
                    : p
                );
                showToast(`Poké Matara kullanıldı! Tüm takım iyileşti (${charges - 1}/3 kaldı). 🧪`);
              }}
              className="px-2 py-1.5 rounded-lg bg-pink-700 hover:bg-pink-600 text-white font-bold text-xs flex items-center gap-1"
              title="Taşınabilir Poké Matara (Radical Red / Inclement Emerald QoL — Hemşire Joy'da dolar)"
            >
              <span>🧪</span>
              <span className="hidden xl:inline">Matara</span>
              <span>{save.pokeVialCharges ?? 3}/3</span>
            </button>
          )}

          <button
            onClick={() => setActiveModal('bag')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1"
          >
            <Backpack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çanta</span>
          </button>

          <button
            onClick={() => setActiveModal('pokenav')}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PokéNav</span>
          </button>

          <button
            onClick={() => setActiveModal('pokedex')}
            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pokédex</span>
          </button>

          <button
            onClick={() => setActiveModal('rescue')}
            className="relative px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Görevler</span>
            {readyQuestCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {readyQuestCount}
              </span>
            )}
          </button>

          {save.bag.bicycle && !curMap.isIndoor && !save.isSurfing && (
            <button
              onClick={() =>
                setSave((p) => (p ? { ...p, isBiking: !p.isBiking } : p))
              }
              className={`p-1.5 rounded-lg border text-xs font-bold ${
                save.isBiking
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Bisiklet (B)"
            >
              <Bike className="w-4 h-4" />
            </button>
          )}

          {/* GBA Emulator Speed Toggle 1x / 2x / 3x */}
          <button
            onClick={() => {
              const nextSpd = save.settings.gameSpeed === 1 ? 2 : save.settings.gameSpeed === 2 ? 3 : 1;
              setSave((p) =>
                p ? { ...p, settings: { ...p.settings, gameSpeed: nextSpd } } : p
              );
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-black text-xs flex items-center gap-1"
            title="GBA Turbo Hız Seçici"
          >
            <FastForward className="w-3.5 h-3.5" />
            {save.settings.gameSpeed}x
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() =>
              setSave((p) =>
                p
                  ? {
                      ...p,
                      settings: { ...p.settings, soundEnabled: !p.settings.soundEnabled },
                    }
                  : p
              )
            }
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Ses Aç/Kapat"
          >
            {save.settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Save & Export JSON */}
          <button
            onClick={() => {
              writeSaveToStorage(save);
              showToast('Oyun başarıyla kaydedildi! 💾');
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300"
            title="Hızlı Kaydet"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(save, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pokemon-kizil-zumrut-${save.playerName}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300"
            title="Kayıt Dosyasını İndir (.json)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN GBA VIEWPORT STAGE */}
      <main className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden p-2">
        <div className="relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
          <canvas
            ref={canvasRef}
            width={768}
            height={512}
            onClick={() => audio.unlock()}
            className="w-[96vw] max-w-[840px] aspect-[3/2] bg-slate-950 block"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Repel / Safari / Champion HUD Pills inside Viewport */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
            {save.repelSteps > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/50 text-[11px] font-bold text-cyan-300">
                🛡️ Kovucu: {save.repelSteps} adım
              </span>
            )}
            {save.mapId === 'safari_zone' && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-[11px] font-black text-emerald-300">
                🎯 Safari Topu: {save.safariBalls}
              </span>
            )}
            {save.flags.is_champion && (
              <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-[11px] font-black text-amber-300">
                👑 Kanto &amp; GBA Şampiyonu
              </span>
            )}
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-amber-400 text-amber-200 text-xs font-bold shadow-lg">
              {toast}
            </div>
          )}

          {/* GBA DIALOGUE BOX OVERLAY */}
          {dialogueQueue.length > 0 && (
            <div
              onClick={advanceDialogue}
              className="absolute bottom-3 left-3 right-3 bg-amber-50/95 border-4 border-slate-800 rounded-2xl p-3.5 sm:p-4 text-slate-900 shadow-2xl cursor-pointer z-20"
            >
              {dialogueQueue[0].speaker && (
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-300 text-xs font-black mb-1">
                  {dialogueQueue[0].speaker}
                </div>
              )}
              <p className="text-sm sm:text-base font-bold leading-snug">
                {dialogueQueue[0].text}
              </p>
              <div className="text-right text-[11px] font-black text-red-600 mt-1 animate-bounce">
                ▼ Devam (Z / Tıkla)
              </div>
            </div>
          )}
        </div>

        {/* ON-SCREEN TOUCH / MOUSE GBA CONTROLS (Great for Mobile & Quick Click Play!) */}
        <div className="fixed bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none z-10 md:px-4">
          {/* D-Pad */}
          <div className="pointer-events-auto grid grid-cols-3 gap-1 w-28 h-28 opacity-80 hover:opacity-100 transition">
            <div />
            <button
              onMouseDown={() => moveStateRef.current.heldDirs.add('up')}
              onMouseUp={() => moveStateRef.current.heldDirs.delete('up')}
              onMouseLeave={() => moveStateRef.current.heldDirs.delete('up')}
              onTouchStart={(e) => {
                e.preventDefault();
                moveStateRef.current.heldDirs.add('up');
              }}
              onTouchEnd={() => moveStateRef.current.heldDirs.delete('up')}
              className="rounded-lg bg-slate-800/90 active:bg-amber-400 active:text-slate-950 border border-slate-600 font-black text-sm flex items-center justify-center"
            >
              ▲
            </button>
            <div />
            <button
              onMouseDown={() => moveStateRef.current.heldDirs.add('left')}
              onMouseUp={() => moveStateRef.current.heldDirs.delete('left')}
              onMouseLeave={() => moveStateRef.current.heldDirs.delete('left')}
              onTouchStart={(e) => {
                e.preventDefault();
                moveStateRef.current.heldDirs.add('left');
              }}
              onTouchEnd={() => moveStateRef.current.heldDirs.delete('left')}
              className="rounded-lg bg-slate-800/90 active:bg-amber-400 active:text-slate-950 border border-slate-600 font-black text-sm flex items-center justify-center"
            >
              ◀
            </button>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700" />
            <button
              onMouseDown={() => moveStateRef.current.heldDirs.add('right')}
              onMouseUp={() => moveStateRef.current.heldDirs.delete('right')}
              onMouseLeave={() => moveStateRef.current.heldDirs.delete('right')}
              onTouchStart={(e) => {
                e.preventDefault();
                moveStateRef.current.heldDirs.add('right');
              }}
              onTouchEnd={() => moveStateRef.current.heldDirs.delete('right')}
              className="rounded-lg bg-slate-800/90 active:bg-amber-400 active:text-slate-950 border border-slate-600 font-black text-sm flex items-center justify-center"
            >
              ▶
            </button>
            <div />
            <button
              onMouseDown={() => moveStateRef.current.heldDirs.add('down')}
              onMouseUp={() => moveStateRef.current.heldDirs.delete('down')}
              onMouseLeave={() => moveStateRef.current.heldDirs.delete('down')}
              onTouchStart={(e) => {
                e.preventDefault();
                moveStateRef.current.heldDirs.add('down');
              }}
              onTouchEnd={() => moveStateRef.current.heldDirs.delete('down')}
              className="rounded-lg bg-slate-800/90 active:bg-amber-400 active:text-slate-950 border border-slate-600 font-black text-sm flex items-center justify-center"
            >
              ▼
            </button>
            <div />
          </div>

          {/* GBA A & B Buttons */}
          <div className="pointer-events-auto flex items-center gap-2.5 opacity-85 hover:opacity-100 transition">
            <button
              onClick={() => setActiveModal('pokenav')}
              className="w-12 h-12 rounded-full bg-sky-700/90 active:scale-95 border-2 border-sky-400 text-white font-black text-xs shadow-lg"
              title="PokéNav (P)"
            >
              NAV
            </button>
            <button
              onClick={handleInteract}
              className="w-14 h-14 rounded-full bg-red-600/95 active:scale-95 border-2 border-red-300 text-white font-black text-lg shadow-lg"
              title="Etkileşim / Konuş (Z / Enter)"
            >
              A
            </button>
          </div>
        </div>
      </main>

      {/* ==================== MODALS & SPECIAL SCREENS ==================== */}

      {/* 1. Starter Selection Lab */}
      {activeModal === 'starter_lab' && (
        <StarterLabModal
          onClose={() => setActiveModal(null)}
          onSelectStarter={(speciesId) => {
            audio.playSfx('catch_success');
            const starter = createPokemon(speciesId, 5, {
              isStarter: true,
              heldItem: 'oran-berry',
              metLocation: 'Prof. Oak Laboratuvarı',
            });
            setActiveModal(null);
            setSave((prev) =>
              prev
                ? {
                    ...prev,
                    starterSpeciesId: speciesId,
                    party: [starter],
                    flags: { ...prev.flags, has_starter: true },
                    pokedexSeen: [speciesId],
                    pokedexCaught: [speciesId],
                  }
                : prev
            );
            pushDialogue(
              [
                `Muhteşem seçim! ${POKEDEX[speciesId].name} artık senin en sadık yol arkadaşın ve haritada seni takip edecek!`,
                `Rakibin ${save.rivalName} da hemen karşı avantajlı Pokémonu aldı! Çıkmadan önce onunla ilk maçını yapabilirsin!`,
              ],
              'Prof. Oak'
            );
          }}
        />
      )}

      {/* 2. Party & Portable PC Box */}
      {activeModal === 'party' && (
        <PartyAndBoxModal
          party={save.party}
          pcBox={save.pcBox}
          bag={save.bag}
          onClose={() => setActiveModal(null)}
          onMakeLead={(idx) => {
            setSave((prev) => {
              if (!prev) return prev;
              const copy = [...prev.party];
              const [chosen] = copy.splice(idx, 1);
              copy.unshift(chosen);
              return { ...prev, party: copy };
            });
          }}
          onEquipItem={(partyIdx, itemId) => {
            setSave((prev) => {
              if (!prev) return prev;
              const mon = prev.party[partyIdx];
              if (!mon) return prev;
              const nextBag = { ...prev.bag };
              // Return old item
              if (mon.heldItem) {
                nextBag[mon.heldItem] = (nextBag[mon.heldItem] || 0) + 1;
              }
              if (itemId) {
                nextBag[itemId] = (nextBag[itemId] || 1) - 1;
                if (nextBag[itemId] <= 0) delete nextBag[itemId];
              }
              return {
                ...prev,
                bag: nextBag,
                party: prev.party.map((m, i) => (i === partyIdx ? { ...m, heldItem: itemId } : m)),
              };
            });
          }}
          onUseItemOnParty={handleUseItemOnParty}
          onDepositToBox={(partyIdx) => {
            setSave((prev) => {
              if (!prev || prev.party.length <= 1) return prev;
              const mon = prev.party[partyIdx];
              return {
                ...prev,
                party: prev.party.filter((_, i) => i !== partyIdx),
                pcBox: [...prev.pcBox, healPokemonFull(mon)],
              };
            });
          }}
          onWithdrawFromBox={(boxIdx) => {
            setSave((prev) => {
              if (!prev || prev.party.length >= 6) return prev;
              const mon = prev.pcBox[boxIdx];
              return {
                ...prev,
                party: [...prev.party, mon],
                pcBox: prev.pcBox.filter((_, i) => i !== boxIdx),
              };
            });
          }}
        />
      )}

      {/* 3. Bag & Shops */}
      {(activeModal === 'bag' ||
        activeModal === 'mart' ||
        activeModal === 'stone_mart' ||
        activeModal === 'tm_mart' ||
        activeModal === 'bp_mart') && (
        <BagAndMartModal
          mode={activeModal}
          bag={save.bag}
          money={save.money}
          battlePoints={save.battlePoints}
          party={save.party}
          onClose={() => setActiveModal(null)}
          onBuyItem={(itemId, count, useBp) => {
            const it = ITEMS[itemId];
            if (!it) return 'Eşya bulunamadı.';
            const unitCost = useBp ? it.bpPrice || 10 : it.price;
            const totalCost = unitCost * count;
            if (useBp) {
              if (save.battlePoints < totalCost) return 'Yeterli BP (Savaş Puanı) yok!';
              audio.playSfx('select');
              setSave((p) =>
                p
                  ? {
                      ...p,
                      battlePoints: p.battlePoints - totalCost,
                      bag: { ...p.bag, [itemId]: (p.bag[itemId] || 0) + count },
                    }
                  : p
              );
              return `${it.nameTr} x${count} satın alındı!`;
            } else {
              if (save.money < totalCost) return 'Yeterli paran yok!';
              audio.playSfx('select');
              setSave((p) =>
                p
                  ? {
                      ...p,
                      money: p.money - totalCost,
                      bag: { ...p.bag, [itemId]: (p.bag[itemId] || 0) + count },
                    }
                  : p
              );
              return `${it.nameTr} x${count} satın alındı!`;
            }
          }}
          onUseBagItem={(itemId, partyIdx) => {
            const it = ITEMS[itemId];
            if (it?.repelSteps) {
              setSave((p) => {
                if (!p) return p;
                const nextBag = { ...p.bag, [itemId]: (p.bag[itemId] || 1) - 1 };
                if (nextBag[itemId] <= 0) delete nextBag[itemId];
                return { ...p, bag: nextBag, repelSteps: it.repelSteps! };
              });
              return `${it.nameTr} sıkıldı! ${it.repelSteps} adım koruma aktif.`;
            }
            if (partyIdx !== undefined) {
              return handleUseItemOnParty(partyIdx, itemId);
            }
            return '';
          }}
        />
      )}

      {/* 4. Emerald PokéNav & DexNav */}
      {activeModal === 'pokenav' && (
        <PokeNavModal
          currentMapId={save.mapId}
          visitedMaps={save.visitedMaps}
          badges={save.badges}
          pokedexSeen={save.pokedexSeen}
          pokedexCaught={save.pokedexCaught}
          vsSeekerCharge={save.vsSeekerCharge}
          hasParty={save.party.length > 0}
          onClose={() => setActiveModal(null)}
          onFlyToMap={(destMapId) => {
            const dm = MAPS[destMapId];
            if (!dm || !dm.flySpot) return;
            audio.playSfx('ball_throw');
            setActiveModal(null);
            syncPositionImmediate(dm.flySpot.x, dm.flySpot.y);
            setSave((p) =>
              p
                ? {
                    ...p,
                    mapId: destMapId,
                    x: dm.flySpot!.x,
                    y: dm.flySpot!.y,
                    dir: 'down',
                    isSurfing: false,
                  }
                : p
            );
            showToast(`${dm.nameTr} bölgesine uçtun! 🦅`);
          }}
          onTriggerDexNavEncounter={(speciesId) => {
            const pool = [
              ...(curMap.grassEncounters || []),
              ...(curMap.waterEncounters || []),
              ...(curMap.fishEncounters || []),
            ];
            setActiveModal(null);
            triggerWildEncounter(pool, save, { dexNavSpeciesId: speciesId });
          }}
          onActivateVsSeeker={() => {
            const routeTrainerIds = curMap.npcs
              .filter((n) => n.role === 'trainer' && n.trainerId && !n.trainerId.startsWith('rival_'))
              .map((n) => n.trainerId!);
            if (routeTrainerIds.length === 0) {
              return 'Bu haritada rövanş yapılabilecek rota eğitmeni bulunmuyor.';
            }
            setSave((p) =>
              p
                ? {
                    ...p,
                    vsSeekerCharge: 0,
                    defeatedTrainers: p.defeatedTrainers.filter(
                      (id) => !routeTrainerIds.includes(id)
                    ),
                  }
                : p
            );
            audio.playSfx('level_up');
            return `${curMap.nameTr} üzerindeki eğitmenler rövanş savaşına hazır!`;
          }}
        />
      )}

      {/* 5. National GBA Pokédex */}
      {activeModal === 'pokedex' && (
        <PokedexModal
          seenIds={save.pokedexSeen}
          caughtIds={save.pokedexCaught}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 6. Mystery Dungeon Rescue Guild Board */}
      {activeModal === 'rescue' && (
        <RescueBoardModal
          save={save}
          onClose={() => setActiveModal(null)}
          onClaimQuest={(q: RescueQuest) => {
            audio.playSfx('catch_success');
            setSave((prev) => {
              if (!prev || prev.completedQuests.includes(q.id)) return prev;
              return {
                ...prev,
                money: prev.money + q.rewardMoney,
                rescuePoints: prev.rescuePoints + q.rewardRescuePts,
                completedQuests: [...prev.completedQuests, q.id],
                bag: {
                  ...prev.bag,
                  [q.rewardItem.itemId]:
                    (prev.bag[q.rewardItem.itemId] || 0) + q.rewardItem.count,
                },
              };
            });
            showToast(`${q.titleTr} ödülü tahsil edildi!`);
          }}
        />
      )}

      {/* 7. Ruby & Sapphire Pinball Arcade */}
      {activeModal === 'pinball' && (
        <PinballModal
          coins={save.coins}
          onClose={() => setActiveModal(null)}
          onAddCoins={(amt) =>
            setSave((p) => (p ? { ...p, coins: p.coins + amt } : p))
          }
          onRedeemPokemon={(speciesId, level, cost) => {
            if (save.coins < cost) return 'Yeterli Jeton yok!';
            audio.playSfx('catch_success');
            const prizeMon = createPokemon(speciesId, level, {
              dexNavBoost: true,
              metLocation: 'Celadon Oyun Salonu',
            });
            setSave((prev) => {
              if (!prev) return prev;
              const { nextSave } = addPokemonToSave(prev, prizeMon);
              return { ...nextSave, coins: nextSave.coins - cost };
            });
            return `Tebrikler! Lv.${level} ${POKEDEX[speciesId].name} kazandın!`;
          }}
        />
      )}

      {/* 8. Emerald Battle Frontier (Tower & Factory) */}
      {(activeModal === 'frontier_tower' || activeModal === 'frontier_factory') && (
        <BattleFrontierModal
          mode={activeModal === 'frontier_tower' ? 'tower' : 'factory'}
          playerParty={save.party}
          towerBestStreak={save.towerBestStreak}
          factoryBestStreak={save.factoryBestStreak}
          battlePoints={save.battlePoints}
          onClose={() => setActiveModal(null)}
          onStartTowerRun={() => {
            const scaled = save.party.slice(0, 3).map(scalePokemonToLevel50);
            const fr: FrontierRunState = {
              mode: 'tower',
              round: 1,
              maxRounds: 5,
              team: scaled,
            };
            setActiveModal(null);
            setFrontierRun(fr);
            launchFrontierMatch(fr);
          }}
          onStartFactoryRun={(chosenThree) => {
            const fr: FrontierRunState = {
              mode: 'factory',
              round: 1,
              maxRounds: 4,
              team: chosenThree,
            };
            setActiveModal(null);
            setFrontierRun(fr);
            launchFrontierMatch(fr);
          }}
        />
      )}

      {/* Battle Factory Inter-Round Rental Swap Modal! */}
      {frontierRun?.awaitingSwap && frontierRun.lastEnemyTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-400 rounded-2xl max-w-2xl w-full p-5 space-y-4">
            <h3 className="text-lg font-black text-cyan-300">
              Savaş Fabrikası Takas Fırsatı! (Tur {frontierRun.round}/{frontierRun.maxRounds})
            </h3>
            <p className="text-xs text-slate-300">
              İstersen az önce yendiğin rakibin 1 Pokémonunu kendi kiralık takımındaki 1. Pokémon ile takas edebilir veya mevcut takımınla sıradaki maça geçebilirsin!
            </p>
            <div className="grid grid-cols-3 gap-2">
              {frontierRun.lastEnemyTeam.map((em) => (
                <button
                  key={em.uid}
                  onClick={() => {
                    const nextTeam = [em, ...frontierRun.team.slice(1)];
                    const nextFr: FrontierRunState = {
                      ...frontierRun,
                      round: frontierRun.round + 1,
                      team: nextTeam,
                      awaitingSwap: false,
                    };
                    setFrontierRun(nextFr);
                    launchFrontierMatch(nextFr);
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-400 text-center"
                >
                  <img
                    src={`/sprites/front/${em.speciesId}.png`}
                    alt=""
                    className="w-14 h-14 mx-auto"
                  />
                  <div className="font-bold text-xs text-white mt-1">
                    {POKEDEX[em.speciesId].name} Al
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const nextFr: FrontierRunState = {
                  ...frontierRun,
                  round: frontierRun.round + 1,
                  awaitingSwap: false,
                };
                setFrontierRun(nextFr);
                launchFrontierMatch(nextFr);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm"
            >
              Takas Yapmadan {frontierRun.round + 1}. Tura İlerle →
            </button>
          </div>
        </div>
      )}

      {/* 9. Seagallop Ferry Selector (Vermilion <-> Cinnabar <-> Sevii & Battle Frontier) */}
      {activeModal === 'ferry' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-sky-400 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-lg font-black text-sky-300">
              ⚓ Seagallop Hızlı Feribot Limanı
            </h3>
            <p className="text-xs text-slate-300">
              Kaptan Seagallop: &quot;Hangi limana yelken açalım eğitmen?&quot;
            </p>
            {[
              { id: 'vermilion_city', x: 18, y: 11, label: 'Vermilion Limanı (Kanto Anakara)' },
              { id: 'cinnabar_island', x: 14, y: 11, label: 'Cinnabar Volkan Adası (7. Salon & Lab)' },
              {
                id: 'sevii_frontier',
                x: 12,
                y: 13,
                label: 'Sevii & Zümrüt Savaş Sınırı (Battle Tower, Factory & Efsaneler!)',
              },
            ].map((dest) => (
              <button
                key={dest.id}
                disabled={save.mapId === dest.id}
                onClick={() => {
                  audio.playSfx('select');
                  setActiveModal(null);
                  syncPositionImmediate(dest.x, dest.y);
                  setSave((p) =>
                    p
                      ? {
                          ...p,
                          mapId: dest.id,
                          x: dest.x,
                          y: dest.y,
                          dir: 'up',
                          isSurfing: false,
                          visitedMaps: Array.from(new Set([...p.visitedMaps, dest.id])),
                        }
                      : p
                  );
                  showToast(`${dest.label.split(' (')[0]} iskelesine ulaştın! ⛴️`);
                }}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-sky-950/60 disabled:opacity-40 border border-slate-800 hover:border-sky-400 text-left font-bold text-xs text-white"
              >
                {dest.label} {save.mapId === dest.id ? '(Buradasın)' : '→'}
              </button>
            ))}
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* 10. Fossil Revival Lab Modal */}
      {activeModal === 'fossil' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-lg font-black text-amber-300">
              🧬 Antik Fosil Canlandırma Makinesi
            </h3>
            <p className="text-xs text-slate-300">
              Çantandaki antik fosilleri anında Seviye 25 Pokémon olarak hayata döndürebilirsin!
            </p>
            {(
              [
                ['helix-fossil', 138, 'Heliks Fosili → Omanyte (Lv.25)'],
                ['dome-fossil', 140, 'Kubbe Fosili → Kabuto (Lv.25)'],
                ['old-amber', 142, 'Kadim Kehribar → Aerodactyl (Lv.25)'],
              ] as const
            ).map(([fid, sid, label]) => {
              const hasIt = (save.bag[fid] || 0) > 0;
              return (
                <button
                  key={fid}
                  disabled={!hasIt}
                  onClick={() => {
                    audio.playSfx('catch_success');
                    const revived = createPokemon(sid, 25, {
                      dexNavBoost: true,
                      metLocation: 'Fosil Laboratuvarı',
                    });
                    setSave((prev) => {
                      if (!prev) return prev;
                      const nextBag = { ...prev.bag };
                      delete nextBag[fid];
                      const { nextSave } = addPokemonToSave({ ...prev, bag: nextBag }, revived);
                      return nextSave;
                    });
                    setActiveModal(null);
                    showToast(`${POKEDEX[sid].name} başarıyla canlandırıldı! 🦖`);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-950 hover:bg-amber-950/50 disabled:opacity-40 border border-slate-800 flex items-center gap-3 text-left"
                >
                  <img src={`/sprites/icons/${sid}.png`} alt="" className="w-8 h-8" />
                  <span className="text-xs font-bold text-white">
                    {label} {hasIt ? '(Canlandır!)' : '(Yok)'}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* 11. Bay Fuji GBA Nature Mint Customizer */}
      {activeModal === 'nature_guru' && save.party[0] && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-400 rounded-2xl max-w-lg w-full p-5 space-y-3 max-h-[88vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-black text-purple-300">
              🌿 Bay Fuji — GBA Doğa (Nature) Nane Ustası
            </h3>
            <p className="text-xs text-slate-300">
              Lider Pokémonun <strong>{POKEDEX[save.party[0].speciesId].name}</strong> için en uygun Doğayı ücretsiz seç:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {NATURE_LIST.filter((n) =>
                ['adamant', 'modest', 'jolly', 'timid', 'bold', 'calm', 'impish', 'careful', 'brave', 'quiet', 'hardy'].includes(n.id)
              ).map((nat) => (
                <button
                  key={nat.id}
                  onClick={() => {
                    audio.playSfx('heal');
                    setSave((prev) => {
                      if (!prev || !prev.party[0]) return prev;
                      const updatedLead = recalculatePokemonStats({
                        ...prev.party[0],
                        nature: nat.id,
                      });
                      return {
                        ...prev,
                        party: [updatedLead, ...prev.party.slice(1)],
                      };
                    });
                    setActiveModal(null);
                    showToast(`Lider Pokémonun doğası ${nat.nameTr} olarak güncellendi!`);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-400 text-left text-xs font-bold text-white"
                >
                  {nat.nameTr}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* 12. Blaine's Cinnabar Gym Quiz Gate */}
      {quizPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-400 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-base font-black text-red-300">
              🔥 Cinnabar Salonu Bilgi Yarışması!
            </h3>
            <p className="text-xs sm:text-sm text-white font-semibold">{quizPrompt.questionTr}</p>
            <div className="space-y-2">
              {quizPrompt.options.map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => {
                    const q = quizPrompt;
                    setQuizPrompt(null);
                    if (idx === q.answerIdx) {
                      audio.playSfx('catch_success');
                      setSave((p) =>
                        p ? { ...p, flags: { ...p.flags, [q.flag]: true } } : p
                      );
                      pushDialogue(
                        ['DİNG-DİNG! Doğru cevap! Salon Lideri Blaine ile karşılaşma kapısı açıldı!'],
                        'Bilgi Makinesi'
                      );
                    } else {
                      audio.playSfx('bump');
                      pushDialogue(
                        ['BZZZT! Yanlış cevap! Tekrar deneyip doğru yeteneği bul!'],
                        'Bilgi Makinesi'
                      );
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/60 border border-slate-700 text-left text-xs font-bold text-slate-100"
                >
                  {idx + 1}. {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 13. ACTIVE GBA BATTLE VIEW */}
      {battleConfig && (
        <BattleView
          config={battleConfig}
          playerParty={frontierRun ? frontierRun.team : save.party}
          bag={save.bag}
          pokedexCaught={save.pokedexCaught}
          safariBalls={save.safariBalls}
          gameSpeed={save.settings.gameSpeed}
          expShareAll={save.settings.expShareAll}
          nuzlocke={save.settings.nuzlocke}
          onFinish={handleBattleFinish}
        />
      )}
    </div>
  );
}
