import { User, Bet, GameResult, Transaction, ColorOption, GameDuration, PaymentMethod, MinesSession, AviatorState, AviatorBet, WheelNumber, WheelBet, WheelGameResult, WheelSegment, WheelGameState } from '../types';

// --- Constants ---
export const GAME_DURATIONS: GameDuration[] = [30, 60, 180, 300, 600];
export const LOCK_TIMES = {
  30: 5,
  60: 5,
  180: 5,
  300: 5,
  600: 5
};

// --- Helper Functions ---
const generatePeriodId = (timestamp: number, duration: GameDuration): string => {
  const date = new Date(timestamp);
  const Y = date.getFullYear();
  const M = (date.getMonth() + 1).toString().padStart(2, '0');
  const D = date.getDate().toString().padStart(2, '0');
  
  const totalSeconds = Math.floor(timestamp / 1000);
  const periodIndex = Math.floor(totalSeconds / duration);
  
  return `${Y}${M}${D}${periodIndex}`;
};

const getColorsForNumber = (num: number): ColorOption[] => {
  if (num === 0) return ['red', 'violet'];
  if (num === 5) return ['green', 'violet'];
  if ([1, 3, 7, 9].includes(num)) return ['green'];
  return ['red'];
};

const calculateRiggedOutcome = (pendingBets: Bet[]) => {
  if (pendingBets.length === 0) return Math.floor(Math.random() * 10);
  
  const liabilities = [];
  for (let n = 0; n <= 9; n++) {
     let liability = 0;
     const nColors = getColorsForNumber(n);
     
     pendingBets.forEach(bet => {
         if (bet.type === 'number' && bet.selection === n) {
             liability += bet.amount * 9;
         } else if (bet.type === 'color' && nColors.includes(bet.selection as ColorOption)) {
             if (bet.selection === 'violet') liability += bet.amount * 4.5;
             else liability += bet.amount * 2;
         }
     });
     liabilities.push({ n, liability });
  }
  
  liabilities.sort((a, b) => a.liability - b.liability);
  const minLiability = liabilities[0].liability;
  const candidates = liabilities.filter(x => x.liability === minLiability).map(x => x.n);
  return candidates[Math.floor(Math.random() * candidates.length)];
};

// --- In-Memory State ---
let users: User[] = []; // Persistent user storage
let currentUser: User | null = null;
let allTransactions: Transaction[] = []; // Global transactions
let activeMinesSession: MinesSession | null = null; // Single active session for current user
let systemConfig = {
    telegramLink: "https://t.me/YourChannel"
};

// Aviator State
let aviatorState: AviatorState = {
  phase: 'betting',
  startTime: Date.now() + 5000,
  crashPoint: 2.00,
  history: [1.2, 5.4, 1.1, 2.3, 15.0]
};
let currentAviatorBets: AviatorBet[] = []; // Active round bets
let aviatorHistory: AviatorBet[] = []; // Persistent history for all users

// Wheel State
let wheelBets: WheelBet[] = [];
// History of last results (value and if it had a mega multiplier)
let wheelHistory: { value: WheelNumber; multiplier?: number }[] = [
    { value: 1 }, { value: 2 }, { value: 1 }, { value: 5 }, { value: 1 },
    { value: 10, multiplier: 50 }, { value: 1 }, { value: 2 }, { value: 20 }, { value: 1 }
];
let currentWheelRoundStart = Date.now();
let currentWheelResult: WheelGameResult | null = null;
let nextWheelMultiplier: { num: WheelNumber, val: number } | null = null;
let nextForcedWheelResult: WheelNumber | null = null; // Admin forced result

// Payment Methods
let paymentMethods: PaymentMethod[] = [
  { id: '1', name: 'USDT (TRC20)', details: 'T9yX...WalletAddress', type: 'crypto' },
  { id: '2', name: 'Bkash (Personal)', details: '01700000000', type: 'fiat' },
];

