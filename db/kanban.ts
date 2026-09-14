export type KanbanStatus = "todo" | "doing" | "done";
export type KanbanPriority = "low" | "medium" | "high";

export type KanbanPerson = {
  id: string;
  name: string;
  email: string;
};

export type KanbanBoardSummary = {
  id: string;
  name: string;
  description: string;
  createdBy: KanbanPerson | null;
  memberCount: number;
  cardCount: number;
  isOwner: boolean;
  canEdit: boolean;
  createdAt: number;
  updatedAt: number;
};

export type KanbanBoard = KanbanBoardSummary & {
  members: KanbanPerson[];
};

export type KanbanCard = {
  id: string;
  boardId: string;
  title: string;
  description: string;
  startDate: string | null;
  durationDays: number | null;
  status: KanbanStatus;
  priority: KanbanPriority;
  position: number;
  createdBy: KanbanPerson | null;
  assignees: KanbanPerson[];
  createdAt: number;
  updatedAt: number;
};

export type KanbanActivity = {
  id: string;
  cardId: string | null;
  action: string;
  summary: string;
  details: string | null;
  actor: KanbanPerson | null;
  createdAt: number;
};

export type KanbanCardComment = {
  id: string;
  cardId: string;
  body: string;
  author: KanbanPerson | null;
  createdAt: number;
};

export type KanbanCardAttachment = {
  id: string;
  cardId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: KanbanPerson | null;
  createdAt: number;
};

export type KanbanCardAttachmentRecord = KanbanCardAttachment & {
  objectKey: string;
};

export type KanbanNotification = {
  id: string;
  boardId: string;
  cardId: string;
  message: string;
  readAt: number | null;
  createdAt: number;
};

type PersonRow = {
  id: string;
  name: string;
  email: string;
};

type BoardRow = {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  creator_name: string | null;
  creator_email: string | null;
  member_count: number;
  card_count: number;
  member_can_edit: number;
  created_at: number;
  updated_at: number;
};

type BoardMemberRow = PersonRow & {
  can_edit: number;
};

type CardRow = {
  id: string;
  board_id: string;
  title: string;
  description: string;
  start_date: string | null;
  duration_days: number | null;
  status: KanbanStatus;
  priority: KanbanPriority;
  position: number;
  created_by: string | null;
  creator_name: string | null;
  creator_email: string | null;
  created_at: number;
  updated_at: number;
};

type AssigneeRow = PersonRow & {
  card_id: string;
};

type ActivityRow = {
  id: string;
  card_id: string | null;
  action: string;
  summary: string;
  details: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  created_at: number;
};

type CommentRow = {
  id: string;
  card_id: string;
  body: string;
  author_user_id: string | null;
  author_name: string | null;
  author_email: string | null;
  created_at: number;
};

type AttachmentRow = {
  id: string;
  card_id: string;
  object_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  uploader_name: string | null;
  uploader_email: string | null;
  created_at: number;
};

type NotificationRow = {
  id: string;
  board_id: string;
  card_id: string;
  message: string;
  read_at: number | null;
  created_at: number;
};

export type KanbanCardAccess = {
  boardId: string;
  canEdit: boolean;
  isOwner: boolean;
};

function person(row: PersonRow): KanbanPerson {
  return { id: row.id, name: row.name, email: row.email };
}

function nullablePerson(
  id: string | null,
  name: string | null,
  email: string | null,
): KanbanPerson | null {
  return id && name && email ? { id, name, email } : null;
}

