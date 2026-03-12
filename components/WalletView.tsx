import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../types';
import { MockWalletService } from '../services/mockBackend';

interface WalletViewProps {
  user: User;
  onDeposit: () => void;
  onWithdraw: () => void;
}

type FilterType = 'all' | 'deposit' | 'withdraw' | 'game';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export default function WalletView({ user, onDeposit, onWithdraw }: WalletViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date_desc');

  // Get transactions directly from service (reactive to user balance changes effectively re-renders this)
  const allTransactions = MockWalletService.getTransactions();

  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Filter
    if (filter !== 'all') {
      result = result.filter(t => {
        if (filter === 'deposit') return t.type === 'deposit';
        if (filter === 'withdraw') return t.type === 'withdraw';
        if (filter === 'game') return t.type === 'bet_win' || t.type === 'bet_loss';
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'date_desc') return b.timestamp - a.timestamp;
      if (sort === 'date_asc') return a.timestamp - b.timestamp;
      if (sort === 'amount_desc') return b.amount - a.amount;
      if (sort === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [allTransactions, filter, sort, user.balance]); // user.balance dependency to force re-calc on updates

  const getTypeColor = (type: Transaction['type'], status: Transaction['status']) => {
      if (status === 'pending') return 'text-amber-500';
      if (status === 'failed') return 'text-red-500';
      
      switch (type) {
          case 'deposit': return 'text-emerald-400';
          case 'withdraw': return 'text-red-400';
          case 'bet_win': return 'text-emerald-400';
          case 'bet_loss': return 'text-slate-400';
          case 'admin_adjustment': return 'text-blue-400';
          default: return 'text-white';
      }
  };

  const getTypeIcon = (type: Transaction['type']) => {
      switch (type) {
          case 'deposit': return '↓';
          case 'withdraw': return '↑';
          case 'bet_win': return '★';
          case 'bet_loss': return '✕';
          default: return '•';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Balance Card */}
       <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="relative z-10">
             <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Asset</p>
             <h2 className="text-4xl font-bold text-white mt-2 font-mono tracking-tight">${user.balance.toFixed(2)}</h2>
             
             <div className="flex gap-3 mt-6">
                <button onClick={onDeposit} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                    Deposit
                </button>
                <button onClick={onWithdraw} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 border border-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    Withdraw
                </button>
             </div>
          </div>
       </div>

       {/* Transactions Section */}
       <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-800 bg-slate-800/50">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-white text-lg">History</h3>
                 <select 
                    value={sort} 
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                 >
                     <option value="date_desc">Newest First</option>
                     <option value="date_asc">Oldest First</option>
                     <option value="amount_desc">Highest Amount</option>
                     <option value="amount_asc">Lowest Amount</option>
                 </select>
             </div>
             
             {/* Filters */}
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                 {(['all', 'deposit', 'withdraw', 'game'] as FilterType[]).map(f => (
                     <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                            filter === f 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                        }`}
                     >
                         {f === 'game' ? 'Game P&L' : f}
                     </button>
                 ))}
             </div>
         </div>

         <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
           {filteredTransactions.length > 0 ? (
               filteredTransactions.map(tx => (
                 <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800 border border-slate-700 ${getTypeColor(tx.type, tx.status)}`}>
                            {getTypeIcon(tx.type)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold capitalize text-white">
                              {tx.type === 'bet_win' ? 'Game Win' : tx.type === 'bet_loss' ? 'Game Loss' : tx.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{new Date(tx.timestamp).toLocaleString()}</span>
                          {tx.status === 'pending' && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Processing</span>}
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <span className={`font-mono font-bold text-lg block ${getTypeColor(tx.type, tx.status)}`}>
                          {['deposit','bet_win','admin_adjustment'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                        {tx.paymentMethod && <span className="text-[10px] text-slate-500 uppercase">{tx.paymentMethod}</span>}
                    </div>
                 </div>
               ))
           ) : (
               <div className="text-center py-12">
                   <div className="text-4xl mb-2 opacity-20">📜</div>
                   <p className="text-slate-500 text-sm">No transactions found</p>
               </div>
           )}
         </div>
       </div>
    </div>
  );
}
