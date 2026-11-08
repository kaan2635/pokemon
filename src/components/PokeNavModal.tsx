import React, { useState } from 'react';
import { MAPS } from '../data/maps';
import { POKEDEX } from '../data/pokedex';
import { GYM_BADGES } from '../data/trainersAndGyms';
import { TYPE_COLORS, TYPE_NAMES_TR } from '../data/typesAndNatures';
import { assetUrl } from '../utils/assetPath';
import { Compass, MapPin, Radar, Award, Plane, X, Sparkles } from 'lucide-react';

interface PokeNavModalProps {
  currentMapId: string;
  visitedMaps: string[];
  badges: string[];
  pokedexSeen: number[];
  pokedexCaught: number[];
  vsSeekerCharge: number;
  hasParty: boolean;
  onFlyToMap: (mapId: string) => void;
  onTriggerDexNavEncounter: (speciesId: number) => void;
  onActivateVsSeeker: () => string;
  onClose: () => void;
}

const FLYABLE_MAPS = [
  'pallet_town',
  'viridian_city',
  'pewter_city',
  'cerulean_city',
  'vermilion_city',
  'lavender_town',
  'celadon_city',
  'fuchsia_city',
  'saffron_city',
  'cinnabar_island',
  'indigo_plateau',
  'sevii_frontier',
];

export const PokeNavModal: React.FC<PokeNavModalProps> = ({
  currentMapId,
  visitedMaps,
  badges,
  pokedexSeen,
  pokedexCaught,
  vsSeekerCharge,
  hasParty,
  onFlyToMap,
  onTriggerDexNavEncounter,
  onActivateVsSeeker,
  onClose,
}) => {
  const [tab, setTab] = useState<'dexnav' | 'map' | 'badges'>('dexnav');
  const [statusMsg, setStatusMsg] = useState<string>('');

  const curMap = MAPS[currentMapId];
  const localWild = Array.from(
    new Map(
      [
        ...(curMap.grassEncounters || []),
        ...(curMap.waterEncounters || []),
        ...(curMap.fishEncounters || []),
      ].map((e) => [e.speciesId, e])
    ).values()
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-cyan-400/70 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ZÜMRÜT POKÉNAV &amp; DEXNAV SİSTEMİ
              </h2>
              <p className="text-[11px] text-slate-400">
                Mevcut Konum: <span className="text-cyan-300 font-bold">{curMap.nameTr}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setTab('dexnav')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'dexnav' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Radar className="w-4 h-4" />
            DexNav Bölge Radarı
          </button>
          <button
            onClick={() => setTab('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'map' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Dünya Haritası &amp; Hızlı Uçuş
          </button>
          <button
            onClick={() => setTab('badges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'badges' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            8 Salon &amp; Rövanş (VS Seeker)
          </button>
        </div>

        {statusMsg && (
          <div className="px-4 py-2 bg-cyan-950/80 border-b border-cyan-700 text-cyan-200 text-xs font-bold">
            ✦ {statusMsg}
          </div>
        )}

        {/* TAB 1: DEXNAV RADAR */}
        {tab === 'dexnav' && (
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-cyan-300">GBA DexNav Tarayıcı:</span> Bulunduğun bölgedeki tüm vahşi türleri gösterir.{' '}
                <strong className="text-amber-300">&quot;Radar Taraması&quot;</strong> başlatırsan yüksek IV&apos;li ve{' '}
                <strong className="text-emerald-300">5x Parlak (Shiny) şanslı</strong> bir karşılaşma yakalarsın!
              </div>
            </div>

            {localWild.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl text-sm">
                Bu bina/alan içinde vahşi Pokémon sinyali yok. Bir rota, orman, mağara veya deniz kıyısına çık!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {localWild.map((enc) => {
                  const sp = POKEDEX[enc.speciesId];
                  const isCaught = pokedexCaught.includes(sp.id);
                  const isSeen = pokedexSeen.includes(sp.id) || isCaught;
                  return (
                    <div
                      key={sp.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={assetUrl(`sprites/front/${sp.id}.png`)}
                          alt={sp.name}
                          style={{ imageRendering: 'pixelated' }}
                          className={`w-14 h-14 bg-slate-900 rounded-lg p-1 ${
                            !isSeen ? 'brightness-0 opacity-75' : ''
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-white">
                              {isSeen ? sp.name : `??? (#${sp.id})`}
                            </span>
                            {isCaught && (
                              <img
                                src={assetUrl('sprites/items/poke-ball.png')}
                                alt="Yakalandı"
                                className="w-4 h-4"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Seviye {enc.minLv}–{enc.maxLv} • {sp.region}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {sp.types.map((t) => (
                              <span
                                key={t}
                                style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].text }}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                              >
                                {TYPE_NAMES_TR[t]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={!hasParty || currentMapId === 'safari_zone'}
                        onClick={() => onTriggerDexNavEncounter(sp.id)}
                        className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Tara!
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WORLD MAP & INSTANT FLY */}
        {tab === 'map' && (
          <div className="p-4 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-400">
              HM02 Uçuş (Fly) QoL: Daha önce ziyaret ettiğin herhangi bir şehre veya adaya tek tıkla anında uçabilirsin!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {FLYABLE_MAPS.map((mid) => {
                const m = MAPS[mid];
                const isVisited = visitedMaps.includes(mid);
                const isHere = currentMapId === mid;
                return (
                  <div
                    key={mid}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                      isHere
                        ? 'bg-emerald-950/60 border-emerald-400'
                        : isVisited
                        ? 'bg-slate-950 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-55'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">{m.nameTr}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {m.region}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.subtitleTr}</p>
                    </div>
                    <button
                      disabled={!isVisited || isHere || !hasParty}
                      onClick={() => onFlyToMap(mid)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      {isHere ? 'Buradasın' : isVisited ? 'Buraya Uç!' : 'Henüz Keşfedilmedi'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GYM BADGES & VS SEEKER */}
        {tab === 'badges' && (
          <div className="p-4 overflow-y-auto space-y-4">
            {/* VS Seeker Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-black text-sm text-amber-300">
                  FireRed Rövanş Cihazı (VS Seeker) — Şarj: %{Math.min(100, Math.round((vsSeekerCharge / 60) * 100))}
                </div>
                <p className="text-xs text-slate-400">
                  60 adımda tam şarj olur. Aktifleştirdiğinde bulunduğun haritadaki yenilmiş rota eğitmenleri yeniden savaşa hazır hale gelir!
                </p>
              </div>
              <button
                disabled={vsSeekerCharge < 60}
                onClick={() => setStatusMsg(onActivateVsSeeker())}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs"
              >
                Rövanş Sinyali Gönder!
              </button>
            </div>

            {/* 8 Gym Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GYM_BADGES.map((g, i) => {
                const earned = badges.includes(g.badgeId);
                return (
                  <div
                    key={g.badgeId}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      earned
                        ? 'bg-emerald-950/40 border-emerald-500/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <img
                      src={assetUrl(`sprites/front/${g.aceSpeciesId}.png`)}
                      alt={g.leaderNameTr}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-14 h-14 bg-slate-900 rounded-xl p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-sm text-white">
                          {i + 1}. {g.leaderNameTr} — {g.badgeNameTr}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            earned ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {earned ? 'KAZANILDI ✓' : `Önerilen Lv.${g.levelCap}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-semibold">
                        {g.cityNameTr} • {g.typeTr} Uzmanı
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{g.descTr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
