import React, { useState, useEffect, useRef } from 'react';
import { WheelNumber, WheelSegment, WheelGameState } from '../types';
import { MockWheelService } from '../services/mockBackend';

interface Props {
  balance: number;
  onUpdateBalance: () => void;
}

const WheelGame: React.FC<Props> = ({ balance, onUpdateBalance }) => {
  const [segments] = useState<WheelSegment[]>(MockWheelService.getSegments());
  
  // Game State
  const [gameState, setGameState] = useState<WheelGameState | null>(null);
  const [rotation, setRotation] = useState(0);
  
  // Visual States for Sequence
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // User State
  const [bets, setBets] = useState<Record<number, number>>({});
  const [totalBet, setTotalBet] = useState(0);
  const [chipValue, setChipValue] = useState(10);
  const [previousBets, setPreviousBets] = useState<Record<number, number> | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Refs for animation
  const requestRef = useRef<number>();
  const lastPhaseRef = useRef<string>('');

  // Updated Chip Values
  const CHIP_VALUES = [10, 20, 50, 100, 200, 500, 1000, 2500, 5000, 10000];

  // --- Game Loop ---
  const animate = () => {
      const state = MockWheelService.getGameState();
      setGameState(state);

      // --- SEQUENCE LOGIC ---
      if (state.phase === 'result' && state.result && lastPhaseRef.current === 'betting') {
          // 1. SEQUENCE START: Show Multiplier (Time ends)
          setShowMultiplier(true);
          
          // 2. Wait 2s, then SPIN
          setTimeout(() => {
              setIsSpinning(true);
              const degPerSegment = 360 / 54;
              const targetIndex = state.result!.winningSegmentIndex;
              
              // ALIGNMENT LOGIC:
              // The SVG is rotated -90deg via CSS, so Index 0 starts at 12 o'clock (Top).
              // Index 'i' is located at (i * degPerSegment) clockwise from Index 0.
              // To bring Index 'i' to the Top (0 deg), we must rotate the wheel 
              // such that the segment moves Counter-Clockwise to 0.
              // Target Rotation (Clockwise) = 360 - (Segment Angle).
              
              const segmentCenterAngle = (targetIndex * degPerSegment) + (degPerSegment / 2);
              
              // Calculate delta to reach this specific angle from current rotation
              // We want: (Current + Delta) % 360 = (360 - segmentCenterAngle)
              const targetAngleOnCircle = (360 - segmentCenterAngle) % 360;
              const currentMod = rotation % 360;
              
              let forwardDistance = targetAngleOnCircle - currentMod;
              if (forwardDistance < 0) forwardDistance += 360;
              
              // Add minimum spins (e.g. 5 full rotations + distance)
              const spins = 360 * 5; 
              const finalTarget = rotation + spins + forwardDistance;
              
              setRotation(finalTarget);

              // 3. Wait for Spin to End (4.5s matches CSS) -> Show Win
              setTimeout(() => {
                  setIsSpinning(false);
                  setShowMultiplier(false);
                  onUpdateBalance();
                  
                  // Local Win Calculation
                  const winningNum = state.result!.winningValue;
                  const myBet = bets[winningNum] || 0;
                  if (myBet > 0) {
                      const mult = (state.result!.multiplierNumber === winningNum) ? state.result!.multiplierValue : winningNum;
                      setLastWin(myBet * (mult + 1));
                      setTimeout(() => setLastWin(null), 4000);
                  }
                  
              }, 4500); // Sync with transition duration

          }, 2000); // 2s delay for multiplier reveal
      }

      // Handle Reset
      if (state.phase === 'betting' && lastPhaseRef.current === 'result') {
          // Round reset
          if (totalBet > 0) {
              setPreviousBets(bets); 
          }
          setBets({});
          setTotalBet(0);
          setLastWin(null);
          setShowMultiplier(false);
          setIsSpinning(false);
      }

      lastPhaseRef.current = state.phase;
      requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current!);
  }, [bets, totalBet, rotation]);

  // --- Actions ---
  const placeBet = async (num: WheelNumber) => {
      if (gameState?.phase !== 'betting') return;
      if (balance - totalBet < chipValue) {
          alert("Insufficient funds");
          return;
      }

      setBets(prev => ({ ...prev, [num]: (prev[num] || 0) + chipValue }));
      setTotalBet(prev => prev + chipValue);

      try {
          await MockWheelService.placeBet(num, chipValue);
      } catch(e) {
          console.error(e);
      }
  };

  const handleRebet = async () => {
      if (gameState?.phase !== 'betting' || !previousBets) return;
      
      let cost = 0;
      Object.values(previousBets).forEach((v: number) => cost += v);
      
      if (balance - totalBet < cost) {
          alert("Insufficient funds for Rebet");
          return;
      }

      // Optimistic update
      setBets(previousBets);
      setTotalBet(prev => prev + cost);

      try {
          // Execute all bets
          await Promise.all(
              Object.entries(previousBets).map(([numStr, amount]) => {
                  const num = parseInt(numStr) as WheelNumber;
                  return MockWheelService.placeBet(num, amount as number);
              })
          );
          onUpdateBalance();
      } catch(e) {
          console.error("Rebet failed", e);
          alert("Rebet failed. Please check your balance.");
      }
  };

  const getMultiplierColor = (val: number) => {
      if (val >= 500) return 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]';
      if (val >= 100) return 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]';
      return 'text-amber-400';
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      
      {/* History Bar */}
      <div className="bg-slate-900/90 p-2 rounded-xl flex items-center gap-2 overflow-x-auto no-scrollbar border border-slate-700 shadow-inner h-14 backdrop-blur-md">
          <div className="sticky left-0 bg-slate-900/95 z-10 px-2 h-full flex items-center border-r border-slate-700">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent</span>
          </div>
          {gameState?.history.map((h, i) => (
              <div 
                key={i} 
                className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-md relative
                    ${h.multiplier ? 'border-amber-400 bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 'border-slate-600 bg-slate-800 text-slate-300'}
                `}
              >
                  {h.value}
                  {h.multiplier && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse"></span>}
              </div>
          ))}
      </div>

      {/* Main Stage */}
      <div className="relative aspect-square md:aspect-video bg-black rounded-3xl border-[6px] border-slate-800 shadow-2xl flex flex-col items-center justify-center group overflow-visible">
          
          {/* Clip background to container */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
             {/* Studio Environment Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#3b0764_0%,_#020617_70%)]"></div>
             {/* Spotlights */}
             <div className="absolute top-0 left-1/4 w-32 h-64 bg-purple-500/10 blur-[50px] transform -rotate-12"></div>
             <div className="absolute top-0 right-1/4 w-32 h-64 bg-amber-500/10 blur-[50px] transform rotate-12"></div>
          </div>

          {/* Multiplier Overlay */}
          {showMultiplier && !isSpinning && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-none rounded-[20px] overflow-hidden">
                  <div className="flex flex-col items-center animate-bounce-in">
                      <span className="text-xl text-amber-400 font-black uppercase tracking-[0.3em] mb-2 drop-shadow-lg">Multiplier</span>
                      <div className="bg-slate-900/90 border-2 border-amber-500 rounded-2xl px-12 py-8 flex flex-col items-center shadow-[0_0_50px_rgba(245,158,11,0.6)]">
                          <span className="text-6xl font-black text-white drop-shadow-md">{gameState?.nextMultiplier?.num}</span>
                          <span className={`text-5xl font-black font-mono mt-2 ${getMultiplierColor(gameState?.nextMultiplier?.val || 0)}`}>
                              x{gameState?.nextMultiplier?.val}
                          </span>
                      </div>
                  </div>
              </div>
          )}

          {/* Win Popup */}
          {lastWin && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in backdrop-blur-sm rounded-[20px] overflow-hidden">
                  <div className="text-center animate-bounce-in">
                      <div className="text-7xl mb-4 drop-shadow-lg">🎉</div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                          BIG WIN
                      </div>
                      <div className="text-4xl font-bold text-white mt-2 drop-shadow-md">
                          +${lastWin.toLocaleString()}
                      </div>
                  </div>
              </div>
          )}

          {/* Timer Overlay */}
          {gameState?.phase === 'betting' && (
              <div className="absolute z-10 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="text-[12rem] font-black text-white/5 animate-pulse select-none leading-none">
                      {Math.ceil(gameState.timeLeft)}
                  </div>
              </div>
          )}

          {/* Rubber Pointer / Flapper (Main Kata) - Smaller and more flexible look */}
          <div className={`absolute -top-5 z-50 w-8 h-14 origin-top ${isSpinning ? 'animate-flapper' : ''}`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>
              <svg viewBox="0 0 40 60" className="w-full h-full overflow-visible">
                  {/* Tapered rubber shape */}
                  <path 
                     d="M10,0 L30,0 L25,45 C25,55 15,55 15,45 Z" 
                     fill="#1e293b" 
                     stroke="#475569" 
                     strokeWidth="2"
                  />
                  <path d="M15,10 L25,10" stroke="#334155" strokeWidth="1" opacity="0.5" />
                  <path d="M15,20 L25,20" stroke="#334155" strokeWidth="1" opacity="0.5" />
                  <path d="M15,30 L25,30" stroke="#334155" strokeWidth="1" opacity="0.5" />
              </svg>
             {/* Smaller Hinge */}
             <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-md border-2 border-slate-500 shadow-xl"></div>
          </div>

          {/* THE WHEEL CONTAINER */}
          {/* Peg radius adjusted to 138px (mobile) and 185px (desktop) to stay inside wheel */}
          {/* Added will-change-transform and optimized cubic-bezier for smooth spin */}
          <div 
            className="relative w-72 h-72 md:w-96 md:h-96 rounded-full shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-visible transition-transform duration-[4500ms] cubic-bezier(0.1, 0.7, 0.1, 1)"
            style={{
                transform: `rotate(${rotation}deg)`,
                zIndex: 10,
                willChange: 'transform',
                // Reduced radius to bring pegs INSIDE the rim
                ['--peg-radius' as any]: '138px' 
            }}
          >
              {/* Desktop Radius Adjustment */}
              <style jsx>{`
                @media (min-width: 768px) {
                   .relative[style*="--peg-radius"] {
                      --peg-radius: 185px !important;
                   }
                }
              `}</style>

              {/* Outer Metallic Rim */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 border border-slate-900 shadow-2xl z-0"></div>
              {/* Gold Inner Rim */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 z-0"></div>
              
              {/* 54 Metal Pegs (Uchou Kata) */}
              {Array.from({length: 54}).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute z-20 w-[4px] h-[12px] bg-gradient-to-br from-slate-100 to-slate-600 shadow-[1px_1px_2px_rgba(0,0,0,0.5)]"
                    style={{
                        top: '50%',
                        left: '50%',
                        transformOrigin: 'center',
                        // Use CSS var for perfect distance
                        transform: `rotate(${i * (360/54)}deg) translateY(calc(-1 * var(--peg-radius)))`, 
                        borderRadius: '2px 2px 4px 4px',
                        boxShadow: 'inset 1px 1px 1px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.6)'
                    }}
                  ></div>
              ))}

              {/* Wheel Surface */}
              <div className="absolute inset-0 rounded-full bg-slate-900 overflow-hidden border-4 border-slate-900 z-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                     <defs>
                        <radialGradient id="segmentShine" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="60%" stopColor="black" stopOpacity="0" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                        </radialGradient>
                     </defs>
                     {segments.map((seg, i) => {
                         const sliceAngle = 360 / 54;
                         const startAngle = i * sliceAngle;
                         const endAngle = startAngle + sliceAngle;
                         const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                         const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                         const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                         const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                         
                         return (
                             <g key={seg.id}>
                                 {/* Slice Base */}
                                 <path 
                                   d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} 
                                   fill={seg.color}
                                   stroke="#1e293b" 
                                   strokeWidth="0.5"
                                 />
                                 {/* Bright Rim on each slice for clarity */}
                                 <path 
                                   d={`M${x1},${y1} A50,50 0 0,1 ${x2},${y2}`} 
                                   fill="none"
                                   stroke="rgba(255,255,255,0.3)"
                                   strokeWidth="1"
                                 />
                                 
                                 {/* Shine Overlay */}
                                 <path 
                                   d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} 
                                   fill="url(#segmentShine)"
                                   className="pointer-events-none"
                                 />
                                 {/* Text Label */}
                                 <text 
                                    x="50" 
                                    y="50" 
                                    dx="40" 
                                    dy="1.5"
                                    fontSize="3.5" 
                                    fontWeight="900"
                                    fill={seg.value === 1 ? '#0f172a' : 'white'}
                                    // Rotate text: Angle + Half Slice for centering. 
                                    // Add 0 degrees to keep text reading outward from center
                                    transform={`rotate(${startAngle + sliceAngle/2}, 50, 50)`}
                                    textAnchor="middle"
                                    style={{
                                        textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                                        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))'
                                    }}
                                 >
                                     {seg.value}
                                 </text>
                             </g>
                         )
                     })}
                  </svg>
              </div>
          </div>
          
          {/* STATIC CENTER CAP */}
          <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-full border-[3px] border-amber-500 shadow-2xl flex items-center justify-center z-30">
              <div className="absolute inset-0 rounded-full border border-white/20"></div>
              <div className="w-12 h-12 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-amber-500 font-bold text-[8px] text-center leading-none tracking-widest">MEGA</span>
                  <span className="text-white font-bold text-[10px] text-center leading-none tracking-widest">WHEEL</span>
              </div>
          </div>

      </div>

      {/* Info & Status */}
      <div className="bg-slate-800 p-3 rounded-xl flex justify-between items-center border border-slate-700 shadow-md">
          <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
              <span className={`text-sm font-bold uppercase ${gameState?.phase === 'betting' ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`}>
                  {gameState?.phase === 'betting' ? `Betting Open (${Math.ceil(gameState.timeLeft)}s)` : (showMultiplier ? 'Multipliers...' : 'Spinning...')}
              </span>
          </div>
          {/* Rebet Button */}
          {gameState?.phase === 'betting' && previousBets && totalBet === 0 && (
              <button 
                onClick={handleRebet}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition"
              >
                  ↺ Rebet
              </button>
          )}
          <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Your Bet</span>
              <span className="text-white font-bold font-mono">${totalBet.toLocaleString()}</span>
          </div>
      </div>

      {/* Betting Controls */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
          {/* Disable Overlay when spinning */}
          {gameState?.phase !== 'betting' && !showMultiplier && (
              <div className="absolute inset-0 bg-slate-900/60 z-30 cursor-not-allowed flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full border border-white/10">Bets Closed</span>
              </div>
          )}

          {/* Chip Selector - Scrollable */}
          <div className="mb-5 overflow-x-auto pb-2 no-scrollbar">
              <div className="flex gap-3 min-w-max px-1">
                  {CHIP_VALUES.map(val => (
                      <button 
                        key={val}
                        onClick={() => setChipValue(val)}
                        className={`
                            relative h-12 min-w-[3rem] px-2 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg transition-all
                            ${val === 10 ? 'bg-slate-200 border-dashed border-slate-400 text-slate-900' : ''}
                            ${val === 20 ? 'bg-orange-200 border-dashed border-orange-400 text-orange-900' : ''}
                            ${val === 50 ? 'bg-red-500 border-dashed border-red-300 text-white' : ''}
                            ${val === 100 ? 'bg-blue-500 border-dashed border-blue-300 text-white' : ''}
                            ${val === 200 ? 'bg-purple-500 border-dashed border-purple-300 text-white' : ''}
                            ${val === 500 ? 'bg-green-600 border-dashed border-green-300 text-white' : ''}
                            ${val === 1000 ? 'bg-slate-800 border-dashed border-amber-500 text-amber-500' : ''}
                            ${val === 2500 ? 'bg-amber-600 border-dashed border-amber-300 text-white' : ''}
                            ${val === 5000 ? 'bg-teal-600 border-dashed border-teal-300 text-white' : ''}
                            ${val === 10000 ? 'bg-black border-dashed border-white text-white ring-2 ring-amber-500' : ''}
                            ${chipValue === val ? 'scale-110 -translate-y-1 shadow-xl z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}
                        `}
                      >
                          {val >= 1000 ? `${val/1000}k` : val}
                      </button>
                  ))}
              </div>
          </div>

          {/* Betting Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[1, 2, 5, 8, 10, 15, 20, 30, 40].map((num) => {
                  const isMultiplierTarget = showMultiplier && gameState?.nextMultiplier?.num === num;
                  return (
                  <button
                    key={num}
                    onClick={() => placeBet(num as WheelNumber)}
                    className={`
                        relative h-16 rounded-xl flex flex-col items-center justify-center border-b-[4px] transition-all active:scale-95 group overflow-visible
                        ${bets[num] ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500'}
                        ${isMultiplierTarget ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 z-20 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : ''}
                    `}
                  >
                      {/* Background Color Indicator */}
                      <div className={`absolute inset-0 opacity-10 bg-${
                          num === 1 ? 'yellow-200' : 
                          num === 2 ? 'blue-500' : 
                          num === 5 ? 'pink-500' : 
                          num === 8 ? 'violet-500' : 
                          num === 10 ? 'red-500' : 
                          num === 15 ? 'green-500' : 
                          num === 20 ? 'orange-500' : 
                          num === 30 ? 'cyan-500' : 'yellow-500'
                      }`}></div>

                      <span className="text-xl font-black text-white group-hover:scale-110 transition-transform relative z-10 drop-shadow-md">{num}</span>
                      <span className="text-[10px] text-slate-400 font-mono relative z-10">1:{num}</span>
                      
                      {/* Multiplier Badge on Button */}
                      {isMultiplierTarget && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-black text-xs px-2 py-0.5 rounded-full shadow-lg border border-white animate-bounce z-50 whitespace-nowrap">
                              {gameState?.nextMultiplier?.val}x
                          </div>
                      )}

                      {/* Bet Badge */}
                      {bets[num] && (
                          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md animate-bounce z-20">
                              {bets[num] >= 1000 ? `${(bets[num]/1000).toFixed(1)}k` : bets[num]}
                          </div>
                      )}
                  </button>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default WheelGame;