export type ThemeMode = 'oatmeal' | 'sage' | 'ink' | 'pure';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  isRegistered: boolean;
  targetWords: number;
  theme: ThemeMode;
  soundEnabled: boolean;
  createdAt: string;
}

export interface DayEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content: string;
  wordCount: number;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  daysCompleted: number;
  todayCompleted: boolean;
  todayWordCount: number;
  isStreakActive: boolean;
}

export interface DayBoxInfo {
  date: string;
  wordCount: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  isInStreak: boolean;
  dayOfWeek: number;
}
