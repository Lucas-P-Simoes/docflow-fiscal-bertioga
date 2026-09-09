import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("approved"),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    lastLoginAt: integer("last_login_at"),
    reviewedAt: integer("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_users_email").on(table.email),
    index("idx_users_status_created").on(table.status, table.createdAt),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ],
);

export const openaiCredentials = sqliteTable("openai_credentials", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  encryptedKey: text("encrypted_key").notNull(),
  iv: text("iv").notNull(),
  model: text("model").notNull(),
  lastFour: text("last_four").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const loginAttempts = sqliteTable("login_attempts", {
  attemptKey: text("attempt_key").primaryKey(),
  failureCount: integer("failure_count").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  blockedUntil: integer("blocked_until").notNull(),
});

export const generatedDocuments = sqliteTable(
  "generated_documents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    filename: text("filename").notNull(),
    documentType: text("document_type").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_generated_documents_object_key").on(table.objectKey),
    index("idx_generated_documents_user_created").on(table.userId, table.createdAt),
  ],
);

export const signatureProfiles = sqliteTable(
  "signature_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_signature_profiles_user_name").on(table.userId, table.name),
  ],
);

export const kanbanBoards = sqliteTable(
  "kanban_boards",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_kanban_boards_creator_updated").on(table.createdBy, table.updatedAt),
  ],
);

export const kanbanBoardMembers = sqliteTable(
  "kanban_board_members",
  {
    boardId: text("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedBy: text("added_by").references(() => users.id, { onDelete: "set null" }),
    canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.boardId, table.userId] }),
    index("idx_kanban_board_members_user_board").on(table.userId, table.boardId),
  ],
);

export const kanbanCards = sqliteTable(
  "kanban_cards",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startDate: text("start_date"),
    durationDays: integer("duration_days"),
    status: text("status", { enum: ["todo", "doing", "done"] }).notNull().default("todo"),
    position: integer("position").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_kanban_cards_board_status_position").on(table.boardId, table.status, table.position),
    index("idx_kanban_cards_status_position").on(table.status, table.position),
    index("idx_kanban_cards_updated_at").on(table.updatedAt),
  ],
);

export const kanbanActivity = sqliteTable(
  "kanban_activity",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    cardId: text("card_id").references(() => kanbanCards.id, { onDelete: "set null" }),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    details: text("details"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_kanban_activity_board_created").on(table.boardId, table.createdAt),
    index("idx_kanban_activity_card_created").on(table.cardId, table.createdAt),
  ],
);

export const kanbanCardAssignees = sqliteTable(
  "kanban_card_assignees",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => kanbanCards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.userId] }),
    index("idx_kanban_assignees_user_card").on(table.userId, table.cardId),
  ],
);

export const kanbanNotifications = sqliteTable(
  "kanban_notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => kanbanCards.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    message: text("message").notNull(),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_kanban_notifications_user_read_created").on(table.userId, table.readAt, table.createdAt),
    index("idx_kanban_notifications_card").on(table.cardId),
  ],
);

export const kanbanCardComments = sqliteTable(
  "kanban_card_comments",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => kanbanCards.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_kanban_card_comments_card_created").on(table.cardId, table.createdAt),
  ],
);

export const kanbanCardAttachments = sqliteTable(
  "kanban_card_attachments",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => kanbanCards.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    objectKey: text("object_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_kanban_card_attachments_card_created").on(table.cardId, table.createdAt),
    uniqueIndex("idx_kanban_card_attachments_object_key").on(table.objectKey),
  ],
);
