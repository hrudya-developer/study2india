CREATE TABLE `offering_counselling_branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offering_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`seats` int,
	`source_id` int,
	CONSTRAINT `offering_counselling_branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `offering_counselling_branches_unique` UNIQUE(`offering_id`,`name`)
);
--> statement-breakpoint
ALTER TABLE `institution_identifiers` MODIFY COLUMN `value` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `offerings` ADD `counselling_seats` int;--> statement-breakpoint
ALTER TABLE `offerings` ADD `counselling_seats_source_id` int;--> statement-breakpoint
ALTER TABLE `offering_counselling_branches` ADD CONSTRAINT `offering_counselling_branches_offering_id_offerings_id_fk` FOREIGN KEY (`offering_id`) REFERENCES `offerings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offering_counselling_branches` ADD CONSTRAINT `offering_counselling_branches_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_counselling_seats_source_id_sources_id_fk` FOREIGN KEY (`counselling_seats_source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;