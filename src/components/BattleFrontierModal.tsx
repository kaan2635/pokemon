import React, { useState } from 'react';
import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { POKEDEX } from '../data/pokedex';
import { ABILITIES } from '../data/typesAndNatures';
import { generateBattleFactoryPool } from '../engine/pokemonFactory';
import { PokemonInstance } from '../types/game';
import { assetUrl } from '../utils/assetPath';
import { Castle, Cpu, Swords, Trophy, X } from 'lucide-react';

interface BattleFrontierModalProps {
  mode: 'tower' | 'factory';
  playerParty: PokemonInstance[];
  towerBestStreak: number;
  factoryBestStreak: number;
  battlePoints: number;
  onStartTowerRun: () => void;
  onStartFactoryRun: (selectedThree: PokemonInstance[]) => void;
  onClose: () => void;
}

export const BattleFrontierModal: React.FC<BattleFrontierModalProps> = ({
  mode,
  playerParty,
  towerBestStreak,
  factoryBestStreak,
  battlePoints,
  onStartTowerRun,
  onStartFactoryRun,
  onClose,
}) => {
  const [rentalPool] = useState<PokemonInstance[]>(() => generateBattleFactoryPool());
  const [pickedUids, setPickedUids] = useState<string[]>([]);

  const togglePick = (uid: string) => {
    setPickedUids((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : prev.length < 3 ? [...prev, uid] : prev
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-emerald-400 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === 'tower' ? (
              <Castle className="w-5 h-5 text-emerald-400" />
            ) : (
              <Cpu className="w-5 h-5 text-cyan-400" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {mode === 'tower'
                  ? 'ZÜMRÜT SAVAŞ KULESİ (Emerald Battle Tower)'
                  : 'ZÜMRÜT SAVAŞ FABRİKASI (Emerald Battle Factory)'}
              </h2>
              <div className="text-xs text-slate-400">
                En Yüksek Seri:{' '}
                <strong className="text-amber-300">
                  {mode === 'tower' ? towerBestStreak : factoryBestStreak} Galibiyet
                </strong>{' '}
                • Mevcut BP: <strong className="text-emerald-300">{battlePoints} BP</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'tower' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                <Trophy className="w-4 h-4" />
                Savaş Kulesi Kuralları (Lv.50 Açık Denge)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Takımındaki ilk 3 Pokémon otomatik olarak <strong>Seviye 50</strong> turnuva dengesine ölçeklenir. Her galibiyet <strong>+6 BP</strong> kazandırır! 5. ardışık maçta efsanevi{' '}
                <strong className="text-amber-300">Kule Beyni Anabel (Alakazam, Snorlax, Metagross)</strong> karşısına çıkarsın ve kazanırsan <strong>+25 Bonus BP</strong> alırsın!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {playerParty.slice(0, 3).map((m) => {
                const sp = POKEDEX[m.speciesId];
                return (
                  <div
                    key={m.uid}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                  >
                    <img
                      src={assetUrl(`sprites/front/${m.speciesId}.png`)}
                      alt={sp.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-14 h-14"
                    />
                    <div>
                      <div className="font-black text-sm text-white">{sp.name}</div>
                      <div className="text-xs text-emerald-400">Turnuva: Lv.50</div>
                      <div className="text-[11px] text-slate-400">{ABILITIES[m.ability]?.nameTr}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={playerParty.length === 0}
              onClick={onStartTowerRun}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <Swords className="w-5 h-5" />
              SAVAŞ KULESİ SERİSİNİ BAŞLAT!
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-300">
              <strong className="text-cyan-300">Pokémon Emerald&apos;ın En Sevilen Modu:</strong> Aşağıdaki 6 turnuva Pokémonu arasından{' '}
              <strong className="text-amber-300">tam 3 tanesini seç ({pickedUids.length}/3)</strong>! Kendi Pokémonların hiç risk almaz; 4. maçta{' '}
              <strong className="text-amber-300">Fabrika Şefi Noland</strong> seni bekler!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {rentalPool.map((m) => {
                const sp = POKEDEX[m.speciesId];
                const isPicked = pickedUids.includes(m.uid);
                return (
                  <button
                    key={m.uid}
                    onClick={() => togglePick(m.uid)}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      isPicked
                        ? 'bg-cyan-950/60 border-cyan-400 scale-[1.01]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={assetUrl(`sprites/front/${m.speciesId}.png`)}
                        alt={sp.name}
                        style={{ imageRendering: 'pixelated' }}
                        className="w-14 h-14 bg-slate-900 rounded-lg p-1"
                      />
                      <div>
                        <div className="font-black text-sm text-white">
                          {sp.name} <span className="text-xs text-cyan-300">Lv.50</span>
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          {ABILITIES[m.ability]?.nameTr}
                        </div>
                        {m.heldItem && (
                          <div className="text-[11px] text-amber-300">
                            🎒 {ITEMS[m.heldItem]?.nameTr}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.moves.map((mv) => (
                        <span
                          key={mv.moveId}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 border border-slate-800"
                        >
                          {MOVES[mv.moveId]?.nameTr}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              disabled={pickedUids.length !== 3}
              onClick={() => {
                const chosen = rentalPool.filter((m) => pickedUids.includes(m.uid));
                onStartFactoryRun(chosen);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 disabled:opacity-40 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <Swords className="w-5 h-5" />
              KİRALIK TAKIMLA SAVAŞ FABRİKASINA GİR ({pickedUids.length}/3)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
