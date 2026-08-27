ALTER TABLE `users` ADD `status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `reviewed_by` text;--> statement-breakpoint
CREATE INDEX `idx_users_status_created` ON `users` (`status`,`created_at`);--> statement-breakpoint
UPDATE `users`
SET `is_admin` = 1, `status` = 'approved'
WHERE lower(`email`) = 'lucaspsimoes22@gmail.com';--> statement-breakpoint
UPDATE `users`
SET `last_login_at` = (
  SELECT MAX(`sessions`.`created_at`)
  FROM `sessions`
  WHERE `sessions`.`user_id` = `users`.`id`
)
WHERE EXISTS (
  SELECT 1
  FROM `sessions`
  WHERE `sessions`.`user_id` = `users`.`id`
);--> statement-breakpoint
PRAGMA optimize;
