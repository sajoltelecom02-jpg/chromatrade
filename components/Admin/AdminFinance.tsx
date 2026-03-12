import React, { useState } from 'react';
import { Transaction, PaymentMethod } from '../../types';
import { MockWalletService, MockPaymentService } from '../../services/mockBackend';

interface AdminFinanceProps {
  deposits: Transaction[];
  withdrawals: Transaction[];
  paymentMethods: PaymentMethod[];
  onRefresh: () => void;
}

const AdminFinance: React.FC<AdminFinanceProps> = ({ deposits, withdrawals, paymentMethods, onRefresh }) => {
  const [newPayName, setNewPayName] = useState('');
  const [newPayDetails, setNewPayDetails] = useState('');

  const handleApproveDeposit = (id: string) => { MockWalletService.approveDeposit(id); onRefresh(); };
  const handleRejectDeposit = (id: string) => { MockWalletService.rejectDeposit(id); onRefresh(); };
  const handleApproveWithdrawal = (id: string) => { MockWalletService.approveWithdrawal(id); onRefresh(); };
  const handleRejectWithdrawal = (id: string) => { MockWalletService.rejectWithdrawal(id); onRefresh(); };

  const handleAddPaymentMethod = () => {
     if(!newPayName || !newPayDetails) return;
     MockPaymentService.addMethod(newPayName, newPayDetails);
     setNewPayName('');
     setNewPayDetails('');
     onRefresh();
  };

  const handleDeletePaymentMethod = (id: string) => {
      MockPaymentService.deleteMethod(id);
      onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Deposits */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Deposit Requests
                </h3>
                {deposits.length > 0 && <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded-full text-white font-bold">{deposits.length} Pending</span>}
            </div>
            <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {deposits.length === 0 && <p className="text-slate-500 text-xs italic text-center py-4">No pending deposits.</p>}
                {deposits.map(tx => (
                    <div key={tx.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-white font-bold">${tx.amount} <span className="text-slate-400 text-xs font-normal">via {tx.paymentMethod}</span></p>
                                <p className="text-[10px] text-slate-500">User: {tx.username}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-mono">ID: {tx.paymentDetails?.transactionId}</p>
                                <p className="text-[10px] text-slate-500">{tx.paymentDetails?.fromNumber}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => handleApproveDeposit(tx.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-bold transition">Approve</button>
                            <button onClick={() => handleRejectDeposit(tx.id)} className="flex-1 bg-red-900/40 hover:bg-red-900 text-red-400 py-1.5 rounded text-xs font-bold transition border border-red-900">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Withdrawals */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Withdrawal Requests
                </h3>
                {withdrawals.length > 0 && <span className="bg-amber-600 text-[10px] px-2 py-0.5 rounded-full text-white font-bold">{withdrawals.length} Pending</span>}
            </div>
            <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {withdrawals.length === 0 && <p className="text-slate-500 text-xs italic text-center py-4">No pending withdrawals.</p>}
                {withdrawals.map(tx => (
                    <div key={tx.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-white font-bold">${tx.amount}</p>
                                <p className="text-[10px] text-slate-500">User: {tx.username}</p>
                            </div>
                            <div className="text-right max-w-[50%]">
                                <p className="text-[10px] text-slate-400 break-words">{tx.paymentDetails?.toNumber}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => handleApproveWithdrawal(tx.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-bold transition">Approve</button>
                            <button onClick={() => handleRejectWithdrawal(tx.id)} className="flex-1 bg-red-900/40 hover:bg-red-900 text-red-400 py-1.5 rounded text-xs font-bold transition border border-red-900">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Config */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2">Payment Configuration</h3>
            
            <div className="space-y-3 mb-5">
                {paymentMethods.map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-600">
                        <div>
                            <p className="text-sm font-bold text-white">{m.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{m.details}</p>
                        </div>
                        <button onClick={() => handleDeletePaymentMethod(m.id)} className="text-red-400 hover:text-white hover:bg-red-600 p-2 rounded transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Add New Method</h4>
                <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Method Name (e.g. USDT)" 
                      value={newPayName} 
                      onChange={e => setNewPayName(e.target.value)} 
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Wallet Address / Number" 
                      value={newPayDetails} 
                      onChange={e => setNewPayDetails(e.target.value)} 
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" 
                    />
                    <button 
                      onClick={handleAddPaymentMethod} 
                      className="bg-amber-500 text-black font-bold py-2 rounded-lg text-sm hover:bg-amber-400 transition"
                    >
                      Add Payment Method
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminFinance;