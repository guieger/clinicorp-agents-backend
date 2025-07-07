/*
  Warnings:

  - The primary key for the `Conversations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `channel` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Conversations` table. All the data in the column will be lost.
  - You are about to drop the `Clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomMessageTemplates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageTemplates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `Channel` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ClientId` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Id` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `LastMessageAt` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `PatientName` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `PatientPhone` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `StartedAt` to the `Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Status` to the `Conversations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Conversations` DROP FOREIGN KEY `Conversation_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `CustomMessageTemplates` DROP FOREIGN KEY `CustomMessageTemplate_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `CustomMessageTemplates` DROP FOREIGN KEY `CustomMessageTemplate_originalTemplateId_fkey`;

-- DropForeignKey
ALTER TABLE `Integrations` DROP FOREIGN KEY `Integration_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `Messages` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `Users` DROP FOREIGN KEY `Users_clientId_fkey`;

-- DropIndex
DROP INDEX `Conversation_clientId_fkey` ON `Conversations`;

-- AlterTable
ALTER TABLE `Conversations` DROP PRIMARY KEY,
    DROP COLUMN `channel`,
    DROP COLUMN `clientId`,
    DROP COLUMN `id`,
    DROP COLUMN `lastMessageAt`,
    DROP COLUMN `patientName`,
    DROP COLUMN `patientPhone`,
    DROP COLUMN `startedAt`,
    DROP COLUMN `status`,
    ADD COLUMN `Channel` VARCHAR(20) NOT NULL,
    ADD COLUMN `ClientId` CHAR(36) NOT NULL,
    ADD COLUMN `Id` CHAR(36) NOT NULL,
    ADD COLUMN `LastMessageAt` TIMESTAMP(0) NOT NULL,
    ADD COLUMN `PatientName` TEXT NOT NULL,
    ADD COLUMN `PatientPhone` TEXT NOT NULL,
    ADD COLUMN `StartedAt` TIMESTAMP(0) NOT NULL,
    ADD COLUMN `Status` VARCHAR(20) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- DropTable
DROP TABLE `Clients`;

-- DropTable
DROP TABLE `CustomMessageTemplates`;

-- DropTable
DROP TABLE `Integrations`;

-- DropTable
DROP TABLE `MessageTemplates`;

-- DropTable
DROP TABLE `Messages`;

-- DropTable
DROP TABLE `Users`;

-- CreateTable
CREATE TABLE `Account` (
    `Id` CHAR(36) NOT NULL,
    `Name` TEXT NOT NULL,
    `PhoneNumber` TEXT NOT NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` TIMESTAMP(0) NOT NULL,
    `ConversationAccountId` CHAR(36) NULL,
    `IsConnected` CHAR(36) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountLog` (
    `Id` CHAR(36) NOT NULL,
    `AccountId` CHAR(36) NOT NULL,
    `UserId` CHAR(36) NOT NULL,
    `EntityType` VARCHAR(100) NOT NULL,
    `EntityId` CHAR(36) NOT NULL,
    `Action` VARCHAR(50) NOT NULL,
    `Changes` JSON NOT NULL,
    `Description` TEXT NOT NULL,
    `CreatedAt` DATETIME NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `Id` CHAR(36) NOT NULL,
    `IsConnected` BOOLEAN NOT NULL,
    `ClientId` CHAR(36) NOT NULL,
    `ActivationDate` TIMESTAMP(0) NULL,
    `Name` VARCHAR(254) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScalingConfig` (
    `Id` CHAR(36) NOT NULL,
    `KeyWords` VARCHAR(254) NOT NULL,
    `MaxRetries` VARCHAR(2) NOT NULL,
    `AutoScalingOnFails` BOOLEAN NOT NULL,
    `ClientId` CHAR(36) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentConfig` (
    `Id` CHAR(36) NOT NULL,
    `AgentName` VARCHAR(254) NOT NULL,
    `WorkingSchedule` VARCHAR(20) NOT NULL,
    `ClientId` CHAR(36) NOT NULL,
    `Name` VARCHAR(254) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `Id` CHAR(36) NOT NULL,
    `ConversationId` CHAR(36) NOT NULL,
    `Sender` VARCHAR(20) NOT NULL,
    `Type` VARCHAR(20) NOT NULL,
    `Content` TEXT NOT NULL,
    `Status` VARCHAR(20) NOT NULL,
    `Timestamp` TIMESTAMP(0) NOT NULL,
    `PatientName` VARCHAR(254) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageTemplate` (
    `Id` CHAR(36) NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Type` VARCHAR(50) NOT NULL,
    `Content` TEXT NOT NULL,
    `Variables` JSON NOT NULL,
    `Channel` VARCHAR(20) NOT NULL,
    `IsActive` BOOLEAN NOT NULL,
    `IsEditable` BOOLEAN NOT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomMessageTemplate` (
    `Id` CHAR(36) NOT NULL,
    `ClientId` CHAR(36) NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `OriginalTemplateId` CHAR(36) NULL,
    `Content` TEXT NOT NULL,
    `Variables` JSON NOT NULL,
    `Channel` VARCHAR(20) NOT NULL,
    `IsActive` BOOLEAN NOT NULL,
    `CreatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `Id` CHAR(36) NOT NULL,
    `ClientId` CHAR(36) NOT NULL,
    `Name` VARCHAR(254) NOT NULL,
    `Email` VARCHAR(254) NOT NULL,
    `PasswordHash` VARCHAR(512) NOT NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `User_Email_key`(`Email`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessagesTracking` (
    `Id` BIGINT NOT NULL AUTO_INCREMENT,
    `MessageId` CHAR(36) NOT NULL,
    `ExternalMessageId` VARCHAR(100) NOT NULL,
    `Provider` VARCHAR(50) NOT NULL,
    `To` VARCHAR(20) NOT NULL,
    `Payload` JSON NOT NULL,
    `ProviderMessageId` VARCHAR(100) NOT NULL,
    `Status` VARCHAR(20) NOT NULL,
    `ErrorMessage` TEXT NULL,
    `LastResponse` JSON NOT NULL,
    `Attempts` INTEGER NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `UpdatedAt` DATETIME NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountLog` ADD CONSTRAINT `AccountLog_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountLog` ADD CONSTRAINT `AccountLog_UserId_fkey` FOREIGN KEY (`UserId`) REFERENCES `User`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScalingConfig` ADD CONSTRAINT `ScalingConfig_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentConfig` ADD CONSTRAINT `AgentConfig_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversations` ADD CONSTRAINT `Conversations_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ConversationId_fkey` FOREIGN KEY (`ConversationId`) REFERENCES `Conversations`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomMessageTemplate` ADD CONSTRAINT `CustomMessageTemplate_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomMessageTemplate` ADD CONSTRAINT `CustomMessageTemplate_OriginalTemplateId_fkey` FOREIGN KEY (`OriginalTemplateId`) REFERENCES `MessageTemplate`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_ClientId_fkey` FOREIGN KEY (`ClientId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessagesTracking` ADD CONSTRAINT `MessagesTracking_MessageId_fkey` FOREIGN KEY (`MessageId`) REFERENCES `Message`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
