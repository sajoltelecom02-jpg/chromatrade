import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, GameDuration, Bet, Transaction, PaymentMethod } from '../../types';
import { MockGameService, MockWalletService, MockAuthService, MockPaymentService } from '../../services/mockBackend';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminFinance from './AdminFinance';

// Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const FinanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface AdminPanelProps {
  user: User; // Current admin user
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'finance'>('dashboard');
  
  // -- Data State --
  const [gameDuration, setGameDuration] = useState<GameDuration>(180);
  const [stats, setStats] = useState<any>(null);
  const [liveBets, setLiveBets] = useState<Bet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // -- Data Fetching --
  const refreshData = useCallback(() => {
    // Game Stats
    setStats(MockGameService.getPeriodStats(gameDuration));
    setLiveBets(MockGameService.getUserBets(gameDuration));
    
    // Admin Global Data
    if (activeTab === 'users') {
        setUsers([...MockAuthService.getAllUsers()]);
    }
    if (activeTab === 'finance') {
        setDeposits(MockWalletService.getPendingDeposits());
        setWithdrawals(MockWalletService.getPendingWithdrawals());
        setPaymentMethods([...MockPaymentService.getMethods()]);
    }
  }, [gameDuration, activeTab]);

  // -- Ticking Loop --
  const tickRef = useRef<() => void>(null);
  useEffect(() => {
    tickRef.current = () => {
      // Always refresh game stats for the dashboard
      const currentPeriodId = MockGameService.getCurrentPeriodId(gameDuration);
      setStats(MockGameService.getPeriodStats(gameDuration));
      setLiveBets(MockGameService.getUserBets(gameDuration));
      
      // Check for period end to force update
      const result = MockGameService.checkPeriodEnd(currentPeriodId, gameDuration);
      if (result) {
        refreshData();
      }
    };
  });

  useEffect(() => {
    // Initial fetch
    refreshData();
    const interval = setInterval(() => { if (tickRef.current) tickRef.current(); }, 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Force refresh when tab changes
  useEffect(() => {
    refreshData();
  }, [activeTab, refreshData]);

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Tab Navigation */}
       <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex shadow-lg sticky top-16 z-30">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
             <DashboardIcon /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
             <UsersIcon /> Users
          </button>
          <button 
            onClick={() => setActiveTab('finance')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'finance' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
             <FinanceIcon /> Finance
          </button>
       </div>

       {/* Content Area */}
       <div className="min-h-[60vh]">
          {activeTab === 'dashboard' && (
             <AdminDashboard 
                gameDuration={gameDuration}
                setGameDuration={setGameDuration}
                stats={stats}
                liveBets={liveBets}
                onRefresh={refreshData}
             />
          )}

          {activeTab === 'users' && (
             <AdminUsers 
                users={users}
                onRefresh={refreshData}
             />
          )}

          {activeTab === 'finance' && (
             <AdminFinance 
                deposits={deposits}
                withdrawals={withdrawals}
                paymentMethods={paymentMethods}
                onRefresh={refreshData}
             />
          )}
       </div>
    </div>
  );
};

export default AdminPanel;