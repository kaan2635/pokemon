import React, { useState } from 'react';
import { ITEMS, MEGA_STONE_MART_ITEMS } from '../data/items';
import { MEGA_FORM_LIST } from '../data/megaEvolutions';
import { POKEDEX, POKEDEX_LIST } from '../data/pokedex';
import { TYPE_COLORS, TYPE_NAMES_TR } from '../data/typesAndNatures';
import { createPokemon } from '../engine/pokemonFactory';
import { PokemonInstance } from '../types/game';
import { assetUrl } from '../utils/assetPath';
import { Flame, Gem, Repeat, Sparkles, Swords, X } from 'lucide-react';

export interface RaidDenEntry {
  id: string;
  speciesId: number;
  stars: 3 | 4 | 5;
  minLevel: number;
  rewardMegaStone: string;
  titleTr: string;
}

export const RAID_DENS: RaidDenEntry[] = [
  {
    id: 'raid_charizard',
    speciesId: 6,
    stars: 4,
    minLevel: 32,
    rewardMegaStone: 'charizardite-x',
    titleTr: 'Kızıl Volkan İni — Alfa Charizard',
  },
  {
    id: 'raid_blastoise',
    speciesId: 9,
    stars: 4,
    minLevel: 32,
    rewardMegaStone: 'blastoisinite',
    titleTr: 'Derin Girdap İni — Alfa Blastoise',
  },
  {
    id: 'raid_venusaur',
    speciesId: 3,
    stars: 4,
    minLevel: 32,
    rewardMegaStone: 'venusaurite',
    titleTr: 'Kadim Orman İni — Alfa Venusaur',
  },
  {
    id: 'raid_gengar',
    speciesId: 94,
    stars: 4,
    minLevel: 35,
    rewardMegaStone: 'gengarite',
    titleTr: 'Lavender Hayalet İni — Alfa Gengar',
  },
  {
    id: 'raid_gyarados',
    speciesId: 130,
    stars: 4,
    minLevel: 34,
    rewardMegaStone: 'gyaradosite',
    titleTr: 'Fırtına Denizi İni — Alfa Gyarados',
  },
  {
    id: 'raid_gardevoir',
    speciesId: 282,
    stars: 4,
    minLevel: 34,
    rewardMegaStone: 'gardevoirite',
    titleTr: 'Peri Kristali İni — Alfa Gardevoir',
  },
  {
    id: 'raid_blaziken',
    speciesId: 257,
    stars: 5,
    minLevel: 40,
    rewardMegaStone: 'blazikenite',
    titleTr: 'Hoenn Alev İni — Alfa Blaziken',
  },
  {
    id: 'raid_tyranitar',
    speciesId: 248,
    stars: 5,
    minLevel: 46,
    rewardMegaStone: 'tyranitarite',
    titleTr: 'Kum Fırtınası İni — Alfa Tyranitar',
  },
  {
    id: 'raid_salamence',
    speciesId: 373,
    stars: 5,
    minLevel: 48,
    rewardMegaStone: 'salamencite',
    titleTr: 'Meteor Şelalesi İni — Alfa Salamence',
  },
  {
    id: 'raid_metagross',
    speciesId: 376,
    stars: 5,
    minLevel: 50,
    rewardMegaStone: 'metagrossite',
    titleTr: 'Süper Çelik İni — Alfa Metagross',
  },
];

interface RaidAndWonderModalProps {
  party: PokemonInstance[];
  pcBox: PokemonInstance[];
  bag: Record<string, number>;
  money: number;
  battlePoints: number;
  onStartRaid: (raid: RaidDenEntry, scaledLevel: number) => void;
  onBuyMegaStone: (itemId: string, useBp: boolean) => string;
  onWonderTradeBox: (boxIdx: number, incoming: PokemonInstance) => void;
  onWonderTradeParty: (partyIdx: number, incoming: PokemonInstance) => void;
  onClose: () => void;
}

