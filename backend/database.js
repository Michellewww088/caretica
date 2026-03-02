const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'caretica.db'));
db.pragma('journal_mode = WAL');

// ── SCHEMA ──
db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             TEXT    NOT NULL DEFAULT 'user1',
    baby_id             TEXT    NOT NULL DEFAULT 'emma',
    type                TEXT    NOT NULL,
    title               TEXT    NOT NULL,
    datetime            TEXT    NOT NULL,
    repeat_frequency    TEXT    NOT NULL DEFAULT 'once',
    notification_method TEXT    NOT NULL DEFAULT 'in-app',
    notes               TEXT,
    status              TEXT    NOT NULL DEFAULT 'active',
    email_sent          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS growth_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id    TEXT    NOT NULL DEFAULT 'emma',
    type       TEXT    NOT NULL,
    value      REAL    NOT NULL,
    unit       TEXT    NOT NULL DEFAULT '',
    logged_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id       TEXT    NOT NULL DEFAULT 'emma',
    record_type   TEXT,
    vaccine_name  TEXT,
    date          TEXT,
    weight        REAL,
    height        REAL,
    doctor_notes  TEXT,
    ai_summary    TEXT,
    file_path     TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS babies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT    NOT NULL DEFAULT 'user1',
    name        TEXT    NOT NULL,
    birthdate   TEXT    NOT NULL,
    gender      TEXT,
    blood_type  TEXT,
    photo_path  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Seed default baby if not exists
  INSERT OR IGNORE INTO babies (id, name, birthdate, gender, blood_type)
  VALUES (1, 'Emma Martinez', '2025-07-02', 'female', 'A+');

  -- Seed sample reminders if empty
  INSERT OR IGNORE INTO reminders (id, type, title, datetime, repeat_frequency, notification_method, notes)
  SELECT 1,'checkup','8-Month Checkup','2026-03-02 10:00:00','once','in-app,email','Dr. Amara Johnson'
  WHERE NOT EXISTS (SELECT 1 FROM reminders LIMIT 1);

  INSERT OR IGNORE INTO reminders (id, type, title, datetime, repeat_frequency, notification_method)
  SELECT 2,'vaccine','Flu Vaccine','2026-03-18 09:00:00','once','in-app','Annual flu shot'
  WHERE (SELECT count(*) FROM reminders) < 2;
`);

// ── REMINDERS ──
const stmts = {
  getAllReminders: db.prepare(`
    SELECT * FROM reminders WHERE status != 'deleted' ORDER BY datetime ASC
  `),
  getReminderById: db.prepare(`SELECT * FROM reminders WHERE id = ?`),
  createReminder: db.prepare(`
    INSERT INTO reminders (user_id, baby_id, type, title, datetime, repeat_frequency, notification_method, notes)
    VALUES (@user_id, @baby_id, @type, @title, @datetime, @repeat_frequency, @notification_method, @notes)
  `),
  updateReminder: db.prepare(`
    UPDATE reminders SET type=@type, title=@title, datetime=@datetime,
      repeat_frequency=@repeat_frequency, notification_method=@notification_method,
      notes=@notes, status=@status WHERE id=@id
  `),
  deleteReminder: db.prepare(`UPDATE reminders SET status='deleted' WHERE id=?`),
  getDueReminders: db.prepare(`
    SELECT * FROM reminders
    WHERE status = 'active'
      AND email_sent = 0
      AND notification_method LIKE '%email%'
      AND datetime BETWEEN datetime('now', '-5 minutes') AND datetime('now', '+5 minutes')
  `),
  markEmailSent: db.prepare(`UPDATE reminders SET email_sent = 1 WHERE id = ?`),

  // ── GROWTH LOGS ──
  getGrowthLogs: db.prepare(`SELECT * FROM growth_logs WHERE baby_id = ? ORDER BY logged_at DESC`),
  addGrowthLog:  db.prepare(`INSERT INTO growth_logs (baby_id, type, value, unit) VALUES (@baby_id, @type, @value, @unit)`),

  // ── MEDICAL RECORDS ──
  getRecords:    db.prepare(`SELECT * FROM medical_records WHERE baby_id = ? ORDER BY created_at DESC`),
  addRecord:     db.prepare(`
    INSERT INTO medical_records (baby_id, record_type, vaccine_name, date, weight, height, doctor_notes, ai_summary, file_path)
    VALUES (@baby_id, @record_type, @vaccine_name, @date, @weight, @height, @doctor_notes, @ai_summary, @file_path)
  `),
};

module.exports = { db, stmts };