// Game State
const state: Record<GameDuration, {
  bets: Bet[];
  results: GameResult[];
  nextForcedResult: number | null;
}> = {
  30: { bets: [], results: [], nextForcedResult: null },
  60: { bets: [], results: [], nextForcedResult: null },
  180: { bets: [], results: [], nextForcedResult: null },
  300: { bets: [], results: [], nextForcedResult: null },
  600: { bets: [], results: [], nextForcedResult: null }
};

// Seed History
const seedHistory = () => {
  const now = Date.now();
  GAME_DURATIONS.forEach(duration => {
    for (let i = 1; i <= 50; i++) {
      const time = now - i * duration * 1000;
      const pid = generatePeriodId(time, duration);
      const num = Math.floor(Math.random() * 10);
      state[duration].results.push({
        periodId: pid,
        number: num,
        colors: getColorsForNumber(num),
        gameDuration: duration,
        timestamp: time,
      });
    }
    state[duration].results.sort((a, b) => b.timestamp - a.timestamp);
  });
};
seedHistory();

// --- Service Methods ---

export const MockAuthService = {
  login: async (phone: string, otp: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Admin Login
    if (phone === 'admin' && otp === 'admin123') {
      currentUser = { id: 'admin-1', username: 'Admin', balance: 999999, role: 'ADMIN', phone, status: 'active' };
      return currentUser;
    }

    // User Login (Persistent)
    let user = users.find(u => u.phone === phone);
    
    if (user) {
        if (user.status === 'blocked') {
            throw new Error("Your account has been blocked. Contact support.");
        }
        // Check password (using otp field as password for simplicity in this mock)
        if (user.password && user.password !== otp) {
            throw new Error("Invalid credentials");
        }
    } else {
      // Create new user
      user = { 
        id: `user-${phone}-${Date.now()}`, 
        username: `User-${phone.slice(-4)}`, 
        balance: 0, 
        role: 'USER', 
        phone,
        status: 'active',
        password: otp // Store password for editing
      };
      users.push(user);
    }
    
    currentUser = user;
    return currentUser;
  },
  
  logout: () => {
    currentUser = null;
    activeMinesSession = null;
  },
  getCurrentUser: () => currentUser,
  
  // Update Profile Info
  updateProfile: async (userId: string, updates: { username?: string; phone?: string; password?: string }, oldPassword?: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      // Verify Old Password if changing password
      if (updates.password) {
          if (!oldPassword) throw new Error("Old password is required to set a new password.");
          if (user.password && user.password !== oldPassword) {
              throw new Error("Old password incorrect.");
          }
      }

      if (updates.username) user.username = updates.username;
      if (updates.phone) user.phone = updates.phone;
      if (updates.password) user.password = updates.password;

      if (currentUser && currentUser.id === userId) {
          // Update local session
          Object.assign(currentUser, updates);
      }
      return user;
  },
  
  // NEW: Get all users for admin
  getAllUsers: () => {
    if (currentUser?.role !== 'ADMIN') return [];
    return users;
  },

  // NEW: Admin create user
  createUser: (phone: string, initialBalance: number) => {
      if (users.find(u => u.phone === phone)) throw new Error("User already exists");
      const newUser: User = {
          id: `user-${phone}-${Date.now()}`,
          username: `User-${phone.slice(-4)}`,
          balance: initialBalance,
          role: 'USER',
          phone,
          status: 'active',
          password: '123' // default
      };
      users.push(newUser);
      return newUser;
  },

  // NEW: Block/Unblock
  updateUserStatus: (userId: string, status: 'active' | 'blocked') => {
      const user = users.find(u => u.id === userId);
      if(user) user.status = status;
  },

  getSystemConfig: () => systemConfig,
  updateTelegramLink: (link: string) => {
      systemConfig.telegramLink = link;
  }
};

