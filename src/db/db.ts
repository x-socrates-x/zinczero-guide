import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("zz_guides.db");

// Helper: run queries that don't return rows
export function run(sql: string, params: any[] = []) {
  db.runSync(sql, params);
}

// Helper: return rows
export function all<T = any>(sql: string, params: any[] = []) {
  return db.getAllSync<T>(sql, params);
}

// Helper: return a single row
export function one<T = any>(sql: string, params: any[] = []) {
  return db.getFirstSync<T>(sql, params);
}