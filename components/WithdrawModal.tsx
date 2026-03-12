import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { MockPaymentService } from '../services/mockBackend';

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number, toNumber: string) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ balance, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [toNumber, setToNumber] = useState('');
  const [selectedMethodName, setSelectedMethodName] = useState('');
  
  const methods = MockPaymentService.getMethods();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !toNumber || !selectedMethodName) return;
    // Combine method name with number for display simplicity in mock
    onConfirm(parseFloat(amount), `${selectedMethodName}: ${toNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden border border-slate-700 shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Withdraw Funds</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6">
            <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">Available Balance</p>
                <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
            </div>

             <form onSubmit={handleSubmit} className="space-y-4">
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
                      max={balance}
                   />
                </div>

                <div>
                   <label className="text-xs text-slate-400 block mb-1">Withdraw Method</label>
                   <select 
                      value={selectedMethodName}
                      onChange={(e) => setSelectedMethodName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      required
                   >
                       <option value="">Select Method</option>
                       {methods.map(m => (
                           <option key={m.id} value={m.name}>{m.name}</option>
                       ))}
                   </select>
                </div>

                <div>
                   <label className="text-xs text-slate-400 block mb-1">Account Details (Number/Address)</label>
                   <input 
                      type="text" 
                      value={toNumber}
                      onChange={(e) => setToNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      placeholder="Enter details..."
                      required
                   />
                </div>

                <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={onClose}
                     className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={!amount || parseFloat(amount) > balance || !selectedMethodName}
                     className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition disabled:opacity-50"
                   >
                     Request Withdraw
                   </button>
                </div>
             </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;