export const MockWalletService = {
  getBalance: async (): Promise<number> => {
    return currentUser ? currentUser.balance : 0;
  },
  
  addTransaction: async (
    type: Transaction['type'], 
    amount: number, 
    paymentMethodName?: string, 
    details?: Transaction['paymentDetails']
  ) => {
    if (!currentUser) throw new Error("Not logged in");
    
    // WITHDRAWAL LOGIC: Deduct immediately but set to Pending
    if (type === 'withdraw') {
        if (currentUser.balance < amount) throw new Error("Insufficient balance");
        currentUser.balance -= amount;
    }
    
    // BET LOGIC
    if (type === 'bet_loss') currentUser.balance -= amount;
    if (type === 'bet_win') currentUser.balance += amount;

    // DEPOSIT LOGIC: Pending by default, no balance change yet

    const status = (type === 'deposit' || type === 'withdraw') ? 'pending' : 'success';

    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      username: currentUser.username,
      type,
      amount,
      timestamp: Date.now(),
      status,
      paymentMethod: paymentMethodName,
      paymentDetails: details
    };
    allTransactions.unshift(tx);
    return tx;
  },
  
  // NEW: Admin adjust balance
  adminAdjustBalance: (userId: string, amount: number, type: 'add' | 'deduct') => {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      
      if (type === 'add') {
          user.balance += amount;
      } else {
          if (user.balance < amount) throw new Error("Insufficient user balance");
          user.balance -= amount;
      }

      // Record transaction
      const tx: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          username: user.username,
          type: 'admin_adjustment',
          amount: amount,
          timestamp: Date.now(),
          status: 'success',
          paymentDetails: { methodName: `Admin ${type === 'add' ? 'Credit' : 'Debit'}` }
      };
      allTransactions.unshift(tx);
      
      // Sync if current user
      if (currentUser && currentUser.id === userId) currentUser.balance = user.balance;
  },

  getTransactions: () => {
    if (!currentUser) return [];
    return allTransactions.filter(t => t.userId === currentUser.id);
  },

  // NEW: For Admin to see specific user history
  getTransactionsForUser: (userId: string) => {
      return allTransactions.filter(t => t.userId === userId);
  },

  // --- Admin Methods ---
  getPendingDeposits: () => {
    return allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  },
  
  getPendingWithdrawals: () => {
    return allTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
  },

  approveDeposit: (id: string) => {
    const tx = allTransactions.find(t => t.id === id);
    if (tx && tx.status === 'pending' && tx.type === 'deposit') {
       tx.status = 'success';
       const user = users.find(u => u.id === tx.userId);
       if (user) {
          user.balance += tx.amount;
          // Sync current session if needed
          if (currentUser && currentUser.id === user.id) {
             currentUser.balance = user.balance;
          }
       }
    }
  },

  rejectDeposit: (id: string) => {
    const tx = allTransactions.find(t => t.id === id);
    if (tx && tx.status === 'pending' && tx.type === 'deposit') {
       tx.status = 'failed';
    }
  },

  approveWithdrawal: (id: string) => {
    const tx = allTransactions.find(t => t.id === id);
    if (tx && tx.status === 'pending' && tx.type === 'withdraw') {
       tx.status = 'success';
       // Balance was already deducted, so we just mark success
    }
  },

  rejectWithdrawal: (id: string) => {
    const tx = allTransactions.find(t => t.id === id);
    if (tx && tx.status === 'pending' && tx.type === 'withdraw') {
       tx.status = 'failed';
       // REFUND the user
       const user = users.find(u => u.id === tx.userId);
       if (user) {
          user.balance += tx.amount;
          if (currentUser && currentUser.id === user.id) {
             currentUser.balance = user.balance;
          }
       }
    }
  }
};

export const MockPaymentService = {
    getMethods: () => paymentMethods,
    addMethod: (name: string, details: string) => {
        const newMethod: PaymentMethod = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            details,
            type: 'fiat'
        };
        paymentMethods.push(newMethod);
        return newMethod;
    },
    deleteMethod: (id: string) => {
        paymentMethods = paymentMethods.filter(p => p.id !== id);
    }
};

