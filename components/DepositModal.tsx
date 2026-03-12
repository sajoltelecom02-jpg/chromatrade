import React, { useState } from 'react';
import { PaymentMethod } from '../types';

interface DepositModalProps {
  methods: PaymentMethod[];
  onClose: () => void;
  onConfirm: (amount: number, paymentMethod: string, fromNumber: string, trxId: string) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ methods, onClose, onConfirm }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [fromNumber, setFromNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount || !fromNumber || !trxId) return;
    
    onConfirm(parseFloat(amount), selectedMethod.name, fromNumber, trxId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden border border-slate-700 shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Deposit Funds</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-6">
          
          {!selectedMethod ? (
             /* Method Selection */
             <div className="space-y-4">
                <p className="text-sm text-slate-400">Select a payment method:</p>
                <div className="space-y-2">
                   {methods.map(method => (
                      <button 
                        key={method.id}
                        onClick={() => setSelectedMethod(method)}
                        className="w-full flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-amber-500 transition group"
                      >
                         <span className="font-bold text-white group-hover:text-amber-500">{method.name}</span>
                         <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">{method.type === 'crypto' ? 'CRYPTO' : 'FIAT'}</span>
                      </button>
                   ))}
                   {methods.length === 0 && <p className="text-center text-slate-500 text-sm">No payment methods available.</p>}
                </div>
             </div>
          ) : (
             /* Payment Details & Form */
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center">
                   <p className="text-xs text-amber-500 uppercase font-bold mb-1">Send Payment To</p>
                   <p className="text-white font-mono break-all text-sm mb-2">{selectedMethod.details}</p>
                   <button 
                     type="button"
                     onClick={() => handleCopy(selectedMethod.details)}
                     className="text-xs bg-amber-500 text-black px-3 py-1 rounded font-bold hover:bg-amber-400 transition"
                   >
                     {copied ? 'Copied!' : 'Copy Address / Number'}
                   </button>
                </div>

                <div>
                   <label className="text-xs text-slate-400 block mb-1">Amount</label>
                   <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      placeholder="0.00"
                      required
                      min="1"
                   />
                </div>

                <div>
                   <label className="text-xs text-slate-400 block mb-1">Sender Number / ID</label>
                   <input 
                      type="text" 
                      value={fromNumber}
                      onChange={(e) => setFromNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. 01700000000"
                      required
                   />
                </div>

                <div>
                   <label className="text-xs text-slate-400 block mb-1">Transaction ID (TrxID)</label>
                   <input 
                      type="text" 
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. 8HD72..."
                      required
                   />
                </div>

                <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setSelectedMethod(null)}
                     className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                   >
                     Back
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:from-emerald-400 hover:to-emerald-500 transition shadow-lg"
                   >
                     Submit Payment
                   </button>
                </div>
             </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default DepositModal;