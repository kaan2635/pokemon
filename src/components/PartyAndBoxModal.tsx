import React, { useState } from 'react';
import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { POKEDEX } from '../data/pokedex';
import {
  ABILITIES,
  NATURES,
  STAT_NAMES_TR,
  TYPE_COLORS,
  TYPE_NAMES_TR,
} from '../data/typesAndNatures';
import { PokemonInstance, StatKey } from '../types/game';
import { ArrowUpCircle, Box, Sparkles, X, Shield } from 'lucide-react';

interface PartyAndBoxModalProps {
  party: PokemonInstance[];
  pcBox: PokemonInstance[];
  bag: Record<string, number>;
  onMakeLead: (idx: number) => void;
  onEquipItem: (partyIdx: number, itemId: string | undefined) => void;
  onUseItemOnParty: (partyIdx: number, itemId: string, replaceMoveIdx?: number) => string;
  onDepositToBox: (partyIdx: number) => void;
  onWithdrawFromBox: (boxIdx: number) => void;
  onReleaseBoxMon?: (boxIdx: number) => void;
  onClose: () => void;
}

export const PartyAndBoxModal: React.FC<PartyAndBoxModalProps> = ({
  party,
  pcBox,
  bag,
  onMakeLead,
  onEquipItem,
  onUseItemOnParty,
  onDepositToBox,
  onWithdrawFromBox,
  onClose,
}) => {
  const [tab, setTab] = useState<'party' | 'box'>('party');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [tmPickMove, setTmPickMove] = useState<{ itemId: string } | null>(null);

  const selectedMon = party[selectedIdx] || party[0];
  const selectedSp = selectedMon ? POKEDEX[selectedMon.speciesId] : null;
  const natureDef = selectedMon ? NATURES[selectedMon.nature] : null;

  const heldCandidates = Object.entries(bag).filter(
    ([id, cnt]) => cnt > 0 && ITEMS[id]?.category === 'held_berry'
  );
  const usableItems = Object.entries(bag).filter(
    ([id, cnt]) => cnt > 0 && ITEMS[id]?.usableInParty && !ITEMS[id]?.repelSteps
  );

  const handleApplyUsable = (itemId: string) => {
    const it = ITEMS[itemId];
    if (!it || !selectedMon) return;
    if (it.tmMoveId && selectedMon.moves.length >= 4 && !selectedMon.moves.some((m) => m.moveId === it.tmMoveId)) {
      setTmPickMove({ itemId });
      return;
    }
    const msg = onUseItemOnParty(selectedIdx, itemId);
    setFeedback(msg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTab('party')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition ${
                tab === 'party'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              TAKIM ({party.length}/6)
            </button>
            <button
              onClick={() => setTab('box')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black flex items-center gap-1.5 transition ${
                tab === 'box'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Box className="w-4 h-4" />
              TAŞINABİLİR PC KUTUSU ({pcBox.length})
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-700 text-emerald-200 text-xs font-bold">
            ✦ {feedback}
          </div>
        )}

        {tab === 'party' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Party List */}
            <div className="lg:col-span-5 space-y-2">
              {party.map((mon, idx) => {
                const sp = POKEDEX[mon.speciesId];
                const isSel = idx === selectedIdx;
                const hpPct = Math.round((mon.currentHp / Math.max(1, mon.maxHp)) * 100);
                return (
                  <div
                    key={mon.uid}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setFeedback('');
                    }}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      isSel
                        ? 'bg-emerald-950/60 border-emerald-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={`/sprites/icons/${mon.speciesId}.png`}
                      alt={sp.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white truncate">
                          {idx === 0 && (
                            <span className="text-amber-300 mr-1" title="Takipçi Lider">
                              ★
                            </span>
                          )}
                          {mon.isShiny && '✨ '}
                          {mon.nickname || sp.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-300">Lv.{mon.level}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            hpPct > 50 ? 'bg-emerald-400' : hpPct > 20 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>
                          HP {mon.currentHp}/{mon.maxHp}{' '}
                          {mon.status !== 'none' && (
                            <span className="text-amber-300 font-bold uppercase">({mon.status})</span>
                          )}
                        </span>
                        {mon.heldItem && (
                          <span className="text-sky-300 truncate">
                            🎒 {ITEMS[mon.heldItem]?.nameTr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {party.length === 0 && (
                <div className="text-sm text-slate-400 p-6 text-center">
                  Henüz hiç Pokémonun yok! Prof. Oak Laboratuvarına uğra.
                </div>
              )}
            </div>

            {/* Right GBA Summary & Customization */}
            {selectedMon && selectedSp && (
              <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedMon.isShiny
                          ? `/sprites/shiny/${selectedMon.speciesId}.png`
                          : `/sprites/front/${selectedMon.speciesId}.png`
                      }
                      alt={selectedSp.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-20 h-20 bg-slate-900 rounded-xl border border-slate-800 p-1"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-white">
                          #{selectedSp.id} {selectedSp.name}
                        </h3>
                        {selectedSp.types.map((t) => (
                          <span
                            key={t}
                            style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].text }}
                            className="px-2 py-0.5 rounded text-[11px] font-bold"
                          >
                            {TYPE_NAMES_TR[t]}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-amber-300 font-semibold mt-1">
                        Doğa: {natureDef?.nameTr || selectedMon.nature}
                      </div>
                      <div className="text-xs text-emerald-400 font-semibold">
                        Yetenek: {ABILITIES[selectedMon.ability]?.nameTr} —{' '}
                        <span className="text-slate-400 font-normal">
                          {ABILITIES[selectedMon.ability]?.descTr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedIdx > 0 && (
                      <button
                        onClick={() => {
                          onMakeLead(selectedIdx);
                          setSelectedIdx(0);
                          setFeedback(`${selectedSp.name} lider ve harita takipçisi yapıldı!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Lider &amp; Takipçi Yap
                      </button>
                    )}
                    {party.length > 1 && (
                      <button
                        onClick={() => {
                          onDepositToBox(selectedIdx);
                          setSelectedIdx(0);
                          setFeedback(`${selectedSp.name} PC Kutusuna aktarıldı.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs"
                      >
                        PC Kutusuna Gönder
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats with GBA Nature +/- Highlighting + IV/EV */}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                    <span>İstatistikler (GBA Doğa Etkisi &amp; IV/EV)</span>
                    <span>Sonraki Seviye EXP: {Math.max(0, selectedMon.nextLevelExp - selectedMon.exp)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(STAT_NAMES_TR) as StatKey[]).map((sk) => {
                      const isUp = sk !== 'hp' && natureDef?.up === sk;
                      const isDown = sk !== 'hp' && natureDef?.down === sk;
                      return (
                        <div
                          key={sk}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div
                              className={`text-[11px] font-bold ${
                                isUp
                                  ? 'text-emerald-400'
                                  : isDown
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {STAT_NAMES_TR[sk]} {isUp ? '▲' : isDown ? '▼' : ''}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              IV:{selectedMon.ivs[sk]} • EV:{selectedMon.evs[sk]}
                            </div>
                          </div>
                          <div className="text-base font-black text-white">
                            {selectedMon.stats[sk]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Held Item Equip / Unequip */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Tutulan Eşya:{' '}
                      {selectedMon.heldItem ? ITEMS[selectedMon.heldItem]?.nameTr : 'Yok'}
                    </span>
                    {selectedMon.heldItem && (
                      <button
                        onClick={() => {
                          onEquipItem(selectedIdx, undefined);
                          setFeedback('Tutulan eşya çantaya geri alındı.');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold"
                      >
                        Çıkar
                      </button>
                    )}
                  </div>
                  {heldCandidates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {heldCandidates.map(([id, cnt]) => (
                        <button
                          key={id}
                          onClick={() => {
                            onEquipItem(selectedIdx, id);
                            setFeedback(`${ITEMS[id]?.nameTr} tutturuldu!`);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-950 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1"
                        >
                          <img src={`/sprites/items/${ITEMS[id].sprite}`} alt="" className="w-4 h-4" />
                          {ITEMS[id].nameTr} (x{cnt})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moves List */}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                    Bilinen Hamleler ({selectedMon.moves.length}/4)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMon.moves.map((ms) => {
                      const md = MOVES[ms.moveId];
                      if (!md) return null;
                      const tc = TYPE_COLORS[md.type];
                      return (
                        <div
                          key={ms.moveId}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{md.nameTr}</span>
                            <span
                              style={{ backgroundColor: tc.bg, color: tc.text }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            >
                              {TYPE_NAMES_TR[md.type]}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {md.category === 'physical' ? '💥 Fiziksel' : md.category === 'special' ? '🌀 Özel' : '✨ Durum'}{' '}
                            • Güç: {md.power || '-'} • PP: {ms.pp}/{ms.maxPp}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Apply Medicine / Evo Stone / TM / Rare Candy */}
                {usableItems.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-amber-300 uppercase mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Hızlı Eşya / Evrim Taşı / TM Kullan
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {usableItems.map(([id, cnt]) => (
                        <button
                          key={id}
                          onClick={() => handleApplyUsable(id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                        >
                          <img src={`/sprites/items/${ITEMS[id].sprite}`} alt="" className="w-4 h-4" />
                          {ITEMS[id].nameTr} {ITEMS[id].tmMoveId ? '(Sınırsız)' : `x${cnt}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* PORTABLE PC BOX TAB */
          <div className="p-4 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-400">
              Bill&apos;in Taşınabilir GBA PC Sistemi! Kutudaki herhangi bir Pokémona tıklayarak takımına alabilirsin (Takımda boş yer olmalı; doluysa önce Takım sekmesinden bir Pokémonu kutuya gönder).
            </p>
            {pcBox.length === 0 ? (
              <div className="p-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                PC Kutusunda henüz Pokémon bulunmuyor. 6&apos;dan fazla Pokémon yakaladığında otomatik buraya aktarılır!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pcBox.map((mon, idx) => {
                  const sp = POKEDEX[mon.speciesId];
                  return (
                    <div
                      key={mon.uid}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-1.5"
                    >
                      <img
                        src={
                          mon.isShiny
                            ? `/sprites/shiny/${mon.speciesId}.png`
                            : `/sprites/front/${mon.speciesId}.png`
                        }
                        alt={sp.name}
                        style={{ imageRendering: 'pixelated' }}
                        className="w-16 h-16"
                      />
                      <div className="font-bold text-sm text-white">
                        {mon.isShiny && '✨ '}
                        {mon.nickname || sp.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Lv.{mon.level} • {ABILITIES[mon.ability]?.nameTr}
                      </div>
                      <button
                        disabled={party.length >= 6}
                        onClick={() => {
                          onWithdrawFromBox(idx);
                          setFeedback(`${sp.name} takıma alındı!`);
                        }}
                        className="w-full mt-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs"
                      >
                        {party.length >= 6 ? 'Takım Dolu (6/6)' : 'Takıma Al'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TM Move Slot Replacement Modal */}
      {tmPickMove && selectedMon && (() => {
        const it = ITEMS[tmPickMove.itemId];
        const md = it?.tmMoveId ? MOVES[it.tmMoveId] : null;
        if (!md) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-md w-full p-4 space-y-3">
              <h4 className="font-black text-amber-300 text-base">
                {md.nameTr} öğretmek için hangi hamle unutulsun?
              </h4>
              {selectedMon.moves.map((sl, mIdx) => (
                <button
                  key={sl.moveId}
                  onClick={() => {
                    const msg = onUseItemOnParty(selectedIdx, tmPickMove.itemId, mIdx);
                    setFeedback(msg);
                    setTmPickMove(null);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-left flex justify-between items-center"
                >
                  <span className="font-bold text-sm text-white">{MOVES[sl.moveId]?.nameTr}</span>
                  <span className="text-xs text-amber-300">Değiştir →</span>
                </button>
              ))}
              <button
                onClick={() => setTmPickMove(null)}
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                İptal
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
