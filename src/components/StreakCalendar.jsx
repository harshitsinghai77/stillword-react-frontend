import React, { useState } from 'react';
import { Flame, Copy, Check } from 'lucide-react';
import { THEMES } from '../utils/theme.js';
import { formatDatePretty, getTodayDateString } from '../utils/storage.js';

export const StreakCalendar = ({ user, stats, entries, onSelectDateToEdit }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [copied, setCopied] = useState(false);

  const theme = THEMES[user.theme] || THEMES.oatmeal;
  const today = getTodayDateString();
  const targetWords = user.targetWords || 750;

  const generateGrid = () => {
    const todayObj = new Date();
    const days = [];
    const totalDays = 16 * 7;
    const startDate = new Date();
    startDate.setDate(todayObj.getDate() - (totalDays - 1));

    const startDayOfWeek = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const curr = new Date(startDate);
    const end = new Date(todayObj);
    const endDayOfWeek = (end.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - endDayOfWeek));

    while (curr <= end) {
      const yr = curr.getFullYear();
      const mo = String(curr.getMonth() + 1).padStart(2, '0');
      const da = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${da}`;

      const isFuture = curr > todayObj;
      const isToday = dateStr === today;
      const entry = entries[dateStr];
      const wordCount = entry ? entry.wordCount : 0;
      const completed = entry ? entry.completed || wordCount >= targetWords : false;

      days.push({ date: dateStr, wordCount, completed, isToday, isFuture, dayOfWeek: (curr.getDay() + 6) % 7 });
      curr.setDate(curr.getDate() + 1);
    }

    return days;
  };

  const gridDays = generateGrid();
  const selectedEntry = entries[selectedDate];

  const handleCopySelected = () => {
    if (!selectedEntry?.content) return;
    navigator.clipboard.writeText(selectedEntry.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      <div className="mb-8">
        <h2 className={`text-2xl font-serif-writing font-medium ${theme.text}`}>Streak & Practice</h2>
        <p className={`text-xs sm:text-sm font-sans mt-1 ${theme.textMuted}`}>
          Daily morning pages build momentum. Every filled box represents a day you gave yourself time to write.
        </p>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl border ${theme.border} ${theme.surface} mb-8`}>
        <div>
          <span className={`block text-xs uppercase tracking-wider ${theme.textSubtle}`}>Current Streak</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-mono-numbers font-medium ${theme.text}`}>{stats.currentStreak}</span>
            <span className={`text-xs ${theme.textMuted}`}>{stats.currentStreak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
        <div>
          <span className={`block text-xs uppercase tracking-wider ${theme.textSubtle}`}>Longest Streak</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-mono-numbers font-medium ${theme.text}`}>{stats.longestStreak}</span>
            <span className={`text-xs ${theme.textMuted}`}>days</span>
          </div>
        </div>
        <div>
          <span className={`block text-xs uppercase tracking-wider ${theme.textSubtle}`}>Days Completed</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-mono-numbers font-medium ${theme.text}`}>{stats.daysCompleted}</span>
            <span className={`text-xs ${theme.textMuted}`}>sessions</span>
          </div>
        </div>
        <div>
          <span className={`block text-xs uppercase tracking-wider ${theme.textSubtle}`}>Total Words</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-mono-numbers font-medium ${theme.text}`}>{stats.totalWords.toLocaleString()}</span>
            <span className={`text-xs ${theme.textMuted}`}>written</span>
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-xl border ${theme.border} ${theme.surface} mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
            Activity Matrix (Last 16 Weeks)
          </span>
          <div className="flex items-center gap-2 text-xs font-sans text-stone-500">
            <span>Empty</span>
            <span className={`w-3.5 h-3.5 rounded-sm border ${theme.boxEmpty}`} />
            <span className={`w-3.5 h-3.5 rounded-sm border ${theme.boxPartial}`} />
            <span className={`w-3.5 h-3.5 rounded-sm border ${theme.boxDone}`} />
            <span>750+ words</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px]">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5">
              {gridDays.map((d) => {
                const isSelected = d.date === selectedDate;
                let boxClass = `w-4 h-4 sm:w-5 sm:h-5 rounded-xs transition-transform duration-150 cursor-pointer `;
                if (d.isFuture) {
                  boxClass += 'opacity-15 border border-dashed border-stone-300 pointer-events-none';
                } else if (d.completed) {
                  boxClass += `${theme.boxDone} hover:scale-115`;
                } else if (d.wordCount > 0) {
                  boxClass += `${theme.boxPartial} hover:scale-115`;
                } else {
                  boxClass += `${theme.boxEmpty} hover:scale-110`;
                }
                if (d.isToday) boxClass += ` ring-2 ring-amber-600/70 ring-offset-1`;
                if (isSelected && !d.isFuture) boxClass += ` outline outline-2 outline-offset-1 outline-stone-800 dark:outline-stone-200`;

                return (
                  <button
                    key={d.date}
                    onClick={() => !d.isFuture && setSelectedDate(d.date)}
                    disabled={d.isFuture}
                    title={`${d.date}: ${d.wordCount} words ${d.completed ? '(Completed)' : ''}`}
                    className={boxClass}
                    aria-label={`${d.date}, ${d.wordCount} words`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
          <span>Monday</span>
          <span>Click any square to view past writing</span>
          <span>Sunday</span>
        </div>
      </div>

      <div className={`p-6 rounded-xl border ${theme.border} ${theme.surface} mb-8`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/50 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-serif-writing font-medium ${theme.text}`}>
                {formatDatePretty(selectedDate)}
              </h3>
              {selectedDate === today && (
                <span className="text-[11px] font-sans text-amber-700 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-sm">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs font-mono-numbers text-stone-500 mt-0.5">
              {selectedEntry ? (
                <>
                  <span className="font-semibold">{selectedEntry.wordCount}</span> words written ·{' '}
                  {selectedEntry.completed || selectedEntry.wordCount >= targetWords ? (
                    <span className="text-emerald-600 font-medium">✓ 750 Goal reached</span>
                  ) : (
                    <span>Partial entry</span>
                  )}
                </>
              ) : (
                <span>No words recorded for this day</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedEntry?.content && (
              <button
                onClick={handleCopySelected}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border ${theme.border} ${theme.textMuted} hover:${theme.text} transition-colors`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            )}
            {selectedDate === today && onSelectDateToEdit && (
              <button
                onClick={() => onSelectDateToEdit(selectedDate)}
                className={`text-xs px-3 py-1.5 rounded-md ${theme.accent} ${theme.accentHover} transition-colors`}
              >
                Continue Writing Today
              </button>
            )}
          </div>
        </div>

        <div className="pt-4">
          {selectedEntry?.content ? (
            <div className={`font-serif-writing text-base leading-[1.8] ${theme.text} whitespace-pre-wrap max-h-96 overflow-y-auto pr-2`}>
              {selectedEntry.content}
            </div>
          ) : (
            <p className="font-serif-writing text-sm italic text-stone-400 py-6 text-center">
              The page for this day remains quiet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
