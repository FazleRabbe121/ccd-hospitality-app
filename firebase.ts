import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  UserSettings,
  RelapseRecord,
  FinanceRecord,
  FamilyMoneyRecord,
  RecipeRecord,
  MonthlyReportRecord,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = getAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth.currentUser?.uid,
      email: currentAuth.currentUser?.email,
      emailVerified: currentAuth.currentUser?.emailVerified,
      isAnonymous: currentAuth.currentUser?.isAnonymous,
      tenantId: currentAuth.currentUser?.tenantId,
      providerInfo: currentAuth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Persistent OAuth token & user caching for Google Workspace access (Drive, Gmail)
const STORAGE_KEY_TOKEN = 'cached_google_token_v1';
const STORAGE_KEY_USER_EMAIL = 'cached_google_user_email_v1';
const STORAGE_KEY_USER_NAME = 'cached_google_user_name_v1';

let cachedGoogleToken: string | null = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

export function getCachedGoogleToken(): string | null {
  if (cachedGoogleToken) return cachedGoogleToken;
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function setCachedGoogleToken(token: string | null) {
  cachedGoogleToken = token;
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch {}
}

export function getCachedUserEmail(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_USER_EMAIL) || auth.currentUser?.email || 'FazleRabbe905@gmail.com';
  } catch {
    return 'FazleRabbe905@gmail.com';
  }
}

export function setCachedUserEmail(email: string) {
  try {
    localStorage.setItem(STORAGE_KEY_USER_EMAIL, email);
  } catch {}
}

export function getCachedUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_USER_NAME) || auth.currentUser?.displayName || 'Fazle Rabbi';
  } catch {
    return 'Fazle Rabbi';
  }
}

// Auto-sync auth state into local storage for seamless sync in downloaded app
onAuthStateChanged(auth, user => {
  if (user) {
    if (user.email) setCachedUserEmail(user.email);
    if (user.displayName) {
      try {
        localStorage.setItem(STORAGE_KEY_USER_NAME, user.displayName);
      } catch {}
    }
  }
});

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently in offline mode.');
    }
    return false;
  }
}

// Google Sign-In via Popup
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string | null } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    setCachedGoogleToken(token);
    if (result.user.email) {
      setCachedUserEmail(result.user.email);
    }
    if (result.user.displayName) {
      try {
        localStorage.setItem(STORAGE_KEY_USER_NAME, result.user.displayName);
      } catch {}
    }
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    // Gracefully handle user cancelling or closing the popup
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google sign-in popup closed by user.');
      return null;
    }
    console.error('Google Sign In error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  setCachedGoogleToken(null);
  await signOut(auth);
}

export function getCachedDriveToken(): string | null {
  return cachedGoogleToken;
}

export function setCachedDriveToken(token: string | null) {
  cachedGoogleToken = token;
}

// Database CRUD with UID segregation
export async function saveUserProfile(user: UserProfile): Promise<void> {
  const path = `users/${user.userId}`;
  try {
    await setDoc(doc(db, 'users', user.userId), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const path = `users/${settings.userId}/settings/current`;
  try {
    await setDoc(doc(db, 'users', settings.userId, 'settings', 'current'), settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function saveRelapse(userId: string, record: RelapseRecord): Promise<void> {
  const path = `users/${userId}/relapses/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'relapses', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteRelapseRecord(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/relapses/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'relapses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveFinance(userId: string, record: FinanceRecord): Promise<void> {
  const path = `users/${userId}/finance/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'finance', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteFinanceRecord(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/finance/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'finance', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveFamilyMoney(userId: string, record: FamilyMoneyRecord): Promise<void> {
  const path = `users/${userId}/familyMoney/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'familyMoney', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteFamilyMoneyRecord(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/familyMoney/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'familyMoney', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveRecipe(userId: string, record: RecipeRecord): Promise<void> {
  const path = `users/${userId}/recipes/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'recipes', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteRecipeRecord(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/recipes/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'recipes', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveReport(userId: string, record: MonthlyReportRecord): Promise<void> {
  const path = `users/${userId}/reports/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'reports', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteReportRecord(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/reports/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'reports', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// Real-time synchronization subscriptions
export function subscribeToUserData(
  userId: string,
  callbacks: {
    onSettings: (settings: UserSettings) => void;
    onRelapses: (relapses: RelapseRecord[]) => void;
    onFinances: (finances: FinanceRecord[]) => void;
    onFamilyMoney: (familyMoney: FamilyMoneyRecord[]) => void;
    onRecipes: (recipes: RecipeRecord[]) => void;
    onReports: (reports: MonthlyReportRecord[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // Settings
  const settingsPath = `users/${userId}/settings/current`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', userId, 'settings', 'current'),
      snapshot => {
        if (snapshot.exists()) {
          callbacks.onSettings(snapshot.data() as UserSettings);
        }
      },
      err => handleFirestoreError(err, OperationType.GET, settingsPath)
    )
  );

  // Relapses
  const relapsesPath = `users/${userId}/relapses`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', userId, 'relapses'),
      snapshot => {
        const list: RelapseRecord[] = [];
        snapshot.forEach(d => list.push(d.data() as RelapseRecord));
        list.sort((a, b) => b.timestamp - a.timestamp);
        callbacks.onRelapses(list);
      },
      err => handleFirestoreError(err, OperationType.LIST, relapsesPath)
    )
  );

  // Finance
  const financePath = `users/${userId}/finance`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', userId, 'finance'),
      snapshot => {
        const list: FinanceRecord[] = [];
        snapshot.forEach(d => list.push(d.data() as FinanceRecord));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callbacks.onFinances(list);
      },
      err => handleFirestoreError(err, OperationType.LIST, financePath)
    )
  );

  // Family Money
  const familyPath = `users/${userId}/familyMoney`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', userId, 'familyMoney'),
      snapshot => {
        const list: FamilyMoneyRecord[] = [];
        snapshot.forEach(d => list.push(d.data() as FamilyMoneyRecord));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callbacks.onFamilyMoney(list);
      },
      err => handleFirestoreError(err, OperationType.LIST, familyPath)
    )
  );

  // Recipes
  const recipesPath = `users/${userId}/recipes`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', userId, 'recipes'),
      snapshot => {
        const list: RecipeRecord[] = [];
        snapshot.forEach(d => list.push(d.data() as RecipeRecord));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callbacks.onRecipes(list);
      },
      err => handleFirestoreError(err, OperationType.LIST, recipesPath)
    )
  );

  // Reports
  const reportsPath = `users/${userId}/reports`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', userId, 'reports'),
      snapshot => {
        const list: MonthlyReportRecord[] = [];
        snapshot.forEach(d => list.push(d.data() as MonthlyReportRecord));
        list.sort((a, b) => b.month.localeCompare(a.month));
        callbacks.onReports(list);
      },
      err => handleFirestoreError(err, OperationType.LIST, reportsPath)
    )
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
