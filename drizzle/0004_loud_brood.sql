CREATE TABLE `kanban_card_assignees` (
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_by` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`card_id`, `user_id`),
	FOREIGN KEY (`card_id`) REFERENCES `kanban_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_assignees_user_card` ON `kanban_card_assignees` (`user_id`,`card_id`);--> statement-breakpoint
CREATE TABLE `kanban_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`position` integer NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_cards_status_position` ON `kanban_cards` (`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_kanban_cards_updated_at` ON `kanban_cards` (`updated_at`);--> statement-breakpoint
CREATE TABLE `kanban_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`actor_user_id` text,
	`message` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `kanban_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_notifications_user_read_created` ON `kanban_notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_kanban_notifications_card` ON `kanban_notifications` (`card_id`);--> statement-breakpoint
PRAGMA optimize;
