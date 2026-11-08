import React, { useEffect, useRef, useState } from 'react';
import { POKEDEX } from '../data/pokedex';
import { audio } from '../engine/audio';
import { Gamepad2, Gift, X } from 'lucide-react';

interface PinballModalProps {
  coins: number;
  onAddCoins: (amount: number) => void;
  onRedeemPokemon: (speciesId: number, level: number, coinCost: number) => string;
  onClose: () => void;
}

const PRIZE_POKEMON: Array<{ speciesId: number; level: number; cost: number; tag: string }> = [
  { speciesId: 137, level: 25, cost: 120, tag: 'Celadon Siber Klasik!' },
  { speciesId: 123, level: 26, cost: 160, tag: 'Metal Kaplama ile Scizor olur!' },
  { speciesId: 147, level: 25, cost: 220, tag: 'Dragonite Evrim Soyu!' },
  { speciesId: 246, level: 26, cost: 260, tag: 'Tyranitar Evrim Soyu!' },
  { speciesId: 374, level: 25, cost: 300, tag: 'Hoenn Efsanesi Metagross Soyu!' },
];

export const PinballModal: React.FC<PinballModalProps> = ({
  coins,
  onAddCoins,
  onRedeemPokemon,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [msg, setMsg] = useState('A / D veya Sol / Sağ Ok tuşlarıyla paletleri kontrol et, Fırlat ile başla!');

  const stateRef = useRef({
    ballX: 150,
    ballY: 120,
    vx: 2.8,
    vy: -3.5,
    inPlay: false,
    leftDown: false,
    rightDown: false,
    score: 0,
    balls: 3,
  });

  const launchBall = () => {
    const st = stateRef.current;
    if (st.inPlay) return;
    if (st.balls <= 0) {
      st.balls = 3;
      st.score = 0;
      setScore(0);
      setBallsLeft(3);
    }
    st.ballX = 255;
    st.ballY = 310;
    st.vx = -2.2 - Math.random() * 1.8;
    st.vy = -8.5 - Math.random() * 2;
    st.inPlay = true;
    audio.playSfx('ball_throw');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftDown = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightDown = true;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        launchBall();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftDown = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightDown = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const bumpers = [
      { x: 95, y: 105, r: 22, color: '#ef4444', pts: 150, label: 'RUBY' },
      { x: 205, y: 105, r: 22, pts: 150, color: '#3b82f6', label: 'SAPPHIRE' },
      { x: 150, y: 165, r: 25, pts: 250, color: '#10b981', label: 'EMERALD' },
    ];

    const step = () => {
      const cvs = canvasRef.current;
      const ctx = cvs?.getContext('2d');
      const st = stateRef.current;

      if (ctx && cvs) {
        const W = cvs.width;
        const H = cvs.height;

        if (st.inPlay) {
          st.vy += 0.18; // gravity
          st.ballX += st.vx;
          st.ballY += st.vy;

          // Walls
          if (st.ballX < 14) {
            st.ballX = 14;
            st.vx = Math.abs(st.vx) * 0.9;
          }
          if (st.ballX > W - 14) {
            st.ballX = W - 14;
            st.vx = -Math.abs(st.vx) * 0.9;
          }
          if (st.ballY < 14) {
            st.ballY = 14;
            st.vy = Math.abs(st.vy) * 0.9;
          }

          // Bumpers
          for (const b of bumpers) {
            const dx = st.ballX - b.x;
            const dy = st.ballY - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < b.r + 9) {
              const nx = dx / Math.max(1, dist);
              const ny = dy / Math.max(1, dist);
              st.ballX = b.x + nx * (b.r + 10);
              st.ballY = b.y + ny * (b.r + 10);
              st.vx = nx * 6.2;
              st.vy = ny * 6.2;
              st.score += b.pts;
              setScore(st.score);
              audio.playSfx('select');
            }
          }

          // Side Slingshots
          if (st.ballY > 270 && st.ballY < 325) {
            if (st.ballX < 62) {
              st.ballX = 63;
              st.vx = Math.abs(st.vx) + 1.5;
              st.vy = -4.5;
            } else if (st.ballX > W - 62) {
              st.ballX = W - 63;
              st.vx = -Math.abs(st.vx) - 1.5;
              st.vy = -4.5;
            }
          }

          // Left & Right Flippers
          const flipY = 338;
          if (st.ballY >= flipY - 12 && st.ballY <= flipY + 14 && st.vy > 0) {
            // Left flipper (65 .. 142)
            if (st.ballX >= 58 && st.ballX <= 145) {
              st.ballY = flipY - 12;
              st.vy = st.leftDown ? -9.6 : -6.2;
              st.vx = (st.ballX - 100) * 0.12 + (st.leftDown ? 1.8 : 0);
              if (st.leftDown) {
                st.score += 50;
                setScore(st.score);
              }
              audio.playSfx('hit');
            }
            // Right flipper (155 .. 242)
            else if (st.ballX >= 155 && st.ballX <= 242) {
              st.ballY = flipY - 12;
              st.vy = st.rightDown ? -9.6 : -6.2;
              st.vx = (st.ballX - 200) * 0.12 - (st.rightDown ? 1.8 : 0);
              if (st.rightDown) {
                st.score += 50;
                setScore(st.score);
              }
              audio.playSfx('hit');
            }
          }

          // Drain check
          if (st.ballY > H + 15) {
            st.inPlay = false;
            st.balls -= 1;
            setBallsLeft(st.balls);
            const earned = Math.max(5, Math.floor(st.score / 80));
            if (st.balls <= 0) {
              onAddCoins(earned);
              setSessionCoins((c) => c + earned);
              setMsg(`Oyun bitti! ${st.score} puanla +${earned} Jeton kazandın! Tekrar Fırlat ile yeni tur başlat!`);
              audio.playSfx('catch_success');
            } else {
              setMsg(`Top düştü! Kalan Poké Topu: ${st.balls}. Fırlat tuşuna bas!`);
            }
          }
        }

        // Draw Table
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // Decorative Rails
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, W - 12, H - 12);

        // Bumpers
        for (const b of bumpers) {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, b.x, b.y + 3);
        }

        // Slingshots
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(20, 275, 38, 8);
        ctx.fillRect(W - 58, 275, 38, 8);

        // Flippers
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = 10;
        ctx.strokeStyle = st.leftDown ? '#fde047' : '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(65, 338);
        ctx.lineTo(138, st.leftDown ? 320 : 344);
        ctx.stroke();

        ctx.strokeStyle = st.rightDown ? '#fde047' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(235, 338);
        ctx.lineTo(162, st.rightDown ? 320 : 344);
        ctx.stroke();
        ctx.restore();

        // Poké Ball Pinball
        if (st.inPlay) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(st.ballX, st.ballY, 9, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(st.ballX, st.ballY, 9, 0, Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(st.ballX, st.ballY, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onAddCoins]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border-2 border-pink-500/70 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                POKÉMON PINBALL: RUBY &amp; SAPPHIRE SALONU
              </h2>
              <div className="text-xs text-amber-300 font-bold">
                Mevcut Jeton: {coins} 🪙 {sessionCoins > 0 && `(Bu oturumda +${sessionCoins})`}
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

        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Arcade Pinball Canvas */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="flex items-center justify-between w-[300px] mb-2 text-xs font-black">
              <span className="text-emerald-300">SKOR: {score}</span>
              <span className="text-rose-300">TOP: {'●'.repeat(Math.max(0, ballsLeft))}</span>
            </div>

            <canvas
              ref={canvasRef}
              width={300}
              height={370}
              className="rounded-xl border-2 border-slate-700 shadow-inner bg-slate-950"
            />

            <div className="grid grid-cols-3 gap-2 w-[300px] mt-2.5">
              <button
                onMouseDown={() => (stateRef.current.leftDown = true)}
                onMouseUp={() => (stateRef.current.leftDown = false)}
                onTouchStart={() => (stateRef.current.leftDown = true)}
                onTouchEnd={() => (stateRef.current.leftDown = false)}
                className="py-2.5 rounded-xl bg-rose-600 active:bg-amber-400 text-white font-black text-xs"
              >
                ◀ SOL PALET (A)
              </button>
              <button
                onClick={launchBall}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
              >
                🚀 FIRLAT!
              </button>
              <button
                onMouseDown={() => (stateRef.current.rightDown = true)}
                onMouseUp={() => (stateRef.current.rightDown = false)}
                onTouchStart={() => (stateRef.current.rightDown = true)}
                onTouchEnd={() => (stateRef.current.rightDown = false)}
                className="py-2.5 rounded-xl bg-sky-600 active:bg-amber-400 text-white font-black text-xs"
              >
                SAĞ PALET (D) ▶
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2 max-w-[300px]">{msg}</p>
          </div>

          {/* Right Celadon Game Corner Prize Exchange */}
          <div className="md:col-span-6 space-y-2.5">
            <div className="flex items-center gap-1.5 text-sm font-black text-amber-300">
              <Gift className="w-4 h-4" />
              CELADON ÖDÜL GİŞESİ (Nadir Pokémonlar)
            </div>
            <p className="text-xs text-slate-400">
              Pinball masasında topladığın Jetonlarla Kanto ve Hoenn&apos;in en nadir Pokémonlarını hemen takımına/kutuna kat!
            </p>
            {PRIZE_POKEMON.map((pr) => {
              const sp = POKEDEX[pr.speciesId];
              return (
                <div
                  key={pr.speciesId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={`/sprites/front/${pr.speciesId}.png`}
                      alt={sp.name}
                      style={{ imageRendering: 'pixelated' }}
                      className="w-12 h-12 bg-slate-900 rounded-lg p-1"
                    />
                    <div>
                      <div className="font-black text-sm text-white">
                        {sp.name} <span className="text-xs text-emerald-400">Lv.{pr.level}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{pr.tag}</div>
                    </div>
                  </div>
                  <button
                    disabled={coins < pr.cost}
                    onClick={() => setMsg(onRedeemPokemon(pr.speciesId, pr.level, pr.cost))}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs shrink-0"
                  >
                    {pr.cost} 🪙 Al
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
