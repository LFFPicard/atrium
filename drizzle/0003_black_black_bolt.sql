CREATE TABLE `uptime_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`service_name` text NOT NULL,
	`service_type` text NOT NULL,
	`module_slug` text,
	`url` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`interval_minutes` integer DEFAULT 15 NOT NULL,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_status` text DEFAULT 'unknown' NOT NULL,
	`last_checked_at` integer,
	`last_notified_at` integer,
	`notify_email` integer DEFAULT false NOT NULL,
	`notify_webhook` integer DEFAULT false NOT NULL,
	`public` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `uptime_events` (
	`id` text PRIMARY KEY NOT NULL,
	`check_id` text NOT NULL,
	`status` text NOT NULL,
	`response_ms` integer,
	`checked_at` integer NOT NULL,
	FOREIGN KEY (`check_id`) REFERENCES `uptime_checks`(`id`) ON UPDATE no action ON DELETE no action
);
