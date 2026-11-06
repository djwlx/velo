CREATE TABLE `velo_statistics_daily` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric` text NOT NULL,
	`date` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `velo_statistics_daily_metric_date_unique` ON `velo_statistics_daily` (`metric`,`date`);