export const MockGameService = {
  placeBet: async (selection: string | number, type: 'color' | 'number', amount: number, periodId: string, duration: GameDuration): Promise<Bet> => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.balance < amount) throw new Error("Insufficient balance");

    currentUser.balance -= amount;

    const newBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      periodId,
      selection,
      type,
      amount,
      gameDuration: duration,
      timestamp: Date.now(),
      status: 'pending',
      payout: 0,
    };
    state[duration].bets.unshift(newBet);
    return newBet;
  },

  getUserBets: (duration: GameDuration) => state[duration].bets,
  getHistory: (duration: GameDuration) => state[duration].results,
  
  setNextResult: (num: number, duration: GameDuration) => {
    state[duration].nextForcedResult = num;
  },

  getPeriodStats: (duration: GameDuration) => {
    const currentPeriodId = generatePeriodId(Date.now(), duration);
    const pendingBets = state[duration].bets.filter(b => b.periodId === currentPeriodId && b.status === 'pending');
    
    return {
       totalBets: pendingBets.length,
       poolSize: pendingBets.reduce((acc, b) => acc + b.amount, 0),
       red: pendingBets.filter(b => b.type === 'color' && b.selection === 'red').reduce((acc, b) => acc + b.amount, 0),
       green: pendingBets.filter(b => b.type === 'color' && b.selection === 'green').reduce((acc, b) => acc + b.amount, 0),
       violet: pendingBets.filter(b => b.type === 'color' && b.selection === 'violet').reduce((acc, b) => acc + b.amount, 0),
       projectedResult: calculateRiggedOutcome(pendingBets),
       forcedResult: state[duration].nextForcedResult
    };
  },

  checkPeriodEnd: (currentPeriodId: string, duration: GameDuration): GameResult | null => {
    const gameState = state[duration];
    const existing = gameState.results.find(r => r.periodId === currentPeriodId);
    if (existing) return existing;

    const now = Date.now();
    const activePeriodId = generatePeriodId(now, duration);
    
    if (activePeriodId !== currentPeriodId) {
      let num: number;
      if (gameState.nextForcedResult !== null) {
        num = gameState.nextForcedResult;
        gameState.nextForcedResult = null;
      } else {
        const pendingBets = gameState.bets.filter(b => b.periodId === currentPeriodId && b.status === 'pending');
        num = calculateRiggedOutcome(pendingBets);
      }

      const result: GameResult = {
        periodId: currentPeriodId,
        number: num,
        colors: getColorsForNumber(num),
        gameDuration: duration,
        timestamp: now,
      };

      gameState.results.unshift(result);
      if (gameState.results.length > 50) gameState.results.pop();

      gameState.bets.forEach(bet => {
        if (bet.periodId === currentPeriodId && bet.status === 'pending') {
          let win = false;
          let multiplier = 0;

          if (bet.type === 'number') {
            if (bet.selection === num) { win = true; multiplier = 9; }
          } else if (bet.type === 'color') {
            const resultColors = getColorsForNumber(num);
            if (resultColors.includes(bet.selection as ColorOption)) {
              win = true;
              multiplier = (bet.selection === 'violet') ? 4.5 : 2;
            }
          }

          if (win) {
            bet.status = 'win';
            bet.payout = bet.amount * multiplier;
            // Update persistent user balance
            if (currentUser) currentUser.balance += bet.payout;
          } else {
            bet.status = 'loss';
            bet.payout = 0;
          }
        }
      });

      return result;
    }
    return null;
  },
  
  getCurrentPeriodId: (duration: GameDuration) => generatePeriodId(Date.now(), duration),
};

