export type GeneratedDocument = {
  id: string;
  filename: string;
  documentType: string;
  contentType: string;
  sizeBytes: number;
  createdAt: number;
};

export type StoredGeneratedDocument = GeneratedDocument & {
  objectKey: string;
};

type GeneratedDocumentRow = {
  id: string;
  object_key: string;
  filename: string;
  document_type: string;
  content_type: string;
  size_bytes: number;
  created_at: number;
};

function mapDocument(row: GeneratedDocumentRow): StoredGeneratedDocument {
  return {
    id: row.id,
    objectKey: row.object_key,
    filename: row.filename,
    documentType: row.document_type,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export async function listGeneratedDocuments(
  db: D1Database,
  userId: string,
): Promise<GeneratedDocument[]> {
  const result = await db
    .prepare(
      `SELECT id, object_key, filename, document_type, content_type, size_bytes, created_at
       FROM generated_documents
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
    )
    .bind(userId)
    .all<GeneratedDocumentRow>();

  return result.results.map((row) => {
    const stored = mapDocument(row);
    const { objectKey: _privateKey, ...document } = stored;
    return document;
  });
}

export async function getGeneratedDocument(
  db: D1Database,
  userId: string,
  documentId: string,
): Promise<StoredGeneratedDocument | null> {
  const row = await db
    .prepare(
      `SELECT id, object_key, filename, document_type, content_type, size_bytes, created_at
       FROM generated_documents
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
    )
    .bind(documentId, userId)
    .first<GeneratedDocumentRow>();
  return row ? mapDocument(row) : null;
}

export async function createGeneratedDocument(
  db: D1Database,
  values: StoredGeneratedDocument & { userId: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO generated_documents (
         id, user_id, object_key, filename, document_type, content_type, size_bytes, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      values.id,
      values.userId,
      values.objectKey,
      values.filename,
      values.documentType,
      values.contentType,
      values.sizeBytes,
      values.createdAt,
    )
    .run();
}
