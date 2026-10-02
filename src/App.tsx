import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, DayEntry, ThemeMode } from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadLocalEntries,
  saveSingleEntry,
  saveLocalEntries,
  calculateStreakStats,
  getTodayDateString,
} from './utils/storage';
import { THEMES } from './utils/theme';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { StreakCalendar } from './components/StreakCalendar';
import { SyncModal } from './components/SyncModal';
import { NameModal } from './components/NameModal';
import { CompletionModal } from './components/CompletionModal';

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => loadUserProfile());
  const [entries, setEntries] = useState<Record<string, DayEntry>>(() => loadLocalEntries());
  const [currentView, setCurrentView] = useState<'write' | 'calendar'>('write');
  const [zenMode, setZenMode] = useState<boolean>(false);

  // Modals
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [completionModalOpen, setCompletionModalOpen] = useState<boolean>(false);

  const todayDate = useMemo(() => getTodayDateString(), []);
  const todayEntry = entries[todayDate] || null;

  // Streak calculations
  const stats = useMemo(() => {
    return calculateStreakStats(entries, user.targetWords || 750);
  }, [entries, user.targetWords]);

  // Sync with backend on mount
  useEffect(() => {
    if (!user.id) return;
    fetch(`/api/sync/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries((prev) => {
            const merged = { ...prev };
            data.entries.forEach((remote: DayEntry) => {
              if (
                !merged[remote.date] ||
                new Date(remote.updatedAt) > new Date(merged[remote.date].updatedAt || 0)
              ) {
                merged[remote.date] = remote;
              }
            });
            saveLocalEntries(merged);
            return merged;
          });
        }
      })
      .catch(() => {
        // Safe offline fallback
      });
  }, [user.id]);

  // First time prompt for name if not set
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('stillword_name_prompted');
    if (!user.name && !hasSeenPrompt) {
      localStorage.setItem('stillword_name_prompted', 'true');
      setNameModalOpen(true);
    }
  }, [user.name]);

  // Keyboard shortcut for Zen mode (Esc exits zen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);

  // Handle Saving Today's Writing
  const handleSaveContent = useCallback(
    (newContent: string) => {
      const { entry } = saveSingleEntry(
        user.id,
        todayDate,
        newContent,
        user.targetWords || 750
      );
      setEntries((prev) => ({
        ...prev,
        [todayDate]: entry,
      }));
    },
    [user.id, todayDate, user.targetWords]
  );

  // Handle Goal Reached
  const handleGoalReached = useCallback(() => {
    setCompletionModalOpen(true);
  }, []);

  // Handle Sound Toggle
  const handleToggleSound = useCallback(() => {
    setUser((prev) => {
      const updated = { ...prev, soundEnabled: !prev.soundEnabled };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Handle Theme Toggle
  const handleToggleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['oatmeal', 'sage', 'ink', 'pure'];
    setUser((prev) => {
      const currIdx = themes.indexOf(prev.theme);
      const nextTheme = themes[(currIdx + 1) % themes.length];
      const updated = { ...prev, theme: nextTheme };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Handle Name Save
  const handleSaveName = useCallback((name: string) => {
    setUser((prev) => {
      const updated = { ...prev, name };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Handle Login / Cloud Sync Success
  const handleLoginSuccess = useCallback((updatedUser: UserProfile, remoteEntries: DayEntry[]) => {
    setUser(updatedUser);
    saveUserProfile(updatedUser);

    setEntries((prev) => {
      const merged = { ...prev };
      remoteEntries.forEach((r) => {
        merged[r.date] = r;
      });
      saveLocalEntries(merged);
      return merged;
    });
  }, []);

  // Handle Sign Out
  const handleLogout = useCallback(() => {
    // Generate new guest ID
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now();
    localStorage.setItem('stillword_guest_uuid_v1', guestId);
    const guestUser: UserProfile = {
      id: guestId,
      name: '',
      isRegistered: false,
      targetWords: 750,
      theme: user.theme,
      soundEnabled: user.soundEnabled,
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    saveUserProfile(guestUser);
  }, [user.theme, user.soundEnabled]);

  const activeTheme = THEMES[user.theme] || THEMES.oatmeal;

  return (
    <div
      className={`min-h-screen flex flex-col ${activeTheme.canvas} ${activeTheme.text} transition-colors duration-300 font-sans selection:bg-amber-200/50 selection:text-stone-900`}
    >
      {/* Top Header */}
      <Header
        user={user}
        stats={stats}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenNameModal={() => setNameModalOpen(true)}
        onToggleSound={handleToggleSound}
        onToggleTheme={handleToggleTheme}
        zenMode={zenMode}
        onToggleZen={() => setZenMode((prev) => !prev)}
      />

      {/* Main Viewport */}
      {currentView === 'write' ? (
        <Editor
          user={user}
          stats={stats}
          todayDate={todayDate}
          entry={todayEntry}
          onSaveContent={handleSaveContent}
          onOpenNameModal={() => setNameModalOpen(true)}
          zenMode={zenMode}
          onGoalReached={handleGoalReached}
        />
      ) : (
        <StreakCalendar
          user={user}
          stats={stats}
          entries={entries}
          onSelectDateToEdit={(date) => {
            if (date === todayDate) {
              setCurrentView('write');
            }
          }}
        />
      )}

      {/* Modals */}
      <SyncModal
        user={user}
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        localEntries={entries}
      />

      <NameModal
        user={user}
        isOpen={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        onSaveName={handleSaveName}
      />

      <CompletionModal
        user={user}
        stats={stats}
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onViewCalendar={() => {
          setCompletionModalOpen(false);
          setCurrentView('calendar');
        }}
      />
    </div>
  );
}
