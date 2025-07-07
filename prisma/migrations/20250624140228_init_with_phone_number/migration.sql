-- CreateTable
CREATE TABLE `Clients` (
    `id` CHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `phoneNumber` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Integrations` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `config` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Integration_clientId_fkey`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversations` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `patientName` TEXT NOT NULL,
    `patientPhone` TEXT NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,

    INDEX `Conversation_clientId_fkey`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Messages` (
    `id` CHAR(36) NOT NULL,
    `conversationId` CHAR(36) NOT NULL,
    `sender` VARCHAR(20) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `patientName` VARCHAR(254) NOT NULL,
    `ExternalId` VARCHAR(100) NULL,

    INDEX `Message_conversationId_fkey`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageTemplates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `content` TEXT NOT NULL,
    `variables` JSON NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `isActive` BOOLEAN NOT NULL,
    `isEditable` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomMessageTemplates` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `originalTemplateId` CHAR(36) NULL,
    `content` TEXT NOT NULL,
    `variables` JSON NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `isActive` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomMessageTemplate_clientId_fkey`(`clientId`),
    INDEX `CustomMessageTemplate_originalTemplateId_fkey`(`originalTemplateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `name` VARCHAR(254) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `passwordHash` VARCHAR(512) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Users_email_key`(`email`),
    INDEX `Users_clientId_fkey`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Integrations` ADD CONSTRAINT `Integration_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversations` ADD CONSTRAINT `Conversation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Messages` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomMessageTemplates` ADD CONSTRAINT `CustomMessageTemplate_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomMessageTemplates` ADD CONSTRAINT `CustomMessageTemplate_originalTemplateId_fkey` FOREIGN KEY (`originalTemplateId`) REFERENCES `MessageTemplates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
