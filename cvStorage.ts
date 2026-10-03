import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { CVData, CVUserAccount, CVDocumentItem, CVTemplateType } from '../types/cv';
import {
  BARTENDER_CV_DATA,
  BARISTA_CV_DATA,
  HOTEL_CV_DATA,
  BLANK_CV_DATA,
  getTemplateData,
} from './cvTemplates';

export const REQUIRED_DEVELOPER_CODE = 'C++Rabbe';
export const DEFAULT_CV_DATA: CVData = BARTENDER_CV_DATA;

const STORAGE_KEY_LIBRARY = 'multi_cv_library_v2';
const STORAGE_KEY_ACTIVE_ID = 'multi_cv_active_id_v2';
const STORAGE_KEY_LEGACY_CV = 'dynamic_cv_data_v4';
const STORAGE_KEY_USER = 'dynamic_cv_user_session_v4';

/**
 * Initializes the default 3 professional CV documents requested by the user:
 * 1. "Fazle Rabbi — Bartender CV"
 * 2. "Fazle Rabbi — Barista CV"
 * 3. "Fazle Rabbi — Hotel CV"
 */
function createDefaultStarterLibrary(): CVDocumentItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'cv-bartender-primary',
      title: 'Fazle Rabbi — Bartender CV',
      roleSubtitle: 'Senior Bartender & Mixologist',
      createdAt: now,
      updatedAt: now,
      data: JSON.parse(JSON.stringify(BARTENDER_CV_DATA)),
      thumbnailColor: '#d4af37',
      isPinned: true,
    },
    {
      id: 'cv-barista-specialist',
      title: 'Fazle Rabbi — Barista CV',
      roleSubtitle: 'Head Barista & Specialty Coffee Artisan',
      createdAt: now,
      updatedAt: now,
      data: JSON.parse(JSON.stringify(BARISTA_CV_DATA)),
      thumbnailColor: '#c5a059',
      isPinned: false,
    },
    {
      id: 'cv-hotel-hospitality',
      title: 'Fazle Rabbi — Hotel CV',
      roleSubtitle: 'Luxury 5-Star Hotel Hospitality & F&B Specialist',
      createdAt: now,
      updatedAt: now,
      data: JSON.parse(JSON.stringify(HOTEL_CV_DATA)),
      thumbnailColor: '#aa771c',
      isPinned: false,
    },
  ];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9@_.-]/g, '');
}

/**
 * Load all saved CV documents from persistent local storage.
 * Automatically migrates existing single CV data if present.
 */
export function loadCVLibrary(): CVDocumentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Check for legacy single-CV data to preserve user's past edits
    const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY_CV);
    const starter = createDefaultStarterLibrary();
    if (legacyRaw) {
      try {
        const legacyCV = JSON.parse(legacyRaw);
        starter[0].data = {
          ...BARTENDER_CV_DATA,
          ...legacyCV,
        };
      } catch (err) {
        console.warn('Could not parse legacy CV data:', err);
      }
    }

    saveCVLibrary(starter);
    return starter;
  } catch (err) {
    console.error('Failed to load CV library from storage:', err);
    return createDefaultStarterLibrary();
  }
}

/**
 * Save the entire CV library list to persistent storage and cloud
 */
export function saveCVLibrary(library: CVDocumentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(library));
    // Also sync the active/first CV to legacy storage for backward compatibility
    if (library.length > 0) {
      localStorage.setItem(STORAGE_KEY_LEGACY_CV, JSON.stringify(library[0].data));
    }
  } catch (err) {
    console.error('Failed to save CV library to storage:', err);
  }

  // Automatically trigger cloud push to Firestore so changes reflect across all phones
  pushCVLibraryToFirestore(library).catch(err => {
    console.warn('Background CV cloud sync deferred:', err);
  });
}

/**
 * Push CV Library to Firestore under user's UID and email account
 */
