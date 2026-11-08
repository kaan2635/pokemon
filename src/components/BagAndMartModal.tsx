import React, { useState } from 'react';
import {
  BP_SHOP_ITEMS,
  ITEMS,
  MEGA_STONE_MART_ITEMS,
  STANDARD_MART_ITEMS,
  STONE_AND_HELD_MART_ITEMS,
  TM_MART_ITEMS,
} from '../data/items';
import { POKEDEX } from '../data/pokedex';
import { ItemCategory, PokemonInstance } from '../types/game';
import { assetUrl } from '../utils/assetPath';
import { Backpack, ShoppingBag, X } from 'lucide-react';

interface BagAndMartModalProps {
  mode: 'bag' | 'mart' | 'stone_mart' | 'tm_mart' | 'bp_mart' | 'mega_mart';
  bag: Record<string, number>;
  money: number;
  battlePoints: number;
  party: PokemonInstance[];
  onBuyItem: (itemId: string, count: number, useBp: boolean) => string;
  onUseBagItem: (itemId: string, partyIdx?: number) => string;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: ItemCategory; label: string }> = [
  { id: 'medicine', label: 'İlaçlar' },
  { id: 'balls', label: 'Toplar' },
  { id: 'evo_tm', label: 'Evrim & TM' },
  { id: 'held_berry', label: 'Mega Taş, Tutulan & Meyve' },
  { id: 'key', label: 'Anahtar Eşyalar' },
];

export const BagAndMartModal: React.FC<BagAndMartModalProps> = ({
  mode,
  bag,
  money,
  battlePoints,
  party,
  onBuyItem,
  onUseBagItem,
  onClose,
}) => {
  const [cat, setCat] = useState<ItemCategory>('medicine');
  const [pickingPartyForItem, setPickingPartyForItem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');

  const isShop = mode !== 'bag';
  const useBp = mode === 'bp_mart';

  const shopCatalog =
    mode === 'mega_mart'
      ? MEGA_STONE_MART_ITEMS
      : mode === 'stone_mart'
      ? STONE_AND_HELD_MART_ITEMS
      : mode === 'tm_mart'
      ? TM_MART_ITEMS
      : mode === 'bp_mart'
      ? BP_SHOP_ITEMS
      : STANDARD_MART_ITEMS;

  const shopTitle =
    mode === 'mega_mart'
      ? 'Kalos & Hoenn Mega Taş ve İlkel Küre Butiği'
      : mode === 'stone_mart'
      ? 'Celadon AVM — Evrim Taşları & Tutulan Eşyalar'
      : mode === 'tm_mart'
      ? 'Celadon AVM — Sınırsız TM Teknik Reyonu'
      : mode === 'bp_mart'
      ? 'Zümrüt Savaş Sınırı — BP Ödül Mağazası'
      : 'Poké Market';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-amber-400/70 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isShop ? (
              <ShoppingBag className="w-5 h-5 text-sky-400" />
            ) : (
              <Backpack className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="text-base sm:text-lg font-black text-white">
              {isShop ? shopTitle : 'Eğitmen Çantası'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-black text-xs">
              {useBp ? `${battlePoints} BP` : `₽${money.toLocaleString('tr-TR')}`}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notice && (
          <div className="px-4 py-2 bg-amber-950/70 border-b border-amber-700/60 text-amber-200 text-xs font-bold">
            ✦ {notice}
          </div>
        )}

        {isShop ? (
          /* SHOP VIEW */
          <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {shopCatalog.map((itemId) => {
              const it = ITEMS[itemId];
              if (!it) return null;
              const cost = useBp ? it.bpPrice || 10 : it.price;
              const owned = bag[itemId] || 0;
              return (
                <div
                  key={itemId}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={assetUrl(`sprites/items/${it.sprite}`)}
                      alt=""
                      style={{ imageRendering: 'pixelated' }}
                      className="w-8 h-8 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">
                        {it.nameTr}{' '}
                        {owned > 0 && (
                          <span className="text-slate-400 font-normal">(Çantada: {owned})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{it.descTr}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <span className="text-xs font-black text-amber-300">
                      {useBp ? `${cost} BP` : `₽${cost.toLocaleString('tr-TR')}`}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setNotice(onBuyItem(itemId, 1, useBp))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Al x1
                      </button>
                      {!it.tmMoveId && !it.megaStoneFor && !useBp && (
                        <button
                          onClick={() => setNotice(onBuyItem(itemId, 5, false))}
                          className="px-2 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs"
                        >
                          x5
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* PLAYER BAG VIEW */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
              {CATEGORY_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCat(t.id);
                    setPickingPartyForItem(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    cat === t.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              {Object.entries(bag)
                .filter(([id, cnt]) => cnt > 0 && ITEMS[id]?.category === cat)
                .map(([id, cnt]) => {
                  const it = ITEMS[id];
                  return (
                    <div
                      key={id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={assetUrl(`sprites/items/${it.sprite}`)}
                          alt=""
                          style={{ imageRendering: 'pixelated' }}
                          className="w-8 h-8 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white">
                            {it.nameTr}{' '}
                            <span className="text-amber-300 text-xs">
                              {it.tmMoveId || it.category === 'key' ? '' : `x${cnt}`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">{it.descTr}</div>
                        </div>
                      </div>
                      {it.repelSteps ? (
                        <button
                          onClick={() => setNotice(onUseBagItem(id))}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                        >
                          Sık
                        </button>
                      ) : it.usableInParty ? (
                        <button
                          onClick={() => setPickingPartyForItem(id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                        >
                          Kullan
                        </button>
                      ) : it.category === 'held_berry' ? (
                        <button
                          onClick={() => setPickingPartyForItem(id)}
                          className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs shrink-0"
                        >
                          Tuttur
                        </button>
                      ) : null}
                    </div>
                  );
                })}

              {Object.entries(bag).filter(([id, cnt]) => cnt > 0 && ITEMS[id]?.category === cat)
                .length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Bu cepte henüz eşya bulunmuyor.
                </div>
              )}

              {/* Target Pokemon Picker inside Bag */}
              {pickingPartyForItem && (
                <div className="p-3 rounded-xl bg-slate-800 border border-amber-400/60 space-y-2 mt-2">
                  <div className="text-xs font-bold text-amber-300">
                    {ITEMS[pickingPartyForItem]?.nameTr} hangi Pokémon üzerinde kullanılsın / tutturulsun?
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {party.map((m, idx) => (
                      <button
                        key={m.uid}
                        onClick={() => {
                          setNotice(onUseBagItem(pickingPartyForItem, idx));
                          setPickingPartyForItem(null);
                        }}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-950 border border-slate-700 flex items-center gap-2 text-left"
                      >
                        <img
                          src={assetUrl(`sprites/icons/${m.speciesId}.png`)}
                          alt=""
                          className="w-7 h-7"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-white">{POKEDEX[m.speciesId].name}</div>
                          <div className="text-[10px] text-slate-400">
                            HP {m.currentHp}/{m.maxHp}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
