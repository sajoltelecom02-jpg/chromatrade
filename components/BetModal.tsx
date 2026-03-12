import React, { useState } from 'react';

interface BetModalProps {
  selection: string | number | null;
  type: 'color' | 'number' | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  balance: number;
}

const AMOUNTS = [10, 100, 500, 1000, 5000, 10000];

const BetModal: React.FC<BetModalProps> = ({ selection, type, onClose, onConfirm, balance }) => {
  const [amount, setAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1);

  const totalBet = amount * multiplier;

  if (selection === null) return null;

  const getColorClass = () => {
    if (selection === 'green') return 'bg-emerald-500';
    if (selection === 'red') return 'bg-red-500';
    if (selection === 'violet') return 'bg-violet-500';
    return 'bg-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden border border-slate-700 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className={`${getColorClass()} p-4 text-center relative overflow-hidden`}>
           {/* Add a subtle shine effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
          <h2 className="text-white font-bold text-lg uppercase relative z-10 drop-shadow-md">
            Select {type === 'color' ? selection : `Number ${selection}`}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance */}
          <div className="text-center text-sm text-slate-400 bg-slate-900/50 py-2 rounded-lg border border-slate-700/50">
            Available Balance: <span className="text-white font-bold font-mono ml-2">${balance.toFixed(2)}</span>
          </div>

          {/* Amount Presets */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Contract Money</p>
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    amount === amt
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg scale-[1.02] ring-2 ring-amber-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                 <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Number (Quantity)</p>
                 <span className="text-xs text-amber-500 font-bold">x{multiplier}</span>
             </div>
             
             <div className="flex items-center space-x-4 bg-slate-900 p-2 rounded-lg justify-between border border-slate-700">
                <button 
                  onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg text-white text-xl hover:bg-slate-600 transition active:scale-90 shadow-sm"
                >-</button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Multiplier</span>
                    <input 
                      type="number" 
                      value={multiplier}
                      onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-transparent text-center text-white font-mono text-2xl w-24 outline-none font-bold"
                    />
                </div>
                <button 
                  onClick={() => setMultiplier(multiplier + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg text-white text-xl hover:bg-slate-600 transition active:scale-90 shadow-sm"
                >+</button>
             </div>
             
             {/* Quick Multiplier Chips */}
             <div className="flex gap-2 justify-center flex-wrap">
                {[1, 2, 5, 10, 20, 50, 100].map(m => (
                    <button 
                        key={m} 
                        onClick={() => setMultiplier(m)} 
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all duration-200 hover:scale-110 ${
                            multiplier === m 
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                            : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                        }`}
                    >
                        x{m}
                    </button>
                ))}
             </div>
          </div>

          {/* Total Calculation Display */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-1 backdrop-blur-sm transition-all duration-300 hover:border-slate-600">
             <p className="text-xs text-slate-400 uppercase tracking-wide">Total Contract Money</p>
             <div className="flex items-center justify-center gap-2 text-lg font-mono flex-wrap">
                <span className="text-slate-300 transition-all duration-300 key={amount}">${amount}</span>
                <span className="text-slate-500 text-sm">x</span>
                <span className="text-slate-300 transition-all duration-300 key={multiplier}">{multiplier}</span>
                <span className="text-slate-500 text-sm">=</span>
                <span className="text-amber-500 font-bold text-2xl drop-shadow-sm transition-all duration-300 scale-100 key={totalBet}">${totalBet}</span>
             </div>
          </div>

          {/* Terms */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 justify-center">
            <input type="checkbox" checked readOnly className="accent-amber-500 w-3 h-3 cursor-not-allowed" />
            <span>I agree to the presale management rules</span>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(totalBet)}
              disabled={totalBet > balance}
              className={`flex-1 py-3.5 rounded-xl font-bold text-black transition-all duration-200 shadow-lg active:scale-[0.98] ${
                totalBet > balance 
                  ? 'bg-slate-500 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 hover:shadow-amber-500/20'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetModal;