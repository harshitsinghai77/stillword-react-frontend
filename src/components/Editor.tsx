import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Copy, Check, Sparkles, ChevronRight, Download, Edit3 } from 'lucide-react';
import { UserProfile, DayEntry, StreakStats } from '../types';
import { THEMES } from '../utils/theme';
import { countWords, formatDatePretty, getTimeGreeting } from '../utils/storage';
import { playSoftKeyClick, playGoalChime } from '../utils/sound';
import { getRandomPrompt } from '../utils/prompts';

interface EditorProps {
  user: UserProfile;
  stats: StreakStats;
  todayDate: string;
  entry: DayEntry | null;
  onSaveContent: (content: string) => void;
  onOpenNameModal: () => void;
  zenMode: boolean;
  onGoalReached: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  user,
  stats,
  todayDate,
  entry,
  onSaveContent,
  onOpenNameModal,
  zenMode,
  onGoalReached,
}) => {
  const [content, setContent] = useState<string>(entry?.content || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isTypingRecently, setIsTypingRecently] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const hasTriggeredChimeToday = useRef<boolean>(entry?.completed || false);

  const theme = THEMES[user.theme] || THEMES.oatmeal;
  const wordCount = countWords(content);
  const targetWords = user.targetWords || 750;
  const progressPercent = Math.min(100, Math.round((wordCount / targetWords) * 100));
  const isTargetMet = wordCount >= targetWords;

  // Sync external entry changes (e.g. if loaded from remote)
  useEffect(() => {
    if (entry && entry.content !== content && !textareaRef.current?.matches(':focus')) {
      setContent(entry.content);
      if (entry.completed) {
        hasTriggeredChimeToday.current = true;
      }
    }
  }, [entry?.id]);

  // Handle Text Change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setContent(nextVal);
    setSaveStatus('saving');

    // Soft audio click
    if (user.soundEnabled) {
      playSoftKeyClick();
    }

    // Typing dim indicator
    setIsTypingRecently(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setIsTypingRecently(false);
    }, 2500);

    // Goal reached detection
    const nextWordCount = countWords(nextVal);
    if (nextWordCount >= targetWords && !hasTriggeredChimeToday.current) {
      hasTriggeredChimeToday.current = true;
      if (user.soundEnabled) {
        playGoalChime();
      }
      onGoalReached();
    }

    // Debounce save to storage & sync
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      onSaveContent(nextVal);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  };

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollH, 360)}px`;
    }
  }, [content]);

  // Copy to clipboard
  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as text file
  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stillword-${todayDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const greetingInfo = getTimeGreeting(user.name);
  const prettyDate = formatDatePretty(todayDate);

  return (
    <main className="w-full flex-1 flex flex-col justify-between max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="w-full flex-1 flex flex-col">
        {/* Header Greeting Zone */}
        <section
          className={`mb-8 sm:mb-12 transition-opacity duration-500 ${
            zenMode && isTypingRecently ? 'opacity-10' : 'opacity-100'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl sm:text-3xl font-serif-writing font-medium ${theme.text}`}>
                  {greetingInfo.greeting}
                </h1>
                {!user.name && (
                  <button
                    onClick={onOpenNameModal}
                    className={`text-xs ${theme.textSubtle} hover:${theme.text} underline underline-offset-4 transition-colors`}
                  >
                    Add your name
                  </button>
                )}
                {user.name && (
                  <button
                    onClick={onOpenNameModal}
                    title="Change name"
                    className={`p-1 rounded-md text-stone-400 hover:${theme.text} transition-colors opacity-40 hover:opacity-100`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm font-sans">
                <span className={theme.textMuted}>{prettyDate}</span>
                <span className={theme.textSubtle} aria-hidden="true">·</span>
                <span className={theme.textMuted}>{greetingInfo.subtext}</span>
              </div>
            </div>

            {/* Mindful spark prompt button */}
            <div className="shrink-0">
              <button
                onClick={() => {
                  const prompt = getRandomPrompt();
                  setActivePrompt(prompt);
                }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.surface} transition-colors`}
                title="A mindful question to inspire today's thoughts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600/80" />
                <span className="hidden sm:inline">Spark a thought</span>
              </button>
            </div>
          </div>

          {/* Active Prompt Box */}
          {activePrompt && (
            <div
              className={`mt-4 p-3.5 rounded-lg border ${theme.border} ${theme.surface} text-sm flex items-start justify-between gap-3 animate-fadeIn`}
            >
              <div className="flex items-start gap-2">
                <span className="text-amber-600/80 font-serif-writing italic font-semibold">“</span>
                <p className={`font-serif-writing text-[15px] italic ${theme.text}`}>
                  {activePrompt}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setActivePrompt(getRandomPrompt())}
                  className={`text-xs px-2 py-1 rounded-sm ${theme.textMuted} hover:${theme.text}`}
                  title="Next prompt"
                >
                  Another
                </button>
                <button
                  onClick={() => setActivePrompt(null)}
                  className={`text-xs px-1.5 py-1 text-stone-400 hover:${theme.text}`}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Pure Writing Surface */}
        <section className="w-full flex-1 flex flex-col mb-12">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder="Clear your mind. Start writing whatever comes to the surface..."
            aria-label="Daily writing entry"
            autoFocus
            className={`w-full flex-1 bg-transparent resize-none border-none outline-none font-serif-writing text-lg sm:text-[19px] leading-[1.85] ${theme.text} placeholder:text-stone-400/60 no-scrollbar focus:ring-0 selection:bg-amber-200/50 selection:text-stone-900`}
            style={{ minHeight: '380px' }}
          />
        </section>
      </div>

      {/* Bottom Floating Zen Bar / Progress Bar */}
      <footer
        className={`sticky bottom-4 w-full transition-opacity duration-300 ${
          zenMode && isTypingRecently ? 'opacity-20 hover:opacity-100' : 'opacity-100'
        }`}
      >
        <div
          className={`w-full max-w-xl mx-auto backdrop-blur-md rounded-xl p-3 sm:p-3.5 border ${theme.border} ${theme.surface}/90 shadow-sm`}
        >
          {/* Progress Bar Track */}
          <div className="w-full h-1.5 rounded-full overflow-hidden mb-2.5 relative bg-stone-200/60 dark:bg-stone-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isTargetMet ? 'bg-emerald-600' : theme.progressFill
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            {/* 750 words notch */}
            <div
              className="absolute top-0 bottom-0 right-0 w-0.5 bg-stone-400/40"
              title="750 words goal"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono-numbers">
            {/* Word Count Metric */}
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isTargetMet ? 'text-emerald-600' : theme.text}`}>
                {wordCount}
              </span>
              <span className={theme.textSubtle}>/</span>
              <span className={theme.textMuted}>{targetWords} words</span>

              {isTargetMet ? (
                <span className="hidden sm:inline-block text-[11px] font-sans text-emerald-600 font-medium ml-1">
                  ✓ Goal achieved!
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[11px] font-sans text-stone-400 ml-1">
                  ({Math.max(0, targetWords - wordCount)} left)
                </span>
              )}
            </div>

            {/* Autosave status & Utilities */}
            <div className="flex items-center gap-3 font-sans">
              {saveStatus === 'saved' && (
                <span className="text-[11px] text-stone-400 flex items-center gap-1 transition-opacity">
                  <Check className="w-3 h-3 text-emerald-500" /> Saved
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-[11px] text-stone-400 animate-soft-pulse">Saving...</span>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                disabled={!content}
                className={`p-1 rounded-md text-stone-400 hover:${theme.text} transition-colors disabled:opacity-30`}
                title="Copy text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={!content}
                className={`p-1 rounded-md text-stone-400 hover:${theme.text} transition-colors disabled:opacity-30`}
                title="Download entry as text file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};
