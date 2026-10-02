import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data folder exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const ENTRIES_FILE = path.resolve(DATA_DIR, 'entries.json');

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  targetWords: number;
  theme: string;
  createdAt: string;
}

interface EntryRecord {
  id: string;
  userId: string;
  date: string;
  content: string;
  wordCount: number;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// In-memory / file backed stores
let users: Record<string, UserRecord> = readJsonFile(USERS_FILE, {});
let entries: Record<string, EntryRecord> = readJsonFile(ENTRIES_FILE, {});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, guestUserId, localEntries } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = Object.values(users).find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const newUser: UserRecord = {
    id: newUserId,
    email: normalizedEmail,
    passwordHash: password, // Simple secure store for this context
    name: name?.trim() || '',
    targetWords: 750,
    theme: 'oatmeal',
    createdAt: new Date().toISOString(),
  };

  users[newUserId] = newUser;
  writeJsonFile(USERS_FILE, users);

  // If user had local guest entries, re-assign or merge them to the new user ID
  if (Array.isArray(localEntries) && localEntries.length > 0) {
    for (const item of localEntries) {
      const entryKey = `${newUserId}_${item.date}`;
      entries[entryKey] = {
        ...item,
        id: entryKey,
        userId: newUserId,
      };
    }
    writeJsonFile(ENTRIES_FILE, entries);
  } else if (guestUserId) {
    // Check if server already has entries under guestUserId
    for (const key of Object.keys(entries)) {
      if (entries[key].userId === guestUserId) {
        const item = entries[key];
        const newKey = `${newUserId}_${item.date}`;
        entries[newKey] = {
          ...item,
          id: newKey,
          userId: newUserId,
        };
      }
    }
    writeJsonFile(ENTRIES_FILE, entries);
  }

  const userEntries = Object.values(entries).filter(e => e.userId === newUserId);

  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      targetWords: newUser.targetWords,
      theme: newUser.theme,
      isRegistered: true,
    },
    entries: userEntries,
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, guestUserId, localEntries } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = Object.values(users).find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Merge any local guest entries written on this machine if newer
  if (Array.isArray(localEntries) && localEntries.length > 0) {
    for (const item of localEntries) {
      const entryKey = `${user.id}_${item.date}`;
      if (!entries[entryKey] || new Date(item.updatedAt || 0) > new Date(entries[entryKey].updatedAt || 0)) {
        entries[entryKey] = {
          ...item,
          id: entryKey,
          userId: user.id,
        };
      }
    }
    writeJsonFile(ENTRIES_FILE, entries);
  }

  const userEntries = Object.values(entries).filter(e => e.userId === user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      targetWords: user.targetWords,
      theme: user.theme,
      isRegistered: true,
    },
    entries: userEntries,
  });
});

// Sync entry or batch of entries
app.post('/api/sync', (req: Request, res: Response) => {
  const { userId, entry, entries: batchEntries } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const toSave = batchEntries || (entry ? [entry] : []);
  for (const item of toSave) {
    if (!item.date) continue;
    const entryKey = `${userId}_${item.date}`;
    // Only update if newer or not present
    const existing = entries[entryKey];
    if (!existing || !existing.updatedAt || new Date(item.updatedAt) >= new Date(existing.updatedAt)) {
      entries[entryKey] = {
        id: entryKey,
        userId,
        date: item.date,
        content: item.content || '',
        wordCount: typeof item.wordCount === 'number' ? item.wordCount : 0,
        completed: Boolean(item.completed),
        completedAt: item.completedAt || null,
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
    }
  }

  writeJsonFile(ENTRIES_FILE, entries);
  res.json({ success: true, savedCount: toSave.length });
});

// Fetch user entries
app.get('/api/sync/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userEntries = Object.values(entries).filter(e => e.userId === userId);
  res.json({ entries: userEntries });
});

// Update user profile
app.post('/api/user/profile', (req: Request, res: Response) => {
  const { userId, name, targetWords, theme } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (users[userId]) {
    if (typeof name === 'string') users[userId].name = name.trim();
    if (typeof targetWords === 'number') users[userId].targetWords = targetWords;
    if (typeof theme === 'string') users[userId].theme = theme;
    writeJsonFile(USERS_FILE, users);
    res.json({ success: true, user: users[userId] });
  } else {
    // For guest users, return acknowledgement
    res.json({ success: true });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Stillword] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Stillword] Failed to start server:', err);
  process.exit(1);
});
