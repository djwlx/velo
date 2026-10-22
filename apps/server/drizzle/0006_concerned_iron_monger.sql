ALTER TABLE `velo_uploaded_files` RENAME TO `velo_files_local`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_velo_files_local` (
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
INSERT INTO `__new_velo_files_local`("id", "storage_key", "original_name", "content_type", "size_bytes", "uploader_id", "created_at") SELECT "id", "storage_key", "original_name", "content_type", "size_bytes", "uploader_id", "created_at" FROM `velo_files_local`;--> statement-breakpoint
DROP TABLE `velo_files_local`;--> statement-breakpoint
ALTER TABLE `__new_velo_files_local` RENAME TO `velo_files_local`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `velo_files_local_storage_key_unique` ON `velo_files_local` (`storage_key`);--> statement-breakpoint
CREATE INDEX `velo_files_local_uploader_created_at_idx` ON `velo_files_local` (`uploader_id`,`created_at`);