export const MockMinesService = {
  getActiveSession: () => activeMinesSession,
  
  startGame: async (betAmount: number, minesCount: number): Promise<MinesSession> => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.balance < betAmount) throw new Error("Insufficient balance");
    if (activeMinesSession && activeMinesSession.status === 'active') throw new Error("Game already active");

    currentUser.balance -= betAmount;

    // Generate grid
    const grid = Array(25).fill(0);
    let placed = 0;
    while (placed < minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (grid[idx] === 0) {
        grid[idx] = 1;
        placed++;
      }
    }

    activeMinesSession = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      betAmount,
      minesCount,
      grid,
      revealed: Array(25).fill(false),
      status: 'active',
      currentMultiplier: 1.0
    };
    return activeMinesSession;
  },

  revealTile: async (index: number): Promise<MinesSession> => {
    if (!activeMinesSession || activeMinesSession.status !== 'active') throw new Error("No active game");
    if (activeMinesSession.revealed[index]) return activeMinesSession;

    activeMinesSession.revealed[index] = true;

    if (activeMinesSession.grid[index] === 1) {
      // Boom
      activeMinesSession.status = 'exploded';
      activeMinesSession.currentMultiplier = 0;
      activeMinesSession = { ...activeMinesSession }; // Trigger update
      const endedSession = activeMinesSession;
      activeMinesSession = null;
      return endedSession;
    } else {
      // Gem Multiplier Logic
      const mines = activeMinesSession.minesCount;
      const revealedCount = activeMinesSession.revealed.filter(Boolean).length;
      
      let mult = 0.99; // House edge base
      for (let i = 0; i < revealedCount; i++) {
          const remainingTiles = 25 - i;
          const remainingSafe = 25 - mines - i;
          mult = mult * (remainingTiles / remainingSafe);
      }
      
      activeMinesSession.currentMultiplier = mult;
      return { ...activeMinesSession };
    }
  },

  cashOut: async (): Promise<MinesSession> => {
    if (!activeMinesSession || activeMinesSession.status !== 'active') throw new Error("No active game");
    
    const payout = activeMinesSession.betAmount * activeMinesSession.currentMultiplier;
    activeMinesSession.status = 'cashed_out';
    
    if (currentUser) {
      currentUser.balance += payout;
    }
    
    const endedSession = { ...activeMinesSession };
    activeMinesSession = null;
    return endedSession;
  }
};

export const MockAviatorService = {
  getGameState: () => {
    const now = Date.now();
    
    if (aviatorState.phase === 'betting') {
        if (now >= aviatorState.startTime) {
            aviatorState.phase = 'flying';
            // Determine crash point
            if (Math.random() < 0.1) aviatorState.crashPoint = 1.00; // Instant crash
            else aviatorState.crashPoint = parseFloat((1 + Math.random() * 10).toFixed(2));
            if (Math.random() > 0.9) aviatorState.crashPoint = parseFloat((10 + Math.random() * 100).toFixed(2)); // High roller
        }
    } else if (aviatorState.phase === 'flying') {
        const elapsed = (now - aviatorState.startTime) / 1000;
        const currentMult = Math.exp(0.06 * elapsed); // Exponential growth
        
        if (currentMult >= aviatorState.crashPoint) {
            aviatorState.phase = 'crashed';
            aviatorState.history.unshift(aviatorState.crashPoint);
            if (aviatorState.history.length > 20) aviatorState.history.pop();
            
            // Process crashes for active bets
            currentAviatorBets.forEach(b => {
                if (b.status === 'active') {
                    b.status = 'crashed';
                }
            });
            
            // Schedule next round
            setTimeout(() => {
                aviatorState.phase = 'betting';
                aviatorState.startTime = Date.now() + 5000;
                currentAviatorBets = []; // Clear bets for next round
            }, 3000);
        }
    }

    return {
        state: { ...aviatorState },
        myBets: currentUser ? currentAviatorBets.filter(b => b.userId === currentUser!.id) : [],
        myHistory: currentUser ? aviatorHistory.filter(b => b.userId === currentUser!.id) : []
    };
  },

  placeBet: async (amount: number, panelId: 1 | 2) => {
      if (!currentUser) throw new Error("Login required");
      if (aviatorState.phase !== 'betting') throw new Error("Betting closed");
      if (currentUser.balance < amount) throw new Error("Insufficient balance");
      if (currentAviatorBets.find(b => b.userId === currentUser!.id && b.panelId === panelId)) throw new Error("Bet already placed");

      currentUser.balance -= amount;
      
      const bet: AviatorBet = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          amount,
          status: 'active',
          panelId,
          timestamp: Date.now()
      };
      currentAviatorBets.push(bet);
  },

  cashOut: async (panelId: 1 | 2) => {
      if (!currentUser) throw new Error("Login required");
      if (aviatorState.phase !== 'flying') throw new Error("Cannot cash out");

      const bet = currentAviatorBets.find(b => b.userId === currentUser!.id && b.panelId === panelId && b.status === 'active');
      if (!bet) throw new Error("No active bet");

      // Calculate current multiplier
      const elapsed = (Date.now() - aviatorState.startTime) / 1000;
      const currentMult = Math.floor(Math.exp(0.06 * elapsed) * 100) / 100; // Floor to 2 decimals

      bet.status = 'cashed';
      bet.cashedOutMultiplier = currentMult;
      bet.payout = bet.amount * currentMult;

      currentUser.balance += bet.payout;

      // Add to persistent history
      aviatorHistory.unshift({...bet});
  }
};

