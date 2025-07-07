/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AccountLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AgentConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Channel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Conversations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CustomMessageTemplate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MessageTemplate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ScalingConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `Account` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `AccountLog` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `AgentConfig` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `Channel` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `Conversations` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `CustomMessageTemplate` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `Message` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `MessageTemplate` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `ScalingConfig` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);
