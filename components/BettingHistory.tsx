import React, { useMemo, useState } from 'react';
import { GameResult, Bet } from '../types';

interface Props {
  history: GameResult[];
  myBets: Bet[];
}

const BettingHistory: React.FC<Props> = ({ history, myBets }) => {
  const [activeTab, setActiveTab] = useState<'record' | 'myBets'>('record');

  // User stats for the My Bets tab
  const userStats = useMemo(() => {
    return myBets.reduce((acc, bet) => {
      acc.totalBets++;
      acc.totalInvested += bet.amount;
      if (bet.status === 'win') {
        acc.wins++;
        acc.totalPayout += bet.payout;
      } else if (bet.status === 'loss') {
        acc.losses++;
      }
      return acc;
    }, { totalBets: 0, wins: 0, losses: 0, totalInvested: 0, totalPayout: 0 });
  }, [myBets]);

  const netPnL = userStats.totalPayout - userStats.totalInvested;

  return (
    <div className="space-y-4 mt-6">
      {/* Tabs */}
      <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'record' ? 'bg-slate-700 text-white shadow ring-1 ring-white/5' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        >
          Game Record
        </button>
        <button
          onClick={() => setActiveTab('myBets')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'myBets' ? 'bg-slate-700 text-white shadow ring-1 ring-white/5' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        >
          My Bets
        </button>
      </div>

      {activeTab === 'record' && (
        <div className="animate-fade-in space-y-4">
          
          {/* History Table */}
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Game Record
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-time</span>
            </div>
            
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-900 text-slate-400 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-center">Number</th>
                    <th className="px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {history.map((row, index) => (
                    <tr 
                      key={row.periodId} 
                      className={`hover:bg-slate-700/30 transition-colors duration-200 ${index === 0 ? 'animate-pulse bg-slate-700/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-white tracking-wide text-md">{row.periodId}</span>
                          <span className="text-[10px] text-slate-500">{new Date(row.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-8 h-8 leading-8 rounded-full text-lg font-bold shadow-lg border border-white/10 ${
                          row.number === 0 ? 'bg-gradient-to-br from-red-500 to-violet-500 text-white' :
                          row.number === 5 ? 'bg-gradient-to-br from-emerald-500 to-violet-500 text-white' :
                          [1,3,7,9].includes(row.number) ? 'bg-emerald-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {row.number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5 items-center h-full">
                          {row.colors.map(c => (
                            <div 
                              key={c} 
                              className={`w-3 h-3 rounded-full shadow-inner ring-2 ring-slate-800 ${
                                c === 'green' ? 'bg-emerald-500' :
                                c === 'red' ? 'bg-red-500' : 'bg-violet-500'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'myBets' && (
        <div className="animate-fade-in space-y-4">
           {/* PnL Summary */}
           <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Performance</h3>
              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-700">
                  <div>
                      <p className="text-[10px] text-slate-500 uppercase">Total Bets</p>
                      <p className="text-lg font-bold text-white">{userStats.totalBets}</p>
                  </div>
                  <div>
                      <p className="text-[10px] text-slate-500 uppercase">Win Rate</p>
                      <p className="text-lg font-bold text-emerald-400">
                          {userStats.totalBets > 0 ? Math.round((userStats.wins / userStats.totalBets) * 100) : 0}%
                      </p>
                  </div>
                  <div>
                      <p className="text-[10px] text-slate-500 uppercase">Net P&L</p>
                      <p className={`text-lg font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {netPnL >= 0 ? '+' : ''}{netPnL.toFixed(1)}
                      </p>
                  </div>
              </div>
           </div>

           {/* User Bets Table */}
           <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
             <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
               <h3 className="font-bold text-white flex items-center gap-2">
                 My Bet History
               </h3>
             </div>
             
             <div className="overflow-x-auto max-h-[400px]">
               <table className="w-full text-sm text-left text-slate-300">
                 <thead className="text-xs uppercase bg-slate-900 text-slate-400 sticky top-0 z-10">
                   <tr>
                     <th className="px-4 py-3">Period</th>
                     <th className="px-4 py-3 text-center">Select</th>
                     <th className="px-4 py-3 text-right">Amount</th>
                     <th className="px-4 py-3 text-right">Profit/Loss</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700/50">
                   {myBets.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-500 italic">No bets placed in this session.</td></tr>
                   ) : (
                      myBets.map(bet => {
                        const isWin = bet.status === 'win';
                        const isLoss = bet.status === 'loss';
                        const profit = bet.payout - bet.amount;
                        
                        return (
                          <tr 
                            key={bet.id} 
                            className={`transition-all duration-300 border-l-4 ${
                                isWin ? 'border-emerald-500 animate-win-pulse' : 
                                isLoss ? 'border-red-500 animate-loss-pulse' : 
                                'border-transparent hover:bg-slate-700/30'
                            }`}
                          >
                            <td className="px-4 py-3">
                               <div className="flex flex-col">
                                  <span className="font-mono text-xs text-white">{bet.periodId}</span>
                                  <span className="text-[10px] text-slate-500">{new Date(bet.timestamp).toLocaleTimeString()}</span>
                               </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                               <span className={`inline-flex items-center justify-center px-2 py-1 min-w-[3rem] rounded text-xs font-bold uppercase border shadow-sm ${
                                 bet.selection === 'green' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                 bet.selection === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                 bet.selection === 'violet' ? 'bg-violet-500/10 border-violet-500/30 text-violet-500' :
                                 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                               }`}>
                                  {bet.selection}
                               </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-300">
                               ${bet.amount}
                            </td>
                            <td className="px-4 py-3 text-right">
                               {bet.status === 'pending' && <span className="text-yellow-500 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded animate-pulse">PENDING</span>}
                               {isWin && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-emerald-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">+${profit.toFixed(1)}</span>
                                  </div>
                               )}
                               {isLoss && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-red-400 font-bold text-sm">-${bet.amount.toFixed(1)}</span>
                                  </div>
                               )}
                            </td>
                          </tr>
                        )
                      })
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BettingHistory;