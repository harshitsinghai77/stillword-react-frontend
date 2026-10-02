import { UserProfile, DayEntry, StreakStats, ThemeMode } from '../types';

const STORAGE_KEY_USER = 'stillword_user_profile_v1';
const STORAGE_KEY_GUEST_UUID = 'stillword_guest_uuid_v1';
const STORAGE_KEY_ENTRIES = 'stillword_entries_v1';
const STORAGE_KEY_THEME = 'stillword_theme_v1';
const STORAGE_KEY_SOUND = 'stillword_sound_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDatePretty(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getTimeGreeting(name?: string): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  let timeSalutation = 'Good day';
  let subtext = 'Take a slow breath. Let today unfold one sentence at a time.';

  if (hour >= 4 && hour < 12) {
    timeSalutation = 'Good morning';
    subtext = 'Clear your thoughts before the world begins to rush.';
  } else if (hour >= 12 && hour < 17) {
    timeSalutation = 'Good afternoon';
    subtext = 'A pause in your day to empty the noise and reset.';
  } else if (hour >= 17 && hour < 22) {
    timeSalutation = 'Good evening';
    subtext = 'Unwind the day. Leave everything here on the page.';
  } else {
    timeSalutation = 'Peaceful night';
    subtext = 'Quiet hours. Write what is still lingering in your mind.';
  }

  const cleanName = name?.trim();
  const greeting = cleanName ? `${timeSalutation}, ${cleanName}.` : `${timeSalutation}.`;

  return { greeting, subtext };
}

export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(STORAGE_KEY_GUEST_UUID);
  if (!guestId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      guestId = 'guest_' + crypto.randomUUID();
    } else {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now();
    }
    localStorage.setItem(STORAGE_KEY_GUEST_UUID, guestId);
  }
  return guestId;
}

export function loadUserProfile(): UserProfile {
  const saved = localStorage.getItem(STORAGE_KEY_USER);
  const guestId = getOrCreateGuestId();
  const savedTheme = (localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode) || 'oatmeal';
  const soundStorageVal = localStorage.getItem(STORAGE_KEY_SOUND);
  const savedSound = soundStorageVal !== null ? soundStorageVal === 'true' : true;

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        id: parsed.id || guestId,
        name: parsed.name || '',
        email: parsed.email,
        isRegistered: Boolean(parsed.isRegistered),
        targetWords: parsed.targetWords || 750,
        theme: parsed.theme || savedTheme,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : savedSound,
        createdAt: parsed.createdAt || new Date().toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const defaultUser: UserProfile = {
    id: guestId,
    name: '',
    isRegistered: false,
    targetWords: 750,
    theme: savedTheme,
    soundEnabled: savedSound,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function saveUserProfile(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEY_THEME, user.theme);
  localStorage.setItem(STORAGE_KEY_SOUND, String(user.soundEnabled));

  // Sync to server asynchronously
  fetch('/api/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      name: user.name,
      targetWords: user.targetWords,
      theme: user.theme,
    }),
  }).catch(() => {
    // Offline or server not yet ready, safely ignored
  });
}

export function loadLocalEntries(): Record<string, DayEntry> {
  const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

export function saveLocalEntries(entries: Record<string, DayEntry>): void {
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
}

export function saveSingleEntry(
  userId: string,
  date: string,
  content: string,
  targetWords: number = 750
): { entry: DayEntry; newlyCompleted: boolean } {
  const entries = loadLocalEntries();
  const wordCount = countWords(content);
  const completed = wordCount >= targetWords;
  const existing = entries[date];

  const newlyCompleted = completed && (!existing || !existing.completed);

  const entry: DayEntry = {
    id: `${userId}_${date}`,
    userId,
    date,
    content,
    wordCount,
    completed,
    completedAt: completed ? (existing?.completedAt || new Date().toISOString()) : null,
    updatedAt: new Date().toISOString(),
  };

  entries[date] = entry;
  saveLocalEntries(entries);

  // Sync to server in background
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, entry }),
  }).catch(() => {
    // Graceful offline behavior
  });

  return { entry, newlyCompleted };
}

// Streak Calculation Logic
export function calculateStreakStats(
  entries: Record<string, DayEntry>,
  targetWords: number = 750
): StreakStats {
  const today = getTodayDateString();
  const todayEntry = entries[today];
  const todayWordCount = todayEntry ? todayEntry.wordCount : 0;
  const todayCompleted = todayEntry ? todayEntry.completed || todayWordCount >= targetWords : false;

  let totalWords = 0;
  let daysCompleted = 0;

  // Set of dates that met the target
  const completedDates = new Set<string>();

  Object.values(entries).forEach((e) => {
    totalWords += e.wordCount;
    if (e.completed || e.wordCount >= targetWords) {
      completedDates.add(e.date);
      daysCompleted++;
    }
  });

  // Calculate current streak
  // Helper to add/subtract days
  const shiftDate = (dateStr: string, daysDelta: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + daysDelta);
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const da = String(date.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  let currentStreak = 0;
  let checkDate = today;

  if (todayCompleted) {
    currentStreak = 1;
    checkDate = shiftDate(today, -1);
    while (completedDates.has(checkDate)) {
      currentStreak++;
      checkDate = shiftDate(checkDate, -1);
    }
  } else {
    // Check if streak was alive yesterday
    const yesterday = shiftDate(today, -1);
    if (completedDates.has(yesterday)) {
      currentStreak = 1;
      checkDate = shiftDate(yesterday, -1);
      while (completedDates.has(checkDate)) {
        currentStreak++;
        checkDate = shiftDate(checkDate, -1);
      }
    }
  }

  // Calculate longest streak across history
  const sortedDates = Array.from(completedDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const dateStr of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expectedNext = shiftDate(prevDate, 1);
      if (expectedNext === dateStr) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = dateStr;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalWords,
    daysCompleted,
    todayCompleted,
    todayWordCount,
    isStreakActive: currentStreak > 0,
  };
}
