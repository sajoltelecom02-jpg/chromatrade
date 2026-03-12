import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDuration, GameResult, Bet } from '../types';
import { MockGameService, LOCK_TIMES } from '../services/mockBackend';
import GameTimer from './GameTimer';
import BetModal from './BetModal';
import BettingHistory from './BettingHistory';

interface Props {
  balance: number;
  onUpdateBalance: () => void;
}

const GAME_MODES: { duration: GameDuration; label: string; short: string }[] = [
  { duration: 30, label: 'Fast 30s', short: '30s' },
  { duration: 60, label: '1 Min', short: '1m' },
  { duration: 180, label: '3 Min', short: '3m' },
  { duration: 300, label: '5 Min', short: '5m' },
  { duration: 600, label: '10 Min', short: '10m' },
];

const ColorGame: React.FC<Props> = ({ balance, onUpdateBalance }) => {
  const [gameDuration, setGameDuration] = useState<GameDuration>(180);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>(MockGameService.getCurrentPeriodId(180));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Game State
  const [history, setHistory] = useState<GameResult[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betSelection, setBetSelection] = useState<string | number | null>(null);
  const [betType, setBetType] = useState<'color' | 'number' | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const refreshGameData = useCallback(() => {
    setHistory([...MockGameService.getHistory(gameDuration)]);
    setMyBets([...MockGameService.getUserBets(gameDuration)]);
    // Trigger parent balance update
    onUpdateBalance();
  }, [gameDuration, onUpdateBalance]);

  // Handle Duration Change
  useEffect(() => {
    const newPeriodId = MockGameService.getCurrentPeriodId(gameDuration);
    setCurrentPeriodId(newPeriodId);
    refreshGameData();
  }, [gameDuration, refreshGameData]);

  // Main Loop
  const tickRef = useRef<() => void>(null);
  useEffect(() => {
    tickRef.current = () => {
      const activePeriod = MockGameService.getCurrentPeriodId(gameDuration);
      const now = Date.now();
      const elapsed = Math.floor(now / 1000) % gameDuration;
      setTimeLeft(gameDuration - elapsed);

      const result = MockGameService.checkPeriodEnd(currentPeriodId, gameDuration);
      if (result) {
        refreshGameData();
        setCurrentPeriodId(activePeriod);
        
        // Check for wins
        const currentBets = MockGameService.getUserBets(gameDuration);
        const wins = currentBets.filter(b => b.periodId === result.periodId && b.status === 'win');
        if (wins.length > 0) {
           const totalWon = wins.reduce((acc, curr) => acc + curr.payout, 0);
           setLastWin(totalWon);
           setTimeout(() => setLastWin(null), 4000);
           onUpdateBalance();
        }
      } else if (activePeriod !== currentPeriodId) {
        setCurrentPeriodId(activePeriod);
      }
    };
  });

  useEffect(() => {
    const interval = setInterval(() => { if (tickRef.current) tickRef.current(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openBetModal = (sel: string | number, type: 'color' | 'number') => {
    const now = Date.now();
    const elapsed = Math.floor(now / 1000) % gameDuration;
    if (gameDuration - elapsed <= LOCK_TIMES[gameDuration]) {
      alert("Betting is locked for this period!");
      return;
    }
    setBetSelection(sel);
    setBetType(type);
    setBetModalOpen(true);
  };

  const confirmBet = async (amount: number) => {
    try {
      if (betSelection === null || !betType) return;
      await MockGameService.placeBet(betSelection, betType, amount, currentPeriodId, gameDuration);
      setBetModalOpen(false);
      refreshGameData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getNumberColorClass = (num: number) => {
     if(num===0) return 'bg-gradient-to-br from-red-500 to-violet-500';
     if(num===5) return 'bg-gradient-to-br from-emerald-500 to-violet-500';
     if([1,3,7,9].includes(num)) return 'bg-emerald-500';
     return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
        {lastWin && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2 border-2 border-white/20">
             <span>🎉</span><span className="font-bold">You Won ${lastWin.toFixed(2)}!</span>
          </div>
        )}

        <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700 overflow-x-auto no-scrollbar">
            {GAME_MODES.map(mode => (
                <button key={mode.duration} onClick={() => setGameDuration(mode.duration)} className={`flex-1 min-w-[60px] py-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${gameDuration === mode.duration ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>{mode.label}</button>
            ))}
        </div>

        <GameTimer periodId={currentPeriodId} onPeriodChange={setCurrentPeriodId} duration={gameDuration} />

        <div className="relative rounded-2xl">
            {timeLeft <= 5 && timeLeft > 0 && (
            <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl border border-red-500/30 animate-fade-in select-none">
                <span className="text-3xl font-bold text-red-500 animate-pulse uppercase tracking-widest">Stop Betting</span>
                <div className="mt-4 w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center bg-slate-800 shadow-[0_0_30px_rgba(239,68,68,0.4)]"><span className="text-5xl font-mono font-bold text-white">{timeLeft}</span></div>
            </div>
            )}
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                <button onClick={() => openBetModal('green', 'color')} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-center shadow-lg transition transform hover:scale-105 active:scale-95">
                    <div className="relative z-10 text-white font-bold text-lg drop-shadow-md">Green</div>
                    <div className="relative z-10 text-emerald-100 text-xs mt-1">Join Green</div>
                </button>
                <button onClick={() => openBetModal('violet', 'color')} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-center shadow-lg transition transform hover:scale-105 active:scale-95">
                    <div className="relative z-10 text-white font-bold text-lg drop-shadow-md">Violet</div>
                    <div className="relative z-10 text-violet-100 text-xs mt-1">Join Violet</div>
                </button>
                <button onClick={() => openBetModal('red', 'color')} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-center shadow-lg transition transform hover:scale-105 active:scale-95">
                    <div className="relative z-10 text-white font-bold text-lg drop-shadow-md">Red</div>
                    <div className="relative z-10 text-red-100 text-xs mt-1">Join Red</div>
                </button>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-3"><span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Number Selection</span><span className="text-xs text-amber-500">x9 Payout</span></div>
                <div className="grid grid-cols-5 gap-2">
                    {[0,1,2,3,4,5,6,7,8,9].map(num => (
                        <button key={num} onClick={() => openBetModal(num, 'number')} className={`relative h-12 rounded-lg font-mono text-lg font-bold text-white shadow-md transition transform hover:scale-110 active:scale-95 overflow-hidden bg-slate-800`}><div className={`absolute inset-0 opacity-20 ${getNumberColorClass(num)}`}></div><span className="relative z-10">{num}</span></button>
                    ))}
                </div>
                </div>
            </div>
        </div>
        
        <BettingHistory history={history} myBets={myBets} />

        {betModalOpen && <BetModal selection={betSelection} type={betType} balance={balance} onClose={() => setBetModalOpen(false)} onConfirm={confirmBet} />}
    </div>
  );
};

export default ColorGame;