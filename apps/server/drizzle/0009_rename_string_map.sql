ALTER TABLE `velo_string_mappings` RENAME TO `velo_string_map`;--> statement-breakpoint
DROP INDEX `velo_string_mappings_namespace_value_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `velo_string_map_namespace_value_unique` ON `velo_string_map` (`namespace`,`value`);