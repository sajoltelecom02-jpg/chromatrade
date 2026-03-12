import React, { useEffect, useState, useRef } from 'react';
import { GameDuration } from '../types';
import { LOCK_TIMES } from '../services/mockBackend';

interface GameTimerProps {
  onPeriodChange: (periodId: string) => void;
  periodId: string;
  duration: GameDuration;
}

const GameTimer: React.FC<GameTimerProps> = ({ onPeriodChange, periodId, duration }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const lastTickRef = useRef<number>(-1);

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    // Reset timer display immediately when duration changes
    setTimeLeft(duration);
    lastTickRef.current = -1;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const totalSeconds = Math.floor(now / 1000);
      const elapsed = totalSeconds % duration;
      const remaining = duration - elapsed;

      // Check if we entered a new second
      if (remaining !== lastTickRef.current) {
        // Play sound for last 5 seconds (5, 4, 3, 2, 1)
        if (remaining <= 5 && remaining > 0) {
          playBeep();
        }
        lastTickRef.current = remaining;
      }

      setTimeLeft(remaining);
    }, 200);

    return () => clearInterval(interval);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const lockTime = LOCK_TIMES[duration];
  const isLocked = timeLeft <= lockTime;

  return (
    <div className="relative">
      <div className="w-full bg-slate-800 rounded-xl p-4 flex justify-between items-center shadow-lg border border-slate-700">
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
             {duration === 30 ? 'Fast Parity' : 'Parity'} Period
          </span>
          <span className="text-xl font-bold text-white">{periodId}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Count Down</span>
          <div className={`text-2xl font-mono font-bold ${isLocked ? 'text-red-500' : 'text-emerald-400'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTimer;