CREATE TABLE `drilldownShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drilldownId` int NOT NULL,
	`sharedWithUserId` int,
	`sharedWithEmail` varchar(320),
	`permission` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`shareToken` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drilldownShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drilldowns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`industryName` varchar(255) NOT NULL,
	`originalFilename` varchar(512),
	`s3FileKey` varchar(1024) NOT NULL,
	`s3FileUrl` varchar(2048) NOT NULL,
	`parsedData` json,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drilldowns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;