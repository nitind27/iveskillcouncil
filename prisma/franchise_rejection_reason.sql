-- Add optional rejection reason for franchise approvals (Approvals page).
-- Run once if you already have `franchises` table and are not using Prisma migrations.
-- (Ignore error if column already exists.)

ALTER TABLE `franchises`
ADD COLUMN `rejection_reason` VARCHAR(500) NULL AFTER `status`;
