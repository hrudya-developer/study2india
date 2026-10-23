CREATE TABLE `slug_redirects` (
	`old_slug` varchar(120) NOT NULL,
	`institution_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slug_redirects_old_slug` PRIMARY KEY(`old_slug`)
);
--> statement-breakpoint
ALTER TABLE `slug_redirects` ADD CONSTRAINT `slug_redirects_institution_id_institutions_id_fk` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `slug_redirects_institution_idx` ON `slug_redirects` (`institution_id`);