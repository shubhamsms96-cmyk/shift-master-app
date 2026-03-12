import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const db = new Database("shiftmaster.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Alex Rivera',
    company TEXT DEFAULT 'AppZyro Corp',
    department TEXT DEFAULT 'Operations',
    notifications_enabled INTEGER DEFAULT 1,
    theme_mode TEXT DEFAULT 'system',
    profile_image TEXT
  );
`);

// Migration for profile_image if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN profile_image TEXT");
} catch {
  // Column might already exist
}

// Ensure at least one user exists
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name) VALUES (?)").run("Alex Rivera");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    shift_type TEXT,
    leave_reason TEXT
  );
`);

// Migration for leave_reason if it doesn't exist
try {
  db.exec("ALTER TABLE shifts ADD COLUMN leave_reason TEXT");
} catch {
  // Column might already exist
}

db.exec(`
  CREATE TABLE IF NOT EXISTS overtime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    hours INTEGER,
    time TEXT,
    description TEXT
  );
`);

// Migration for overtime table
try {
  db.exec("ALTER TABLE overtime ADD COLUMN time TEXT");
  db.exec("ALTER TABLE overtime ADD COLUMN description TEXT");
} catch {
  // Columns might already exist
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user);
  });

  app.post("/api/user", (req, res) => {
    const { name, company, department, notifications_enabled, theme_mode, profile_image } = req.body;
    db.prepare(`
      UPDATE users SET 
        name = ?, 
        company = ?, 
        department = ?, 
        notifications_enabled = ?, 
        theme_mode = ?,
        profile_image = ?
      WHERE id = 1
    `).run(name, company, department, notifications_enabled ? 1 : 0, theme_mode, profile_image);
    res.json({ success: true });
  });

  app.get("/api/shifts", (req, res) => {
    const shifts = db.prepare("SELECT * FROM shifts").all();
    res.json(shifts);
  });

  app.post("/api/shifts", (req, res) => {
    const { date, shift_type, leave_reason } = req.body;
    db.prepare("INSERT OR REPLACE INTO shifts (date, shift_type, leave_reason) VALUES (?, ?, ?)").run(date, shift_type, leave_reason || null);
    res.json({ success: true });
  });

  app.post("/api/shifts/bulk", (req, res) => {
    const { shifts } = req.body;
    const insert = db.prepare("INSERT OR REPLACE INTO shifts (date, shift_type, leave_reason) VALUES (?, ?, ?)");
    const transaction = db.transaction((data) => {
      for (const item of data) {
        insert.run(item.date, item.shift_type, item.leave_reason || null);
      }
    });
    transaction(shifts);
    res.json({ success: true });
  });

  app.get("/api/overtime", (req, res) => {
    const overtime = db.prepare("SELECT * FROM overtime").all();
    res.json(overtime);
  });

  app.post("/api/overtime", (req, res) => {
    const { date, hours, time, description } = req.body;
    db.prepare("INSERT INTO overtime (date, hours, time, description) VALUES (?, ?, ?, ?)").run(date, hours, time || null, description || null);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
