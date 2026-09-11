import {
  defaultUserCardAccess,
  getUserCardAccess,
  isHomeCardKey,
  type UserCardAccess,
} from "./card-access";

export type ManagedUserStatus = "pending" | "approved" | "rejected";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  status: ManagedUserStatus;
  isAdmin: boolean;
  createdAt: number;
  lastLoginAt: number | null;
  reviewedAt: number | null;
  cardAccess: UserCardAccess;
};

type ManagedUserRow = {
  id: string;
  name: string;
  email: string;
  status: ManagedUserStatus;
  is_admin: number;
  created_at: number;
  last_login_at: number | null;
  reviewed_at: number | null;
};

type DocumentObjectKeyRow = {
  object_key: string;
};

type ManagedUserCardPermissionRow = {
  user_id: string;
  card_key: string;
  enabled: number;
};

const MANAGED_USER_COLUMNS = `
  id, name, email, status, is_admin,
  created_at, last_login_at, reviewed_at
`;

function managedUser(
  row: ManagedUserRow,
  cardAccess: UserCardAccess = defaultUserCardAccess(),
): ManagedUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    reviewedAt: row.reviewed_at,
    cardAccess,
  };
}

export async function listManagedUsers(db: D1Database): Promise<ManagedUser[]> {
  const [usersResult, permissionsResult] = await Promise.all([
    db
      .prepare(
        `SELECT ${MANAGED_USER_COLUMNS}
         FROM users
         ORDER BY
           CASE status
             WHEN 'pending' THEN 0
             WHEN 'approved' THEN 1
             ELSE 2
           END,
           created_at DESC`,
      )
      .all<ManagedUserRow>(),
    db
      .prepare(
        `SELECT user_id, card_key, enabled
         FROM user_card_permissions`,
      )
      .all<ManagedUserCardPermissionRow>(),
  ]);

  const accessByUser = new Map<string, UserCardAccess>();
  for (const row of usersResult.results) accessByUser.set(row.id, defaultUserCardAccess());
  for (const permission of permissionsResult.results) {
    const access = accessByUser.get(permission.user_id);
    if (access && isHomeCardKey(permission.card_key)) {
      access[permission.card_key] = Boolean(permission.enabled);
    }
  }

  return usersResult.results.map((row) => managedUser(row, accessByUser.get(row.id)));
}

export async function updateManagedUserStatus(
  db: D1Database,
  values: {
    userId: string;
    status: Exclude<ManagedUserStatus, "pending">;
    reviewedBy: string;
    now: number;
  },
): Promise<ManagedUser | null> {
  const statements = [
    db
      .prepare(
        `UPDATE users
         SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
         WHERE id = ? AND is_admin = 0`,
      )
      .bind(
        values.status,
        values.now,
        values.reviewedBy,
        values.now,
        values.userId,
      ),
  ];

  if (values.status === "rejected") {
    statements.push(
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(values.userId),
    );
  }

  const [updateResult] = await db.batch(statements);
  if (updateResult.meta.changes < 1) return null;

  const row = await db
    .prepare(
      `SELECT ${MANAGED_USER_COLUMNS}
       FROM users
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(values.userId)
    .first<ManagedUserRow>();

  return row ? managedUser(row, await getUserCardAccess(db, row.id)) : null;
}

export async function getManagedUserDeletion(
  db: D1Database,
  userId: string,
): Promise<{ objectKeys: string[] } | null> {
  const user = await db
    .prepare(
      `SELECT id
       FROM users
       WHERE id = ? AND is_admin = 0
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ id: string }>();
  if (!user) return null;

  const documents = await db
    .prepare(
      `SELECT object_key
       FROM generated_documents
       WHERE user_id = ?`,
    )
    .bind(userId)
    .all<DocumentObjectKeyRow>();

  return { objectKeys: documents.results.map((row) => row.object_key) };
}

export async function deleteManagedUser(
  db: D1Database,
  userId: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM users WHERE id = ? AND is_admin = 0")
    .bind(userId)
    .run();
  return result.meta.changes > 0;
}
