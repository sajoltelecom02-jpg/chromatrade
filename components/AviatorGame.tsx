import React, { useState, useEffect, useRef } from 'react';
import { MockAviatorService } from '../services/mockBackend';
import { AviatorState, AviatorBet } from '../types';

interface Props {
  balance: number;
  onUpdateBalance: () => void;
}

const AviatorGame: React.FC<Props> = ({ balance, onUpdateBalance }) => {
  const [gameState, setGameState] = useState<AviatorState | null>(null);
  const [myBets, setMyBets] = useState<AviatorBet[]>([]);
  const [myHistory, setMyHistory] = useState<AviatorBet[]>([]);
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00);
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // Initialize Stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 50 }).map(() => ({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 2,
        speed: 0.5 + Math.random() * 2
    }));
  }, []);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const { state, myBets: bets, myHistory: history } = MockAviatorService.getGameState();
      setGameState(state);
      setMyBets(bets);
      setMyHistory(history);

      let currentMult = 1.00;
      let timeElapsed = 0;

      if (state.phase === 'flying') {
         timeElapsed = (Date.now() - state.startTime) / 1000;
         currentMult = Math.max(1, Math.exp(0.06 * timeElapsed));
         setDisplayMultiplier(currentMult);
      } else if (state.phase === 'crashed') {
         setDisplayMultiplier(state.crashPoint);
         // Keep plane at crash point visual
         timeElapsed = Math.log(state.crashPoint) / 0.06;
      } else {
         setDisplayMultiplier(1.00);
         timeElapsed = 0;
      }

      drawCanvas(state.phase, timeElapsed, currentMult);
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Canvas Drawing Logic ---
  const drawCanvas = (phase: string, time: number, multiplier: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Resize canvas to fit container
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Space Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0f172a'); // Dark Slate
      bgGrad.addColorStop(1, '#1e1b4b'); // Indigo 950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Stars (Parallax)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      starsRef.current.forEach(star => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
          
          if (phase === 'flying') {
              star.x -= star.speed * (multiplier * 0.5); // Move stars faster as multiplier grows
          } else {
              star.x -= star.speed * 0.2; // Slow drift
          }
          
          if (star.x < 0) star.x = w;
      });

      // 3. Draw Grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'; // Slate 400 very low opacity
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=1; i<5; i++) {
          const y = h - (h/5)*i;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
      }
      for(let i=1; i<5; i++) {
          const x = (w/5)*i;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
      }
      ctx.stroke();

      if (phase === 'betting') {
          // Waiting visual
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("PREPARING FLIGHT...", w/2, h/2);
          
          // Draw plane on runway
          drawPlane(ctx, 40, h - 30, 0, false);
          return;
      }

      // --- Draw Curve ---
      // Coordinate System:
      const padding = 30;
      const originX = padding;
      const originY = h - padding;
      
      // Scaling logic to keep plane on screen
      const maxX = Math.max(10, time * 1.1);
      const maxY = Math.max(2, (phase === 'crashed' ? multiplier : Math.exp(0.06 * time)) * 1.1);
      
      const scaleX = (w - 2 * padding) / maxX;
      const scaleY = (h - 2 * padding) / (maxY - 1); // Y starts at 1

      // Draw Curve Path
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      
      const step = 0.1;
      for(let t = 0; t <= time; t += step) {
          const multAtT = Math.exp(0.06 * t);
          const x = originX + t * scaleX;
          const y = originY - (multAtT - 1) * scaleY;
          ctx.lineTo(x, y);
      }
      
      const finalX = originX + time * scaleX;
      const finalY = originY - (multiplier - 1) * scaleY;
      ctx.lineTo(finalX, finalY);

      // Stroke Curve (Red Neon Glow)
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ef4444'; 
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // Fill Area (Gradient)
      ctx.lineTo(finalX, originY);
      ctx.lineTo(originX, originY);
      const areaGrad = ctx.createLinearGradient(0, finalY, 0, originY);
      areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // --- Draw Plane ---
      if (phase === 'flying') {
         drawPlane(ctx, finalX, finalY, -25, true); 
      } else if (phase === 'crashed') {
         // Explosion text
         ctx.font = '900 32px sans-serif';
         ctx.fillStyle = '#ef4444';
         ctx.textAlign = 'center';
         ctx.fillText("CRASHED", w/2, h/2);
         ctx.font = 'bold 20px sans-serif';
         ctx.fillText(`@ ${multiplier.toFixed(2)}x`, w/2, h/2 + 30);
      }
  };

  const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, rotationDeg: number, trail: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotationDeg * Math.PI / 180);
      ctx.scale(0.7, 0.7);

      // Trail Effect
      if (trail) {
        ctx.beginPath();
        ctx.moveTo(-25, 2);
        ctx.lineTo(-80, 5);
        ctx.moveTo(-25, -2);
        ctx.lineTo(-80, -5);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
        
        // Engine Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
      }

      // --- SHARP JET DESIGN ---

      // 1. Vertical Stabilizer (Tail)
      ctx.beginPath();
      ctx.moveTo(-20, -5);
      ctx.lineTo(-35, -25);
      ctx.lineTo(-10, -5);
      ctx.fillStyle = '#7f1d1d'; // Darkest Red
      ctx.fill();

      // 2. Far Wing (Left/Top)
      ctx.beginPath();
      ctx.moveTo(5, -2);
      ctx.lineTo(-15, -20);
      ctx.lineTo(-5, -2);
      ctx.fillStyle = '#991b1b';
      ctx.fill();

      // 3. Main Fuselage (Body)
      ctx.beginPath();
      ctx.moveTo(40, 0); // Nose
      ctx.lineTo(-30, 8); // Rear Bottom
      ctx.lineTo(-30, -8); // Rear Top
      ctx.closePath();
      ctx.fillStyle = '#ef4444'; // Main Red
      ctx.fill();

      // 4. Cockpit Window
      ctx.beginPath();
      ctx.moveTo(15, -4);
      ctx.lineTo(5, -7);
      ctx.lineTo(25, -6);
      ctx.closePath();
      ctx.fillStyle = '#e2e8f0'; // Light Blue/Grey
      ctx.fill();

      // 5. Near Wing (Right/Bottom)
      ctx.beginPath();
      ctx.moveTo(5, 2);
      ctx.lineTo(-20, 18);
      ctx.lineTo(15, 4);
      ctx.closePath();
      ctx.fillStyle = '#b91c1c'; // Dark Red
      ctx.fill();
      
      // Reset Shadow
      ctx.shadowBlur = 0;

      ctx.restore();
  };

  // --- Betting Handlers ---
  const handleBet = async (amount: number, panelId: 1 | 2) => {
     try {
         await MockAviatorService.placeBet(amount, panelId);
         onUpdateBalance();
     } catch(e: any) {
         // Silently fail if spamming
         console.error(e);
     }
  };

  const handleCashOut = async (panelId: 1 | 2) => {
      try {
          await MockAviatorService.cashOut(panelId);
          onUpdateBalance();
      } catch(e: any) {
          console.error(e);
      }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
        {/* Top Bar - History */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 bg-slate-800 rounded-lg px-2 border border-slate-700 h-10 items-center">
            {gameState?.history.map((m, i) => (
                <div key={i} className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold font-mono ${m >= 10 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : m >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'}`}>
                    {m.toFixed(2)}x
                </div>
            ))}
        </div>

        {/* Game Canvas Area */}
        <div className="relative h-72 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" ref={containerRef}>
             <canvas ref={canvasRef} className="absolute inset-0 z-0" />
             
             {/* Center Overlay Text */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                 {gameState?.phase === 'betting' && (
                     <div className="flex flex-col items-center animate-pulse">
                         <span className="text-2xl text-amber-500 font-bold">NEXT ROUND</span>
                         <span className="text-5xl text-white font-mono font-black mt-2">
                             {Math.max(0, ((gameState.startTime - Date.now())/1000)).toFixed(1)}s
                         </span>
                     </div>
                 )}
                 {gameState?.phase === 'flying' && (
                     <div className="flex flex-col items-center">
                         <span className="text-7xl text-white font-black font-mono drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                             {displayMultiplier.toFixed(2)}x
                         </span>
                         <span className="text-sm text-red-200 uppercase tracking-widest font-bold mt-1">Current Payout</span>
                     </div>
                 )}
             </div>
        </div>

        {/* Dual Bet Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BetControlPanel 
                panelId={1} 
                gameState={gameState} 
                activeBet={myBets.find(b => b.panelId === 1)} 
                onBet={handleBet} 
                onCashOut={handleCashOut}
                displayMultiplier={displayMultiplier}
            />
            <BetControlPanel 
                panelId={2} 
                gameState={gameState} 
                activeBet={myBets.find(b => b.panelId === 2)} 
                onBet={handleBet} 
                onCashOut={handleCashOut}
                displayMultiplier={displayMultiplier}
            />
        </div>

        {/* My History Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg mt-6">
            <div className="p-3 bg-slate-900 border-b border-slate-700">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    My History
                </h3>
            </div>
            <div className="overflow-x-auto max-h-60">
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-500">
                        <tr>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Bet</th>
                            <th className="px-4 py-2">Outcome</th>
                            <th className="px-4 py-2 text-right">Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {myHistory.map(bet => (
                            <tr key={bet.id} className="hover:bg-slate-700/30">
                                <td className="px-4 py-2 text-xs">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                <td className="px-4 py-2 font-mono text-white">${bet.amount}</td>
                                <td className="px-4 py-2">
                                    {bet.status === 'cashed' ? (
                                        <span className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-1 rounded text-xs">
                                            {bet.cashedOutMultiplier?.toFixed(2)}x
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs">Crashed</span>
                                    )}
                                </td>
                                <td className={`px-4 py-2 text-right font-bold ${bet.status === 'cashed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {bet.status === 'cashed' ? `+$${(bet.payout! - bet.amount).toFixed(2)}` : `-$${bet.amount}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

// --- Sub-component for individual betting panel ---
interface PanelProps {
    panelId: 1 | 2;
    gameState: AviatorState | null;
    activeBet: AviatorBet | undefined;
    onBet: (amount: number, panelId: 1 | 2) => void;
    onCashOut: (panelId: 1 | 2) => void;
    displayMultiplier: number;
}

const BetControlPanel: React.FC<PanelProps> = ({ panelId, gameState, activeBet, onBet, onCashOut, displayMultiplier }) => {
    const [amount, setAmount] = useState(10);

    const isBetting = gameState?.phase === 'betting';
    const isFlying = gameState?.phase === 'flying';
    
    // Status Logic
    const isPlaced = !!activeBet;
    const canCashOut = isPlaced && activeBet.status === 'active' && isFlying;
    
    return (
        <div className={`p-3 rounded-xl border-2 transition-all ${isPlaced ? 'bg-slate-800 border-amber-500/50' : 'bg-slate-800 border-slate-700'}`}>
            {/* Quick Amounts */}
            <div className="flex gap-1 justify-between mb-3">
                {[10, 50, 100, 500].map(val => (
                    <button 
                        key={val} 
                        onClick={() => !isPlaced && setAmount(val)} 
                        disabled={isPlaced}
                        className={`flex-1 text-[10px] py-1 rounded font-bold border transition ${amount === val ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-900 border-transparent text-slate-500 hover:border-slate-600'}`}
                    >
                        {val}
                    </button>
                ))}
            </div>

            {/* Input & Big Button */}
            <div className="flex gap-2 h-12">
                <div className="relative w-24">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        disabled={isPlaced}
                        className="w-full h-full bg-slate-900 border border-slate-600 rounded-lg pl-2 pr-1 text-center font-bold text-white focus:border-amber-500 outline-none disabled:opacity-50"
                    />
                </div>
                
                {canCashOut ? (
                    <button 
                        onClick={() => onCashOut(panelId)}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] transition active:scale-95 flex flex-col items-center justify-center leading-none"
                    >
                        <span className="text-xs uppercase">Cash Out</span>
                        <span className="text-lg">${(activeBet.amount * displayMultiplier).toFixed(2)}</span>
                    </button>
                ) : (
                    <button 
                        onClick={() => onBet(amount, panelId)}
                        disabled={!isBetting || isPlaced}
                        className={`flex-1 font-bold rounded-lg transition active:scale-95 flex flex-col items-center justify-center leading-none ${
                            isPlaced 
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50 cursor-default' 
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg'
                        } disabled:opacity-50`}
                    >
                        {isPlaced ? (
                            <>
                                <span className="text-xs uppercase">Bet Placed</span>
                                <span className="text-xs">Waiting...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm uppercase">BET</span>
                                <span className="text-xs opacity-80">NEXT ROUND</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Info Footer */}
            {activeBet && activeBet.status === 'cashed' && (
                <div className="mt-2 text-center bg-emerald-500/10 border border-emerald-500/20 rounded py-1">
                    <span className="text-xs text-emerald-400 font-bold">Won ${(activeBet.payout! - activeBet.amount).toFixed(2)}</span>
                </div>
            )}
        </div>
    );
};

export default AviatorGame;