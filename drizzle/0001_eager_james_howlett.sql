CREATE TABLE `consumer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`brand_id` text NOT NULL,
	`product_id` text,
	`scope` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`published_at` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`moderation_note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_author_scope` ON `consumer_reviews` (`user_id`,`brand_id`,`scope`);--> statement-breakpoint
CREATE TABLE `trust_profiles` (
	`brand_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trust_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`data` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
