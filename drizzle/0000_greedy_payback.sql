CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`config` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stats_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`media_type` text NOT NULL,
	`sonarr_id` integer,
	`radarr_id` integer,
	`title` text NOT NULL,
	`poster_url` text,
	`notify_email` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tabs` (
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
CREATE UNIQUE INDEX `tabs_slug_unique` ON `tabs` (`slug`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`plex_token` text,
	`jellyfin_user_id` text,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);