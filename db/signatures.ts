export type SignatureProfile = {
  id: string;
  name: string;
  role: string;
  createdAt: number;
  updatedAt: number;
};

type SignatureProfileRow = {
  id: string;
  name: string;
  role: string;
  created_at: number;
  updated_at: number;
};

function mapSignatureProfile(row: SignatureProfileRow): SignatureProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSignatureProfiles(
  db: D1Database,
  userId: string,
): Promise<SignatureProfile[]> {
  const result = await db
    .prepare(
      `SELECT id, name, role, created_at, updated_at
       FROM signature_profiles
       WHERE user_id = ?`,
    )
    .bind(userId)
    .all<SignatureProfileRow>();

  return result.results.map(mapSignatureProfile);
}

export async function createSignatureProfile(
  db: D1Database,
  values: SignatureProfile & { userId: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO signature_profiles (
         id, user_id, name, role, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      values.id,
      values.userId,
      values.name,
      values.role,
      values.createdAt,
      values.updatedAt,
    )
    .run();
}

export async function updateSignatureProfile(
  db: D1Database,
  values: Pick<SignatureProfile, "id" | "name" | "role" | "updatedAt"> & { userId: string },
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE signature_profiles
       SET name = ?, role = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .bind(values.name, values.role, values.updatedAt, values.id, values.userId)
    .run();
  return result.meta.changes > 0;
}

export async function deleteSignatureProfile(
  db: D1Database,
  userId: string,
  profileId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `DELETE FROM signature_profiles
       WHERE id = ? AND user_id = ?`,
    )
    .bind(profileId, userId)
    .run();
  return result.meta.changes > 0;
}
