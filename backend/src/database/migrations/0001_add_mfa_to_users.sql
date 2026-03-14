ALTER TABLE `users` ADD COLUMN `mfa_enabled` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `mfa_token` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `mfa_expires` integer;

