CREATE TABLE `velo_string_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`namespace` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `velo_string_mappings_namespace_value_unique` ON `velo_string_mappings` (`namespace`,`value`);