export async function pushCVLibraryToFirestore(library: CVDocumentItem[]): Promise<void> {
  const currentUser = auth.currentUser;
  const userSession = loadUserSession();
  const targetEmail = currentUser?.email || userSession?.email || 'FazleRabbe905@gmail.com';

  const docData = {
    cvLibrary: JSON.stringify(library),
    cvData: JSON.stringify(library[0]?.data || DEFAULT_CV_DATA),
    totalCount: library.length,
    updatedAt: new Date().toISOString(),
  };

  // 1. If Firebase Auth user is signed in, sync to their UID
  if (currentUser?.uid) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid, 'cvLibrary', 'main');
      await setDoc(userDocRef, docData, { merge: true });
    } catch (e) {
      console.warn('Could not sync CVs to users UID doc:', e);
    }
  }

  // 2. Also sync to cv_accounts keyed by normalized Gmail
  if (targetEmail) {
    try {
      const emailDocId = normalizeEmail(targetEmail).replace(/[@.]/g, '_');
      const accountDocRef = doc(db, 'cv_accounts', emailDocId);
      await setDoc(accountDocRef, { ...docData, email: targetEmail }, { merge: true });
    } catch (e) {
      console.warn('Could not sync CVs to cv_accounts doc:', e);
    }
  }
}

/**
 * Fetch CV library from Firestore on login or device startup.
 * Ensures that installing the app on any phone with internet will automatically load all CVs!
 */
export async function syncAndLoadCloudCVLibrary(
  userId?: string,
  userEmail?: string
): Promise<CVDocumentItem[]> {
  const email = userEmail || auth.currentUser?.email || loadUserSession()?.email || 'FazleRabbe905@gmail.com';
  const uid = userId || auth.currentUser?.uid;

  let cloudLibrary: CVDocumentItem[] | null = null;

  // 1. Try reading from users/{uid}/cvLibrary/main
  if (uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'cvLibrary', 'main'));
      if (snap.exists() && snap.data()?.cvLibrary) {
        const parsed = JSON.parse(snap.data().cvLibrary);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cloudLibrary = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read CV library from users UID:', e);
    }
  }

  // 2. If not found, try reading from cv_accounts/{emailDocId}
  if (!cloudLibrary && email) {
    try {
      const emailDocId = normalizeEmail(email).replace(/[@.]/g, '_');
      const snap = await getDoc(doc(db, 'cv_accounts', emailDocId));
      if (snap.exists() && snap.data()?.cvLibrary) {
        const parsed = JSON.parse(snap.data().cvLibrary);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cloudLibrary = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read CV library from cv_accounts:', e);
    }
  }

  // If cloud has valid CVs, update local storage and notify UI
  if (cloudLibrary && cloudLibrary.length > 0) {
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(cloudLibrary));
    if (cloudLibrary[0]?.data) {
      localStorage.setItem(STORAGE_KEY_LEGACY_CV, JSON.stringify(cloudLibrary[0].data));
    }
    window.dispatchEvent(new CustomEvent('cv_library_cloud_updated', { detail: cloudLibrary }));
    return cloudLibrary;
  }

  // If cloud was empty, upload our current local library to cloud so it's ready for any new phone!
  const local = loadCVLibrary();
  await pushCVLibraryToFirestore(local);
  return local;
}

/**
 * Get or set the ID of the currently active CV being edited
 */
export function getActiveCVId(): string {
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (active) return active;
  } catch (e) {
    // fallback
  }
  const lib = loadCVLibrary();
  const fallbackId = lib[0]?.id || 'cv-bartender-primary';
  setActiveCVId(fallbackId);
  return fallbackId;
}

export function setActiveCVId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (e) {
    // ignore
  }
}

/**
 * Get a specific CV by its ID
 */
export function getCVById(id: string): CVDocumentItem | null {
  const lib = loadCVLibrary();
  return lib.find(item => item.id === id) || null;
}

/**
 * Create a new, completely independent CV in its own workspace.
 * Existing CVs remain untouched.
 */
