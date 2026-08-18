CREATE TABLE `campaigns` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`start_time` timestamp NOT NULL,
	`delay_ms` int NOT NULL,
	`hourly_limit` int,
	`total_recipients` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` varchar(36) NOT NULL,
	`campaign_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`status` enum('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
	`scheduled_at` timestamp NOT NULL,
	`sent_at` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`error_message` text,
	`job_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `senders` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`smtp_host` varchar(255) NOT NULL,
	`smtp_port` int NOT NULL,
	`smtp_user` varchar(255) NOT NULL,
	`smtp_pass` varchar(255) NOT NULL,
	`from_email` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `senders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_emails_status_scheduled` ON `emails` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_emails_sender_status` ON `emails` (`sender_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_emails_campaign` ON `emails` (`campaign_id`);