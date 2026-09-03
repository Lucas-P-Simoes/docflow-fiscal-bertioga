CREATE TABLE `kanban_card_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`uploaded_by` text,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `kanban_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_card_attachments_card_created` ON `kanban_card_attachments` (`card_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_kanban_card_attachments_object_key` ON `kanban_card_attachments` (`object_key`);--> statement-breakpoint
CREATE TABLE `kanban_card_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`author_user_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `kanban_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_card_comments_card_created` ON `kanban_card_comments` (`card_id`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
