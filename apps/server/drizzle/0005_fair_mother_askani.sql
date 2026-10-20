CREATE TABLE `velo_uploaded_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`storage_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploader_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `velo_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `velo_uploaded_files_storage_key_unique` ON `velo_uploaded_files` (`storage_key`);--> statement-breakpoint
CREATE INDEX `velo_uploaded_files_uploader_created_at_idx` ON `velo_uploaded_files` (`uploader_id`,`created_at`);