ALTER TABLE `velo_files_115` ADD `name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `velo_files_115` ADD `size_bytes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `velo_files_115` ADD `cached_at` integer;--> statement-breakpoint
CREATE INDEX `velo_files_115_class_id_idx` ON `velo_files_115` (`class`,`id`);