PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tabs` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`icon` text DEFAULT '' NOT NULL,
	`order` integer NOT NULL,
	`min_role` text DEFAULT 'user' NOT NULL,
	`open_in_iframe` integer DEFAULT true NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tabs`("id", "slug", "label", "url", "icon", "order", "min_role", "open_in_iframe", "enabled") SELECT "id", "slug", "label", "url", "icon", "order", "min_role", "open_in_iframe", "enabled" FROM `tabs`;--> statement-breakpoint
DROP TABLE `tabs`;--> statement-breakpoint
ALTER TABLE `__new_tabs` RENAME TO `tabs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tabs_slug_unique` ON `tabs` (`slug`);