function boardSummary(row: BoardRow, userId: string): KanbanBoardSummary {
  const isOwner = row.created_by === userId;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: nullablePerson(row.created_by, row.creator_name, row.creator_email),
    memberCount: Number(row.member_count || 0),
    cardCount: Number(row.card_count || 0),
    isOwner,
    canEdit: isOwner || Boolean(row.member_can_edit),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApprovedKanbanPeople(db: D1Database): Promise<KanbanPerson[]> {
  const result = await db
    .prepare(
      `SELECT id, name, email
       FROM users
       WHERE status = 'approved'
       ORDER BY name COLLATE NOCASE, email COLLATE NOCASE`,
    )
    .all<PersonRow>();
  return result.results.map(person);
}

export async function listAccessibleKanbanBoards(
  db: D1Database,
  userId: string,
): Promise<KanbanBoardSummary[]> {
  const result = await db
    .prepare(
      `SELECT
         b.id, b.name, b.description, b.created_by,
         creator.name AS creator_name, creator.email AS creator_email,
         (SELECT COUNT(*) FROM kanban_board_members AS members WHERE members.board_id = b.id) AS member_count,
         (SELECT COUNT(*) FROM kanban_cards AS cards WHERE cards.board_id = b.id) AS card_count,
         COALESCE((SELECT can_edit FROM kanban_board_members WHERE board_id = b.id AND user_id = ?), 0) AS member_can_edit,
         b.created_at, b.updated_at
       FROM kanban_boards AS b
       LEFT JOIN users AS creator ON creator.id = b.created_by
       WHERE b.created_by = ?
          OR EXISTS (
            SELECT 1 FROM kanban_board_members AS access
            WHERE access.board_id = b.id AND access.user_id = ?
          )
       ORDER BY b.updated_at DESC, b.name COLLATE NOCASE`,
    )
    .bind(userId, userId, userId)
    .all<BoardRow>();
  return result.results.map((row) => boardSummary(row, userId));
}

export async function getKanbanBoard(
  db: D1Database,
  boardId: string,
  userId: string,
): Promise<KanbanBoard | null> {
  const row = await db
    .prepare(
      `SELECT
         b.id, b.name, b.description, b.created_by,
         creator.name AS creator_name, creator.email AS creator_email,
         (SELECT COUNT(*) FROM kanban_board_members AS members WHERE members.board_id = b.id) AS member_count,
         (SELECT COUNT(*) FROM kanban_cards AS cards WHERE cards.board_id = b.id) AS card_count,
         COALESCE((SELECT can_edit FROM kanban_board_members WHERE board_id = b.id AND user_id = ?), 0) AS member_can_edit,
         b.created_at, b.updated_at
       FROM kanban_boards AS b
       LEFT JOIN users AS creator ON creator.id = b.created_by
       WHERE b.id = ?
         AND (b.created_by = ? OR EXISTS (
           SELECT 1 FROM kanban_board_members AS access
           WHERE access.board_id = b.id AND access.user_id = ?
         ))
       LIMIT 1`,
    )
    .bind(userId, boardId, userId, userId)
    .first<BoardRow>();
  if (!row) return null;

  const memberResult = await db
    .prepare(
      `SELECT u.id, u.name, u.email, members.can_edit
       FROM kanban_board_members AS members
       INNER JOIN users AS u ON u.id = members.user_id
       WHERE members.board_id = ?
       ORDER BY u.name COLLATE NOCASE, u.email COLLATE NOCASE`,
    )
    .bind(boardId)
    .all<BoardMemberRow>();

  return {
    ...boardSummary(row, userId),
    members: memberResult.results.map(person),
  };
}

export async function createKanbanBoard(
  db: D1Database,
  values: {
    id: string;
    name: string;
    description: string;
    memberIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanBoard> {
  const memberIds = [...new Set([values.actor.id, ...values.memberIds])];
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO kanban_boards (id, name, description, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(values.id, values.name, values.description, values.actor.id, values.now, values.now),
  ];
  for (const userId of memberIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_board_members (board_id, user_id, added_by, can_edit, created_at)
           VALUES (?, ?, ?, 1, ?)`,
        )
        .bind(values.id, userId, values.actor.id, values.now),
    );
  }
  statements.push(activityStatement(db, {
    boardId: values.id,
    actorUserId: values.actor.id,
    action: "board_created",
    summary: `criou o quadro “${values.name}”`,
    now: values.now,
  }));
  await db.batch(statements);
  const board = await getKanbanBoard(db, values.id, values.actor.id);
  if (!board) throw new Error("O quadro criado não pôde ser recuperado.");
  return board;
}

export async function updateKanbanBoard(
  db: D1Database,
  values: {
    id: string;
    name: string;
    description: string;
    memberIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanBoard | null> {
  const existing = await getKanbanBoard(db, values.id, values.actor.id);
  if (!existing || !existing.isOwner) return null;
  const memberIds = [...new Set([values.actor.id, ...values.memberIds])];
  const previousIds = new Set(existing.members.map((item) => item.id));
  const nextIds = new Set(memberIds);
  const allPeople = await listApprovedKanbanPeople(db);
  const peopleById = new Map(allPeople.map((item) => [item.id, item.name]));
  const added = memberIds.filter((id) => !previousIds.has(id)).map((id) => peopleById.get(id)).filter(Boolean);
  const removed = existing.members.filter((item) => !nextIds.has(item.id)).map((item) => item.name);
  const summaryParts: string[] = [];
  if (existing.name !== values.name || existing.description !== values.description) {
    summaryParts.push("atualizou as informações do quadro");
  }
  if (added.length) summaryParts.push(`adicionou ${added.join(", ")}`);
  if (removed.length) summaryParts.push(`removeu ${removed.join(", ")}`);
  if (!summaryParts.length) summaryParts.push("revisou as configurações do quadro");

  const statements: D1PreparedStatement[] = [
    db
      .prepare("UPDATE kanban_boards SET name = ?, description = ?, updated_at = ? WHERE id = ?")
      .bind(values.name, values.description, values.now, values.id),
    db.prepare("DELETE FROM kanban_board_members WHERE board_id = ?").bind(values.id),
    db
      .prepare(
        `DELETE FROM kanban_card_assignees
         WHERE card_id IN (SELECT id FROM kanban_cards WHERE board_id = ?)
           AND user_id NOT IN (${memberIds.map(() => "?").join(", ")})`,
      )
      .bind(values.id, ...memberIds),
  ];
  for (const userId of memberIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_board_members (board_id, user_id, added_by, can_edit, created_at)
           VALUES (?, ?, ?, 1, ?)`,
        )
        .bind(values.id, userId, values.actor.id, values.now),
    );
  }
  statements.push(activityStatement(db, {
    boardId: values.id,
    actorUserId: values.actor.id,
    action: "board_updated",
    summary: summaryParts.join("; "),
    now: values.now,
  }));
  await db.batch(statements);
  return getKanbanBoard(db, values.id, values.actor.id);
}

export async function deleteKanbanBoard(
  db: D1Database,
  boardId: string,
  userId: string,
): Promise<boolean> {
  const [, boardResult] = await db.batch([
    db
      .prepare(
        `DELETE FROM kanban_cards
         WHERE board_id IN (
           SELECT id FROM kanban_boards WHERE id = ? AND created_by = ?
         )`,
      )
      .bind(boardId, userId),
    db
      .prepare("DELETE FROM kanban_boards WHERE id = ? AND created_by = ?")
      .bind(boardId, userId),
  ]);
  return boardResult.meta.changes > 0;
}

export async function listKanbanCards(db: D1Database, boardId: string): Promise<KanbanCard[]> {
  const cardResult = await db
    .prepare(
      `SELECT
         c.id, c.board_id, c.title, c.description, c.start_date, c.duration_days, c.status, c.priority, c.position,
         c.created_by, creator.name AS creator_name, creator.email AS creator_email,
         c.created_at, c.updated_at
       FROM kanban_cards AS c
       LEFT JOIN users AS creator ON creator.id = c.created_by
       WHERE c.board_id = ?
       ORDER BY
         CASE c.status WHEN 'todo' THEN 0 WHEN 'doing' THEN 1 ELSE 2 END,
         CASE c.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         c.position DESC,
         c.created_at DESC`,
    )
    .bind(boardId)
    .all<CardRow>();

  if (!cardResult.results.length) return [];
  const cardIds = cardResult.results.map((row) => row.id);
  const placeholders = cardIds.map(() => "?").join(", ");
  const assigneeResult = await db
    .prepare(
      `SELECT a.card_id, u.id, u.name, u.email
       FROM kanban_card_assignees AS a
       INNER JOIN users AS u ON u.id = a.user_id
       WHERE a.card_id IN (${placeholders})
       ORDER BY u.name COLLATE NOCASE, u.email COLLATE NOCASE`,
    )
    .bind(...cardIds)
    .all<AssigneeRow>();

  const assigneesByCard = new Map<string, KanbanPerson[]>();
  for (const row of assigneeResult.results) {
    const assignees = assigneesByCard.get(row.card_id) || [];
    assignees.push(person(row));
    assigneesByCard.set(row.card_id, assignees);
  }

  return cardResult.results.map((row) => ({
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    durationDays: row.duration_days,
    status: row.status,
    priority: row.priority,
    position: row.position,
    createdBy: nullablePerson(row.created_by, row.creator_name, row.creator_email),
    assignees: assigneesByCard.get(row.id) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listKanbanActivity(
  db: D1Database,
  boardId: string,
): Promise<KanbanActivity[]> {
  const result = await db
    .prepare(
      `SELECT
         activity.id, activity.card_id, activity.action, activity.summary, activity.details,
         activity.actor_user_id, actor.name AS actor_name, actor.email AS actor_email,
         activity.created_at
       FROM kanban_activity AS activity
       LEFT JOIN users AS actor ON actor.id = activity.actor_user_id
       WHERE activity.board_id = ?
       ORDER BY activity.created_at DESC, activity.rowid DESC
       LIMIT 100`,
    )
    .bind(boardId)
    .all<ActivityRow>();
  return result.results.map((row) => ({
    id: row.id,
    cardId: row.card_id,
    action: row.action,
    summary: row.summary,
    details: row.details,
    actor: nullablePerson(row.actor_user_id, row.actor_name, row.actor_email),
    createdAt: row.created_at,
  }));
}

export async function listKanbanCardActivity(
  db: D1Database,
  cardId: string,
): Promise<KanbanActivity[]> {
  const result = await db
    .prepare(
      `SELECT
         activity.id, activity.card_id, activity.action, activity.summary, activity.details,
         activity.actor_user_id, actor.name AS actor_name, actor.email AS actor_email,
         activity.created_at
       FROM kanban_activity AS activity
       LEFT JOIN users AS actor ON actor.id = activity.actor_user_id
       WHERE activity.card_id = ?
       ORDER BY activity.created_at DESC, activity.rowid DESC
       LIMIT 120`,
    )
    .bind(cardId)
    .all<ActivityRow>();
  return result.results.map((row) => ({
    id: row.id,
    cardId: row.card_id,
    action: row.action,
    summary: row.summary,
    details: row.details,
    actor: nullablePerson(row.actor_user_id, row.actor_name, row.actor_email),
    createdAt: row.created_at,
  }));
}

export async function listKanbanCardComments(
  db: D1Database,
  cardId: string,
): Promise<KanbanCardComment[]> {
  const result = await db
    .prepare(
      `SELECT
         comments.id, comments.card_id, comments.body, comments.author_user_id,
         author.name AS author_name, author.email AS author_email, comments.created_at
       FROM kanban_card_comments AS comments
       LEFT JOIN users AS author ON author.id = comments.author_user_id
       WHERE comments.card_id = ?
       ORDER BY comments.created_at DESC, comments.rowid DESC
       LIMIT 120`,
    )
    .bind(cardId)
    .all<CommentRow>();
  return result.results.map((row) => ({
    id: row.id,
    cardId: row.card_id,
    body: row.body,
    author: nullablePerson(row.author_user_id, row.author_name, row.author_email),
    createdAt: row.created_at,
  }));
}

export async function createKanbanCardComment(
  db: D1Database,
  values: {
    id: string;
    cardId: string;
    boardId: string;
    body: string;
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCardComment> {
  const [recipientIds, cardTitle] = await Promise.all([
    listKanbanNotificationRecipientIds(db, values.boardId, values.actor.id),
    getKanbanCardTitle(db, values.cardId, values.boardId),
  ]);
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO kanban_card_comments (id, card_id, author_user_id, body, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(values.id, values.cardId, values.actor.id, values.body, values.now),
    db.prepare("UPDATE kanban_cards SET updated_at = ? WHERE id = ?").bind(values.now, values.cardId),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
  ];
  appendKanbanNotifications(db, statements, {
    recipientIds,
    cardId: values.cardId,
    actorUserId: values.actor.id,
    message: `${values.actor.name} adicionou uma atualização no cartão “${cardTitle || "Cartão"}”.`,
    now: values.now,
  });
  await db.batch(statements);
  return {
    id: values.id,
    cardId: values.cardId,
    body: values.body,
    author: values.actor,
    createdAt: values.now,
  };
}

export async function listKanbanCardAttachments(
  db: D1Database,
  cardId: string,
): Promise<KanbanCardAttachment[]> {
  const records = await listKanbanCardAttachmentRecords(db, cardId);
  return records.map((record) => ({
    id: record.id,
    cardId: record.cardId,
    filename: record.filename,
    contentType: record.contentType,
    sizeBytes: record.sizeBytes,
    uploadedBy: record.uploadedBy,
    createdAt: record.createdAt,
  }));
}

export async function getKanbanCardAttachment(
  db: D1Database,
  cardId: string,
  attachmentId: string,
): Promise<KanbanCardAttachmentRecord | null> {
  const row = await db
    .prepare(
      `SELECT
         attachments.id, attachments.card_id, attachments.object_key, attachments.filename,
         attachments.content_type, attachments.size_bytes, attachments.uploaded_by,
         uploader.name AS uploader_name, uploader.email AS uploader_email, attachments.created_at
       FROM kanban_card_attachments AS attachments
       LEFT JOIN users AS uploader ON uploader.id = attachments.uploaded_by
       WHERE attachments.id = ? AND attachments.card_id = ?
       LIMIT 1`,
    )
    .bind(attachmentId, cardId)
    .first<AttachmentRow>();
  return row ? attachmentFromRow(row) : null;
}

export async function countKanbanCardAttachments(db: D1Database, cardId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM kanban_card_attachments WHERE card_id = ?")
    .bind(cardId)
    .first<{ count: number }>();
  return Number(row?.count || 0);
}

export async function createKanbanCardAttachments(
  db: D1Database,
  values: {
    cardId: string;
    boardId: string;
    attachments: Array<{
      id: string;
      objectKey: string;
      filename: string;
      contentType: string;
      sizeBytes: number;
    }>;
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCardAttachment[]> {
  const [recipientIds, cardTitle] = await Promise.all([
    listKanbanNotificationRecipientIds(db, values.boardId, values.actor.id),
    getKanbanCardTitle(db, values.cardId, values.boardId),
  ]);
  const statements: D1PreparedStatement[] = [];
  for (const attachment of values.attachments) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_card_attachments (
             id, card_id, uploaded_by, object_key, filename, content_type, size_bytes, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          attachment.id,
          values.cardId,
          values.actor.id,
          attachment.objectKey,
          attachment.filename,
          attachment.contentType,
          attachment.sizeBytes,
          values.now,
        ),
      activityStatement(db, {
        boardId: values.boardId,
        cardId: values.cardId,
        actorUserId: values.actor.id,
        action: "attachment_added",
        summary: `anexou o arquivo “${attachment.filename}”`,
        now: values.now,
      }),
    );
  }
  statements.push(
    db.prepare("UPDATE kanban_cards SET updated_at = ? WHERE id = ?").bind(values.now, values.cardId),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
  );
  appendKanbanNotifications(db, statements, {
    recipientIds,
    cardId: values.cardId,
    actorUserId: values.actor.id,
    message: `${values.actor.name} anexou ${values.attachments.length} ${values.attachments.length === 1 ? "arquivo" : "arquivos"} ao cartão “${cardTitle || "Cartão"}”.`,
    now: values.now,
  });
  await db.batch(statements);
  return listKanbanCardAttachments(db, values.cardId);
}

export async function deleteKanbanCardAttachment(
  db: D1Database,
  values: {
    cardId: string;
    boardId: string;
    attachmentId: string;
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCardAttachmentRecord | null> {
  const attachment = await getKanbanCardAttachment(db, values.cardId, values.attachmentId);
  if (!attachment) return null;
  const [recipientIds, cardTitle] = await Promise.all([
    listKanbanNotificationRecipientIds(db, values.boardId, values.actor.id),
    getKanbanCardTitle(db, values.cardId, values.boardId),
  ]);
  const statements: D1PreparedStatement[] = [
    db.prepare("DELETE FROM kanban_card_attachments WHERE id = ? AND card_id = ?").bind(values.attachmentId, values.cardId),
    activityStatement(db, {
      boardId: values.boardId,
      cardId: values.cardId,
      actorUserId: values.actor.id,
      action: "attachment_deleted",
      summary: `removeu o arquivo “${attachment.filename}”`,
      now: values.now,
    }),
    db.prepare("UPDATE kanban_cards SET updated_at = ? WHERE id = ?").bind(values.now, values.cardId),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
  ];
  appendKanbanNotifications(db, statements, {
    recipientIds,
    cardId: values.cardId,
    actorUserId: values.actor.id,
    message: `${values.actor.name} removeu um arquivo do cartão “${cardTitle || "Cartão"}”.`,
    now: values.now,
  });
  await db.batch(statements);
  return attachment;
}

export async function listKanbanAttachmentKeysForCard(db: D1Database, cardId: string): Promise<string[]> {
  const result = await db
    .prepare("SELECT object_key FROM kanban_card_attachments WHERE card_id = ?")
    .bind(cardId)
    .all<{ object_key: string }>();
  return result.results.map((row) => row.object_key);
}

export async function listKanbanAttachmentKeysForBoard(db: D1Database, boardId: string): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT attachments.object_key
       FROM kanban_card_attachments AS attachments
       INNER JOIN kanban_cards AS cards ON cards.id = attachments.card_id
       WHERE cards.board_id = ?`,
    )
    .bind(boardId)
    .all<{ object_key: string }>();
  return result.results.map((row) => row.object_key);
}

async function listKanbanCardAttachmentRecords(
  db: D1Database,
  cardId: string,
): Promise<KanbanCardAttachmentRecord[]> {
  const result = await db
    .prepare(
      `SELECT
         attachments.id, attachments.card_id, attachments.object_key, attachments.filename,
         attachments.content_type, attachments.size_bytes, attachments.uploaded_by,
         uploader.name AS uploader_name, uploader.email AS uploader_email, attachments.created_at
       FROM kanban_card_attachments AS attachments
       LEFT JOIN users AS uploader ON uploader.id = attachments.uploaded_by
       WHERE attachments.card_id = ?
       ORDER BY attachments.created_at DESC, attachments.rowid DESC`,
    )
    .bind(cardId)
    .all<AttachmentRow>();
  return result.results.map(attachmentFromRow);
}

function attachmentFromRow(row: AttachmentRow): KanbanCardAttachmentRecord {
  return {
    id: row.id,
    cardId: row.card_id,
    objectKey: row.object_key,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    uploadedBy: nullablePerson(row.uploaded_by, row.uploader_name, row.uploader_email),
    createdAt: row.created_at,
  };
}

export async function getKanbanCardAccess(
  db: D1Database,
  cardId: string,
  userId: string,
): Promise<KanbanCardAccess | null> {
  const row = await db
    .prepare(
      `SELECT
         c.board_id,
         CASE WHEN b.created_by = ? THEN 1 ELSE COALESCE(members.can_edit, 0) END AS can_edit,
         CASE WHEN b.created_by = ? THEN 1 ELSE 0 END AS is_owner
       FROM kanban_cards AS c
       INNER JOIN kanban_boards AS b ON b.id = c.board_id
       LEFT JOIN kanban_board_members AS members
         ON members.board_id = b.id AND members.user_id = ?
       WHERE c.id = ? AND (b.created_by = ? OR members.user_id IS NOT NULL)
       LIMIT 1`,
    )
    .bind(userId, userId, userId, cardId, userId)
    .first<{ board_id: string; can_edit: number; is_owner: number }>();
  return row
    ? { boardId: row.board_id, canEdit: Boolean(row.can_edit), isOwner: Boolean(row.is_owner) }
    : null;
}

export async function createKanbanCard(
  db: D1Database,
  values: {
    id: string;
    boardId: string;
    title: string;
    description: string;
    startDate: string;
    durationDays: number;
    status: KanbanStatus;
    priority: KanbanPriority;
    assigneeIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCard> {
  const notificationRecipientIds = await listKanbanNotificationRecipientIds(
    db,
    values.boardId,
    values.actor.id,
  );
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO kanban_cards (
           id, board_id, title, description, start_date, duration_days, status, priority, position, created_by, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        values.id,
        values.boardId,
        values.title,
        values.description,
        values.startDate,
        values.durationDays,
        values.status,
        values.priority,
        values.now,
        values.actor.id,
        values.now,
        values.now,
      ),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
    activityStatement(db, {
      boardId: values.boardId,
      cardId: values.id,
      actorUserId: values.actor.id,
      action: "card_created",
      summary: `criou o cartão “${values.title}” com início em ${formatKanbanDate(values.startDate)} e ${values.durationDays} ${values.durationDays === 1 ? "dia" : "dias"} de vigência`,
      details: values.description || null,
      now: values.now,
    }),
  ];

  for (const userId of values.assigneeIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_card_assignees (card_id, user_id, assigned_by, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(values.id, userId, values.actor.id, values.now),
    );
  }
  appendKanbanNotifications(db, statements, {
    recipientIds: notificationRecipientIds,
    cardId: values.id,
    actorUserId: values.actor.id,
    message: `${values.actor.name} criou o cartão “${values.title}”.`,
    now: values.now,
  });

  await db.batch(statements);
  const card = (await listKanbanCards(db, values.boardId)).find((item) => item.id === values.id);
  if (!card) throw new Error("O cartão criado não pôde ser recuperado.");
  return card;
}

export async function updateKanbanCard(
  db: D1Database,
  values: {
    id: string;
    boardId: string;
    title: string;
    description: string;
    startDate: string | null;
    durationDays: number | null;
    status: KanbanStatus;
    priority: KanbanPriority;
    assigneeIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCard | null> {
  const existing = await db
    .prepare("SELECT id, title, description, start_date, duration_days, status, priority, position FROM kanban_cards WHERE id = ? AND board_id = ? LIMIT 1")
    .bind(values.id, values.boardId)
    .first<{ id: string; title: string; description: string; start_date: string | null; duration_days: number | null; status: KanbanStatus; priority: KanbanPriority; position: number }>();
  if (!existing) return null;

  const [currentAssignees, notificationRecipientIds] = await Promise.all([
    db
      .prepare("SELECT user_id FROM kanban_card_assignees WHERE card_id = ?")
      .bind(values.id)
      .all<{ user_id: string }>(),
    listKanbanNotificationRecipientIds(db, values.boardId, values.actor.id),
  ]);
  const currentIds = new Set(currentAssignees.results.map((row) => row.user_id));
  const nextIds = new Set(values.assigneeIds);
  const newlyAssigned = values.assigneeIds.filter((userId) => !currentIds.has(userId));
  const removedAssignees = [...currentIds].filter((userId) => !nextIds.has(userId));
  const assigneesChanged = currentIds.size !== nextIds.size || [...currentIds].some((id) => !nextIds.has(id));
  const titleChanged = existing.title !== values.title;
  const descriptionChanged = existing.description !== values.description;
  const scheduleChanged = existing.start_date !== values.startDate || existing.duration_days !== values.durationDays;
  const priorityChanged = existing.priority !== values.priority;
  const contentChanged = titleChanged || descriptionChanged || scheduleChanged || priorityChanged || assigneesChanged;
  const statusChanged = existing.status !== values.status;
  const nextPosition = statusChanged ? values.now : existing.position;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE kanban_cards
         SET title = ?, description = ?, start_date = ?, duration_days = ?, status = ?, priority = ?, position = ?, updated_at = ?
         WHERE id = ? AND board_id = ?`,
      )
      .bind(
        values.title,
        values.description,
        values.startDate,
        values.durationDays,
        values.status,
        values.priority,
        nextPosition,
        values.now,
        values.id,
        values.boardId,
      ),
    db.prepare("DELETE FROM kanban_card_assignees WHERE card_id = ?").bind(values.id),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
  ];

  for (const userId of values.assigneeIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_card_assignees (card_id, user_id, assigned_by, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(values.id, userId, values.actor.id, values.now),
    );
  }
  if (contentChanged) {
    const changes: string[] = [];
    if (titleChanged) changes.push(`alterou o título de “${existing.title}” para “${values.title}”`);
    if (descriptionChanged) {
      if (!existing.description && values.description) changes.push(`adicionou uma descrição ao cartão “${values.title}”`);
      else if (existing.description && !values.description) changes.push(`removeu a descrição do cartão “${values.title}”`);
      else changes.push(`alterou a descrição do cartão “${values.title}”`);
    }
    if (scheduleChanged) {
      if (!values.startDate || !values.durationDays) {
        changes.push(`removeu o prazo do cartão “${values.title}”`);
      } else if (!existing.start_date || !existing.duration_days) {
        changes.push(`definiu o prazo do cartão “${values.title}”: início em ${formatKanbanDate(values.startDate)} e ${values.durationDays} ${values.durationDays === 1 ? "dia" : "dias"} de vigência`);
      } else {
        if (existing.start_date !== values.startDate) changes.push(`alterou a data de início do cartão “${values.title}” para ${formatKanbanDate(values.startDate)}`);
        if (existing.duration_days !== values.durationDays) changes.push(`alterou a vigência do cartão “${values.title}” para ${values.durationDays} ${values.durationDays === 1 ? "dia" : "dias"}`);
      }
    }
    if (priorityChanged) {
      changes.push(`alterou a prioridade do cartão “${values.title}” de ${priorityLabel(existing.priority)} para ${priorityLabel(values.priority)}`);
    }
    if (newlyAssigned.length) {
      changes.push(`adicionou ${newlyAssigned.length} ${newlyAssigned.length === 1 ? "responsável" : "responsáveis"} ao cartão “${values.title}”`);
    }
    if (removedAssignees.length) {
      changes.push(`removeu ${removedAssignees.length} ${removedAssignees.length === 1 ? "responsável" : "responsáveis"} do cartão “${values.title}”`);
    }
    statements.push(activityStatement(db, {
      boardId: values.boardId,
      cardId: values.id,
      actorUserId: values.actor.id,
      action: "card_updated",
      summary: changes.join("; "),
      details: descriptionChanged && values.description ? values.description : null,
      now: values.now,
    }));
  }
  if (statusChanged) {
    statements.push(activityStatement(db, {
      boardId: values.boardId,
      cardId: values.id,
      actorUserId: values.actor.id,
      action: "card_moved",
      summary: `moveu “${values.title}” de ${statusLabel(existing.status)} para ${statusLabel(values.status)}`,
      now: values.now,
    }));
  }
  if (contentChanged || statusChanged) {
    const action = contentChanged && statusChanged
      ? `atualizou e moveu o cartão “${values.title}” para ${statusLabel(values.status)}`
      : statusChanged
        ? `moveu o cartão “${values.title}” para ${statusLabel(values.status)}`
        : `atualizou o cartão “${values.title}”`;
    appendKanbanNotifications(db, statements, {
      recipientIds: notificationRecipientIds,
      cardId: values.id,
      actorUserId: values.actor.id,
      message: `${values.actor.name} ${action}.`,
      now: values.now,
    });
  }

  await db.batch(statements);
  return (await listKanbanCards(db, values.boardId)).find((item) => item.id === values.id) || null;
}

export async function deleteKanbanCard(
  db: D1Database,
  values: { cardId: string; boardId: string; actor: KanbanPerson; now: number },
): Promise<boolean> {
  const existing = await db
    .prepare("SELECT title FROM kanban_cards WHERE id = ? AND board_id = ? LIMIT 1")
    .bind(values.cardId, values.boardId)
    .first<{ title: string }>();
  if (!existing) return false;
  await db.batch([
    activityStatement(db, {
      boardId: values.boardId,
      cardId: values.cardId,
      actorUserId: values.actor.id,
      action: "card_deleted",
      summary: `excluiu o cartão “${existing.title}”`,
      now: values.now,
    }),
    db.prepare("DELETE FROM kanban_cards WHERE id = ? AND board_id = ?").bind(values.cardId, values.boardId),
    db.prepare("UPDATE kanban_boards SET updated_at = ? WHERE id = ?").bind(values.now, values.boardId),
  ]);
  return true;
}

export async function listKanbanNotifications(
  db: D1Database,
  userId: string,
  includeAll = false,
): Promise<{ notifications: KanbanNotification[]; unreadCount: number; totalCount: number }> {
  const accessSql = `(b.created_by = ? OR EXISTS (
    SELECT 1 FROM kanban_board_members AS access
    WHERE access.board_id = b.id AND access.user_id = ?
  ))`;
  const limitSql = includeAll ? "" : "LIMIT 40";
  const [notifications, unread, total] = await Promise.all([
    db
      .prepare(
        `SELECT n.id, c.board_id, n.card_id, n.message, n.read_at, n.created_at
         FROM kanban_notifications AS n
         INNER JOIN kanban_cards AS c ON c.id = n.card_id
         INNER JOIN kanban_boards AS b ON b.id = c.board_id
         WHERE n.user_id = ? AND ${accessSql}
         ORDER BY n.created_at DESC
         ${limitSql}`,
      )
      .bind(userId, userId, userId)
      .all<NotificationRow>(),
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM kanban_notifications AS n
         INNER JOIN kanban_cards AS c ON c.id = n.card_id
         INNER JOIN kanban_boards AS b ON b.id = c.board_id
         WHERE n.user_id = ? AND n.read_at IS NULL AND ${accessSql}`,
      )
      .bind(userId, userId, userId)
      .first<{ count: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM kanban_notifications AS n
         INNER JOIN kanban_cards AS c ON c.id = n.card_id
         INNER JOIN kanban_boards AS b ON b.id = c.board_id
         WHERE n.user_id = ? AND ${accessSql}`,
      )
      .bind(userId, userId, userId)
      .first<{ count: number }>(),
  ]);

  return {
    notifications: notifications.results.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      cardId: row.card_id,
      message: row.message,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unreadCount: Number(unread?.count || 0),
    totalCount: Number(total?.count || 0),
  };
}

export async function markKanbanNotificationRead(
  db: D1Database,
  userId: string,
  notificationId: string,
  now: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE kanban_notifications
       SET read_at = COALESCE(read_at, ?)
       WHERE id = ? AND user_id = ?`,
    )
    .bind(now, notificationId, userId)
    .run();
  return result.meta.changes > 0;
}

export async function markAllKanbanNotificationsRead(
  db: D1Database,
  userId: string,
  now: number,
): Promise<void> {
  await db
    .prepare(
      `UPDATE kanban_notifications
       SET read_at = ?
       WHERE user_id = ? AND read_at IS NULL`,
    )
    .bind(now, userId)
    .run();
}

function statusLabel(status: KanbanStatus): string {
  if (status === "doing") return "Em andamento";
  if (status === "done") return "Concluído";
  return "A fazer";
}

function priorityLabel(priority: KanbanPriority): string {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Média";
}

function formatKanbanDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function activityStatement(
  db: D1Database,
  values: {
    boardId: string;
    cardId?: string;
    actorUserId: string;
    action: string;
    summary: string;
    details?: string | null;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO kanban_activity (
         id, board_id, card_id, actor_user_id, action, summary, details, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      values.boardId,
      values.cardId || null,
      values.actorUserId,
      values.action,
      values.summary,
      values.details || null,
      values.now,
    );
}

function notificationStatement(
  db: D1Database,
  values: {
    userId: string;
    cardId: string;
    actorUserId: string;
    message: string;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO kanban_notifications (
         id, user_id, card_id, actor_user_id, message, created_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      values.userId,
      values.cardId,
      values.actorUserId,
      values.message,
      values.now,
    );
}

async function listKanbanNotificationRecipientIds(
  db: D1Database,
  boardId: string,
  actorUserId: string,
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT user_id
       FROM kanban_board_members
       WHERE board_id = ? AND user_id <> ?`,
    )
    .bind(boardId, actorUserId)
    .all<{ user_id: string }>();
  return result.results.map((row) => row.user_id);
}

async function getKanbanCardTitle(
  db: D1Database,
  cardId: string,
  boardId: string,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT title FROM kanban_cards WHERE id = ? AND board_id = ? LIMIT 1")
    .bind(cardId, boardId)
    .first<{ title: string }>();
  return row?.title || null;
}

function appendKanbanNotifications(
  db: D1Database,
  statements: D1PreparedStatement[],
  values: {
    recipientIds: string[];
    cardId: string;
    actorUserId: string;
    message: string;
    now: number;
  },
): void {
  for (const userId of values.recipientIds) {
    statements.push(notificationStatement(db, {
      userId,
      cardId: values.cardId,
      actorUserId: values.actorUserId,
      message: values.message,
      now: values.now,
    }));
  }
}
