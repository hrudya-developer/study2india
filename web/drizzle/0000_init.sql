CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(200) NOT NULL,
	`short_name` varchar(60) NOT NULL,
	`stream_id` int NOT NULL,
	`level` enum('ug','pg','diploma','doctorate','certificate','integrated') NOT NULL,
	`duration_text` varchar(120),
	`eligibility_text` text,
	`sort_order` int NOT NULL DEFAULT 100,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cutoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offering_id` int NOT NULL,
	`exam_id` int NOT NULL,
	`year` int NOT NULL,
	`round` varchar(40),
	`quota` varchar(60),
	`category` varchar(40),
	`opening_rank` int,
	`closing_rank` int,
	`source_id` int NOT NULL,
	CONSTRAINT `cutoffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`cycle` varchar(20) NOT NULL,
	`event` varchar(160) NOT NULL,
	`starts_on` date,
	`ends_on` date,
	`status` enum('announced','tentative','not_announced') NOT NULL DEFAULT 'not_announced',
	`source_id` int,
	CONSTRAINT `exam_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_streams` (
	`exam_id` int NOT NULL,
	`stream_id` int NOT NULL,
	CONSTRAINT `exam_streams_exam_id_stream_id_pk` PRIMARY KEY(`exam_id`,`stream_id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(200) NOT NULL,
	`short_name` varchar(40) NOT NULL,
	`conducting_body` varchar(200) NOT NULL,
	`level` varchar(20) NOT NULL,
	`official_url` varchar(255),
	`sort_order` int NOT NULL DEFAULT 100,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`),
	CONSTRAINT `exams_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `institution_identifiers` (
	`institution_id` int NOT NULL,
	`scheme` varchar(20) NOT NULL,
	`value` varchar(60) NOT NULL,
	CONSTRAINT `institution_identifiers_scheme_value_pk` PRIMARY KEY(`scheme`,`value`)
);
--> statement-breakpoint
CREATE TABLE `institution_streams` (
	`institution_id` int NOT NULL,
	`stream_id` int NOT NULL,
	CONSTRAINT `institution_streams_institution_id_stream_id_pk` PRIMARY KEY(`institution_id`,`stream_id`)
);
--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(255) NOT NULL,
	`aliases` json,
	`ownership` enum('government','private','deemed','central','state_university','autonomous','public_private'),
	`established_year` int,
	`affiliating_university` varchar(255),
	`address` text,
	`city` varchar(120),
	`district` varchar(120),
	`state_code` varchar(4),
	`pin` varchar(6),
	`website` varchar(255),
	`phone` varchar(60),
	`email` varchar(160),
	`approvals` json,
	`naac_grade` varchar(8),
	`is_partner` boolean NOT NULL DEFAULT false,
	`status` enum('draft','needs_review','verified','published') NOT NULL DEFAULT 'draft',
	`source_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `institutions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`phone` varchar(15) NOT NULL,
	`phone_verified` boolean NOT NULL DEFAULT false,
	`course_interest` varchar(80),
	`home_state` varchar(60),
	`exam_rank` varchar(40),
	`source_path` varchar(255),
	`consent_text` text NOT NULL,
	`stage` varchar(20) NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offering_fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offering_id` int NOT NULL,
	`quota` varchar(60),
	`component` varchar(40) NOT NULL DEFAULT 'tuition',
	`amount_inr` decimal(12,0),
	`basis` enum('per_year','whole_course','per_semester','one_time'),
	`source_id` int,
	CONSTRAINT `offering_fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institution_id` int NOT NULL,
	`course_id` int NOT NULL,
	`academic_year` varchar(9),
	`seats` int,
	`seats_source_id` int,
	CONSTRAINT `offerings_id` PRIMARY KEY(`id`),
	CONSTRAINT `offerings_unique` UNIQUE(`institution_id`,`course_id`,`academic_year`)
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institution_id` int NOT NULL,
	`agency` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`category` varchar(60) NOT NULL,
	`rank` int,
	`rank_band` varchar(20),
	`score` decimal(6,2),
	`source_id` int NOT NULL,
	CONSTRAINT `rankings_id` PRIMARY KEY(`id`),
	CONSTRAINT `rankings_unique` UNIQUE(`institution_id`,`agency`,`year`,`category`)
);
--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_type` varchar(40),
	`eligibility_text` text,
	`amount_text` varchar(255),
	`deadline` date,
	`official_url` varchar(255),
	`source_id` int,
	`status` enum('draft','needs_review','verified','published') NOT NULL DEFAULT 'draft',
	CONSTRAINT `scholarships_id` PRIMARY KEY(`id`),
	CONSTRAINT `scholarships_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publisher` varchar(255) NOT NULL,
	`title` varchar(255),
	`url` text,
	`retrieved_on` date NOT NULL,
	`checked_by` varchar(120),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `states` (
	`code` varchar(4) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(80) NOT NULL,
	`is_union_territory` boolean NOT NULL DEFAULT false,
	CONSTRAINT `states_code` PRIMARY KEY(`code`),
	CONSTRAINT `states_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`summary` varchar(255),
	`sort_order` int NOT NULL DEFAULT 100,
	CONSTRAINT `streams_id` PRIMARY KEY(`id`),
	CONSTRAINT `streams_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_stream_id_streams_id_fk` FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cutoffs` ADD CONSTRAINT `cutoffs_offering_id_offerings_id_fk` FOREIGN KEY (`offering_id`) REFERENCES `offerings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cutoffs` ADD CONSTRAINT `cutoffs_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cutoffs` ADD CONSTRAINT `cutoffs_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_dates` ADD CONSTRAINT `exam_dates_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_dates` ADD CONSTRAINT `exam_dates_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_streams` ADD CONSTRAINT `exam_streams_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_streams` ADD CONSTRAINT `exam_streams_stream_id_streams_id_fk` FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institution_identifiers` ADD CONSTRAINT `institution_identifiers_institution_id_institutions_id_fk` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institution_streams` ADD CONSTRAINT `institution_streams_institution_id_institutions_id_fk` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institution_streams` ADD CONSTRAINT `institution_streams_stream_id_streams_id_fk` FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institutions` ADD CONSTRAINT `institutions_state_code_states_code_fk` FOREIGN KEY (`state_code`) REFERENCES `states`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institutions` ADD CONSTRAINT `institutions_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offering_fees` ADD CONSTRAINT `offering_fees_offering_id_offerings_id_fk` FOREIGN KEY (`offering_id`) REFERENCES `offerings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offering_fees` ADD CONSTRAINT `offering_fees_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_institution_id_institutions_id_fk` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offerings` ADD CONSTRAINT `offerings_seats_source_id_sources_id_fk` FOREIGN KEY (`seats_source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rankings` ADD CONSTRAINT `rankings_institution_id_institutions_id_fk` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rankings` ADD CONSTRAINT `rankings_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `courses_stream_idx` ON `courses` (`stream_id`);--> statement-breakpoint
CREATE INDEX `cutoffs_offering_idx` ON `cutoffs` (`offering_id`);--> statement-breakpoint
CREATE INDEX `identifiers_institution_idx` ON `institution_identifiers` (`institution_id`);--> statement-breakpoint
CREATE INDEX `institution_streams_stream_idx` ON `institution_streams` (`stream_id`);--> statement-breakpoint
CREATE INDEX `institutions_state_idx` ON `institutions` (`state_code`);--> statement-breakpoint
CREATE INDEX `institutions_status_idx` ON `institutions` (`status`);--> statement-breakpoint
CREATE INDEX `institutions_name_idx` ON `institutions` (`name`);--> statement-breakpoint
CREATE INDEX `rankings_lookup_idx` ON `rankings` (`agency`,`year`,`category`,`rank`);