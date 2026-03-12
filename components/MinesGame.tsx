import React, { useState, useEffect } from 'react';
import { MinesSession } from '../types';
import { MockMinesService, MockWalletService } from '../services/mockBackend';

// Icons
const MineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const GemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-bounce" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

interface Props {
  balance: number;
  onUpdateBalance: () => void;
}

const MinesGame: React.FC<Props> = ({ balance, onUpdateBalance }) => {
  const [session, setSession] = useState<MinesSession | null>(MockMinesService.getActiveSession());
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);

  // Sound effects helper
  const playSound = (type: 'gem' | 'mine' | 'click') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'gem') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'mine') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      // Ignore audio errors
    }
  };

  const handleStart = async () => {
    if (betAmount > balance) {
      alert("Insufficient balance");
      return;
    }
    setLoading(true);
    try {
      playSound('click');
      const newSession = await MockMinesService.startGame(betAmount, minesCount);
      setSession({ ...newSession }); // Force new reference
      onUpdateBalance();
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleTileClick = async (index: number) => {
    if (!session || session.status !== 'active' || session.revealed[index] || loading) return;
    
    setLoading(true);
    try {
      const updatedSession = await MockMinesService.revealTile(index);
      setSession({ ...updatedSession });
      
      // Check result of this specific tile for sound
      if (updatedSession.status === 'exploded') {
        playSound('mine');
      } else {
        playSound('gem');
      }
      
      if (updatedSession.status !== 'active') {
        onUpdateBalance();
      }
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleCashout = async () => {
    if (!session || session.status !== 'active') return;
    setLoading(true);
    try {
      playSound('gem');
      const updatedSession = await MockMinesService.cashOut();
      setSession({ ...updatedSession });
      onUpdateBalance();
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const isGameActive = session?.status === 'active';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
         {!isGameActive ? (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-bold uppercase">Bet Amount</span>
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={e => setBetAmount(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-white text-right w-32 focus:border-amber-500 outline-none"
                  />
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-bold uppercase">Mines (1-24)</span>
                  <select 
                    value={minesCount} 
                    onChange={e => setMinesCount(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-white text-right w-32 focus:border-amber-500 outline-none"
                  >
                     {[1,3,5,10,15,20,24].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
               </div>
               <button 
                 onClick={handleStart}
                 disabled={loading || balance < betAmount}
                 className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl shadow-lg hover:from-amber-400 hover:to-orange-500 transition disabled:opacity-50 active:scale-95"
               >
                 {loading ? 'Starting...' : 'Start Game'}
               </button>
            </div>
         ) : (
            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <span className="text-slate-400 text-xs uppercase">Current Profit</span>
                  <span className="text-emerald-400 font-bold text-xl">+${(session.betAmount * session.currentMultiplier - session.betAmount).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase">Multiplier</span>
                      <span className="text-white font-mono font-bold text-lg">x{session.currentMultiplier.toFixed(2)}</span>
                   </div>
                   <button 
                     onClick={handleCashout}
                     disabled={loading}
                     className="px-8 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition active:scale-95"
                   >
                     Cash Out ${(session.betAmount * session.currentMultiplier).toFixed(2)}
                   </button>
               </div>
            </div>
         )}
      </div>

      {/* Grid */}
      <div className="relative">
         <div className="grid grid-cols-5 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner mx-auto max-w-sm">
            {Array.from({ length: 25 }).map((_, index) => {
               const isRevealed = session?.revealed[index];
               const isMine = session?.grid[index] === 1;
               const isExploded = session?.status === 'exploded' && isMine && isRevealed;
               
               return (
                  <button
                    key={index}
                    disabled={!isGameActive || isRevealed}
                    onClick={() => handleTileClick(index)}
                    className={`
                       aspect-square rounded-lg flex items-center justify-center transition-all duration-300 transform
                       ${!isRevealed 
                           ? 'bg-slate-700 hover:bg-slate-600 shadow-lg cursor-pointer active:scale-90 border-b-4 border-slate-800' 
                           : 'bg-slate-800 border border-slate-700 cursor-default'
                       }
                       ${isExploded ? 'bg-red-900/50 border-red-500' : ''}
                    `}
                  >
                     {isRevealed ? (
                        <div className="animate-pop-in">
                           {isMine ? <MineIcon /> : <GemIcon />}
                        </div>
                     ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                     )}
                  </button>
               )
            })}
         </div>

         {/* Game Over Overlay */}
         {!isGameActive && session && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               {session.status === 'exploded' && (
                  <div className="bg-red-600/90 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl animate-bounce backdrop-blur-sm border-2 border-red-400">
                     BOOM! Game Over
                  </div>
               )}
               {session.status === 'cashed_out' && (
                  <div className="bg-emerald-500/90 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl animate-bounce backdrop-blur-sm border-2 border-emerald-300">
                     You Won ${(session.betAmount * session.currentMultiplier).toFixed(2)}!
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-slate-500">
         <p>Find gems to increase multiplier. Avoid mines!</p>
         <p className="mt-1">Cash out anytime to secure your profit.</p>
      </div>
    </div>
  );
};

export default MinesGame;