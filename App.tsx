import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut as firebaseLogOut, saveRelapse, deleteRelapseRecord, saveFinance, deleteFinanceRecord, saveFamilyMoney, deleteFamilyMoneyRecord, saveRecipe, deleteRecipeRecord, saveReport, deleteReportRecord, saveUserSettings, saveUserProfile } from './services/firebase';
import { loadLocalState, saveLocalState } from './services/localStore';
import { syncAndLoadCloudCVLibrary } from './services/cvStorage';
import {
  AppStateData,
  FinanceRecord,
  RelapseRecord,
  FamilyMoneyRecord,
  RecipeRecord,
  MonthlyReportRecord,
  UserSettings,
  MonthlyStatsPayload,
  FinanceType,
} from './types';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { RelapseTrackerView } from './views/RelapseTrackerView';
import { FinanceTrackerView } from './views/FinanceTrackerView';
import { FamilyMoneyView } from './views/FamilyMoneyView';
import { RecipeLibraryView } from './views/RecipeLibraryView';
import { AIAssistantView } from './views/AIAssistantView';
import { ReportsView } from './views/ReportsView';
import { ProgressStatsView } from './views/ProgressStatsView';
import { SettingsView } from './views/SettingsView';
import { CVBuilderView } from './views/CVBuilderView';
import { ApplyByEmailView } from './views/ApplyByEmailView';

