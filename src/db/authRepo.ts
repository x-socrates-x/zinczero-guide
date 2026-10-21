import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { one, run, db } from "./db";

const SESSION_KEY = "ZZ_SESSION_USER_ID";

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function sha256(text: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

async function makeSalt() {
  return sha256(`${Math.random()}_${Date.now()}_${Math.random()}`);
}

async function hashPassword(password: string, salt: string) {
  return sha256(`${salt}:${password}`);
}

// ✅ ensures admin/admin123 exists AND fixes any old TEMP_HASH admin
export async function ensureAdminUser() {
  const anyUser = one<{ id: string }>(`SELECT id FROM users LIMIT 1;`);
  if (anyUser) return; // ✅ don’t overwrite existing users

  const salt = await makeSalt();
  const password_hash = await hashPassword("admin123", salt);

  run(
    `INSERT INTO users (id, username, password_hash, salt, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [id("user"), "admin", password_hash, salt, Date.now()]
  );
}


export async function login(username: string, password: string) {
  const user = one<{ id: string; password_hash: string; salt: string }>(
    `SELECT id, password_hash, salt FROM users WHERE username = ?;`,
    [username.trim()]
  );

  if (!user) return { ok: false as const, error: "Invalid username or password." };

  const candidate = await hashPassword(password, user.salt);
  if (candidate !== user.password_hash) {
    return { ok: false as const, error: "Invalid username or password." };
  }

  await SecureStore.setItemAsync(SESSION_KEY, user.id);
  return { ok: true as const, userId: user.id };
}

export async function logout() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getSessionUserId() {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function updateAdminCredentials(newUsername: string, newPassword: string) {
  const existing = one<{ id: string; username: string }>(
    `SELECT id, username FROM users ORDER BY created_at ASC LIMIT 1;`
  );

  if (!existing) {
    throw new Error("No users exist yet. Seed a user first.");
  }

  const salt = await makeSalt();
  const password_hash = await hashPassword(newPassword, salt);

  run(
    `UPDATE users
     SET username = ?, password_hash = ?, salt = ?
     WHERE id = ?;`,
    [newUsername.trim(), password_hash, salt, existing.id]
  );
}
