export type KanbanStatus = "todo" | "doing" | "done";

export type KanbanPerson = {
  id: string;
  name: string;
  email: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  position: number;
  createdBy: KanbanPerson | null;
  assignees: KanbanPerson[];
  createdAt: number;
  updatedAt: number;
};

export type KanbanNotification = {
  id: string;
  cardId: string;
  message: string;
  readAt: number | null;
  createdAt: number;
};

type CardRow = {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  position: number;
  created_by: string | null;
  creator_name: string | null;
  creator_email: string | null;
  created_at: number;
  updated_at: number;
};

type PersonRow = {
  id: string;
  name: string;
  email: string;
};

type AssigneeRow = PersonRow & {
  card_id: string;
};

type NotificationRow = {
  id: string;
  card_id: string;
  message: string;
  read_at: number | null;
  created_at: number;
};

function person(row: PersonRow): KanbanPerson {
  return { id: row.id, name: row.name, email: row.email };
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

export async function listKanbanCards(db: D1Database): Promise<KanbanCard[]> {
  const cardResult = await db
    .prepare(
      `SELECT
         c.id, c.title, c.description, c.status, c.position,
         c.created_by, creator.name AS creator_name, creator.email AS creator_email,
         c.created_at, c.updated_at
       FROM kanban_cards AS c
       LEFT JOIN users AS creator ON creator.id = c.created_by
       ORDER BY
         CASE c.status WHEN 'todo' THEN 0 WHEN 'doing' THEN 1 ELSE 2 END,
         c.position DESC,
         c.created_at DESC`,
    )
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
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    createdBy: row.created_by && row.creator_name && row.creator_email
      ? { id: row.created_by, name: row.creator_name, email: row.creator_email }
      : null,
    assignees: assigneesByCard.get(row.id) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createKanbanCard(
  db: D1Database,
  values: {
    id: string;
    title: string;
    description: string;
    status: KanbanStatus;
    assigneeIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCard> {
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO kanban_cards (
           id, title, description, status, position, created_by, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        values.id,
        values.title,
        values.description,
        values.status,
        values.now,
        values.actor.id,
        values.now,
        values.now,
      ),
  ];

  for (const userId of values.assigneeIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO kanban_card_assignees (card_id, user_id, assigned_by, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(values.id, userId, values.actor.id, values.now),
      notificationStatement(db, {
        userId,
        cardId: values.id,
        actorUserId: values.actor.id,
        actorName: values.actor.name,
        cardTitle: values.title,
        now: values.now,
      }),
    );
  }

  await db.batch(statements);
  const card = (await listKanbanCards(db)).find((item) => item.id === values.id);
  if (!card) throw new Error("O cartão criado não pôde ser recuperado.");
  return card;
}

export async function updateKanbanCard(
  db: D1Database,
  values: {
    id: string;
    title: string;
    description: string;
    status: KanbanStatus;
    assigneeIds: string[];
    actor: KanbanPerson;
    now: number;
  },
): Promise<KanbanCard | null> {
  const existing = await db
    .prepare("SELECT id, status, position FROM kanban_cards WHERE id = ? LIMIT 1")
    .bind(values.id)
    .first<{ id: string; status: KanbanStatus; position: number }>();
  if (!existing) return null;

  const currentAssignees = await db
    .prepare("SELECT user_id FROM kanban_card_assignees WHERE card_id = ?")
    .bind(values.id)
    .all<{ user_id: string }>();
  const currentIds = new Set(currentAssignees.results.map((row) => row.user_id));
  const newlyAssigned = values.assigneeIds.filter((userId) => !currentIds.has(userId));
  const nextPosition = existing.status === values.status ? existing.position : values.now;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE kanban_cards
         SET title = ?, description = ?, status = ?, position = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        values.title,
        values.description,
        values.status,
        nextPosition,
        values.now,
        values.id,
      ),
    db.prepare("DELETE FROM kanban_card_assignees WHERE card_id = ?").bind(values.id),
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
  for (const userId of newlyAssigned) {
    statements.push(notificationStatement(db, {
      userId,
      cardId: values.id,
      actorUserId: values.actor.id,
      actorName: values.actor.name,
      cardTitle: values.title,
      now: values.now,
    }));
  }

  await db.batch(statements);
  return (await listKanbanCards(db)).find((item) => item.id === values.id) || null;
}

export async function deleteKanbanCard(db: D1Database, cardId: string): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM kanban_cards WHERE id = ?")
    .bind(cardId)
    .run();
  return result.meta.changes > 0;
}

export async function listKanbanNotifications(
  db: D1Database,
  userId: string,
): Promise<{ notifications: KanbanNotification[]; unreadCount: number }> {
  const [notifications, unread] = await Promise.all([
    db
      .prepare(
        `SELECT id, card_id, message, read_at, created_at
         FROM kanban_notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 40`,
      )
      .bind(userId)
      .all<NotificationRow>(),
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM kanban_notifications
         WHERE user_id = ? AND read_at IS NULL`,
      )
      .bind(userId)
      .first<{ count: number }>(),
  ]);

  return {
    notifications: notifications.results.map((row) => ({
      id: row.id,
      cardId: row.card_id,
      message: row.message,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unreadCount: Number(unread?.count || 0),
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

function notificationStatement(
  db: D1Database,
  values: {
    userId: string;
    cardId: string;
    actorUserId: string;
    actorName: string;
    cardTitle: string;
    now: number;
  },
): D1PreparedStatement {
  const message = `${values.actorName} marcou você no cartão “${values.cardTitle}”.`;
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
      message,
      values.now,
    );
}
