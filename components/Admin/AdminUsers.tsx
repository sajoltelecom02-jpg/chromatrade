import React, { useState } from 'react';
import { User, Transaction } from '../../types';
import { MockAuthService, MockWalletService } from '../../services/mockBackend';

interface AdminUsersProps {
  users: User[];
  onRefresh: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'history'>('overview');

  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('');
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');

  const handleCreateUser = () => {
      if(!newUserPhone || !newUserBalance) return;
      try {
          MockAuthService.createUser(newUserPhone, parseFloat(newUserBalance));
          setNewUserPhone('');
          setNewUserBalance('');
          onRefresh();
          alert("User created successfully!");
      } catch(e: any) {
          alert(e.message);
      }
  };

  const handleSelectUser = (u: User) => {
      setSelectedUser(u);
      setDetailTab('overview');
      // Fetch User History
      const txs = MockWalletService.getTransactionsForUser(u.id);
      setUserTransactions(txs);
  };

  const handleUserStatusChange = (status: 'active' | 'blocked') => {
      if(!selectedUser) return;
      MockAuthService.updateUserStatus(selectedUser.id, status);
      // Update local state immediately for UI response
      setSelectedUser({...selectedUser, status});
      onRefresh();
  };

  const handleAdjustBalance = (type: 'add' | 'deduct') => {
      if(!selectedUser || !balanceAdjustAmount) return;
      try {
          MockWalletService.adminAdjustBalance(selectedUser.id, parseFloat(balanceAdjustAmount), type);
          setBalanceAdjustAmount('');
          
          // Update local state to reflect new balance
          const updatedBalance = type === 'add' 
             ? selectedUser.balance + parseFloat(balanceAdjustAmount)
             : selectedUser.balance - parseFloat(balanceAdjustAmount);
             
          setSelectedUser({...selectedUser, balance: updatedBalance});
          
          // Refresh transactions
          const txs = MockWalletService.getTransactionsForUser(selectedUser.id);
          setUserTransactions(txs);

          onRefresh();
          alert("Balance updated!");
      } catch(e: any) {
          alert(e.message);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Create User Card */}
        {!selectedUser && (
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                Add New User
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Phone Number" 
                  value={newUserPhone} 
                  onChange={e => setNewUserPhone(e.target.value)} 
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" 
                />
                <input 
                  type="number" 
                  placeholder="Initial Balance" 
                  value={newUserBalance} 
                  onChange={e => setNewUserBalance(e.target.value)} 
                  className="w-full sm:w-32 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" 
                />
                <button 
                  onClick={handleCreateUser} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-emerald-600/20"
                >
                  Create
                </button>
            </div>
        </div>
        )}

        {/* User List or User Detail */}
        {selectedUser ? (
           <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-slide-up">
               {/* Header */}
               <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-800 rounded-full transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                      </button>
                      <div>
                          <h3 className="text-white font-bold">{selectedUser.username}</h3>
                          <p className="text-xs text-slate-400 font-mono">{selectedUser.phone}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-emerald-400 font-mono font-bold text-lg">${selectedUser.balance.toFixed(2)}</p>
                      <p className={`text-[10px] uppercase font-bold ${selectedUser.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{selectedUser.status}</p>
                  </div>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-slate-700">
                   <button onClick={() => setDetailTab('overview')} className={`flex-1 py-3 text-sm font-bold transition ${detailTab === 'overview' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-white'}`}>Overview & Actions</button>
                   <button onClick={() => setDetailTab('history')} className={`flex-1 py-3 text-sm font-bold transition ${detailTab === 'history' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-white'}`}>History & Transactions</button>
               </div>

               <div className="p-4">
                   {detailTab === 'overview' && (
                       <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                   <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Account Status</label>
                                   <div className="flex gap-2">
                                       <button 
                                          onClick={() => handleUserStatusChange('active')}
                                          disabled={selectedUser.status === 'active'}
                                          className={`flex-1 py-1.5 rounded text-xs font-bold ${selectedUser.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                       >
                                          Active
                                       </button>
                                       <button 
                                          onClick={() => handleUserStatusChange('blocked')}
                                          disabled={selectedUser.status === 'blocked'}
                                          className={`flex-1 py-1.5 rounded text-xs font-bold ${selectedUser.status === 'blocked' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                       >
                                          Blocked
                                       </button>
                                   </div>
                               </div>
                               <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                   <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Manual Balance Adjustment</label>
                                   <div className="flex gap-2">
                                       <input 
                                          type="number" 
                                          placeholder="Amount" 
                                          value={balanceAdjustAmount}
                                          onChange={e => setBalanceAdjustAmount(e.target.value)}
                                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                       />
                                   </div>
                                   <div className="flex gap-2 mt-2">
                                       <button onClick={() => handleAdjustBalance('add')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded text-xs font-bold">Credit</button>
                                       <button onClick={() => handleAdjustBalance('deduct')} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-1 rounded text-xs font-bold">Debit</button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {detailTab === 'history' && (
                       <div className="space-y-4">
                           <h4 className="text-xs text-slate-400 uppercase font-bold">Recent Transactions</h4>
                           <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                               {userTransactions.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No transactions found.</p>}
                               {userTransactions.map(tx => (
                                   <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                       <div className="flex flex-col">
                                           <span className="text-sm text-white capitalize font-medium">{tx.type.replace('_', ' ')}</span>
                                           <span className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleString()}</span>
                                       </div>
                                       <div className="text-right">
                                           <p className={`font-mono font-bold text-sm ${['deposit','bet_win','admin_adjustment'].includes(tx.type) && tx.status === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                               {['deposit','bet_win','admin_adjustment'].includes(tx.type) ? '+' : '-'}{tx.amount}
                                           </p>
                                           <p className={`text-[10px] uppercase font-bold ${tx.status === 'success' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>{tx.status}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
           </div>
        ) : (
            /* User List */
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Registered Users</h3>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{users.length} Total</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    {users.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No users found.</div>}
                    {users.map(u => (
                        <div 
                        key={u.id} 
                        onClick={() => handleSelectUser(u)} 
                        className="p-4 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer flex justify-between items-center group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'ADMIN' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                                {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm flex items-center gap-2">
                                    {u.username} 
                                    {u.status === 'blocked' && <span className="bg-red-500 text-[10px] px-1.5 rounded text-white">BLOCKED</span>}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">{u.phone}</p>
                            </div>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-400 font-mono font-bold text-sm">${u.balance.toFixed(2)}</p>
                                <span className="text-[10px] text-slate-500 group-hover:text-amber-500 transition-colors">View Details →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminUsers;