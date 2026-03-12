import React, { useState, useEffect } from 'react';
import { GameDuration, Bet, WheelNumber } from '../../types';
import { MockGameService, MockAuthService, MockWheelService } from '../../services/mockBackend';

// Shared UI constants
const GAME_MODES: { duration: GameDuration; label: string; short: string }[] = [
  { duration: 30, label: 'Fast 30s', short: '30s' },
  { duration: 60, label: '1 Min', short: '1m' },
  { duration: 180, label: '3 Min', short: '3m' },
  { duration: 300, label: '5 Min', short: '5m' },
  { duration: 600, label: '10 Min', short: '10m' },
];

interface AdminDashboardProps {
  gameDuration: GameDuration;
  setGameDuration: (d: GameDuration) => void;
  stats: any;
  liveBets: Bet[];
  onRefresh: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  gameDuration, 
  setGameDuration, 
  stats, 
  liveBets, 
  onRefresh 
}) => {
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
      const config = MockAuthService.getSystemConfig();
      setTelegramLink(config.telegramLink);
  }, []);

  const handleUpdateTelegram = () => {
      MockAuthService.updateTelegramLink(telegramLink);
      alert("Telegram Link updated!");
  };

  const getNumberColorClass = (num: number) => {
     if(num===0) return 'bg-gradient-to-br from-red-500 to-violet-500';
     if(num===5) return 'bg-gradient-to-br from-emerald-500 to-violet-500';
     if([1,3,7,9].includes(num)) return 'bg-emerald-500';
     return 'bg-red-500';
  };

  const handleForceResult = (num: number) => {
    MockGameService.setNextResult(num, gameDuration);
    onRefresh();
    alert(`✅ Next result for ${gameDuration}s forced to: ${num}`);
  };

  const handleForceWheelResult = (num: WheelNumber) => {
    MockWheelService.forceResult(num);
    alert(`✅ Next Mega Wheel result forced to: ${num}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* System Config */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <h2 className="text-sm font-bold text-white mb-2">System Configuration</h2>
          <div className="flex gap-2">
              <input 
                 type="text" 
                 value={telegramLink} 
                 onChange={(e) => setTelegramLink(e.target.value)}
                 className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                 placeholder="Telegram Support Link (https://t.me/...)"
              />
              <button onClick={handleUpdateTelegram} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold transition">
                  Save
              </button>
          </div>
      </div>

      {/* Game Selector */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          Game Control
        </h2>
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
            {GAME_MODES.map(mode => (
                <button 
                  key={mode.duration} 
                  onClick={() => setGameDuration(mode.duration)} 
                  className={`px-3 py-1.5 text-[10px] rounded-md font-bold transition-all ${gameDuration===mode.duration ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {mode.short}
                </button>
            ))}
        </div>
      </div>
      
      {/* Live Monitor & Force Result */}
      {stats && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monitor Card */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
                Live Pools 
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-1 rounded-full animate-pulse">
                  ● Live ({gameDuration}s)
                </span>
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center"><p className="text-[10px] text-red-400 uppercase font-bold mb-1">Red</p><p className="text-xl font-bold text-red-500">${stats.red}</p></div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center"><p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Green</p><p className="text-xl font-bold text-emerald-500">${stats.green}</p></div>
                  <div className="bg-violet-500/10 border border-violet-500/20 p-3 rounded-lg text-center"><p className="text-[10px] text-violet-400 uppercase font-bold mb-1">Violet</p><p className="text-xl font-bold text-violet-500">${stats.violet}</p></div>
              </div>
              
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Total Pool: <span className="text-white font-bold ml-1">${stats.poolSize}</span></span>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">System Result</p>
                    <div className="flex items-center gap-2 justify-end">
                        {stats.forcedResult !== null ? (
                          <span className="text-amber-500 font-bold text-xs flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ⚠️ Forced: {stats.forcedResult}
                          </span>
                        ) : (
                          <>
                            <span className="text-slate-400 text-xs">Winner:</span>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm text-white ${getNumberColorClass(stats.projectedResult)}`}>
                              {stats.projectedResult}
                            </span>
                          </>
                        )}
                    </div>
                </div>
              </div>
          </div>

          {/* Force Control Card */}
          <div className="bg-slate-800 p-4 rounded-xl border border-amber-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-amber-500/5 rotate-12">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              </div>
              
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Force Outcome (Next)</h3>
              <div className="grid grid-cols-5 gap-3 relative z-10">
                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                    <button 
                      key={num} 
                      onClick={() => handleForceResult(num)} 
                      className={`
                        h-10 rounded-lg font-bold text-sm text-white shadow-md transition-all transform hover:scale-105 active:scale-95 border border-white/10
                        ${getNumberColorClass(num)} 
                        ${stats.forcedResult === num ? 'ring-2 ring-white scale-110 shadow-xl' : 'opacity-90 hover:opacity-100'}
                      `}
                    >
                      {num}
                    </button>
                ))}
              </div>
          </div>
      </div>
      )}
      
      {/* Mega Wheel Control Section */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mt-6">
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            Mega Wheel Force Result
          </h3>
          <p className="text-xs text-slate-400 mb-3">Force the result for the next spin. This will override random logic.</p>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
              {[1, 2, 5, 8, 10, 15, 20, 30, 40].map((num) => (
                  <button
                      key={num}
                      onClick={() => handleForceWheelResult(num as WheelNumber)}
                      className="h-10 rounded-lg font-bold text-sm text-white bg-slate-700 hover:bg-amber-600 hover:text-black transition shadow-md border border-slate-600 active:scale-95"
                  >
                      {num}
                  </button>
              ))}
          </div>
      </div>

      {/* Bets Stream */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg mt-6">
         <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              Active Bets Stream
              <span className="bg-slate-700 text-[10px] px-2 py-0.5 rounded-full text-slate-300">{liveBets.length}</span>
            </h3>
         </div>
         <div className="max-h-48 overflow-y-auto p-2 space-y-1">
            {liveBets.map(b => (
            <div key={b.id} className="flex justify-between items-center p-2 hover:bg-slate-700/30 rounded-lg transition border-b border-slate-700/50 last:border-0">
                <span className="flex items-center gap-2">
                   <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${b.selection==='green'?'bg-emerald-500':b.selection==='red'?'bg-red-500':b.selection==='violet'?'bg-violet-500':'bg-slate-200'}`}></span>
                   <span className="text-xs text-slate-300 capitalize font-medium">{b.selection}</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold text-xs">${b.amount}</span>
            </div>
            ))}
            {liveBets.length === 0 && <div className="py-8 text-center text-slate-500 text-xs italic">No bets placed in current period.</div>}
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;