ALTER TABLE `cutoffs` MODIFY COLUMN `quota` varchar(100);--> statement-breakpoint
ALTER TABLE `cutoffs` ADD `branch` varchar(200);--> statement-breakpoint
ALTER TABLE `cutoffs` ADD `seat_pool` varchar(60);--> statement-breakpoint
ALTER TABLE `cutoffs` ADD `row_key` char(64) GENERATED ALWAYS AS (sha2(concat_ws('|', offering_id, exam_id, year, ifnull(round, ''), ifnull(quota, ''), ifnull(category, ''), ifnull(branch, ''), ifnull(seat_pool, '')), 256)) STORED;--> statement-breakpoint
ALTER TABLE `cutoffs` ADD CONSTRAINT `cutoffs_row_key` UNIQUE(`row_key`);