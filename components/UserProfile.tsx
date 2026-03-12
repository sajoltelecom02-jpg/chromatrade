import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { MockAuthService, MockWalletService } from '../services/mockBackend';

interface Props {
  user: User;
  onLogout: () => void;
}

const UserProfile: React.FC<Props> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState(user.username);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editPassword, setEditPassword] = useState('');
  const [oldPassword, setOldPassword] = useState(''); // New State
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // History State
  const [history, setHistory] = useState<Transaction[]>([]);

  // About State
  const [telegramLink, setTelegramLink] = useState('');

  const handleLogout = () => {
     MockAuthService.logout();
     onLogout();
  };

  const handleOpenHistory = () => {
      const txs = MockWalletService.getTransactions();
      setHistory(txs);
      setShowHistory(true);
  };

  const handleOpenAbout = () => {
      const config = MockAuthService.getSystemConfig();
      setTelegramLink(config.telegramLink);
      setShowAbout(true);
  };

  const handleSaveProfile = async () => {
     if (editPassword && !oldPassword) {
         setMessage({ text: 'Old password is required to set a new password.', type: 'error' });
         return;
     }

     try {
         await MockAuthService.updateProfile(user.id, {
             username: editName,
             phone: editPhone,
             password: editPassword || undefined // Only send if changed
         }, oldPassword);

         setMessage({ text: 'Profile updated successfully!', type: 'success' });
         setTimeout(() => {
             setIsEditing(false);
             setMessage(null);
             setOldPassword('');
             setEditPassword('');
         }, 1500);
     } catch (e: any) {
         setMessage({ text: e.message || 'Update failed', type: 'error' });
     }
  };

  const MenuItem = ({ icon, label, onClick, danger = false }: { icon: any, label: string, onClick?: () => void, danger?: boolean }) => (
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700/50 hover:bg-slate-700 transition first:rounded-t-xl last:rounded-b-xl last:border-0 ${danger ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-200'}`}
      >
          <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${danger ? 'bg-red-500/20' : 'bg-slate-700'}`}>
                  {icon}
              </span>
              <span className="font-medium text-sm">{label}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
      </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-300 border-2 border-slate-600 shadow-lg relative z-10">
                {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white">{user.username}</h2>
                        <p className="text-slate-400 text-sm font-mono">{user.phone}</p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-amber-500 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500 hover:text-black transition">
                        Edit
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 uppercase">ID: {user.id.split('-')[1]}</span>
                    {user.role === 'ADMIN' && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded border border-amber-500/30">ADMIN</span>}
                </div>
            </div>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <p className="text-slate-500 text-xs uppercase font-bold mb-1">Total Assets</p>
                 <p className="text-xl font-bold text-white">${user.balance.toFixed(2)}</p>
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <p className="text-slate-500 text-xs uppercase font-bold mb-1">Status</p>
                 <p className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     Active
                 </p>
             </div>
        </div>

        {/* Menu Section */}
        <div className="rounded-xl border border-slate-700 overflow-hidden shadow-sm">
             <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>}
                label="Financial Records"
                onClick={handleOpenHistory} 
             />
             <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                label="Edit Profile Details"
                onClick={() => setIsEditing(true)} 
             />
             <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
                label="About Us"
                onClick={handleOpenAbout} 
             />
             <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>}
                label="Logout"
                danger={true}
                onClick={handleLogout} 
             />
        </div>

        <p className="text-center text-slate-600 text-xs">Version 2.4.2</p>

        {/* Edit Modal */}
        {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg">Edit Profile</h2>
                        <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                        {message && (
                            <div className={`p-3 rounded text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {message.text}
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">Username</label>
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">Phone Number</label>
                            <input 
                                type="text" 
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        
                        <div className="border-t border-slate-700 pt-3">
                            <p className="text-xs text-amber-500 mb-2">Change Password</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">Old Password</label>
                                    <input 
                                        type="password" 
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="Required for changes"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">New Password</label>
                                    <input 
                                        type="password" 
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="Leave empty to keep current"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold">Cancel</button>
                            <button onClick={handleSaveProfile} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* History Modal */}
        {showHistory && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 w-full max-w-sm h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
                    <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg">Financial Records</h2>
                        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {history.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">No records found.</p>}
                        {history.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                                <div>
                                    <p className="text-sm font-bold text-white capitalize">{tx.type.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-bold ${['deposit','bet_win','admin_adjustment'].includes(tx.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {['deposit','bet_win','admin_adjustment'].includes(tx.type) ? '+' : '-'}{tx.amount}
                                    </p>
                                    <p className={`text-[10px] uppercase font-bold ${tx.status === 'success' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>{tx.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {/* About Us Modal */}
        {showAbout && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg">About Us</h2>
                        <button onClick={() => setShowAbout(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="p-6 text-center space-y-6">
                        <div>
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl mx-auto flex items-center justify-center text-black font-bold text-2xl mb-4 shadow-lg">
                                C
                            </div>
                            <h3 className="text-xl font-bold text-white">ChromaTrade</h3>
                            <p className="text-slate-400 text-sm mt-1">Professional Gaming Platform</p>
                        </div>
                        
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-left text-sm text-slate-300">
                            <p className="mb-2">Welcome to the future of prediction gaming. We ensure fair play and instant withdrawals.</p>
                            <p>Version: 2.4.2 (Stable)</p>
                        </div>

                        {telegramLink && (
                            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.119.098.152.228.166.331.016.119.017.243.006.353z"/></svg>
                                Join Official Channel
                            </a>
                        )}
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default UserProfile;