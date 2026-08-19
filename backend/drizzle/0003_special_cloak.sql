CREATE TABLE `campaign_attachments` (
	`id` varchar(36) NOT NULL,
	`campaign_id` varchar(36) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mime_type` varchar(255) NOT NULL,
	`size` int NOT NULL,
	`data` longtext NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `campaign_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campaign_attachments` ADD CONSTRAINT `campaign_attachments_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_campaign_attachments_campaign` ON `campaign_attachments` (`campaign_id`);