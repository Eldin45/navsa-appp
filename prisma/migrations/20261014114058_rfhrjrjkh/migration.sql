-- AlterTable
ALTER TABLE `iot_devices` MODIFY `device_type` ENUM('SOIL_SENSOR', 'WEATHER_STATION', 'MOISTURE_PROBE', 'CAMERA', 'MULTI_SENSOR', 'WATER_PUMP', 'VALVE', 'FAN', 'LIGHT', 'MOTOR', 'HEATER') NOT NULL;

-- CreateTable
CREATE TABLE `iot_device_actuators` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `mode` ENUM('MANUAL', 'AUTO', 'SCHEDULE') NOT NULL DEFAULT 'MANUAL',
    `state` ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    `lastStateChange` DATETIME(3) NULL,
    `lastChangedBy` VARCHAR(191) NULL,
    `triggerType` VARCHAR(191) NULL,
    `triggerUnit` VARCHAR(191) NULL,
    `onBelow` DOUBLE NULL,
    `offAbove` DOUBLE NULL,
    `maxRunMinutes` INTEGER NULL,
    `cooldownMinutes` INTEGER NULL,
    `totalRuntimeMinutes` INTEGER NOT NULL DEFAULT 0,
    `lastRunStartedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `iot_device_actuators_deviceId_key`(`deviceId`),
    INDEX `iot_device_actuators_mode_idx`(`mode`),
    INDEX `iot_device_actuators_state_idx`(`state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_actuator_commands` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `action` ENUM('ON', 'OFF') NOT NULL,
    `source` ENUM('MANUAL', 'AUTO', 'SCHEDULE', 'SAFETY') NOT NULL DEFAULT 'MANUAL',
    `triggeredBy` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `readingValue` DOUBLE NULL,
    `readingType` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `iot_actuator_commands_deviceId_created_at_idx`(`deviceId`, `created_at`),
    INDEX `iot_actuator_commands_source_idx`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iot_device_actuators` ADD CONSTRAINT `fk_actuator_device` FOREIGN KEY (`deviceId`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_actuator_commands` ADD CONSTRAINT `fk_actuator_cmd_device` FOREIGN KEY (`deviceId`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_actuator_commands` ADD CONSTRAINT `fk_actuator_cmd_user` FOREIGN KEY (`triggeredBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
