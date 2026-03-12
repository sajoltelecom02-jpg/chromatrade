export type UserRole = 'USER' | 'ADMIN';
export type GameDuration = 30 | 60 | 180 | 300 | 600;

export interface User {
  id: string;
  username: string;
  name: string; // Real name
  balance: number;
  role: UserRole;
  phone: string;
  status: 'active' | 'blocked';
  password?: string; // New field for profile editing
}

export type ColorOption = 'green' | 'red' | 'violet';
export type BetType = 'color' | 'number';

export interface Bet {
  id: string;
  periodId: string;
  selection: string | number; // 'green', 'red', 'violet' or 0-9
  type: BetType;
  amount: number;
  gameDuration: GameDuration;
  timestamp: number;
  status: 'pending' | 'win' | 'loss';
  payout: number;
}

export interface GameResult {
  periodId: string;
  number: number;
  colors: ColorOption[]; // A number can correspond to multiple colors (e.g., 0 is red+violet)
  gameDuration: GameDuration;
  timestamp: number;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdraw' | 'bet_win' | 'bet_loss' | 'admin_adjustment';
  amount: number;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  // New verification fields
  paymentMethod?: string; // e.g., "Bkash"
  paymentDetails?: {
    fromNumber?: string;
    transactionId?: string; // TrxID
    toNumber?: string; // For withdrawals (user's wallet)
    methodName?: string;
  };
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g., "Bkash", "USDT"
  details: string; // e.g., Wallet Address or Phone Number
  type: 'crypto' | 'fiat';
}

// --- Mines Game Types ---
export interface MinesSession {
  id: string;
  userId: string;
  betAmount: number;
  minesCount: number;
  grid: number[]; // 0 = safe, 1 = mine (Hidden from frontend in real app, but here we simulate)
  revealed: boolean[]; // true if user clicked
  status: 'active' | 'cashed_out' | 'exploded';
  currentMultiplier: number;
}

// --- Aviator Game Types ---
export type AviatorPhase = 'betting' | 'flying' | 'crashed';

export interface AviatorState {
  phase: AviatorPhase;
  startTime: number; // When the current flight started (or will start)
  crashPoint: number; // The multiplier where it crashes
  history: number[]; // Last 10 crash points
}

export interface AviatorBet {
  id: string;
  userId: string;
  amount: number;
  cashedOutMultiplier?: number;
  payout?: number;
  status: 'active' | 'cashed' | 'crashed';
  panelId: 1 | 2; // Support for double betting
  timestamp: number;
}

// --- Mega Wheel Types ---
export type WheelNumber = 1 | 2 | 5 | 8 | 10 | 15 | 20 | 30 | 40;

export interface WheelSegment {
  id: number; // 0-53
  value: WheelNumber;
  color: string;
}

export interface WheelBet {
  id: string;
  userId: string;
  selection: WheelNumber;
  amount: number;
  status: 'pending' | 'win' | 'loss';
  payout: number;
}

export interface WheelGameResult {
    winningSegmentIndex: number;
    winningValue: WheelNumber;
    multiplierNumber: WheelNumber | null; // The number that got boosted
    multiplierValue: number; // e.g., 50x, 100x
}

export interface WheelGameState {
    phase: 'betting' | 'spinning' | 'result';
    timeLeft: number;
    history: { value: WheelNumber; multiplier?: number }[];
    result: WheelGameResult | null;
    nextMultiplier: { num: WheelNumber, val: number } | null; // The potential boost shown during betting/spin
}