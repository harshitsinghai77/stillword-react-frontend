import React from 'react';
import { X, Sparkles, Flame, ArrowRight } from 'lucide-react';
import { UserProfile, StreakStats } from '../types';
import { THEMES } from '../utils/theme';

interface CompletionModalProps {
  user: UserProfile;
  stats: StreakStats;
  isOpen: boolean;
  onClose: () => void;
  onViewCalendar: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  user,
  stats,
  isOpen,
  onClose,
  onViewCalendar,
}) => {
  if (!isOpen) return null;

  const theme = THEMES[user.theme] || THEMES.oatmeal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-sm rounded-2xl border ${theme.border} ${theme.surface} p-6 shadow-xl relative text-center`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className={`text-2xl font-serif-writing font-medium ${theme.text} mb-2`}>
          750 Words Reached
        </h3>

        <p className={`text-xs sm:text-sm font-sans leading-relaxed ${theme.textMuted} mb-5`}>
          You emptied your thoughts and honored today's page. Take a slow breath. Your mind is clearer now.
        </p>

        {/* Streak summary */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-200/50 dark:bg-stone-800 text-xs font-mono-numbers mb-6">
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span className={`font-semibold ${theme.text}`}>{stats.currentStreak} Day Streak</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 text-xs font-medium rounded-lg ${theme.accent} ${theme.accentHover} transition-colors`}
          >
            Keep Writing
          </button>
          <button
            onClick={() => {
              onClose();
              onViewCalendar();
            }}
            className={`w-full py-2 px-4 text-xs font-medium rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} transition-colors flex items-center justify-center gap-1.5`}
          >
            <span>View Streak Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
