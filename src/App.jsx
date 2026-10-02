import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadUserProfile,
  saveUserProfile,
  loadLocalEntries,
  saveSingleEntry,
  saveLocalEntries,
  calculateStreakStats,
  getTodayDateString,
} from './utils/storage.js';
import { THEMES } from './utils/theme.js';
import { Header } from './components/Header.jsx';
import { Editor } from './components/Editor.jsx';
import { StreakCalendar } from './components/StreakCalendar.jsx';
import { SyncModal } from './components/SyncModal.jsx';
import { NameModal } from './components/NameModal.jsx';
import { CompletionModal } from './components/CompletionModal.jsx';

export default function App() {
  const [user, setUser] = useState(() => loadUserProfile());
  const [entries, setEntries] = useState(() => loadLocalEntries());
  const [currentView, setCurrentView] = useState('write');
  const [zenMode, setZenMode] = useState(false);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  const todayDate = useMemo(() => getTodayDateString(), []);
  const todayEntry = entries[todayDate] || null;

  const stats = useMemo(() => {
    return calculateStreakStats(entries, user.targetWords || 750);
  }, [entries, user.targetWords]);

  useEffect(() => {
    if (!user.id) return;
    fetch(`/api/sync/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries((prev) => {
            const merged = { ...prev };
            data.entries.forEach((remote) => {
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
      .catch(() => {});
  }, [user.id]);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('stillword_name_prompted');
    if (!user.name && !hasSeenPrompt) {
      localStorage.setItem('stillword_name_prompted', 'true');
      setNameModalOpen(true);
    }
  }, [user.name]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && zenMode) setZenMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);

  const handleSaveContent = useCallback(
    (newContent) => {
      const { entry } = saveSingleEntry(user.id, todayDate, newContent, user.targetWords || 750);
      setEntries((prev) => ({ ...prev, [todayDate]: entry }));
    },
    [user.id, todayDate, user.targetWords]
  );

  const handleGoalReached = useCallback(() => setCompletionModalOpen(true), []);

  const handleToggleSound = useCallback(() => {
    setUser((prev) => {
      const updated = { ...prev, soundEnabled: !prev.soundEnabled };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    const themes = ['oatmeal', 'sage', 'ink', 'pure'];
    setUser((prev) => {
      const currIdx = themes.indexOf(prev.theme);
      const nextTheme = themes[(currIdx + 1) % themes.length];
      const updated = { ...prev, theme: nextTheme };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const handleSaveName = useCallback((name) => {
    setUser((prev) => {
      const updated = { ...prev, name };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const handleLoginSuccess = useCallback((updatedUser, remoteEntries) => {
    setUser(updatedUser);
    saveUserProfile(updatedUser);
    setEntries((prev) => {
      const merged = { ...prev };
      remoteEntries.forEach((r) => { merged[r.date] = r; });
      saveLocalEntries(merged);
      return merged;
    });
  }, []);

  const handleLogout = useCallback(() => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now();
    localStorage.setItem('stillword_guest_uuid_v1', guestId);
    const guestUser = {
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
            if (date === todayDate) setCurrentView('write');
          }}
        />
      )}

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
