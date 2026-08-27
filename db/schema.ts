import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("idx_users_email").on(table.email)],
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
