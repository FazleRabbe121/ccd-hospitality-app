export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  habitName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelapseRecord {
  id: string;
  userId: string;
  habitName: string;
  relapseDate: string; // YYYY-MM-DD
  relapseTime: string; // HH:mm:ss
  timestamp: number;
  streakDaysLost: number;
  trigger?: string;
  notes?: string;
  createdAt: string;
}

export type FinanceType = 'income' | 'expense';

export type IncomeCategory = 'Salary' | 'Tips' | 'Other Income';

export type ExpenseCategory =
  | 'Food'
  | 'Shopping'
  | 'Internet'
  | 'Transport'
  | 'Rent'
  | 'Personal'
  | 'Family'
  | 'Other';

export interface FinanceRecord {
  id: string;
  userId: string;
  type: FinanceType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface FamilyMoneyRecord {
  id: string;
  userId: string;
  amount: number;
  recipient?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export type RecipeCategory =
  | 'Cocktail'
  | 'Mocktail'
  | 'Coffee'
  | 'Syrup'
  | 'Food'
  | 'Other';

export interface RecipeRecord {
  id: string;
  userId: string;
  name: string;
  category: RecipeCategory;
  ingredients: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  method?: string;
  steps: string;
  notes?: string;
  tags?: string;
  isFavorite: boolean;
  photoUrl?: string;
  createdAt: string;
}

export interface MonthlyStatsPayload {
  month: string; // YYYY-MM
  income: {
    salary: number;
    tips: number;
    other: number;
    total: number;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  savings: number;
  familyMoney: {
    total: number;
    count: number;
  };
  habit: {
    habitName: string;
    relapses: number;
    currentStreak: number;
    longestStreak: number;
  };
  recipes: {
    total: number;
    addedThisMonth: number;
  };
}

export interface MonthlyReportRecord {
  id: string;
  userId: string;
  month: string; // e.g. "2026-09"
  dataSnapshot: MonthlyStatsPayload;
  reportContent: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  habitName: string;
  habitStartDate: string; // ISO string
  currency: string;
  theme: 'dark';
  autoBackup: boolean;
  googleDriveConnected: boolean;
  lastBackupAt?: string;
  notificationsEnabled: boolean;
  updatedAt?: string;
}

export interface AppStateData {
  profile: UserProfile | null;
  settings: UserSettings;
  relapses: RelapseRecord[];
  finances: FinanceRecord[];
  familyMoney: FamilyMoneyRecord[];
  recipes: RecipeRecord[];
  reports: MonthlyReportRecord[];
}
