import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, GameDuration, PaymentMethod } from './types';
import { MockAuthService, MockWalletService, MockPaymentService } from './services/mockBackend';
import DepositModal from './components/DepositModal';
import WithdrawModal from './components/WithdrawModal';
import MinesGame from './components/MinesGame';
import ColorGame from './components/ColorGame';
import AviatorGame from './components/AviatorGame';
import WheelGame from './components/WheelGame';
import AdminPanel from './components/Admin/AdminPanel';
import UserProfile from './components/UserProfile';

// --- Icons (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default function App() {
  const [view, setView] = useState<'LOGIN' | 'GAME' | 'WALLET' | 'ADMIN' | 'PROFILE'>('LOGIN');
  const [activeGame, setActiveGame] = useState<'color' | 'mines' | 'aviator' | 'wheel' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Wallet State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Auth State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Load initial data
  const refreshGlobalData = useCallback(() => {
    // Payment methods
    setPaymentMethods([...MockPaymentService.getMethods()]);
    
    // Balance check
    MockWalletService.getBalance().then(b => {
      setUser(prev => {
        if (!prev) return null; 
        if (Math.abs(prev.balance - b) < 0.001) return prev; 
        return { ...prev, balance: b };
      });
    });
  }, [user?.role]);

  // Global Tick (just for global data consistency if needed)
  useEffect(() => {
      refreshGlobalData();
      const interval = setInterval(refreshGlobalData, 5000); // Polling for balance updates
      return () => clearInterval(interval);
  }, [refreshGlobalData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await MockAuthService.login(phone, otp);
      setUser(u);
      setView('GAME');
      refreshGlobalData();
    } catch (err: any) {
      alert(err.message || "Login failed");
    }
    setLoading(false);
  };

  const handleDeposit = async (amount: number, method: string, fromNumber: string, trxId: string) => {
     try {
        await MockWalletService.addTransaction('deposit', amount, method, { fromNumber, transactionId: trxId });
        setDepositModalOpen(false);
        refreshGlobalData();
        alert("Deposit submitted! Waiting for Admin verification.");
     } catch(e) {
        alert("Deposit failed");
     }
  };

  const handleWithdraw = async (amount: number, toNumber: string) => {
    try {
        await MockWalletService.addTransaction('withdraw', amount, undefined, { toNumber });
        setWithdrawModalOpen(false);
        refreshGlobalData();
        alert("Withdrawal request submitted! Pending Admin Approval.");
    } catch(e: any) {
        alert(e.message || "Withdrawal failed");
    }
  };

  const getHeaderTitle = () => {
    if (view === 'GAME') {
      if (activeGame === 'color') return 'Win Go';
      if (activeGame === 'mines') return 'Mines';
      if (activeGame === 'aviator') return 'Aviator';
      if (activeGame === 'wheel') return 'Mega Wheel';
      return 'Lobby';
    }
    if (view === 'WALLET') return 'Wallet';
    if (view === 'ADMIN') return 'Admin Panel';
    if (view === 'PROFILE') return 'My Profile';
    return 'ChromaTrade';
  };

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">ChromaTrade</h1>
          <p className="text-slate-400 text-center mb-8">Next-Gen Prediction Platform</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm">Mobile Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition" placeholder="Enter Mobile Number" />
            </div>
            <div>
              <label className="text-slate-400 text-sm">OTP (or Password)</label>
              <input type="password" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition" placeholder="••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold py-3 rounded-xl hover:from-amber-400 hover:to-orange-500 transition shadow-lg">{loading ? 'Authenticating...' : 'Login Securely'}</button>
          </form>
        </div>
      </div>
    );
  }

  // Determine if nav should be shown
  const showNav = view !== 'GAME' || activeGame === null;

  return (
    <div className={`min-h-screen bg-slate-950 ${showNav ? 'pb-20' : 'pb-4'}`}>
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-black text-sm">C</div>
           <span className="font-bold text-lg tracking-tight text-white">{getHeaderTitle()}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-medium text-emerald-400 text-sm">${user?.balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {view === 'GAME' && (
          <>
            {/* Game Lobby - Show when no game is active */}
            {!activeGame && (
              <div className="space-y-6 animate-fade-in">
                 {/* Welcome Banner */}
                 <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full -ml-5 -mb-5 blur-xl"></div>
                    <h2 className="text-2xl font-bold relative z-10">Welcome Back!</h2>
                    <p className="text-white/80 text-sm mt-1 relative z-10">Select a game to start winning.</p>
                 </div>

                 <div className="space-y-3">
                    <h3 className="text-white font-bold text-lg border-l-4 border-amber-500 pl-3">Originals</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Win Go Card */}
                      <button onClick={() => setActiveGame('color')} className="relative group overflow-hidden bg-slate-800 rounded-2xl p-0.5 border border-slate-700 shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95 duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative bg-slate-900/90 rounded-[14px] p-4 h-full flex flex-col items-center gap-4 backdrop-blur-sm overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -ml-10 -mb-10 group-hover:bg-violet-500/20 transition-all"></div>
                              <div className="w-20 h-20 relative flex items-center justify-center">
                                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-violet-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg animate-[spin_4s_linear_infinite] group-hover:animate-[spin_1s_linear_infinite]">
                                      <defs>
                                          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
                                          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient>
                                          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#f87171" /></linearGradient>
                                      </defs>
                                      <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                      <g transform="translate(50,50)">
                                          <path d="M0,0 L0,-45 A45,45 0 0,1 38.97,-22.5 Z" fill="url(#grad1)" stroke="#0f172a" strokeWidth="1" />
                                          <path d="M0,0 L38.97,-22.5 A45,45 0 0,1 38.97,22.5 Z" fill="url(#grad2)" stroke="#0f172a" strokeWidth="1" />
                                          <path d="M0,0 L38.97,22.5 A45,45 0 0,1 0,45 Z" fill="url(#grad3)" stroke="#0f172a" strokeWidth="1" />
                                          <path d="M0,0 L0,45 A45,45 0 0,1 -38.97,22.5 Z" fill="url(#grad1)" stroke="#0f172a" strokeWidth="1" />
                                          <path d="M0,0 L-38.97,22.5 A45,45 0 0,1 -38.97,-22.5 Z" fill="url(#grad3)" stroke="#0f172a" strokeWidth="1" />
                                          <path d="M0,0 L-38.97,-22.5 A45,45 0 0,1 0,-45 Z" fill="url(#grad2)" stroke="#0f172a" strokeWidth="1" />
                                      </g>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="absolute -top-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-amber-400 drop-shadow-md z-10"></div>
                                      <div className="w-10 h-10 bg-slate-900 rounded-full border-2 border-slate-700 flex items-center justify-center shadow-lg z-10 relative">
                                          <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-black rounded-full flex items-center justify-center">
                                              <span className="text-[8px] font-bold text-white font-mono leading-none text-center">WIN<br/>GO</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-center z-10">
                                  <h4 className="font-bold text-white text-lg tracking-wide group-hover:text-emerald-400 transition-colors">Win Go</h4>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider group-hover:text-slate-300">Color Prediction</p>
                              </div>
                          </div>
                      </button>

                      {/* Mines Card */}
                      <button onClick={() => setActiveGame('mines')} className="relative group overflow-hidden bg-slate-800 rounded-2xl p-0.5 border border-slate-700 shadow-xl hover:shadow-red-500/20 transition-all active:scale-95 duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative bg-slate-900/90 rounded-[14px] p-4 h-full flex flex-col items-center gap-4 backdrop-blur-sm overflow-hidden">
                              <div className="absolute top-0 left-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -ml-10 -mt-10 group-hover:bg-red-500/20 transition-all"></div>
                              <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mb-10 group-hover:bg-orange-500/20 transition-all"></div>
                              <div className="w-16 h-16 relative">
                                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse"></div>
                                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                                      <defs>
                                        <radialGradient id="bombGradient" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#475569" /><stop offset="100%" stopColor="#1e293b" /></radialGradient>
                                      </defs>
                                      <circle cx="50" cy="55" r="32" fill="url(#bombGradient)" className="group-hover:fill-slate-700 transition-colors" />
                                      <ellipse cx="35" cy="40" rx="10" ry="6" fill="white" opacity="0.1" transform="rotate(-45 35 40)" />
                                      <g stroke="#334155" strokeWidth="4" strokeLinecap="round"><path d="M50 18 L50 23" /><path d="M50 87 L50 92" /><path d="M18 55 L23 55" /><path d="M87 55 L92 55" /><path d="M27 32 L31 36" /><path d="M73 78 L77 82" /><path d="M27 78 L31 74" /><path d="M73 32 L77 28" /></g>
                                      <path d="M50 25 Q50 5 70 10" stroke="#f59e0b" strokeWidth="3" fill="none" className="group-hover:stroke-amber-400" />
                                      <g className="animate-pulse origin-center"><circle cx="70" cy="10" r="3" fill="#ef4444" className="animate-ping" /><path d="M70 10 L75 5 M70 10 L78 10 M70 10 L75 16 M70 10 L65 5 M70 10 L62 10" stroke="#ef4444" strokeWidth="2" /></g>
                                      <text x="50" y="65" fontSize="24" textAnchor="middle" fill="white" className="opacity-80">☠️</text>
                                  </svg>
                              </div>
                              <div className="text-center z-10">
                                  <h4 className="font-bold text-white text-lg tracking-wide group-hover:text-red-400 transition-colors">Mines</h4>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider group-hover:text-slate-300">Strategic Sweeper</p>
                              </div>
                          </div>
                      </button>

                      {/* Aviator Card */}
                      <button onClick={() => setActiveGame('aviator')} className="relative group overflow-hidden bg-slate-800 rounded-2xl p-0.5 border border-slate-700 shadow-xl hover:shadow-red-500/20 transition-all active:scale-95 duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-red-600/40 via-transparent to-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                          
                          <div className="relative bg-slate-900/90 rounded-[14px] p-4 h-full flex items-center gap-6 backdrop-blur-sm overflow-hidden">
                              {/* Background Effects */}
                              <div className="absolute left-0 bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-slate-900/0 to-slate-900/0"></div>
                              <div className="absolute top-2 right-10 w-1 h-1 bg-white rounded-full animate-[ping_3s_linear_infinite]"></div>
                              <div className="absolute bottom-10 left-20 w-1 h-1 bg-white rounded-full animate-[ping_5s_linear_infinite]"></div>

                              {/* Icon Container */}
                              <div className="w-24 h-24 relative flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                  {/* Plane Trail */}
                                  <svg className="absolute inset-0 w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
                                      <path d="M10,80 Q40,80 80,30" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                  </svg>
                                  
                                  {/* Animated Plane */}
                                  <div className="absolute inset-0 animate-[bounce_2s_infinite]">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] transform -rotate-12 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700">
                                        <path d="M21 14l-6.2-2.1L12 3H9.5l3 8.9L6 14l-2.5-2H2l2.5 5 16.5-3z" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.5"/>
                                        <path d="M21 14l-2 3-17-3 2.5-5L6 14l6.5-2.1L9.5 3H12l2.8 8.9L21 14z" fill="url(#planeGrad)" opacity="0.5"/>
                                        <defs>
                                            <linearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#fff" stopOpacity="0.4"/>
                                                <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                  </div>
                              </div>

                              <div className="text-left z-10 flex-1">
                                  <h4 className="font-bold text-white text-xl tracking-wide group-hover:text-red-400 transition-colors drop-shadow-md">Aviator</h4>
                                  <p className="text-xs text-slate-400 uppercase tracking-wider group-hover:text-slate-300 flex items-center gap-1">
                                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> 
                                     Live
                                  </p>
                              </div>
                          </div>
                      </button>

                      {/* Mega Wheel Card */}
                      <button onClick={() => setActiveGame('wheel')} className="relative group overflow-hidden bg-slate-800 rounded-2xl p-0.5 border border-slate-700 shadow-xl hover:shadow-purple-500/20 transition-all active:scale-95 duration-300">
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-transparent to-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                          
                          <div className="relative bg-slate-900/90 rounded-[14px] p-4 h-full flex flex-col items-center gap-4 backdrop-blur-sm overflow-hidden">
                              {/* Background Effects */}
                              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 to-transparent"></div>
                              
                              {/* Animated Wheel Icon */}
                              <div className="w-20 h-20 relative flex items-center justify-center">
                                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-500/30 animate-[spin_10s_linear_infinite]"></div>
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 shadow-lg flex items-center justify-center animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite]">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                      <div className="absolute top-0 w-1 h-4 bg-white/50"></div>
                                      <div className="absolute bottom-0 w-1 h-4 bg-white/50"></div>
                                      <div className="absolute left-0 w-4 h-1 bg-white/50"></div>
                                      <div className="absolute right-0 w-4 h-1 bg-white/50"></div>
                                  </div>
                                  {/* Pointer */}
                                  <div className="absolute top-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-white drop-shadow-md z-10"></div>
                              </div>

                              <div className="text-center z-10">
                                  <h4 className="font-bold text-white text-lg tracking-wide group-hover:text-amber-400 transition-colors drop-shadow-md">Mega Wheel</h4>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider group-hover:text-slate-300">500x Multipliers</p>
                              </div>
                          </div>
                      </button>

                    </div>
                 </div>
              </div>
            )}

            {/* Active Game Components */}
            {activeGame === 'mines' && (
                <div className="animate-slide-up">
                    <button onClick={() => setActiveGame(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white transition"><span className="text-lg">‹</span> Back to Lobby</button>
                    <MinesGame balance={user?.balance || 0} onUpdateBalance={refreshGlobalData} />
                </div>
            )}
            
            {activeGame === 'color' && (
                <div className="animate-slide-up">
                     <button onClick={() => setActiveGame(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white transition"><span className="text-lg">‹</span> Back to Lobby</button>
                    <ColorGame balance={user?.balance || 0} onUpdateBalance={refreshGlobalData} />
                </div>
            )}

            {activeGame === 'aviator' && (
                <div className="animate-slide-up">
                     <button onClick={() => setActiveGame(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white transition"><span className="text-lg">‹</span> Back to Lobby</button>
                    <AviatorGame balance={user?.balance || 0} onUpdateBalance={refreshGlobalData} />
                </div>
            )}

            {activeGame === 'wheel' && (
                <div className="animate-slide-up">
                     <button onClick={() => setActiveGame(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white transition"><span className="text-lg">‹</span> Back to Lobby</button>
                    <WheelGame balance={user?.balance || 0} onUpdateBalance={refreshGlobalData} />
                </div>
            )}
          </>
        )}

        {view === 'WALLET' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-slate-400 text-sm">Total Asset</p>
                   <h2 className="text-4xl font-bold text-white mt-1">${user?.balance.toFixed(2)}</h2>
                   <div className="flex gap-3 mt-6">
                      <button onClick={() => setDepositModalOpen(true)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg font-medium transition active:scale-95 shadow-lg shadow-emerald-500/20">Deposit</button>
                      <button onClick={() => setWithdrawModalOpen(true)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition active:scale-95">Withdraw</button>
                   </div>
                </div>
             </div>
             <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
               <h3 className="font-bold text-white mb-4">Transaction History</h3>
               <div className="space-y-3">
                 {MockWalletService.getTransactions().map(tx => (
                   <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium capitalize text-white">{tx.type.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className={`font-mono font-bold ${tx.status === 'pending' ? 'text-amber-500' : tx.status === 'failed' ? 'text-red-500' : ['deposit','bet_win','admin_adjustment'].includes(tx.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.status === 'pending' ? 'PENDING' : tx.status === 'failed' ? 'FAILED' : `${['deposit','bet_win','admin_adjustment'].includes(tx.type) ? '+' : '-'}${tx.amount}`}
                      </span>
                   </div>
                 ))}
                 {MockWalletService.getTransactions().length === 0 && <div className="text-center text-slate-500 text-sm py-4">No transactions yet</div>}
               </div>
             </div>
          </div>
        )}

        {view === 'ADMIN' && user?.role === 'ADMIN' && (
           <AdminPanel user={user} />
        )}

        {view === 'PROFILE' && user && (
           <UserProfile user={user} onLogout={() => { setUser(null); setView('LOGIN'); }} />
        )}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-40">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            <button onClick={() => { setView('GAME'); setActiveGame(null); }} className={`flex flex-col items-center gap-1 w-1/4 ${view === 'GAME' ? 'text-amber-500' : 'text-slate-500'}`}><HomeIcon /><span className="text-[10px] font-medium">Home</span></button>
            <button onClick={() => setView('WALLET')} className={`flex flex-col items-center gap-1 w-1/4 ${view === 'WALLET' ? 'text-amber-500' : 'text-slate-500'}`}><WalletIcon /><span className="text-[10px] font-medium">Wallet</span></button>
            {user?.role === 'ADMIN' && (<button onClick={() => setView('ADMIN')} className={`flex flex-col items-center gap-1 w-1/4 ${view === 'ADMIN' ? 'text-amber-500' : 'text-slate-500'}`}><AdminIcon /><span className="text-[10px] font-medium">Admin</span></button>)}
            <button onClick={() => setView('PROFILE')} className={`flex flex-col items-center gap-1 w-1/4 ${view === 'PROFILE' ? 'text-amber-500' : 'text-slate-500'}`}><UserIcon /><span className="text-[10px] font-medium">Me</span></button>
          </div>
        </nav>
      )}

      {depositModalOpen && <DepositModal methods={paymentMethods} onClose={() => setDepositModalOpen(false)} onConfirm={handleDeposit} />}
      {withdrawModalOpen && <WithdrawModal balance={user?.balance || 0} onClose={() => setWithdrawModalOpen(false)} onConfirm={handleWithdraw} />}
    </div>
  );
}