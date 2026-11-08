import React, { useState } from 'react';
import { MOVES } from '../data/moves';
import { POKEDEX, POKEDEX_LIST } from '../data/pokedex';
import { ABILITIES, TYPE_COLORS, TYPE_NAMES_TR } from '../data/typesAndNatures';
import { BookOpen, Search, Sparkles, X } from 'lucide-react';

interface PokedexModalProps {
  seenIds: number[];
  caughtIds: number[];
  onClose: () => void;
}

export const PokedexModal: React.FC<PokedexModalProps> = ({ seenIds, caughtIds, onClose }) => {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'Kanto' | 'Johto' | 'Hoenn' | 'CAUGHT'>('ALL');
  const [selectedId, setSelectedId] = useState<number>(caughtIds[0] || seenIds[0] || 1);
  const [showShiny, setShowShiny] = useState(false);

  const filtered = POKEDEX_LIST.filter((sp) => {
    if (regionFilter === 'CAUGHT' && !caughtIds.includes(sp.id)) return false;
    if (regionFilter !== 'ALL' && regionFilter !== 'CAUGHT' && sp.region !== regionFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return sp.name.toLowerCase().includes(q) || String(sp.id).includes(q);
    }
    return true;
  });

  const sp = POKEDEX[selectedId] || POKEDEX_LIST[0];
  const isCaught = caughtIds.includes(sp.id);
  const isSeen = seenIds.includes(sp.id) || isCaught;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-red-950/80 border-b border-red-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-red-300" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ULUSAL GBA POKÉDEX (165 SEÇKİN TÜR)
              </h2>
              <div className="text-[11px] text-red-200">
                Görülen: <strong>{seenIds.length}</strong> / 165 • Yakalanan:{' '}
                <strong className="text-amber-300">{caughtIds.length}</strong> / 165
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pokémon adı veya #numara ara..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-400"
            />
          </div>
          {(['ALL', 'CAUGHT', 'Kanto', 'Johto', 'Hoenn'] as const).map((rf) => (
            <button
              key={rf}
              onClick={() => setRegionFilter(rf)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                regionFilter === rf
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {rf === 'ALL' ? 'Tümü' : rf === 'CAUGHT' ? 'Yakalananlar' : rf}
            </button>
          ))}
        </div>

        {/* Split Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Species List */}
          <div className="md:col-span-5 overflow-y-auto p-3 space-y-1.5 border-r border-slate-800 max-h-[38vh] md:max-h-none">
            {filtered.map((item) => {
              const c = caughtIds.includes(item.id);
              const s = seenIds.includes(item.id) || c;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition ${
                    selectedId === item.id
                      ? 'bg-red-950/60 border-red-400'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={`/sprites/icons/${item.id}.png`}
                      alt=""
                      style={{ imageRendering: 'pixelated' }}
                      className={`w-8 h-8 ${!s ? 'brightness-0 opacity-40' : ''}`}
                    />
                    <div>
                      <div className="text-xs font-black text-white">
                        #{String(item.id).padStart(3, '0')} {s ? item.name : '???????'}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.region}</div>
                    </div>
                  </div>
                  {c ? (
                    <img src="/sprites/items/poke-ball.png" alt="Yakalandı" className="w-4 h-4" />
                  ) : s ? (
                    <span className="text-[10px] text-slate-400">Görüldü</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Right Detailed Entry */}
          <div className="md:col-span-7 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={
                    showShiny
                      ? `/sprites/shiny/${sp.id}.png`
                      : `/sprites/front/${sp.id}.png`
                  }
                  alt={sp.name}
                  style={{ imageRendering: 'pixelated' }}
                  className="w-24 h-24 bg-slate-900 rounded-xl p-1 border border-slate-800"
                />
                <div>
                  <div className="text-xs text-slate-400 font-bold">
                    #{String(sp.id).padStart(3, '0')} • {sp.region} Bölgesi
                  </div>
                  <h3 className="text-2xl font-black text-white">{sp.name}</h3>
                  <div className="flex gap-1.5 mt-1">
                    {sp.types.map((t) => (
                      <span
                        key={t}
                        style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].text }}
                        className="px-2 py-0.5 rounded text-xs font-bold"
                      >
                        {TYPE_NAMES_TR[t]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowShiny((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border ${
                  showShiny
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showShiny ? 'Shiny Görünüm' : 'Normal Görünüm'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {isSeen
                ? sp.dexDescTr
                : 'Henüz doğada karşılaşmadın ama Ulusal GBA Veritabanından temel verilerini inceleyebilirsin:'}{' '}
              {!isSeen && <span className="text-slate-400 italic">({sp.dexDescTr})</span>}
            </div>

            {/* Base Stat Bars */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                Temel İstatistikler (Toplam:{' '}
                {Object.values(sp.baseStats).reduce((a, b) => a + b, 0)})
              </div>
              {(
                [
                  ['HP', sp.baseStats.hp, 'bg-emerald-400'],
                  ['Saldırı', sp.baseStats.atk, 'bg-red-400'],
                  ['Savunma', sp.baseStats.def, 'bg-amber-400'],
                  ['Özel Sal.', sp.baseStats.spa, 'bg-sky-400'],
                  ['Özel Sav.', sp.baseStats.spd, 'bg-teal-400'],
                  ['Hız', sp.baseStats.spe, 'bg-purple-400'],
                ] as const
              ).map(([lbl, val, col]) => (
                <div key={lbl} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-slate-400 font-semibold">{lbl}</span>
                  <span className="w-8 font-black text-white text-right">{val}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${col}`}
                      style={{ width: `${Math.min(100, (val / 160) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Abilities & Evolutions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-1">Yetenekler (Abilities)</div>
                {sp.abilities.map((ab) => (
                  <div key={ab} className="text-xs text-slate-300 mt-1">
                    <strong>{ABILITIES[ab]?.nameTr}:</strong> {ABILITIES[ab]?.descTr}
                  </div>
                ))}
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-amber-300 mb-1">Evrim Koşulu</div>
                {sp.evolutions && sp.evolutions.length > 0 ? (
                  sp.evolutions.map((ev) => (
                    <button
                      key={ev.to + (ev.item || '')}
                      onClick={() => setSelectedId(ev.to)}
                      className="flex items-center gap-2 text-xs text-slate-200 hover:text-amber-300 mt-1"
                    >
                      <img src={`/sprites/icons/${ev.to}.png`} alt="" className="w-6 h-6" />
                      <span>
                        → <strong>{POKEDEX[ev.to]?.name}</strong> (
                        {ev.level ? `Lv.${ev.level}` : ev.item})
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Nihai form (Evrimleşmez).</div>
                )}
              </div>
            </div>

            {/* Level-Up Learnset */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                Seviye Hamle Havuzu
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sp.learnset.map((ls) => {
                  const md = MOVES[ls.moveId];
                  if (!md) return null;
                  return (
                    <span
                      key={`${ls.level}-${ls.moveId}`}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                    >
                      <strong className="text-amber-300">Lv.{ls.level}</strong> {md.nameTr}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
