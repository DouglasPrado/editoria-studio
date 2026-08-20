CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`pillarId` int,
	`title` varchar(180) NOT NULL,
	`format` enum('story','reel','carrossel') NOT NULL,
	`status` enum('ideia','em produção','pronto','publicado') NOT NULL DEFAULT 'ideia',
	`scheduledFor` timestamp,
	`caption` text,
	`hashtags` text,
	`visualReference` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `editorialPillars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`theme` varchar(160) NOT NULL,
	`description` text,
	`color` varchar(24) NOT NULL DEFAULT '#B68A56',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `editorialPillars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moodboardItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`campaign` varchar(140) NOT NULL,
	`title` varchar(160) NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moodboardItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`description` text,
	`brandTone` text,
	`colorPrimary` varchar(24) NOT NULL DEFAULT '#27211D',
	`colorAccent` varchar(24) NOT NULL DEFAULT '#B68A56',
	`fontHeading` varchar(100) NOT NULL DEFAULT 'Playfair Display',
	`fontBody` varchar(100) NOT NULL DEFAULT 'DM Sans',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
