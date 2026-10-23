ALTER TABLE `cutoffs` ADD `preparatory` varchar(8);--> statement-breakpoint
ALTER TABLE `cutoffs` MODIFY COLUMN `row_key` char(64) GENERATED ALWAYS AS (sha2(concat_ws('|', offering_id, exam_id, year, ifnull(round, ''), ifnull(quota, ''), ifnull(category, ''), ifnull(branch, ''), ifnull(seat_pool, ''), preparatory), 256)) STORED;
