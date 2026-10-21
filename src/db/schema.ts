import { run, all } from "./db";

function hasColumn(tableName: string, columnName: string) {
  const columns = all<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>(`PRAGMA table_info(${tableName});`);

  return columns.some((col) => col.name === columnName);
}

function addColumnIfMissing(tableName: string, columnName: string, sqlTypeAndDefault: string) {
  if (!hasColumn(tableName, columnName)) {
    run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlTypeAndDefault};`);
  }
}

export function initSchema() {
  run(`PRAGMA foreign_keys = ON;`);

  run(`
    CREATE TABLE IF NOT EXISTS guides (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS stages (
      id TEXT PRIMARY KEY NOT NULL,
      guide_id TEXT NOT NULL,
      stage_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
    );
  `);
  
  run(`
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      stage_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      instruction_title TEXT NOT NULL,
      code TEXT,
      explanation TEXT,
      image_uri TEXT,
      attachment_name TEXT,
      attachment_url TEXT,
      is_completed INTEGER DEFAULT 0,
      completed_at INTEGER,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    );
  `);

  run(`CREATE INDEX IF NOT EXISTS idx_stages_guide_id ON stages(guide_id);`);
  run(`CREATE INDEX IF NOT EXISTS idx_steps_stage_id ON steps(stage_id);`);

  run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);

  run(`
    CREATE TABLE IF NOT EXISTS guide_sections (
      id TEXT PRIMARY KEY NOT NULL,
      guide_id TEXT NOT NULL,
      key TEXT NOT NULL,
      content_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
      UNIQUE(guide_id, key)
    );
  `);

  // Guides
  addColumnIfMissing("guides", "status", `TEXT NOT NULL DEFAULT 'inactive'`);
  addColumnIfMissing("guides", "activated_at", `INTEGER`);
  addColumnIfMissing("guides", "completed_at", `INTEGER`);
  addColumnIfMissing("guides", "cancelled_at", `INTEGER`);
  addColumnIfMissing("guides", "estimated_duration_days", `INTEGER`);

  // Steps
  addColumnIfMissing("steps", "is_completed", `INTEGER NOT NULL DEFAULT 0`);
  addColumnIfMissing("steps", "completed_at", `INTEGER`);
  addColumnIfMissing("steps", "attachment_name", `TEXT`);
  addColumnIfMissing("steps", "attachment_url", `TEXT`);
}