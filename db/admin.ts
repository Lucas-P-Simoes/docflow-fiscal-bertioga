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

const MANAGED_USER_COLUMNS = `
  id, name, email, status, is_admin,
  created_at, last_login_at, reviewed_at
`;

function managedUser(row: ManagedUserRow): ManagedUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function listManagedUsers(db: D1Database): Promise<ManagedUser[]> {
  const result = await db
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
    .all<ManagedUserRow>();

  return result.results.map(managedUser);
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

  return row ? managedUser(row) : null;
}
