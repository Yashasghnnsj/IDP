import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('acusound.db');

// ── Schema Setup ──────────────────────────────────────────────────────────────

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      disease TEXT NOT NULL,
      confidence REAL NOT NULL,
      risk TEXT NOT NULL,
      audioUri TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

// ── Scan Record Operations ────────────────────────────────────────────────────

export type ScanRecord = {
  id: string;
  date: string;
  disease: string;
  confidence: number;
  risk: 'Low' | 'Moderate' | 'High';
  audioUri?: string;
};

export function insertScan(scan: ScanRecord) {
  db.runSync(
    `INSERT OR REPLACE INTO scans (id, date, disease, confidence, risk, audioUri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    scan.id,
    scan.date,
    scan.disease,
    scan.confidence,
    scan.risk,
    scan.audioUri ?? null
  );
}

export function getAllScans(): ScanRecord[] {
  return db.getAllSync<ScanRecord>(
    `SELECT * FROM scans ORDER BY createdAt DESC`
  );
}

export function getScanById(id: string): ScanRecord | null {
  return db.getFirstSync<ScanRecord>(
    `SELECT * FROM scans WHERE id = ?`,
    id
  ) ?? null;
}

export function deleteScan(id: string) {
  db.runSync(`DELETE FROM scans WHERE id = ?`, id);
}

export function clearAllScans() {
  db.runSync(`DELETE FROM scans`);
}

// ── User Profile Operations ───────────────────────────────────────────────────

export function setProfileValue(key: string, value: string) {
  db.runSync(
    `INSERT OR REPLACE INTO user_profile (key, value) VALUES (?, ?)`,
    key,
    value
  );
}

export function getProfileValue(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM user_profile WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}
