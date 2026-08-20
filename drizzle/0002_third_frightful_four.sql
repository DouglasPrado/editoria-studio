ALTER TABLE `contentItems` MODIFY COLUMN `format` enum('stories','reels 7s','reels longo','carrossel') NOT NULL;--> statement-breakpoint
ALTER TABLE `contentItems` ADD `script` text;--> statement-breakpoint
ALTER TABLE `contentItems` ADD `completedAt` timestamp;