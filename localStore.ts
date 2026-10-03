import {
  UserProfile,
  UserSettings,
  RelapseRecord,
  FinanceRecord,
  FamilyMoneyRecord,
  RecipeRecord,
  MonthlyReportRecord,
  AppStateData,
} from '../types';

const STORAGE_KEY = 'ccd_local_state_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  userId: 'local-user',
  habitName: 'Masturbation',
  habitStartDate: new Date(Date.now() - 7 * 86400000).toISOString(),
  currency: '$',
  theme: 'dark',
  autoBackup: true,
  googleDriveConnected: false,
  notificationsEnabled: true,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SAMPLE_RECIPES: RecipeRecord[] = [
  {
    id: 'sample-rec-1',
    userId: 'default',
    name: 'Royal Espresso Tonic',
    category: 'Coffee',
    ingredients: 'Double shot espresso (60ml)\nPremium Indian Tonic Water (150ml)\nFresh rosemary sprig\nDehydrated orange wheel\nClear ice cubes',
    prepTimeMinutes: 3,
    cookTimeMinutes: 2,
    totalTimeMinutes: 5,
    method: 'Build over clear ice in a highball glass.',
    steps: '1. Fill a chilled crystal glass with artisanal ice cubes.\n2. Gently pour 150ml of premium tonic water along the side of the glass.\n3. Carefully float a freshly pulled double espresso over the tonic using a bar spoon.\n4. Garnish with a torched rosemary sprig and blood orange slice.',
    notes: 'Incredible afternoon focus boost with balanced bitterness and refreshing effervescence.',
    tags: 'coffee, refresher, afternoon, signature',
    isFavorite: true,
    photoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-rec-2',
    userId: 'default',
    name: 'Midnight Gold Velvet Mocktail',
    category: 'Mocktail',
    ingredients: 'Fresh Blackberry Puree (45ml)\nOrganic Lavender-infused Agave (20ml)\nClarified Lemon Juice (25ml)\nSparkling Mineral Water (90ml)\nEdible gold dust for garnish',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    totalTimeMinutes: 5,
    method: 'Shake and strain over diamond cut ice.',
    steps: '1. Combine blackberry puree, lavender agave, and fresh lemon in a Parisian shaker with ice.\n2. Shake vigorously for 12 seconds until frosty.\n3. Fine-strain into a chilled coupe.\n4. Top with effervescent mineral water and dust with edible gold flake.',
    notes: 'A luxurious alcohol-free evening ritual drink designed to calm evening cravings.',
    tags: 'evening, mocktail, luxury, non-alcoholic',
    isFavorite: true,
    photoUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  }
];

export function loadLocalState(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        profile: parsed.profile || null,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        relapses: parsed.relapses || [],
        finances: parsed.finances || [],
        familyMoney: parsed.familyMoney || [],
        recipes: parsed.recipes && parsed.recipes.length > 0 ? parsed.recipes : DEFAULT_SAMPLE_RECIPES,
        reports: parsed.reports || [],
      };
    }
  } catch (e) {
    console.error('Error loading local state:', e);
  }

  return {
    profile: null,
    settings: DEFAULT_SETTINGS,
    relapses: [],
    finances: [],
    familyMoney: [],
    recipes: DEFAULT_SAMPLE_RECIPES,
    reports: [],
  };
}

export function saveLocalState(state: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving local state:', e);
  }
}

export function exportBackupJSON(state: AppStateData): string {
  const exportPayload = {
    app: 'CCD — A Better You Every Day',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importBackupJSON(jsonStr: string): AppStateData | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const data = parsed.data || parsed;
    if (data.settings || data.finances || data.relapses) {
      return {
        profile: data.profile || null,
        settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        relapses: data.relapses || [],
        finances: data.finances || [],
        familyMoney: data.familyMoney || [],
        recipes: data.recipes || [],
        reports: data.reports || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse backup JSON:', e);
  }
  return null;
}
