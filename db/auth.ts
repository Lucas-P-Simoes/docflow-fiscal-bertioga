import { getUserCardAccess, type UserCardAccess } from "./card-access";

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  isAdmin: boolean;
  aiEnabled: boolean;
  lastLoginAt: number | null;
  hasApiKey: boolean;
  apiModel: string | null;
  apiKeyLastFour: string | null;
  cardAccess: UserCardAccess;
};

export type PasswordUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  status: "pending" | "approved" | "rejected";
  isAdmin: boolean;
};

export type StoredOpenAICredential = {
  encryptedKey: string;
  iv: string;
  model: string;
  lastFour: string;
};

type SessionRow = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  is_admin: number;
  ai_enabled: number;
  last_login_at: number | null;
  api_model: string | null;
  api_key_last_four: string | null;
};

type PasswordUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  status: "pending" | "approved" | "rejected";
  is_admin: number;
};

type CredentialRow = {
  encrypted_key: string;
  iv: string;
  model: string;
  last_four: string;
};

type CredentialOwnerRow = CredentialRow & {
  user_id: string;
};

type LoginAttemptRow = {
  failure_count: number;
  window_started_at: number;
  blocked_until: number;
};

export async function findUserByEmail(
  db: D1Database,
  email: string,
): Promise<PasswordUser | null> {
  const row = await db
    .prepare(
      `SELECT
         id, name, email, password_hash, password_salt, password_iterations,
         status, is_admin
       FROM users
       WHERE email = ?
       LIMIT 1`,
    )
    .bind(email)
    .first<PasswordUserRow>();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordIterations: row.password_iterations,
    status: row.status,
    isAdmin: Boolean(row.is_admin),
  };
}

export async function createPendingUser(
  db: D1Database,
  values: {
    userId: string;
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (
         id, name, email, password_hash, password_salt,
         password_iterations, status, is_admin, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    )
    .bind(
      values.userId,
      values.name,
      values.email,
      values.passwordHash,
      values.passwordSalt,
      values.passwordIterations,
      values.now,
      values.now,
    )
    .run();
}

export async function createSession(
  db: D1Database,
  values: {
    tokenHash: string;
    userId: string;
    now: number;
    expiresAt: number;
  },
): Promise<boolean> {
  const [sessionResult] = await db.batch([
    db
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
         SELECT ?, id, ?, ?
         FROM users
         WHERE id = ? AND status = 'approved'`,
      )
      .bind(values.tokenHash, values.now, values.expiresAt, values.userId),
    db
      .prepare(
        `UPDATE users
         SET last_login_at = ?, updated_at = ?
         WHERE id = ? AND status = 'approved'`,
      )
      .bind(values.now, values.now, values.userId),
  ]);
  return sessionResult.meta.changes > 0;
}

export async function getAccountBySession(
  db: D1Database,
  tokenHash: string,
  now: number,
): Promise<AccountSummary | null> {
  const row = await db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.status,
         u.is_admin,
         u.ai_enabled,
         u.last_login_at,
         c.model AS api_model,
         c.last_four AS api_key_last_four
       FROM sessions AS s
       INNER JOIN users AS u ON u.id = s.user_id
       LEFT JOIN openai_credentials AS c ON c.user_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'approved'
       LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<SessionRow>();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    isAdmin: Boolean(row.is_admin),
    aiEnabled: Boolean(row.ai_enabled),
    lastLoginAt: row.last_login_at,
    hasApiKey: Boolean(row.api_model && row.api_key_last_four),
    apiModel: row.api_model,
    apiKeyLastFour: row.api_key_last_four,
    cardAccess: await getUserCardAccess(db, row.id),
  };
}

export async function deleteSession(
  db: D1Database,
  tokenHash: string,
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function deleteExpiredSessions(
  db: D1Database,
  now: number,
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
}

export async function saveOpenAICredential(
  db: D1Database,
  values: {
    userId: string;
    encryptedKey: string;
    iv: string;
    model: string;
    lastFour: string;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO openai_credentials (
         user_id, encrypted_key, iv, model, last_four, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         encrypted_key = excluded.encrypted_key,
         iv = excluded.iv,
         model = excluded.model,
         last_four = excluded.last_four,
         updated_at = excluded.updated_at`,
    )
    .bind(
      values.userId,
      values.encryptedKey,
      values.iv,
      values.model,
      values.lastFour,
      values.now,
      values.now,
    )
    .run();
}

export async function updateOpenAIModel(
  db: D1Database,
  userId: string,
  model: string,
  now: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE openai_credentials
       SET model = ?, updated_at = ?
       WHERE user_id = ?`,
    )
    .bind(model, now, userId)
    .run();
  return result.meta.changes > 0;
}

export async function getOpenAICredential(
  db: D1Database,
  userId: string,
): Promise<StoredOpenAICredential | null> {
  const row = await db
    .prepare(
      `SELECT encrypted_key, iv, model, last_four
       FROM openai_credentials
       WHERE user_id = ?
       LIMIT 1`,
    )
    .bind(userId)
    .first<CredentialRow>();

  if (!row) return null;
  return {
    encryptedKey: row.encrypted_key,
    iv: row.iv,
    model: row.model,
    lastFour: row.last_four,
  };
}

export async function getOpenAICredentialByEmail(
  db: D1Database,
  email: string,
): Promise<(StoredOpenAICredential & { userId: string }) | null> {
  const row = await db
    .prepare(
      `SELECT
         c.user_id, c.encrypted_key, c.iv, c.model, c.last_four
       FROM openai_credentials AS c
       INNER JOIN users AS u ON u.id = c.user_id
       WHERE u.email = ? AND u.is_admin = 1
       LIMIT 1`,
    )
    .bind(email)
    .first<CredentialOwnerRow>();

  if (!row) return null;
  return {
    userId: row.user_id,
    encryptedKey: row.encrypted_key,
    iv: row.iv,
    model: row.model,
    lastFour: row.last_four,
  };
}

export async function deleteOpenAICredential(
  db: D1Database,
  userId: string,
): Promise<void> {
  await db.prepare("DELETE FROM openai_credentials WHERE user_id = ?").bind(userId).run();
}

export async function getLoginAttempt(
  db: D1Database,
  attemptKey: string,
): Promise<LoginAttemptRow | null> {
  return db
    .prepare(
      `SELECT failure_count, window_started_at, blocked_until
       FROM login_attempts
       WHERE attempt_key = ?
       LIMIT 1`,
    )
    .bind(attemptKey)
    .first<LoginAttemptRow>();
}

export async function recordLoginFailure(
  db: D1Database,
  values: {
    attemptKey: string;
    failureCount: number;
    windowStartedAt: number;
    blockedUntil: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO login_attempts (
         attempt_key, failure_count, window_started_at, blocked_until
       ) VALUES (?, ?, ?, ?)
       ON CONFLICT(attempt_key) DO UPDATE SET
         failure_count = excluded.failure_count,
         window_started_at = excluded.window_started_at,
         blocked_until = excluded.blocked_until`,
    )
    .bind(
      values.attemptKey,
      values.failureCount,
      values.windowStartedAt,
      values.blockedUntil,
    )
    .run();
}

export async function clearLoginAttempts(
  db: D1Database,
  attemptKey: string,
): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE attempt_key = ?").bind(attemptKey).run();
}
