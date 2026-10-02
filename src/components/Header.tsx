import React from 'react';
import { Flame, Volume2, VolumeX, Maximize2, Minimize2, Calendar, PenLine, Cloud, CloudCheck, Sparkles } from 'lucide-react';
import { UserProfile, StreakStats, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';

interface HeaderProps {
  user: UserProfile;
  stats: StreakStats;
  currentView: 'write' | 'calendar';
  onViewChange: (view: 'write' | 'calendar') => void;
  onOpenSync: () => void;
  onOpenNameModal: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  stats,
  currentView,
  onViewChange,
  onOpenSync,
  onOpenNameModal,
  onToggleSound,
  onToggleTheme,
  zenMode,
  onToggleZen,
}) => {
  const theme = THEMES[user.theme] || THEMES.oatmeal;

  return (
    <header
      className={`w-full border-b ${theme.border} transition-all duration-300 ${
        zenMode ? 'opacity-0 hover:opacity-100 py-2' : 'py-3.5'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('write')}
            className={`text-xl tracking-tight font-serif-writing font-medium ${theme.text} hover:opacity-80 transition-opacity focus:outline-none`}
            title="Return to writing"
          >
            Stillword
          </button>

          {/* Quick Streak Pill - Clean & unboxed */}
          <button
            onClick={() => onViewChange('calendar')}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-mono-numbers px-2.5 py-1 rounded-md border ${
              stats.currentStreak > 0
                ? `${theme.surface} ${theme.text} ${theme.border}`
                : `${theme.textMuted} border-transparent`
            } hover:opacity-85 transition-opacity`}
            title="View streak calendar and writing archive"
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                stats.todayCompleted
                  ? 'text-amber-600 fill-amber-500'
                  : stats.currentStreak > 0
                  ? 'text-amber-700'
                  : 'text-stone-400'
              }`}
            />
            <span>
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </span>
            {stats.todayCompleted && (
              <span className="text-[10px] text-emerald-600 font-sans font-medium">✓ done</span>
            )}
          </button>
        </div>

        {/* Zone 2: View Switchers & Zen */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewChange('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentView === 'write'
                ? `${theme.surface} ${theme.text} font-semibold shadow-xs`
                : `${theme.textMuted} hover:${theme.text}`
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>

          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentView === 'calendar'
                ? `${theme.surface} ${theme.text} font-semibold shadow-xs`
                : `${theme.textMuted} hover:${theme.text}`
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Streak & Archive</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={user.soundEnabled ? 'Disable typing sound' : 'Enable typing sound'}
            title={user.soundEnabled ? 'Typing sound on' : 'Typing sound off'}
            className={`p-1.5 rounded-md ${theme.textMuted} hover:${theme.text} hover:${theme.surface} transition-colors`}
          >
            {user.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-50" />
            )}
          </button>

          {/* Theme Palette Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Change color theme"
            title={`Theme: ${theme.name} (Click to switch)`}
            className={`text-xs px-2 py-1 rounded-md border ${theme.border} ${theme.textMuted} hover:${theme.text} transition-colors hidden md:inline-flex items-center gap-1`}
          >
            <span className="w-2 h-2 rounded-full border border-current" />
            <span>{theme.name.split(' ')[0]}</span>
          </button>

          {/* Fullscreen / Zen Toggle */}
          <button
            onClick={onToggleZen}
            aria-label={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
            title={zenMode ? 'Exit Zen mode (Esc)' : 'Zen focus mode'}
            className={`p-1.5 rounded-md ${theme.textMuted} hover:${theme.text} hover:${theme.surface} transition-colors`}
          >
            {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Cloud Sync / Account Button */}
          <button
            onClick={onOpenSync}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border ${
              user.isRegistered
                ? `${theme.border} ${theme.textMuted} hover:${theme.text}`
                : `${theme.surface} ${theme.text} border-amber-300/40 hover:border-amber-400/70`
            } transition-colors`}
            title={
              user.isRegistered
                ? `Signed in as ${user.email} (Cloud Synced)`
                : 'Writing as Guest (Saved on this device). Click to sync across devices.'
            }
          >
            {user.isRegistered ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {user.name || user.email?.split('@')[0] || 'Synced'}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Sync Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