export function createNewCV(
  customTitle?: string,
  templateType: CVTemplateType = 'bartender'
): CVDocumentItem {
  const template = getTemplateData(templateType);
  const now = new Date().toISOString();
  const id = `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newCV: CVDocumentItem = {
    id,
    title: customTitle?.trim() || template.title,
    roleSubtitle: template.subtitle,
    createdAt: now,
    updatedAt: now,
    data: template.data,
    thumbnailColor: '#d4af37',
    isPinned: false,
  };

  const lib = loadCVLibrary();
  const updatedLib = [newCV, ...lib];
  saveCVLibrary(updatedLib);
  setActiveCVId(id);
  return newCV;
}

/**
 * Duplicate an existing CV into a completely independent clone.
 * Editing the clone NEVER modifies the original CV.
 */
export function duplicateCV(sourceId: string, customTitle?: string): CVDocumentItem {
  const lib = loadCVLibrary();
  const source = lib.find(c => c.id === sourceId) || lib[0];

  const now = new Date().toISOString();
  const newId = `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = customTitle?.trim() || `${source.title} (Copy)`;

  const clonedCV: CVDocumentItem = {
    id: newId,
    title,
    roleSubtitle: source.roleSubtitle || source.data.professionalTitle || 'Bartender',
    createdAt: now,
    updatedAt: now,
    data: JSON.parse(JSON.stringify(source.data)),
    thumbnailColor: source.thumbnailColor || '#d4af37',
    isPinned: false,
  };

  // Insert right after the source or at top
  const index = lib.findIndex(c => c.id === sourceId);
  const updatedLib = [...lib];
  if (index !== -1) {
    updatedLib.splice(index + 1, 0, clonedCV);
  } else {
    updatedLib.unshift(clonedCV);
  }

  saveCVLibrary(updatedLib);
  return clonedCV;
}

/**
 * Update CV metadata (title, subtitle, pinned state, etc.)
 */