export const RaidAndWonderModal: React.FC<RaidAndWonderModalProps> = ({
  party,
  pcBox,
  bag,
  money,
  battlePoints,
  onStartRaid,
  onBuyMegaStone,
  onWonderTradeBox,
  onWonderTradeParty,
  onClose,
}) => {
  const [tab, setTab] = useState<'raids' | 'megashop' | 'wonder'>('raids');
  const [notice, setNotice] = useState<string>('');

  const avgPartyLevel =
    party.length > 0
      ? Math.max(15, Math.round(party.reduce((s, m) => s + m.level, 0) / party.length))
      : 20;

  const ownedSpeciesSet = new Set([
    ...party.map((m) => m.speciesId),
    ...pcBox.map((m) => m.speciesId),
  ]);

  const generateWonderPokemon = (targetLevel: number): PokemonInstance => {
    const candidates = POKEDEX_LIST.filter((sp) => sp.catchRate >= 25);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const bonusPool = [
      'sitrus-berry',
      'lum-berry',
      'rare-candy',
      'leftovers',
      'life-orb',
      ...MEGA_STONE_MART_ITEMS,
    ];
    const heldItem =
      Math.random() < 0.38 ? bonusPool[Math.floor(Math.random() * bonusPool.length)] : undefined;
    const forceShiny = Math.random() < 0.12; // 12% Wonder Trade Shiny thrill!

    return createPokemon(chosen.id, Math.max(5, Math.min(75, targetLevel)), {
      dexNavBoost: true,
      forceShiny,
      heldItem,
      metLocation: 'Harika Takas (Wonder Trade)',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-fuchsia-500/80 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img src={assetUrl('sprites/items/mega-ring.png')} alt="" className="w-6 h-6" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                MEGA MERKEZİ • MAKSİMUM AKIN İNLERİ &amp; HARİKA TAKAS
              </h2>
              <p className="text-[11px] text-slate-400">
                Pokémon Unbound, Radical Red ve Modern Emerald sistemleri tek merkezde!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-black text-xs">
              ₽{money.toLocaleString('tr-TR')} • {battlePoints} BP
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setTab('raids')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'raids' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Flame className="w-4 h-4" />
            Maksimum Akın İnleri (Raid Dens)
          </button>
          <button
            onClick={() => setTab('megashop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'megashop' ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Gem className="w-4 h-4" />
            Mega Taş &amp; İlkel Küre Galerisi ({MEGA_FORM_LIST.length} Form)
          </button>
          <button
            onClick={() => setTab('wonder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              tab === 'wonder' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Repeat className="w-4 h-4" />
            Harika Takas (Wonder Trade)
          </button>
        </div>

        {notice && (
          <div className="px-4 py-2 bg-fuchsia-950/80 border-b border-fuchsia-700 text-fuchsia-100 text-xs font-bold">
            ✦ {notice}
          </div>
        )}

        {/* TAB 1: RAID DENS */}
        {tab === 'raids' && (
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 text-xs text-slate-300">
              <strong className="text-rose-400">⚡ Dinamaks / Alfa Akın İnleri:</strong> Dev Boss Pokémonlar{' '}
              <strong>2.2x Can</strong> ve <strong>Kusursuz (31) IV</strong> ile çıkar! Canını %45 altına indirdiğinde Poké Topu atıp yakalayabilir veya yenerek{' '}
              <strong className="text-amber-300">Garantili Mega Taş + Nadir Şeker + 8 BP</strong> ödülü kazanabilirsin!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RAID_DENS.map((raid) => {
                const sp = POKEDEX[raid.speciesId];
                const stone = ITEMS[raid.rewardMegaStone];
                const hasStone = (bag[raid.rewardMegaStone] || 0) > 0;
                const scaledLv = Math.max(raid.minLevel, avgPartyLevel + 2);

                return (
                  <div
                    key={raid.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/60 hover:border-rose-500/70 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-xl bg-rose-600/20 blur-sm" />
                        <img
                          src={assetUrl(`sprites/front/${sp.id}.png`)}
                          alt={sp.name}
                          className="relative w-16 h-16 bg-slate-900 rounded-xl p-1 border border-rose-700/60"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-amber-400">
                          {'★'.repeat(raid.stars)} • Önerilen Lv.{scaledLv}
                        </div>
                        <div className="font-black text-sm text-white truncate">{raid.titleTr}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {sp.types.map((t) => (
                            <span
                              key={t}
                              style={{ backgroundColor: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].text }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            >
                              {TYPE_NAMES_TR[t]}
                            </span>
                          ))}
                          {stone && (
                            <span className="text-[11px] text-fuchsia-300 font-bold flex items-center gap-1">
                              <img
                                src={assetUrl(`sprites/items/${stone.sprite}`)}
                                alt=""
                                className="w-4 h-4"
                              />
                              {stone.nameTr.split(' (')[0]} {hasStone ? '✓' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={party.length === 0 || !party.some((m) => m.currentHp > 0)}
                      onClick={() => onStartRaid(raid, scaledLv)}
                      className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1.5 shrink-0 shadow-lg"
                    >
                      <Swords className="w-4 h-4" />
                      Akına Gir!
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MEGA STONE & PRIMAL ORB GALLERY */}
        {tab === 'megashop' && (
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-fuchsia-500/40 text-xs text-slate-300">
              <strong className="text-fuchsia-300">✨ Mega Evrim Nasıl Kullanılır?</strong> Çantandan veya Takım ekranından uyumlu Pokémonuna Mega Taşını tuttur (ör. Charizard →{' '}
              <em>Charizardite X</em>). Savaşta <strong>SAVAŞ</strong> menüsünü açtığında üstte beliren parlayan{' '}
              <strong>&quot;MEGA EVRİM AKTİF ET&quot;</strong> butonuna basıp hamleni seç! <em>(Kyogre ve Groudon kürelerini tutarken otomatik İlkel Dönüşüm geçirir; Rayquaza ise Ejder Yükselişi hamlesiyle taşa ihtiyaç duymadan Mega Evrimleşir!)</em>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MEGA_STONE_MART_ITEMS.map((itemId) => {
                const it = ITEMS[itemId];
                if (!it) return null;
                const targetSp = it.megaStoneFor ? POKEDEX[it.megaStoneFor] : null;
                const megaForm = MEGA_FORM_LIST.find((f) => f.requiredItem === itemId);
                const ownedCount = bag[itemId] || 0;
                const hasPokemon = it.megaStoneFor ? ownedSpeciesSet.has(it.megaStoneFor) : false;

                return (
                  <div
                    key={itemId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      hasPokemon
                        ? 'bg-fuchsia-950/30 border-fuchsia-500/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {megaForm ? (
                        <img
                          src={assetUrl(`sprites/front/${megaForm.spriteId}.png`)}
                          alt={megaForm.nameTr}
                          className="w-12 h-12 bg-slate-900 rounded-lg p-0.5 shrink-0"
                        />
                      ) : (
                        <img
                          src={assetUrl(`sprites/items/${it.sprite}`)}
                          alt=""
                          className="w-9 h-9 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-black text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                          <img
                            src={assetUrl(`sprites/items/${it.sprite}`)}
                            alt=""
                            className="w-4 h-4 inline"
                          />
                          <span>{it.nameTr.split(' (')[0]}</span>
                          {ownedCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              Çantada x{ownedCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">
                          {targetSp ? `${targetSp.name} → ${megaForm?.nameTr}` : it.descTr}
                          {hasPokemon && (
                            <span className="text-amber-300 font-bold ml-1">★ Uyumlu Pokémonun Var!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0 items-end">
                      <button
                        onClick={() => setNotice(onBuyMegaStone(itemId, false))}
                        className="px-2.5 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs"
                      >
                        ₽{it.price.toLocaleString('tr-TR')}
                      </button>
                      {it.bpPrice && (
                        <button
                          onClick={() => setNotice(onBuyMegaStone(itemId, true))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-700 border border-slate-700 text-emerald-300 font-bold text-[11px]"
                        >
                          {it.bpPrice} BP
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WONDER TRADE */}
        {tab === 'wonder' && (
          <div className="p-4 overflow-y-auto space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" />
              <div>
                <strong className="text-cyan-300">Küresel Harika Takas (Modern Emerald):</strong> Kutusundaki veya takımındaki (en az 2 Pokémon varsa) bir Pokémonu gönder; aynı seviyede rastgele Kanto/Johto/Hoenn Pokémonu gelsin!{' '}
                <strong className="text-amber-300">%12 Parlak (Shiny)</strong> ve{' '}
                <strong className="text-fuchsia-300">%38 Mega Taş / Nadir Eşya tutma</strong> şansı vardır!
              </div>
            </div>

            {party.length > 1 && (
              <div>
                <div className="text-xs font-black text-emerald-300 uppercase mb-2">
                  Takımdan Gönder ({party.length}/6)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {party.map((mon, idx) => {
                    const sp = POKEDEX[mon.speciesId];
                    return (
                      <div
                        key={mon.uid}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={assetUrl(`sprites/icons/${mon.speciesId}.png`)}
                            alt=""
                            className="w-9 h-9 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate">
                              {mon.isShiny && '✨ '}
                              {mon.nickname || sp.name}
                            </div>
                            <div className="text-[10px] text-slate-400">Lv.{mon.level}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const incoming = generateWonderPokemon(mon.level);
                            onWonderTradeParty(idx, incoming);
                            const inSp = POKEDEX[incoming.speciesId];
                            setNotice(
                              `Harika Takas tamamlandı! ${sp.name} gitti → ${
                                incoming.isShiny ? '✨ PARLAK ' : ''
                              }${inSp.name} (Lv.${incoming.level}${
                                incoming.heldItem ? `, Eşya: ${ITEMS[incoming.heldItem]?.nameTr}` : ''
                              }) geldi!`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shrink-0"
                        >
                          Takasla
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-black text-sky-300 uppercase mb-2">
                PC Kutusundan Gönder ({pcBox.length})
              </div>
              {pcBox.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                  PC Kutusunda henüz Pokémon yok. Doğada yakaladığın fazla Pokémonları burada sürpriz takasa sokabilirsin!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {pcBox.map((mon, idx) => {
                    const sp = POKEDEX[mon.speciesId];
                    return (
                      <div
                        key={mon.uid}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-1.5"
                      >
                        <img
                          src={assetUrl(`sprites/front/${mon.speciesId}.png`)}
                          alt=""
                          className="w-14 h-14"
                        />
                        <div className="font-bold text-xs text-white">
                          {mon.isShiny && '✨ '}
                          {mon.nickname || sp.name} (Lv.{mon.level})
                        </div>
                        <button
                          onClick={() => {
                            const incoming = generateWonderPokemon(mon.level);
                            onWonderTradeBox(idx, incoming);
                            const inSp = POKEDEX[incoming.speciesId];
                            setNotice(
                              `Harika Takas! ${sp.name} gönderildi → ${
                                incoming.isShiny ? '✨ PARLAK ' : ''
                              }${inSp.name} (Lv.${incoming.level}${
                                incoming.heldItem ? `, Eşya: ${ITEMS[incoming.heldItem]?.nameTr}` : ''
                              }) kutuna geldi!`
                            );
                          }}
                          className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs"
                        >
                          Harika Takas!
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
