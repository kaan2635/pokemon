import React, { useState } from 'react';
import { DifficultyMode, SaveState } from '../types/game';
import { assetUrl } from '../utils/assetPath';
import { Sparkles, Play, RotateCcw, Upload, Shield, Flame, Trophy } from 'lucide-react';

interface TitleScreenProps {
  existingSave: SaveState | null;
  onContinue: () => void;
  onStartNew: (playerName: string, rivalName: string, difficulty: DifficultyMode, nuzlocke: boolean) => void;
  onImportSave: (save: SaveState) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  existingSave,
  onContinue,
  onStartNew,
  onImportSave,
}) => {
  const [showNewForm, setShowNewForm] = useState(!existingSave);
  const [playerName, setPlayerName] = useState('Red');
  const [rivalName, setRivalName] = useState('Blue');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [nuzlocke, setNuzlocke] = useState(false);
  const [importError, setImportError] = useState('');

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SaveState;
        if (parsed && parsed.mapId && Array.isArray(parsed.party)) {
          onImportSave(parsed);
        } else {
          setImportError('Geçersiz kayıt dosyası formatı.');
        }
      } catch {
        setImportError('Kayıt dosyası okunamadı.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-red-950/60 to-emerald-950/80 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Retro Background Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ef4444_0%,transparent_35%),radial-gradient(circle_at_80%_75%,#10b981_0%,transparent_40%)]" />

      <div className="max-w-4xl w-full z-10 flex flex-col items-center">
        {/* GBA Cartridge Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-amber-300 text-xs font-bold tracking-widest uppercase mb-3 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          GAME BOY ADVANCE • EFSANELER KARMASI SÜRÜMÜ
        </div>

        {/* Title Logo */}
        <div className="text-center mb-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-red-400 to-emerald-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            POKÉMON: KIZIL ZÜMRÜT
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
            FireRed &amp; LeafGreen • Emerald Battle Frontier • Ruby/Sapphire • Red Rescue Team • Pinball
          </p>
        </div>

        {/* Hero GBA + Mega Sprite Showcase */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 my-2 px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-700/70 backdrop-blur-sm shadow-2xl">
          {[3, 10034, 9, 10079, 10050, 282, 10043].map((id, idx) => (
            <div key={id} className="flex flex-col items-center">
              <img
                src={assetUrl(`sprites/front/${id}.png`)}
                alt={`Pokemon ${id}`}
                style={{ imageRendering: 'pixelated' }}
                className={`w-14 h-14 sm:w-20 sm:h-20 object-contain transition-transform hover:scale-110 ${
                  idx === 3 ? 'scale-125 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]' : idx === 1 ? 'scale-115 drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]' : ''
                }`}
              />
            </div>
          ))}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 my-3 text-[11px] text-slate-300">
          <span className="px-2.5 py-1 rounded-md bg-fuchsia-950/90 border border-fuchsia-500/60 text-fuchsia-200 font-bold">✨ 31 Mega Evrim &amp; İlkel Dönüşüm + Peri Tipi</span>
          <span className="px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-700/50">⚡ Dinamaks Akın İnleri &amp; Harika Takas</span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/50">8 Salon + Elit Dörtlü + Savaş Sınırı</span>
          <span className="px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-700/50">PokéNav, DexNav, Safari, Pinball &amp; Kurtarma Loncası</span>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-xl bg-slate-900/90 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl mt-1">
          {existingSave && !showNewForm ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/90 border border-emerald-500/40">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Kayıtlı Macera Bulundu</span>
                    <h2 className="text-xl font-bold text-white">{existingSave.playerName}</h2>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <div className="font-semibold text-amber-300">{existingSave.badges.length} / 8 Rozet</div>
                    <div>Pokédex: {existingSave.pokedexCaught.length} Yakalandı</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {existingSave.party.map((m) => (
                    <div key={m.uid} className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700">
                      <img src={assetUrl(`sprites/icons/${m.speciesId}.png`)} alt="" style={{ imageRendering: 'pixelated' }} className="w-7 h-7" />
                      <span className="text-xs font-bold text-slate-200">Lv.{m.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onContinue}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Play className="w-5 h-5 fill-current" />
                MACERAYA DEVAM ET
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Yeni Oyun Başlat
                </button>
                <label className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  Kayıt Yükle (.json)
                  <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Eğitmen Adın</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Rakibin Adı</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={rivalName}
                    onChange={(e) => setRivalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Oyun Zorluğu (GBA Dengesi)</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDifficulty('normal')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      difficulty === 'normal'
                        ? 'bg-emerald-950/80 border-emerald-400 text-white'
                        : 'bg-slate-950/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Klasik FireRed
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Dengeli seviye eğrisi, keyifli keşif ve strateji.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('emerald_hard')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      difficulty === 'emerald_hard'
                        ? 'bg-red-950/80 border-red-400 text-white'
                        : 'bg-slate-950/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <Flame className="w-4 h-4 text-red-400" />
                      Zümrüt Ustası (Zor)
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Radical Red esintili akıllı AI ve güçlü liderler!</p>
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Nuzlocke Onur Modu (Opsiyonel)</div>
                    <div className="text-[11px] text-slate-400">Bayılan Pokémonlar Merkez dışında kullanılamaz, heyecanı zirveye taşır.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={nuzlocke}
                  onChange={(e) => setNuzlocke(e.target.checked)}
                  className="w-4 h-4 accent-amber-400"
                />
              </label>

              <div className="flex gap-2 pt-1">
                {existingSave && (
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm"
                  >
                    Geri
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onStartNew(playerName, rivalName, difficulty, nuzlocke)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  PALET KASABASINDA BAŞLA!
                </button>
              </div>

              {!existingSave && (
                <div className="text-center pt-1">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Önceki Kayıt Dosyasını (.json) İçe Aktar
                    <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          )}

          {importError && <p className="text-xs text-red-400 text-center mt-2">{importError}</p>}
        </div>

        {/* Quick Controls Hint */}
        <div className="mt-3 text-[11px] text-slate-400 text-center">
          Kontroller: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">WASD / Oklar</kbd> Hareket •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Z / Enter / Boşluk</kbd> Etkileşim (A) •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Shift</kbd> Koş •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">B</kbd> Bisiklet •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">P</kbd> PokéNav • Dokunmatik GBA Tuşları Dahil!
        </div>
      </div>
    </div>
  );
};
