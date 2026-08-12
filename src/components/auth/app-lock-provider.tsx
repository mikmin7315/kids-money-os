'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppLockOverlay } from './app-lock-overlay';

// Routes where the parent lock overlay should NOT appear
const LOCK_EXCLUDED_PREFIXES = ['/child/', '/child-pin/', '/login', '/setup', '/onboarding'];

const STORAGE_KEY = 'monari_app_lock';
const LAST_ACTIVE_KEY = 'monari_last_active';

interface LockSettings {
  enabled: boolean;
  timeoutMinutes: number;
}

function getSettings(): LockSettings {
  if (typeof window === 'undefined') return { enabled: false, timeoutMinutes: 5 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LockSettings;
  } catch {}
  return { enabled: false, timeoutMinutes: 5 };
}

interface AppLockContextValue {
  settings: LockSettings;
  saveSettings: (s: LockSettings) => void;
  lockNow: () => void;
}

const AppLockContext = createContext<AppLockContextValue>({
  settings: { enabled: false, timeoutMinutes: 5 },
  saveSettings: () => {},
  lockNow: () => {},
});

export function useAppLock() {
  return useContext(AppLockContext);
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = LOCK_EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState<LockSettings>(() => getSettings());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markActive = useCallback(() => {
    sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }, []);

  const lockNow = useCallback(() => setLocked(true), []);

  const onUnlock = useCallback(() => {
    setLocked(false);
    markActive();
  }, [markActive]);

  const saveSettings = useCallback((s: LockSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSettings(s);
    if (!s.enabled) setLocked(false);
  }, []);

  // Activity tracking
  useEffect(() => {
    if (!settings.enabled) return;
    const events = ['click', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActive));
  }, [settings.enabled, markActive]);

  // Inactivity checker
  useEffect(() => {
    if (!settings.enabled) { if (tickRef.current) clearInterval(tickRef.current); return; }
    markActive();
    tickRef.current = setInterval(() => {
      const last = Number(sessionStorage.getItem(LAST_ACTIVE_KEY) ?? 0);
      if (last && Date.now() - last > settings.timeoutMinutes * 60 * 1000) {
        setLocked(true);
      }
    }, 30_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [settings.enabled, settings.timeoutMinutes, markActive]);

  // Page visibility
  useEffect(() => {
    if (!settings.enabled) return;
    function onVisibilityChange() {
      if (document.hidden) return;
      const last = Number(sessionStorage.getItem(LAST_ACTIVE_KEY) ?? 0);
      if (last && Date.now() - last > settings.timeoutMinutes * 60 * 1000) {
        setLocked(true);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [settings.enabled, settings.timeoutMinutes]);

  return (
    <AppLockContext.Provider value={{ settings, saveSettings, lockNow }}>
      {children}
      {locked && !isExcluded && <AppLockOverlay onUnlock={onUnlock} />}
    </AppLockContext.Provider>
  );
}