import { RelapseModal } from './components/RelapseModal';
import { FinanceModal } from './components/FinanceModal';
import { FamilyMoneyModal } from './components/FamilyMoneyModal';
import { RecipeModal } from './components/RecipeModal';
import { AIReportModal } from './components/AIReportModal';
import { EducationalUrgeGuide } from './components/EducationalUrgeGuide';
import { AndroidExportModal } from './components/AndroidExportModal';
import { DeveloperGateModal, AppAccessLevel } from './components/DeveloperGateModal';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { theme } = useTheme();
  const [accessLevel, setAccessLevel] = useState<AppAccessLevel | 'none'>(() => {
    const stored = localStorage.getItem('app_access_level_auth');
    if (stored === 'full' || stored === 'cv-only') {
      return stored;
    }
    if (localStorage.getItem('app_dev_authorized_89056') === 'true') {
      return 'full';
    }
    return 'none';
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [appState, setAppState] = useState<AppStateData>(() => loadLocalState());
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Modal States
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeModalType, setFinanceModalType] = useState<FinanceType>('expense');
  const [editingFinance, setEditingFinance] = useState<FinanceRecord | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyMoneyRecord | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUrgeGuideOpen, setIsUrgeGuideOpen] = useState(false);
  const [isAndroidExportOpen, setIsAndroidExportOpen] = useState(false);

  // Network connectivity listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever appState updates
  useEffect(() => {
    saveLocalState(appState);
  }, [appState]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        setIsCloudSynced(true);
        // Sync profile
        const userProfile = {
          userId: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Distinguished Member',
          photoURL: currentUser.photoURL || undefined,
          habitName: appState.settings.habitName,
          updatedAt: new Date().toISOString(),
        };
        saveUserProfile(userProfile).catch(err => console.warn('Cloud profile sync deferred:', err));

        // Automatically fetch and synchronize CV library from cloud
        syncAndLoadCloudCVLibrary(currentUser.uid, currentUser.email || '').catch(err =>
          console.warn('CV cloud sync deferred:', err)
        );
      } else {
        setIsCloudSynced(false);
      }
    });

    return () => unsubscribe();
  }, [appState.settings.habitName]);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubs: (() => void)[] = [];

    // Relapses listener
    try {
      const relapsesRef = collection(db, 'users', user.uid, 'relapses');
      unsubs.push(
        onSnapshot(relapsesRef, snapshot => {
          const list: RelapseRecord[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as RelapseRecord));
          list.sort((a, b) => b.timestamp - a.timestamp);
          setAppState(prev => ({ ...prev, relapses: list }));
        })
      );

      // Finances listener
      const financesRef = collection(db, 'users', user.uid, 'finance');
      unsubs.push(
        onSnapshot(financesRef, snapshot => {
          const list: FinanceRecord[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as FinanceRecord));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAppState(prev => ({ ...prev, finances: list }));
        })
      );

      // Family Money listener
      const familyRef = collection(db, 'users', user.uid, 'familyMoney');
      unsubs.push(
        onSnapshot(familyRef, snapshot => {
          const list: FamilyMoneyRecord[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as FamilyMoneyRecord));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAppState(prev => ({ ...prev, familyMoney: list }));
        })
      );

      // Recipes listener
      const recipesRef = collection(db, 'users', user.uid, 'recipes');
      unsubs.push(
        onSnapshot(recipesRef, snapshot => {
          const list: RecipeRecord[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as RecipeRecord));
          if (list.length > 0) {
            setAppState(prev => ({ ...prev, recipes: list }));
          }
        })
      );

      // Reports listener
      const reportsRef = collection(db, 'users', user.uid, 'reports');
      unsubs.push(
        onSnapshot(reportsRef, snapshot => {
          const list: MonthlyReportRecord[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as MonthlyReportRecord));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAppState(prev => ({ ...prev, reports: list }));
        })
      );

      // Multi-CV Library real-time listener across all devices
      const cvDocRef = doc(db, 'users', user.uid, 'cvLibrary', 'main');
      unsubs.push(
        onSnapshot(cvDocRef, snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.cvLibrary) {
              try {
                const list = JSON.parse(data.cvLibrary);
                if (Array.isArray(list) && list.length > 0) {
                  localStorage.setItem('multi_cv_library_v2', JSON.stringify(list));
                  window.dispatchEvent(new CustomEvent('cv_library_cloud_updated', { detail: list }));
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }, err => console.warn('CV library snapshot listener:', err))
      );
    } catch (err) {
      console.warn('Real-time listener setup error:', err);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        setAuthNotice(`Signed in as ${result.user.displayName || result.user.email}`);
        setTimeout(() => setAuthNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setAuthNotice('Sign-in unavailable. Operating in local offline mode.');
      setTimeout(() => setAuthNotice(null), 4000);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogOut();
      setUser(null);
      setIsCloudSynced(false);
      setAuthNotice('Logged out safely. Switched to local mode.');
      setTimeout(() => setAuthNotice(null), 3000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Relapse Handlers
  const handleConfirmRelapse = async (recordData: Omit<RelapseRecord, 'id' | 'userId' | 'createdAt'>) => {
    const newRecord: RelapseRecord = {
      ...recordData,
      id: `relapse-${Date.now()}`,
      userId: user?.uid || 'local-user',
      createdAt: new Date().toISOString(),
    };

    setAppState(prev => ({
      ...prev,
      relapses: [newRecord, ...prev.relapses],
      settings: {
        ...prev.settings,
        habitStartDate: new Date().toISOString(),
      },
    }));

    if (user) {
      await saveRelapse(user.uid, newRecord);
      await saveUserSettings({ ...appState.settings, habitStartDate: new Date().toISOString() });
    }
  };

  const handleDeleteRelapse = async (id: string) => {
    setAppState(prev => ({
      ...prev,
      relapses: prev.relapses.filter(r => r.id !== id),
    }));

    if (user) {
      await deleteRelapseRecord(user.uid, id);
    }
  };

  const handleUpdateHabitName = async (name: string) => {
    const updatedSettings = { ...appState.settings, habitName: name };
    setAppState(prev => ({ ...prev, settings: updatedSettings }));
    if (user) {
      await saveUserSettings(updatedSettings);
    }
  };

  // Finance Handlers
  const handleSaveFinance = async (
    recordData: Omit<FinanceRecord, 'id' | 'userId' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated: FinanceRecord = {
        ...recordData,
        id: existingId,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        finances: prev.finances.map(f => (f.id === existingId ? updated : f)),
      }));
      if (user) await saveFinance(user.uid, updated);
    } else {
      const newRecord: FinanceRecord = {
        ...recordData,
        id: `fin-${Date.now()}`,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        finances: [newRecord, ...prev.finances],
      }));
      if (user) await saveFinance(user.uid, newRecord);
    }
    setEditingFinance(null);
  };

  const handleDeleteFinance = async (id: string) => {
    setAppState(prev => ({
      ...prev,
      finances: prev.finances.filter(f => f.id !== id),
    }));
    if (user) await deleteFinanceRecord(user.uid, id);
  };

  // Family Money Handlers
  const handleSaveFamilyMoney = async (
    recordData: Omit<FamilyMoneyRecord, 'id' | 'userId' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated: FamilyMoneyRecord = {
        ...recordData,
        id: existingId,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        familyMoney: prev.familyMoney.map(f => (f.id === existingId ? updated : f)),
      }));
      if (user) await saveFamilyMoney(user.uid, updated);
    } else {
      const newRecord: FamilyMoneyRecord = {
        ...recordData,
        id: `fm-${Date.now()}`,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        familyMoney: [newRecord, ...prev.familyMoney],
      }));
      if (user) await saveFamilyMoney(user.uid, newRecord);
    }
    setEditingFamily(null);
  };

  const handleDeleteFamilyMoney = async (id: string) => {
    setAppState(prev => ({
      ...prev,
      familyMoney: prev.familyMoney.filter(f => f.id !== id),
    }));
    if (user) await deleteFamilyMoneyRecord(user.uid, id);
  };

  // Recipe Handlers
  const handleSaveRecipe = async (
    recordData: Omit<RecipeRecord, 'id' | 'userId' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const existing = appState.recipes.find(r => r.id === existingId);
      const updated: RecipeRecord = {
        ...recordData,
        id: existingId,
        userId: user?.uid || 'local-user',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        recipes: prev.recipes.map(r => (r.id === existingId ? updated : r)),
      }));
      if (user) await saveRecipe(user.uid, updated);
    } else {
      const newRecord: RecipeRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
      };
      setAppState(prev => ({
        ...prev,
        recipes: [newRecord, ...prev.recipes],
      }));
      if (user) await saveRecipe(user.uid, newRecord);
    }
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = async (id: string) => {
    setAppState(prev => ({
      ...prev,
      recipes: prev.recipes.filter(r => r.id !== id),
    }));
    if (user) await deleteRecipeRecord(user.uid, id);
  };

  const handleToggleFavoriteRecipe = async (recipe: RecipeRecord) => {
    const updated = { ...recipe, isFavorite: !recipe.isFavorite };
    setAppState(prev => ({
      ...prev,
      recipes: prev.recipes.map(r => (r.id === recipe.id ? updated : r)),
    }));
    if (user) await saveRecipe(user.uid, updated);
  };

  // Report Handlers
  const handleSaveReport = async (month: string, stats: MonthlyStatsPayload, reportContent: string) => {
    const newReport: MonthlyReportRecord = {
      id: `rep-${Date.now()}`,
      userId: user?.uid || 'local-user',
      month,
      dataSnapshot: stats,
      reportContent,
      createdAt: new Date().toISOString(),
    };

    setAppState(prev => ({
      ...prev,
      reports: [newReport, ...prev.reports],
    }));

    if (user) {
      await saveReport(user.uid, newReport);
    }
  };

  const handleDeleteReport = async (id: string) => {
    setAppState(prev => ({
      ...prev,
      reports: prev.reports.filter(r => r.id !== id),
    }));
    if (user) await deleteReportRecord(user.uid, id);
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const merged = { ...appState.settings, ...newSettings };
    setAppState(prev => ({ ...prev, settings: merged }));
    if (user) {
      await saveUserSettings(merged);
    }
  };

  // Monthly stats payload calculation for AI Report
  const currentMonthStats: MonthlyStatsPayload = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const mFinances = appState.finances.filter(f => f.date.startsWith(currentMonth));
    const mFamily = appState.familyMoney.filter(fm => fm.date.startsWith(currentMonth));
    const mRecipes = appState.recipes.filter(r => r.createdAt.startsWith(currentMonth));

    const salary = mFinances
      .filter(f => f.type === 'income' && f.category === 'Salary')
      .reduce((s, f) => s + f.amount, 0);
    const tips = mFinances
      .filter(f => f.type === 'income' && f.category === 'Tips')
      .reduce((s, f) => s + f.amount, 0);
    const other = mFinances
      .filter(f => f.type === 'income' && f.category === 'Other Income')
      .reduce((s, f) => s + f.amount, 0);
    const totalIncome = salary + tips + other;

    const expensesByCategory: Record<string, number> = {};
    let totalExpenses = 0;
    mFinances
      .filter(f => f.type === 'expense')
      .forEach(f => {
        expensesByCategory[f.category] = (expensesByCategory[f.category] || 0) + f.amount;
        totalExpenses += f.amount;
      });

    const familyTotal = mFamily.reduce((s, fm) => s + fm.amount, 0);

    // Relapses this month
    const mRelapses = appState.relapses.filter(r => r.relapseDate.startsWith(currentMonth));

    // Calculate streaks
    const currentStreakDays = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(appState.settings.habitStartDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return {
      month: currentMonth,
      income: {
        salary,
        tips,
        other,
        total: totalIncome,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      savings: totalIncome - totalExpenses,
      familyMoney: {
        total: familyTotal,
        count: mFamily.length,
      },
      habit: {
        habitName: appState.settings.habitName,
        relapses: mRelapses.length,
        currentStreak: currentStreakDays,
        longestStreak: Math.max(currentStreakDays, 14),
      },
      recipes: {
        total: appState.recipes.length,
        addedThisMonth: mRecipes.length,
      },
    };
  }, [appState]);

  if (accessLevel === 'none') {
    return (
      <DeveloperGateModal
        onAuthorize={(level) => setAccessLevel(level)}
      />
    );
  }

  // Temporary CV-Only Mode: Passcode 00000 strictly isolates the CV Builder/Library
  // All other personal sections (habit, finance, family money, recipes, reports, stats) are completely hidden and restricted
  if (accessLevel === 'cv-only') {
    return (
      <CVBuilderView
        isCvOnlyMode={true}
        onExitSession={() => {
          localStorage.removeItem('app_access_level_auth');
          setAccessLevel('none');
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-[#d4af37]/30 selection:text-[#f3e5ab] ${
        theme === 'dark' ? 'bg-[#0b0c10] text-[#e5e7eb]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* If currentTab is 'cv', render the dedicated full-featured CV Builder View */}
      {currentTab === 'cv' ? (
        <CVBuilderView
          onBackToApp={() => setCurrentTab('dashboard')}
          onOpenApplyByEmail={() => setCurrentTab('apply-email')}
        />
      ) : currentTab === 'apply-email' ? (
        <>
          <Navbar
            user={user}
            isOnline={isOnline}
            isCloudSynced={isCloudSynced}
            onGoogleSignIn={handleGoogleSignIn}
            onLogout={handleLogout}
            onOpenRelapseModal={() => setIsRelapseModalOpen(true)}
            onOpenUrgeGuide={() => setIsUrgeGuideOpen(true)}
            onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
            onOpenCVBuilder={() => setCurrentTab('cv')}
            onOpenApplyByEmail={() => setCurrentTab('apply-email')}
            onLockApp={() => {
              localStorage.removeItem('app_access_level_auth');
              setAccessLevel('none');
            }}
          />
          <ApplyByEmailView
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onOpenCVLibrary={() => setCurrentTab('cv')}
          />
        </>
      ) : (
        <>
          {/* Main Top Navigation Bar */}
          <Navbar
            user={user}
            isOnline={isOnline}
            isCloudSynced={isCloudSynced}
            onGoogleSignIn={handleGoogleSignIn}
            onLogout={handleLogout}
            onOpenRelapseModal={() => setIsRelapseModalOpen(true)}
            onOpenUrgeGuide={() => setIsUrgeGuideOpen(true)}
            onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
            onOpenCVBuilder={() => setCurrentTab('cv')}
            onOpenApplyByEmail={() => setCurrentTab('apply-email')}
            onLockApp={() => {
              localStorage.removeItem('app_access_level_auth');
              setAccessLevel('none');
            }}
          />

          {/* Floating Auth Notification Toast */}
          {authNotice && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in max-w-md w-[90%] pointer-events-none">
              <div className="bg-[#1b202e] border border-[#d4af37]/40 text-[#fdf8f0] px-4 py-2.5 rounded-2xl shadow-2xl text-xs text-center font-medium">
                {authNotice}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28">
            {currentTab === 'dashboard' && (
              <DashboardView
                profile={appState.profile}
                settings={appState.settings}
                relapses={appState.relapses}
                finances={appState.finances}
                familyMoney={appState.familyMoney}
                recipes={appState.recipes}
                onNavigate={setCurrentTab}
                onOpenRelapseModal={() => setIsRelapseModalOpen(true)}
                onOpenFinanceModal={type => {
                  setFinanceModalType(type || 'expense');
                  setEditingFinance(null);
                  setIsFinanceModalOpen(true);
                }}
                onOpenFamilyModal={() => {
                  setEditingFamily(null);
                  setIsFamilyModalOpen(true);
                }}
                onOpenRecipeModal={() => {
                  setEditingRecipe(null);
                  setIsRecipeModalOpen(true);
                }}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenUrgeGuide={() => setIsUrgeGuideOpen(true)}
              />
            )}

            {currentTab === 'relapse' && (
              <RelapseTrackerView
                settings={appState.settings}
                relapses={appState.relapses}
                onOpenRelapseModal={() => setIsRelapseModalOpen(true)}
                onOpenUrgeGuide={() => setIsUrgeGuideOpen(true)}
                onDeleteRelapse={handleDeleteRelapse}
                onUpdateHabitName={handleUpdateHabitName}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceTrackerView
                finances={appState.finances}
                currency={appState.settings.currency || '$'}
                onOpenAddModal={type => {
                  setFinanceModalType(type || 'expense');
                  setEditingFinance(null);
                  setIsFinanceModalOpen(true);
                }}
                onEditRecord={record => {
                  setEditingFinance(record);
                  setFinanceModalType(record.type);
                  setIsFinanceModalOpen(true);
                }}
                onDeleteRecord={handleDeleteFinance}
              />
            )}

            {currentTab === 'family' && (
              <FamilyMoneyView
                familyMoney={appState.familyMoney}
                currency={appState.settings.currency || '$'}
                onOpenAddModal={() => {
                  setEditingFamily(null);
                  setIsFamilyModalOpen(true);
                }}
                onEditRecord={record => {
                  setEditingFamily(record);
                  setIsFamilyModalOpen(true);
                }}
                onDeleteRecord={handleDeleteFamilyMoney}
              />
            )}

            {currentTab === 'recipes' && (
              <RecipeLibraryView
                recipes={appState.recipes}
                onOpenAddModal={() => {
                  setEditingRecipe(null);
                  setIsRecipeModalOpen(true);
                }}
                onEditRecipe={recipe => {
                  setEditingRecipe(recipe);
                  setIsRecipeModalOpen(true);
                }}
                onDeleteRecipe={handleDeleteRecipe}
                onToggleFavorite={handleToggleFavoriteRecipe}
              />
            )}

            {currentTab === 'ai' && (
              <AIAssistantView
                settings={appState.settings}
                relapses={appState.relapses}
                finances={appState.finances}
                familyMoney={appState.familyMoney}
                currency={appState.settings.currency || '$'}
                onOpenUrgeGuide={() => setIsUrgeGuideOpen(true)}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                reports={appState.reports}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onDeleteReport={handleDeleteReport}
                currency={appState.settings.currency || '$'}
              />
            )}

            {currentTab === 'stats' && (
              <ProgressStatsView
                finances={appState.finances}
                relapses={appState.relapses}
                familyMoney={appState.familyMoney}
                settings={appState.settings}
                currency={appState.settings.currency || '$'}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                user={user}
                settings={appState.settings}
                fullAppState={appState}
                onUpdateSettings={handleUpdateSettings}
                onGoogleSignIn={handleGoogleSignIn}
                onLogout={handleLogout}
                onRestoreState={setAppState}
                onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
                isCloudSynced={isCloudSynced}
              />
            )}
          </main>
        </>
      )}

      {/* Global Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals */}
      <RelapseModal
        isOpen={isRelapseModalOpen}
        onClose={() => setIsRelapseModalOpen(false)}
        onConfirmRelapse={handleConfirmRelapse}
        habitName={appState.settings.habitName}
        currentStreakDays={Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(appState.settings.habitStartDate).getTime()) / (1000 * 60 * 60 * 24)
          )
        )}
        onOpenGuide={() => {
          setIsRelapseModalOpen(false);
          setIsUrgeGuideOpen(true);
        }}
      />

      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setEditingFinance(null);
        }}
        onSave={handleSaveFinance}
        currency={appState.settings.currency || '$'}
        initialRecord={editingFinance}
      />

      <FamilyMoneyModal
        isOpen={isFamilyModalOpen}
        onClose={() => {
          setIsFamilyModalOpen(false);
          setEditingFamily(null);
        }}
        onSave={handleSaveFamilyMoney}
        currency={appState.settings.currency || '$'}
        initialRecord={editingFamily}
      />

      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveRecipe}
        initialRecord={editingRecipe}
      />

      <AIReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        statsPayload={currentMonthStats}
        currency={appState.settings.currency || '$'}
        onSaveReport={handleSaveReport}
      />

      {isUrgeGuideOpen && (
        <EducationalUrgeGuide
          habitName={appState.settings.habitName}
          onClose={() => setIsUrgeGuideOpen(false)}
        />
      )}

      <AndroidExportModal
        isOpen={isAndroidExportOpen}
        onClose={() => setIsAndroidExportOpen(false)}
      />
    </div>
  );
}
