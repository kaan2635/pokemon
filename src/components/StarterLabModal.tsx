import React, { useState } from 'react';
import { POKEDEX } from '../data/pokedex';
import { ABILITIES, TYPE_COLORS, TYPE_NAMES_TR } from '../data/typesAndNatures';
import { Sparkles, Check } from 'lucide-react';

interface StarterLabModalProps {
  onSelectStarter: (speciesId: number) => void;
  onClose: () => void;
}

const STARTER_GROUPS: Array<{
  regionKey: 'Kanto' | 'Hoenn' | 'Johto';
  titleTr: string;
  subtitleTr: string;
  ids: [number, number, number];
}> = [
  {
    regionKey: 'Kanto',
    titleTr: 'Kanto Klasikleri (FireRed & LeafGreen)',
    subtitleTr: 'Prof. Oak\'un efsanevi üçlüsü',
    ids: [1, 4, 7],
  },
  {
    regionKey: 'Hoenn',
    titleTr: 'Hoenn Yıldızları (Ruby, Sapphire & Emerald)',
    subtitleTr: 'Prof. Birch tarafından özel gönderildi',
    ids: [252, 255, 258],
  },
  {
    regionKey: 'Johto',
    titleTr: 'Johto & Sevii Seçkisi (Emerald Post-Game)',
    subtitleTr: 'Prof. Elm\'in nadir başlangıç üçlüsü',
    ids: [152, 155, 158],
  },
];

export const StarterLabModal: React.FC<StarterLabModalProps> = ({ onSelectStarter, onClose }) => {
  const [tabIdx, setTabIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<number>(4);

  const currentGroup = STARTER_GROUPS[tabIdx];
  const selectedSp = POKEDEX[selectedId];
  const evo1 = selectedSp.evolutions?.[0]?.to ? POKEDEX[selectedSp.evolutions[0].to] : null;
  const evo2 = evo1?.evolutions?.[0]?.to ? POKEDEX[evo1.evolutions[0].to] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-amber-400/70 rounded-2xl max-w-3xl w-full p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              PROF. OAK ARAŞTIRMA LABORATUVARI
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">İlk Pokémon Ortağını Seç!</h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Kapat
          </button>
        </div>

        {/* Region Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {STARTER_GROUPS.map((g, i) => (
            <button
              key={g.regionKey}
              onClick={() => {
                setTabIdx(i);
                setSelectedId(g.ids[0]);
              }}
              className={`p-2.5 rounded-xl border text-left transition ${
                tabIdx === i
                  ? 'bg-amber-500/20 border-amber-400 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-black text-xs sm:text-sm">{g.regionKey} Üçlüsü</div>
              <div className="text-[10px] opacity-80 hidden sm:block">{g.subtitleTr}</div>
            </button>
          ))}
        </div>

        {/* 3 Starter Cards in Current Region */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {currentGroup.ids.map((id) => {
            const sp = POKEDEX[id];
            const isSel = selectedId === id;
            const mainType = sp.types[0];
            const tc = TYPE_COLORS[mainType];
            return (
              <button
                key={id}
                onClick={() => setSelectedId(id)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center transition ${
                  isSel
                    ? 'bg-slate-800 border-amber-400 scale-[1.02] shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                }`}
              >
                <img
                  src={`/sprites/front/${id}.png`}
                  alt={sp.name}
                  style={{ imageRendering: 'pixelated' }}
                  className="w-20 h-20 object-contain"
                />
                <div className="font-black text-white text-sm sm:text-base mt-1">{sp.name}</div>
                <span
                  style={{ backgroundColor: tc.bg, color: tc.text }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold mt-1"
                >
                  {TYPE_NAMES_TR[mainType]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Starter Detailed Dossier */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-amber-300">
                  #{selectedSp.id} {selectedSp.name}
                </h3>
                {selectedSp.types.map((t) => (
                  <span
                    key={t}
                    style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].text }}
                    className="px-2 py-0.5 rounded text-xs font-bold"
                  >
                    {TYPE_NAMES_TR[t]}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-300 mt-1">{selectedSp.dexDescTr}</p>
              <div className="text-xs text-emerald-400 font-semibold mt-1.5">
                Yetenek: {ABILITIES[selectedSp.abilities[0]]?.nameTr} —{' '}
                <span className="text-slate-400 font-normal">
                  {ABILITIES[selectedSp.abilities[0]]?.descTr}
                </span>
              </div>
            </div>

            {/* Evolution Chain Preview */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shrink-0 self-start">
              <div className="text-center">
                <img src={`/sprites/icons/${selectedSp.id}.png`} alt="" style={{ imageRendering: 'pixelated' }} className="w-8 h-8 mx-auto" />
                <span className="text-[10px] text-slate-300 font-bold">Lv.5</span>
              </div>
              {evo1 && (
                <>
                  <span className="text-slate-500 text-xs">→</span>
                  <div className="text-center">
                    <img src={`/sprites/icons/${evo1.id}.png`} alt="" style={{ imageRendering: 'pixelated' }} className="w-8 h-8 mx-auto" />
                    <span className="text-[10px] text-slate-300 font-bold">Lv.{selectedSp.evolutions?.[0]?.level}</span>
                  </div>
                </>
              )}
              {evo2 && (
                <>
                  <span className="text-slate-500 text-xs">→</span>
                  <div className="text-center">
                    <img src={`/sprites/icons/${evo2.id}.png`} alt="" style={{ imageRendering: 'pixelated' }} className="w-8 h-8 mx-auto" />
                    <span className="text-[10px] text-amber-300 font-bold">Lv.{evo1?.evolutions?.[0]?.level}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Base Stats */}
          <div className="grid grid-cols-6 gap-2 text-center pt-1">
            {(
              [
                ['HP', selectedSp.baseStats.hp],
                ['SAL', selectedSp.baseStats.atk],
                ['SAV', selectedSp.baseStats.def],
                ['Ö.SAL', selectedSp.baseStats.spa],
                ['Ö.SAV', selectedSp.baseStats.spd],
                ['HIZ', selectedSp.baseStats.spe],
              ] as const
            ).map(([lbl, val]) => (
              <div key={lbl} className="bg-slate-900 rounded-lg p-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold">{lbl}</div>
                <div className="text-sm font-black text-white">{val}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onSelectStarter(selectedId)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            {selectedSp.name.toUpperCase()}, SENİ SEÇTİM!
          </button>
        </div>
      </div>
    </div>
  );
};