// ... Wheel Service Definitions ...
const WHEEL_SEGMENTS: WheelSegment[] = [];

const colors: Record<number, string> = {
    1: '#FCD34D', // Pale Gold/Cream
    2: '#3B82F6', // Blue
    5: '#EC4899', // Pink
    8: '#8B5CF6', // Violet
    10: '#EF4444', // Red
    15: '#10B981', // Green
    20: '#F97316', // Orange
    30: '#06B6D4', // Cyan
    40: '#F59E0B'  // Gold
};

const generateFairWheel = (): WheelSegment[] => {
    const hardcodedOrder: WheelNumber[] = [
        1, 10, 2, 5, 1, 2, 8, 1, 5, 2, 1, 15, 2, 5, 1, 2, 10, 1, 
        8, 2, 1, 5, 30, 1, 2, 40, 1, 2, 5, 1, 8, 2, 1, 10, 5, 2,
        1, 20, 1, 2, 8, 1, 5, 2, 1, 10, 1, 15, 2, 1, 20, 1, 2, 1
    ];
    
    return hardcodedOrder.map((val, i) => ({
        id: i,
        value: val,
        color: colors[val]
    }));
};

const WHEEL_SEGMENTS_GENERATED = generateFairWheel();
WHEEL_SEGMENTS_GENERATED.forEach(s => WHEEL_SEGMENTS.push(s));


