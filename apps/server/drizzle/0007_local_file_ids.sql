CREATE TABLE `velo_files_local_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `velo_files_local_entries_path_unique` ON `velo_files_local_entries` (`path`);