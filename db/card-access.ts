export const HOME_CARD_KEYS = [
  "report",
  "etp",
  "tr",
  "cota",
  "memorando",
  "oficio",
  "notification",
  "warning",
] as const;

export type HomeCardKey = (typeof HOME_CARD_KEYS)[number];
export type UserCardAccess = Record<HomeCardKey, boolean>;

type UserCardPermissionRow = {
  card_key: string;
  enabled: number;
};

export function defaultUserCardAccess(): UserCardAccess {
  return Object.fromEntries(HOME_CARD_KEYS.map((key) => [key, true])) as UserCardAccess;
}

export function isHomeCardKey(value: unknown): value is HomeCardKey {
  return typeof value === "string" && HOME_CARD_KEYS.includes(value as HomeCardKey);
}

export async function getUserCardAccess(
  db: D1Database,
  userId: string,
): Promise<UserCardAccess> {
  const access = defaultUserCardAccess();
  const result = await db
    .prepare(
      `SELECT card_key, enabled
       FROM user_card_permissions
       WHERE user_id = ?`,
    )
    .bind(userId)
    .all<UserCardPermissionRow>();

  for (const row of result.results) {
    if (isHomeCardKey(row.card_key)) access[row.card_key] = Boolean(row.enabled);
  }
  return access;
}

export async function updateUserCardAccess(
  db: D1Database,
  values: {
    userId: string;
    cardKey: HomeCardKey;
    enabled: boolean;
    updatedBy: string;
    now: number;
  },
): Promise<UserCardAccess | null> {
  const user = await db
    .prepare(
      `SELECT id
       FROM users
       WHERE id = ? AND is_admin = 0
       LIMIT 1`,
    )
    .bind(values.userId)
    .first<{ id: string }>();
  if (!user) return null;

  await db
    .prepare(
      `INSERT INTO user_card_permissions (
         user_id, card_key, enabled, updated_at, updated_by
       ) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, card_key) DO UPDATE SET
         enabled = excluded.enabled,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(
      values.userId,
      values.cardKey,
      values.enabled ? 1 : 0,
      values.now,
      values.updatedBy,
    )
    .run();

  return getUserCardAccess(db, values.userId);
}
