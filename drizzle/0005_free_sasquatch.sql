CREATE TABLE `kanban_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`card_id` text,
	`actor_user_id` text,
	`action` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `kanban_boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `kanban_cards`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_activity_board_created` ON `kanban_activity` (`board_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_kanban_activity_card_created` ON `kanban_activity` (`card_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `kanban_board_members` (
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`added_by` text,
	`can_edit` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`board_id`, `user_id`),
	FOREIGN KEY (`board_id`) REFERENCES `kanban_boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_board_members_user_board` ON `kanban_board_members` (`user_id`,`board_id`);--> statement-breakpoint
CREATE TABLE `kanban_boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_kanban_boards_creator_updated` ON `kanban_boards` (`created_by`,`updated_at`);--> statement-breakpoint
ALTER TABLE `kanban_cards` ADD `board_id` text REFERENCES kanban_boards(id);--> statement-breakpoint
INSERT INTO `kanban_boards` (`id`, `name`, `description`, `created_by`, `created_at`, `updated_at`)
SELECT
	'00000000-0000-4000-8000-000000000005',
	'Quadro existente',
	'Atividades criadas antes da organização por quadros privados.',
	COALESCE(
		(SELECT `created_by` FROM `kanban_cards` WHERE `created_by` IS NOT NULL ORDER BY `created_at` LIMIT 1),
		(SELECT `id` FROM `users` WHERE `status` = 'approved' ORDER BY `is_admin` DESC, `created_at` LIMIT 1)
	),
	COALESCE(MIN(`created_at`), CAST(strftime('%s', 'now') AS integer)),
	COALESCE(MAX(`updated_at`), CAST(strftime('%s', 'now') AS integer))
FROM `kanban_cards`
HAVING COUNT(*) > 0;--> statement-breakpoint
UPDATE `kanban_cards`
SET `board_id` = '00000000-0000-4000-8000-000000000005'
WHERE `board_id` IS NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `kanban_board_members` (`board_id`, `user_id`, `added_by`, `can_edit`, `created_at`)
SELECT
	'00000000-0000-4000-8000-000000000005',
	participants.`user_id`,
	(SELECT `created_by` FROM `kanban_boards` WHERE `id` = '00000000-0000-4000-8000-000000000005'),
	1,
	CAST(strftime('%s', 'now') AS integer)
FROM (
	SELECT `created_by` AS `user_id` FROM `kanban_cards` WHERE `created_by` IS NOT NULL
	UNION
	SELECT `user_id` FROM `kanban_card_assignees`
	UNION
	SELECT `created_by` AS `user_id` FROM `kanban_boards`
	WHERE `id` = '00000000-0000-4000-8000-000000000005' AND `created_by` IS NOT NULL
) AS participants;--> statement-breakpoint
INSERT INTO `kanban_activity` (`id`, `board_id`, `card_id`, `actor_user_id`, `action`, `summary`, `created_at`)
SELECT
	'00000000-0000-4000-8000-000000000006',
	`id`,
	NULL,
	`created_by`,
	'board_created',
	'organizou as atividades existentes neste quadro privado',
	CAST(strftime('%s', 'now') AS integer)
FROM `kanban_boards`
WHERE `id` = '00000000-0000-4000-8000-000000000005';--> statement-breakpoint
CREATE INDEX `idx_kanban_cards_board_status_position` ON `kanban_cards` (`board_id`,`status`,`position`);
