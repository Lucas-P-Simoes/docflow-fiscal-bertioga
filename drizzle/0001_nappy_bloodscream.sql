CREATE TABLE `generated_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`document_type` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_generated_documents_object_key` ON `generated_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_generated_documents_user_created` ON `generated_documents` (`user_id`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
