import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const ENTRIES_FILE = path.resolve(DATA_DIR, 'entries.json');

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

let users = readJsonFile(USERS_FILE, {});
let entries = readJsonFile(ENTRIES_FILE, {});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/auth/register', (req, res) => {
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
  const newUser = {
    id: newUserId,
    email: normalizedEmail,
    passwordHash: password,
    name: name?.trim() || '',
    targetWords: 750,
    theme: 'oatmeal',
    createdAt: new Date().toISOString(),
  };

  users[newUserId] = newUser;
  writeJsonFile(USERS_FILE, users);

  if (Array.isArray(localEntries) && localEntries.length > 0) {
    for (const item of localEntries) {
      const entryKey = `${newUserId}_${item.date}`;
      entries[entryKey] = { ...item, id: entryKey, userId: newUserId };
    }
    writeJsonFile(ENTRIES_FILE, entries);
  } else if (guestUserId) {
    for (const key of Object.keys(entries)) {
      if (entries[key].userId === guestUserId) {
        const item = entries[key];
        const newKey = `${newUserId}_${item.date}`;
        entries[newKey] = { ...item, id: newKey, userId: newUserId };
      }
    }
    writeJsonFile(ENTRIES_FILE, entries);
  }

  const userEntries = Object.values(entries).filter(e => e.userId === newUserId);
  res.json({
    user: { id: newUser.id, email: newUser.email, name: newUser.name, targetWords: newUser.targetWords, theme: newUser.theme, isRegistered: true },
    entries: userEntries,
  });
});

app.post('/api/auth/login', (req, res) => {
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

  if (Array.isArray(localEntries) && localEntries.length > 0) {
    for (const item of localEntries) {
      const entryKey = `${user.id}_${item.date}`;
      if (!entries[entryKey] || new Date(item.updatedAt || 0) > new Date(entries[entryKey].updatedAt || 0)) {
        entries[entryKey] = { ...item, id: entryKey, userId: user.id };
      }
    }
    writeJsonFile(ENTRIES_FILE, entries);
  }

  const userEntries = Object.values(entries).filter(e => e.userId === user.id);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, targetWords: user.targetWords, theme: user.theme, isRegistered: true },
    entries: userEntries,
  });
});

app.post('/api/sync', (req, res) => {
  const { userId, entry, entries: batchEntries } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const toSave = batchEntries || (entry ? [entry] : []);
  for (const item of toSave) {
    if (!item.date) continue;
    const entryKey = `${userId}_${item.date}`;
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

app.get('/api/sync/:userId', (req, res) => {
  const { userId } = req.params;
  const userEntries = Object.values(entries).filter(e => e.userId === userId);
  res.json({ entries: userEntries });
});

app.post('/api/user/profile', (req, res) => {
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
    res.json({ success: true });
  }
});

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
    app.get('*', (_req, res) => {
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
