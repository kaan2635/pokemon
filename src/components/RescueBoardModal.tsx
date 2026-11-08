import React from 'react';
import { ITEMS } from '../data/items';
import { POKEDEX } from '../data/pokedex';
import { getRescueRank, RESCUE_QUESTS } from '../data/quests';
import { RescueQuest, SaveState } from '../types/game';
import { Award, CheckCircle2, ScrollText, X } from 'lucide-react';

interface RescueBoardModalProps {
  save: SaveState;
  onClaimQuest: (quest: RescueQuest) => void;
  onClose: () => void;
}

export function isQuestReadyToClaim(quest: RescueQuest, save: SaveState): { ready: boolean; progressText: string } {
  switch (quest.type) {
    case 'catch_species': {
      const done = quest.targetSpeciesId ? save.pokedexCaught.includes(quest.targetSpeciesId) : false;
      return { ready: done, progressText: done ? 'Tamamlandı (1/1)' : 'Henüz yakalanmadı (0/1)' };
    }
    case 'reach_badge': {
      const done = quest.targetBadgeId ? save.badges.includes(quest.targetBadgeId) : false;
      return { ready: done, progressText: done ? 'Rozet Kazanıldı!' : 'Rozet bekleniyor' };
    }
    case 'visit_map': {
      const done = quest.targetMapId ? save.visitedMaps.includes(quest.targetMapId) : false;
      return { ready: done, progressText: done ? 'Keşfedildi!' : 'Henüz gidilmedi' };
    }
    case 'defeat_count': {
      const goal = quest.targetCount || 10;
      const cur = Math.min(goal, save.totalBattlesWon);
      return { ready: cur >= goal, progressText: `${cur} / ${goal} Zafer` };
    }
    case 'catch_type': {
      const goal = quest.targetCount || 1;
      const count = save.pokedexCaught.filter((id) =>
        quest.targetType ? POKEDEX[id]?.types.includes(quest.targetType) : false
      ).length;
      return { ready: count >= goal, progressText: `${Math.min(goal, count)} / ${goal} Yakalandı` };
    }
  }
}

export const RescueBoardModal: React.FC<RescueBoardModalProps> = ({
  save,
  onClaimQuest,
  onClose,
}) => {
  const rankInfo = getRescueRank(save.rescuePoints);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                KIZIL KURTARMA TAKIMI İLAN PANOSU (Mystery Dungeon GBA)
              </h2>
              <div className="text-xs flex items-center gap-2">
                <span style={{ color: rankInfo.color }} className="font-black">
                  ★ {rankInfo.nameTr}
                </span>
                <span className="text-slate-400">
                  ({save.rescuePoints} / {rankInfo.nextPts} Kurtarma Puanı)
                </span>
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

        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {RESCUE_QUESTS.map((q) => {
            const claimed = save.completedQuests.includes(q.id);
            const { ready, progressText } = isQuestReadyToClaim(q, save);
            const rewardIt = ITEMS[q.rewardItem.itemId];

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
                  claimed
                    ? 'bg-slate-950/50 border-emerald-800/50 opacity-70'
                    : ready
                    ? 'bg-amber-950/30 border-amber-400'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/sprites/icons/${q.clientSpeciesId}.png`}
                        alt=""
                        style={{ imageRendering: 'pixelated' }}
                        className="w-8 h-8"
                      />
                      <div>
                        <div className="font-black text-sm text-white">{q.titleTr}</div>
                        <div className="text-[11px] text-slate-400">
                          İstemci: {q.clientNameTr} • Bölge: {q.locationTr}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-black text-xs">
                      Sınıf {q.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">{q.descTr}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-300">
                    <div>
                      Ödül: <strong className="text-amber-300">₽{q.rewardMoney}</strong> +{' '}
                      <strong className="text-emerald-300">
                        {rewardIt?.nameTr} x{q.rewardItem.count}
                      </strong>
                    </div>
                    <div className="text-slate-400">{progressText}</div>
                  </div>

                  {claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Alındı
                    </span>
                  ) : (
                    <button
                      disabled={!ready}
                      onClick={() => onClaimQuest(q)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs flex items-center gap-1 shrink-0"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Ödülü Al!
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