export function updateCV(id: string, updates: Partial<CVDocumentItem>): void {
  const lib = loadCVLibrary();
  const updatedLib = lib.map(item => {
    if (item.id === id) {
      return {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveCVLibrary(updatedLib);
}

/**
 * Update the full content data of a specific CV independently.
 */
export function updateCVData(id: string, data: CVData): void {
  const lib = loadCVLibrary();
  const updatedLib = lib.map(item => {
    if (item.id === id) {
      return {
        ...item,
        data,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveCVLibrary(updatedLib);
}

/**
 * Rename a specific CV
 */
export function renameCV(id: string, newTitle: string): void {
  const trimmed = newTitle.trim();
  if (!trimmed) return;
  updateCV(id, { title: trimmed });
}

/**
 * Delete a specific CV.
 * Guarantees at least 1 CV remains in the library.
 */
export function deleteCV(id: string): CVDocumentItem[] {
  const lib = loadCVLibrary();
  let filtered = lib.filter(c => c.id !== id);

  if (filtered.length === 0) {
    filtered = createDefaultStarterLibrary();
  }

  saveCVLibrary(filtered);

  // If active CV was deleted, point active ID to the first remaining CV
  const activeId = getActiveCVId();
  if (activeId === id) {
    setActiveCVId(filtered[0].id);
  }

  return filtered;
}

/**
 * Export all CVs as an offline JSON backup archive
 */
export function exportAllCVsAsJSON(): void {
  try {
    const lib = loadCVLibrary();
    const payload = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      owner: 'Fazle Rabbi',
      totalCVs: lib.length,
      cvLibrary: lib,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Fazle_Rabbi_CV_Library_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export CV library JSON backup:', err);
  }
}

/**
 * Import CVs from a JSON backup file
 */
export function importCVsFromJSON(
  jsonString: string,
  mode: 'merge' | 'replace' = 'merge'
): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const importedList: CVDocumentItem[] = Array.isArray(parsed.cvLibrary)
      ? parsed.cvLibrary
      : Array.isArray(parsed)
      ? parsed
      : null;

    if (!importedList || importedList.length === 0) {
      return { success: false, count: 0, error: 'ফাইলে কোনো সঠিক সিভি ডাটা পাওয়া যায়নি (No valid CV data found in file).' };
    }

    // Validate that each item has data and title
    const validItems: CVDocumentItem[] = importedList.map(item => ({
      id: item.id || `cv-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: item.title || 'Imported CV',
      roleSubtitle: item.roleSubtitle || item.data?.professionalTitle || 'Hospitality',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: item.data || BARTENDER_CV_DATA,
      thumbnailColor: item.thumbnailColor || '#d4af37',
      isPinned: !!item.isPinned,
    }));

    const current = loadCVLibrary();
    let finalList: CVDocumentItem[];

    if (mode === 'replace') {
      finalList = validItems;
    } else {
      // Merge: append new items that don't share IDs or give fresh IDs
      const currentIds = new Set(current.map(c => c.id));
      const freshItems = validItems.map(item => {
        if (currentIds.has(item.id)) {
          return {
            ...item,
            id: `cv-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: `${item.title} (Imported)`,
          };
        }
        return item;
      });
      finalList = [...freshItems, ...current];
    }

    saveCVLibrary(finalList);
    setActiveCVId(finalList[0].id);
    return { success: true, count: validItems.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
  }
}

// ==========================================
// Backward Compatibility Helpers for Single CV
// ==========================================

export function loadLocalCVData(): CVData {
  const activeId = getActiveCVId();
  const cvItem = getCVById(activeId);
  if (cvItem && cvItem.data) {
    return cvItem.data;
  }
  const lib = loadCVLibrary();
  return lib[0]?.data || BARTENDER_CV_DATA;
}

export function saveLocalCVData(data: CVData): void {
  const activeId = getActiveCVId();
  updateCVData(activeId, data);
}

// ==========================================
// User Authentication & Cloud Sync
// ==========================================

export function loadUserSession(): CVUserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load user session:', err);
  }
  return null;
}

export function saveUserSession(account: CVUserAccount | null): void {
  try {
    if (account) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(account));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
}

export async function signUpUserWithPasscode(
  name: string,
  email: string,
  passcode: string,
  phoneNumber: string,
  developerCode: string
): Promise<{ success: boolean; error?: string; account?: CVUserAccount; cvData?: CVData }> {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPasscode = passcode.trim();
  const trimmedPhone = phoneNumber.trim();
  const trimmedDevCode = developerCode.trim();

  if (!trimmedName) {
    return { success: false, error: 'পূর্ণ নাম লিখুন (Please enter your Full Name).' };
  }

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'সঠিক জিমেইল বা ইমেইল ঠিকানা দিন (Please enter a valid Gmail / Email).' };
  }

  if (!/^\d{5}$/.test(trimmedPasscode)) {
    return { success: false, error: 'পাসকোডটি অবশ্যই ৫ ডিজিটের হতে হবে (Passcode must be exactly 5 digits, e.g. 12345).' };
  }

  if (!trimmedPhone || trimmedPhone.length < 5) {
    return { success: false, error: 'সঠিক ফোন নাম্বার দিন (Please enter a valid Phone Number).' };
  }

  if (trimmedDevCode !== REQUIRED_DEVELOPER_CODE) {
    return {
      success: false,
      error: `ডেভলপার পারমিশন কোডটি সঠিক নয়! অনুগ্রহ করে সঠিক কোড "${REQUIRED_DEVELOPER_CODE}" দিন (Invalid Developer Permission Code).`,
    };
  }

  const account: CVUserAccount = {
    name: trimmedName,
    email: normalizedEmail,
    passcode: trimmedPasscode,
    phoneNumber: trimmedPhone,
    developerCode: trimmedDevCode,
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    const docId = normalizedEmail.replace(/[@.]/g, '_');
    const docRef = doc(db, 'cv_accounts', docId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      const data = existing.data();
      if (data.passcode && data.passcode !== trimmedPasscode) {
        return {
          success: false,
          error: 'এই জিমেইলটি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন ট্যাব ব্যবহার করুন।',
        };
      }
      if (data.cvLibrary) {
        try {
          const cloudLib = JSON.parse(data.cvLibrary);
          if (Array.isArray(cloudLib) && cloudLib.length > 0) {
            saveCVLibrary(cloudLib);
          }
        } catch (e) {
          // ignore
        }
      }
      saveUserSession(account);
      return { success: true, account, cvData: loadLocalCVData() };
    }

    const currentLibrary = loadCVLibrary();
    await setDoc(docRef, {
      name: trimmedName,
      email: normalizedEmail,
      passcode: trimmedPasscode,
      phoneNumber: trimmedPhone,
      developerCode: trimmedDevCode,
      cvLibrary: JSON.stringify(currentLibrary),
      cvData: JSON.stringify(currentLibrary[0]?.data || DEFAULT_CV_DATA),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    saveUserSession(account);
    return { success: true, account, cvData: loadLocalCVData() };
  } catch (err: any) {
    console.warn('Firestore signup error, fallback to local storage:', err);
    saveUserSession(account);
    return { success: true, account, cvData: loadLocalCVData() };
  }
}

export async function loginUserWithPasscode(
  email: string,
  passcode: string
): Promise<{ success: boolean; error?: string; account?: CVUserAccount; cvData?: CVData }> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPasscode = passcode.trim();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'সঠিক জিমেইল ঠিকানা দিন (Please enter your Gmail / Email).' };
  }

  if (!/^\d{5}$/.test(trimmedPasscode)) {
    return { success: false, error: 'পাসকোডটি অবশ্যই ৫ ডিজিটের হতে হবে (Passcode must be exactly 5 digits).' };
  }

  try {
    const docId = normalizedEmail.replace(/[@.]/g, '_');
    const docRef = doc(db, 'cv_accounts', docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.passcode && data.passcode !== trimmedPasscode) {
        return { success: false, error: 'ভুল পাসকোড! অনুগ্রহ করে সঠিক ৫ ডিজিট পাসকোড দিন।' };
      }

      const account: CVUserAccount = {
        name: data.name || 'Fazle Rabbi',
        email: normalizedEmail,
        passcode: trimmedPasscode,
        phoneNumber: data.phoneNumber || '',
        developerCode: data.developerCode || REQUIRED_DEVELOPER_CODE,
        registeredAt: data.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      if (data.cvLibrary) {
        try {
          const cloudLib = JSON.parse(data.cvLibrary);
          if (Array.isArray(cloudLib) && cloudLib.length > 0) {
            saveCVLibrary(cloudLib);
          }
        } catch (e) {
          // ignore
        }
      }

      saveUserSession(account);
      return { success: true, account, cvData: loadLocalCVData() };
    } else {
      const localAccount = loadUserSession();
      if (localAccount && normalizeEmail(localAccount.email) === normalizedEmail) {
        if (localAccount.passcode === trimmedPasscode) {
          return { success: true, account: localAccount, cvData: loadLocalCVData() };
        } else {
          return { success: false, error: 'ভুল পাসকোড! সঠিক ৫ ডিজিট পাসকোড দিন।' };
        }
      }

      return {
        success: false,
        error: `এই জিমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সাইন আপ (Sign Up) করুন। ডেভলপার কোড: ${REQUIRED_DEVELOPER_CODE}`,
      };
    }
  } catch (err: any) {
    console.warn('Firestore login error, checking local session:', err);
    const localAccount = loadUserSession();
    if (localAccount && normalizeEmail(localAccount.email) === normalizedEmail) {
      if (localAccount.passcode === trimmedPasscode) {
        return { success: true, account: localAccount, cvData: loadLocalCVData() };
      }
    }

    const fallbackAccount: CVUserAccount = {
      name: 'Fazle Rabbi',
      email: normalizedEmail,
      passcode: trimmedPasscode,
      phoneNumber: '+357-95502363',
      developerCode: REQUIRED_DEVELOPER_CODE,
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    saveUserSession(fallbackAccount);
    return { success: true, account: fallbackAccount, cvData: loadLocalCVData() };
  }
}

/**
 * Persist entire CV Library to Firestore
 */
export async function syncCVToCloud(
  account: CVUserAccount | null,
  activeCVData?: CVData
): Promise<void> {
  const lib = loadCVLibrary();
  if (activeCVData) {
    const activeId = getActiveCVId();
    updateCVData(activeId, activeCVData);
  }
  if (!account || !account.email) return;

  const docId = normalizeEmail(account.email).replace(/[@.]/g, '_');
  try {
    const docRef = doc(db, 'cv_accounts', docId);
    await setDoc(
      docRef,
      {
        name: account.name,
        email: account.email,
        passcode: account.passcode,
        phoneNumber: account.phoneNumber,
        developerCode: account.developerCode,
        cvLibrary: JSON.stringify(lib),
        cvData: JSON.stringify(lib[0]?.data || DEFAULT_CV_DATA),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Cloud sync deferred to local storage:', err);
  }
}