export const MockWheelService = {
    getSegments: () => WHEEL_SEGMENTS,
    
    // NEW: Force Result Method for Admin
    forceResult: (num: WheelNumber) => {
        nextForcedWheelResult = num;
    },

    // NEW: Auto-Loop Logic
    getGameState: (): WheelGameState => {
        const now = Date.now();
        const cycleDuration = 20000; // Increased cycle time to 20s
        const bettingDuration = 10000; // 10s betting
        
        // Calculate where we are in the cycle
        const elapsed = now - currentWheelRoundStart;
        
        // Check if round over
        if (elapsed >= cycleDuration) {
            // Reset Round & Update History
            currentWheelRoundStart = now;
            
            // Push the result of the JUST FINISHED round to history
            if (currentWheelResult) {
                wheelHistory.unshift({ 
                    value: currentWheelResult.winningValue, 
                    multiplier: currentWheelResult.multiplierNumber === currentWheelResult.winningValue ? currentWheelResult.multiplierValue : undefined 
                });
                if (wheelHistory.length > 20) wheelHistory.pop();
            }

            wheelBets = []; // Clear bets
            currentWheelResult = null;
            nextWheelMultiplier = null;
            
            // Pre-calculate next multiplier for the upcoming round
            const possibleNumbers: WheelNumber[] = [1,2,5,8,10,15,20,30,40];
            const num = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
            const val = Math.random() > 0.9 ? 500 : Math.random() > 0.7 ? 200 : Math.random() > 0.4 ? 100 : 50;
            nextWheelMultiplier = { num, val };
            
            return {
                phase: 'betting',
                timeLeft: bettingDuration / 1000,
                history: wheelHistory,
                result: null,
                nextMultiplier: nextWheelMultiplier
            };
        }

        if (elapsed < bettingDuration) {
            // Betting Phase
            if (!nextWheelMultiplier) {
                 // Should have been set on reset, but just in case
                 nextWheelMultiplier = { num: 10, val: 50 };
            }
            return {
                phase: 'betting',
                timeLeft: (bettingDuration - elapsed) / 1000,
                history: wheelHistory,
                result: null,
                nextMultiplier: nextWheelMultiplier
            };
        } else {
            // Spinning / Result Phase
            if (!currentWheelResult) {
                // Generate result once when entering spin phase
                
                // --- RESULT LOGIC ---
                let winningIndex: number;
                let winningSegment: WheelSegment;

                // CHECK ADMIN FORCE RESULT
                if (nextForcedWheelResult !== null) {
                    // Find all segments matching the forced number
                    const candidates = WHEEL_SEGMENTS.filter(s => s.value === nextForcedWheelResult);
                    if (candidates.length > 0) {
                        // Pick a random one to vary the rotation
                        winningSegment = candidates[Math.floor(Math.random() * candidates.length)];
                        winningIndex = winningSegment.id;
                    } else {
                        // Fallback
                        winningIndex = Math.floor(Math.random() * 54);
                        winningSegment = WHEEL_SEGMENTS[winningIndex];
                    }
                    nextForcedWheelResult = null; // Clear force
                } else {
                    winningIndex = Math.floor(Math.random() * 54);
                    winningSegment = WHEEL_SEGMENTS[winningIndex];
                }
                
                // Determine actual multiplier applied
                let finalMultValue = 0;
                let multiplierApplied = null;
                
                if (nextWheelMultiplier && nextWheelMultiplier.num === winningSegment.value) {
                    finalMultValue = nextWheelMultiplier.val;
                    multiplierApplied = nextWheelMultiplier.val;
                } else {
                    finalMultValue = winningSegment.value;
                }

                currentWheelResult = {
                    winningSegmentIndex: winningIndex,
                    winningValue: winningSegment.value,
                    multiplierNumber: nextWheelMultiplier ? nextWheelMultiplier.num : null,
                    multiplierValue: nextWheelMultiplier ? nextWheelMultiplier.val : 0
                };

                // Payouts
                let anyWins = false;
                wheelBets.forEach(bet => {
                    if (bet.status === 'pending') {
                        if (bet.selection === winningSegment.value) {
                            bet.status = 'win';
                            const odds = multiplierApplied ? multiplierApplied : winningSegment.value;
                            bet.payout = bet.amount * (odds + 1);
                            
                            if (currentUser && bet.userId === currentUser.id) {
                                currentUser.balance += bet.payout;
                                anyWins = true;
                            }
                        } else {
                            bet.status = 'loss';
                            bet.payout = 0;
                        }
                    }
                });
            }

            return {
                phase: 'result', // Client visualizes 'spinning' then 'result' based on this
                timeLeft: (cycleDuration - elapsed) / 1000,
                history: wheelHistory,
                result: currentWheelResult,
                nextMultiplier: nextWheelMultiplier
            };
        }
    },

    placeBet: async (selection: WheelNumber, amount: number) => {
        if (!currentUser) throw new Error("Login required");
        
        // Validations
        const now = Date.now();
        const elapsed = now - currentWheelRoundStart;
        if (elapsed >= 10000) throw new Error("Betting closed"); // 10s betting window

        if (currentUser.balance < amount) throw new Error("Insufficient funds");

        currentUser.balance -= amount;
        
        const bet: WheelBet = {
            id: Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            selection,
            amount,
            status: 'pending',
            payout: 0
        };
        wheelBets.push(bet);
        return bet;
    },
};