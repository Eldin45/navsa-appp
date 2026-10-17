-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `accounts_userId_idx`(`userId`),
    UNIQUE INDEX `accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `password_resets_userId_idx`(`userId`),
    INDEX `password_resets_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `password_hash` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'FARMER', 'SUPPLIER') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    `organizationId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `legal_name` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('COOPERATIVE', 'NGO', 'GOVERNMENT', 'AGGREGATOR', 'INPUT_SUPPLIER', 'FARM_MANAGEMENT') NOT NULL,
    `registration_number` VARCHAR(191) NULL,
    `tax_id` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'NIGERIA',
    `region` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `logo_url` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    UNIQUE INDEX `organizations_registration_number_key`(`registration_number`),
    INDEX `organizations_type_idx`(`type`),
    INDEX `organizations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farmer_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `farmer_code` VARCHAR(191) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `id_type` VARCHAR(191) NULL,
    `id_number` VARCHAR(191) NULL,
    `primary_crops` LONGTEXT NULL,
    `years_farming` INTEGER NULL,
    `total_land_ha` DOUBLE NULL,
    `has_smartphone` BOOLEAN NOT NULL DEFAULT false,
    `primary_language` VARCHAR(191) NULL DEFAULT 'ENGLISH',
    `bank_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `farmer_profiles_userId_key`(`userId`),
    UNIQUE INDEX `farmer_profiles_farmer_code_key`(`farmer_code`),
    INDEX `farmer_profiles_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `supplier_code` VARCHAR(191) NULL,
    `business_name` VARCHAR(191) NOT NULL,
    `business_type` VARCHAR(191) NULL,
    `registration_no` VARCHAR(191) NULL,
    `tax_id` VARCHAR(191) NULL,
    `product_categories` LONGTEXT NULL,
    `delivery_regions` LONGTEXT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supplier_profiles_userId_key`(`userId`),
    UNIQUE INDEX `supplier_profiles_supplier_code_key`(`supplier_code`),
    INDEX `supplier_profiles_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NULL DEFAULT 'light',
    `language` VARCHAR(191) NULL DEFAULT 'en',
    `timezone` VARCHAR(191) NULL DEFAULT 'Africa/Lagos',
    `email_enabled` BOOLEAN NOT NULL DEFAULT true,
    `sms_enabled` BOOLEAN NOT NULL DEFAULT false,
    `push_enabled` BOOLEAN NOT NULL DEFAULT true,
    `weather_alerts` BOOLEAN NOT NULL DEFAULT true,
    `payment_alerts` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_invites` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `organizationName` VARCHAR(191) NOT NULL,
    `organizationType` ENUM('COOPERATIVE', 'NGO', 'GOVERNMENT', 'AGGREGATOR', 'INPUT_SUPPLIER', 'FARM_MANAGEMENT') NOT NULL DEFAULT 'AGGREGATOR',
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `invitedById` VARCHAR(191) NOT NULL,
    `acceptedByUserId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `revokedById` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_invites_token_key`(`token`),
    UNIQUE INDEX `admin_invites_acceptedByUserId_key`(`acceptedByUserId`),
    INDEX `admin_invites_email_idx`(`email`),
    INDEX `admin_invites_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_applications` (
    `id` VARCHAR(191) NOT NULL,
    `application_number` VARCHAR(191) NOT NULL,
    `contact_full_name` VARCHAR(191) NOT NULL,
    `contact_email` VARCHAR(191) NOT NULL,
    `contact_phone` VARCHAR(191) NOT NULL,
    `business_name` VARCHAR(191) NOT NULL,
    `business_type` VARCHAR(191) NULL,
    `registration_number` VARCHAR(191) NULL,
    `tax_id` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'NIGERIA',
    `state` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `product_categories` TEXT NULL,
    `delivery_regions` TEXT NULL,
    `years_in_business` INTEGER NULL,
    `description` TEXT NULL,
    `documents` JSON NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFO_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `decisionNotes` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `moreInfoRequest` TEXT NULL,
    `moreInfoRespondedAt` DATETIME(3) NULL,
    `approvedUserId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supplier_applications_application_number_key`(`application_number`),
    UNIQUE INDEX `supplier_applications_approvedUserId_key`(`approvedUserId`),
    INDEX `supplier_applications_contact_email_idx`(`contact_email`),
    INDEX `supplier_applications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('SUPER_ADMIN', 'ADMIN', 'FARMER_CLOSED', 'FARMER_OPEN', 'SUPPLIER') NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL DEFAULT 'NAVSA',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `ledgerBalance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `availableBalance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'FROZEN', 'CLOSED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `isFrozen` BOOLEAN NOT NULL DEFAULT false,
    `frozenAt` DATETIME(3) NULL,
    `frozenReason` VARCHAR(191) NULL,
    `kycLevel` INTEGER NOT NULL DEFAULT 1,
    `dailyLimit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `monthlyLimit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `singleTxnLimit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `palmPayCustomerId` VARCHAR(191) NULL,
    `palmPayAccountNumber` VARCHAR(191) NULL,
    `palmPayAccountName` VARCHAR(191) NULL,
    `palmPayBankName` VARCHAR(191) NULL DEFAULT 'PalmPay',
    `palmPayBankCode` VARCHAR(191) NULL,
    `palmPayAccountReference` VARCHAR(191) NULL,
    `palmPayStatus` VARCHAR(191) NULL DEFAULT 'PENDING',
    `palmPayCreatedAt` DATETIME(3) NULL,
    `palmPayMetadata` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallets_accountNumber_key`(`accountNumber`),
    UNIQUE INDEX `wallets_palmPayCustomerId_key`(`palmPayCustomerId`),
    UNIQUE INDEX `wallets_palmPayAccountNumber_key`(`palmPayAccountNumber`),
    UNIQUE INDEX `wallets_palmPayAccountReference_key`(`palmPayAccountReference`),
    INDEX `wallets_userId_idx`(`userId`),
    INDEX `wallets_type_idx`(`type`),
    INDEX `wallets_status_idx`(`status`),
    INDEX `wallets_accountNumber_idx`(`accountNumber`),
    INDEX `wallets_palmPayAccountNumber_idx`(`palmPayAccountNumber`),
    UNIQUE INDEX `wallets_userId_type_key`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_fundings` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `source` ENUM('BANK_TRANSFER', 'CARD', 'USSD', 'ADMIN_ALLOCATION', 'PLATFORM_FUNDING', 'HARVEST_SETTLEMENT', 'MANUAL') NOT NULL DEFAULT 'BANK_TRANSFER',
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(191) NULL,
    `providerReference` VARCHAR(191) NULL,
    `providerPayload` JSON NULL,
    `initiatedById` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `wallet_fundings_reference_key`(`reference`),
    INDEX `wallet_fundings_walletId_idx`(`walletId`),
    INDEX `wallet_fundings_reference_idx`(`reference`),
    INDEX `wallet_fundings_status_idx`(`status`),
    INDEX `wallet_fundings_source_idx`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT', 'TRANSFER', 'FEE', 'REFUND', 'RESERVE', 'RELEASE', 'ADMIN_ADJUSTMENT', 'SYSTEM') NOT NULL,
    `category` ENUM('FUNDING', 'INPUT_PAYMENT', 'HARVEST_PAYOUT', 'WITHDRAWAL', 'TRANSFER', 'REFUND', 'FEE', 'ADMIN_ADJUSTMENT', 'SYSTEM') NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `fee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `balanceBefore` DECIMAL(18, 2) NOT NULL,
    `balanceAfter` DECIMAL(18, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `fundingId` VARCHAR(191) NULL,
    `debitTransferId` VARCHAR(191) NULL,
    `creditTransferId` VARCHAR(191) NULL,
    `inputOrderId` VARCHAR(191) NULL,
    `inputRequestId` VARCHAR(191) NULL,
    `harvestPayoutId` VARCHAR(191) NULL,
    `withdrawalId` VARCHAR(191) NULL,

    UNIQUE INDEX `wallet_transactions_reference_key`(`reference`),
    UNIQUE INDEX `wallet_transactions_fundingId_key`(`fundingId`),
    UNIQUE INDEX `wallet_transactions_debitTransferId_key`(`debitTransferId`),
    UNIQUE INDEX `wallet_transactions_creditTransferId_key`(`creditTransferId`),
    UNIQUE INDEX `wallet_transactions_inputOrderId_key`(`inputOrderId`),
    UNIQUE INDEX `wallet_transactions_inputRequestId_key`(`inputRequestId`),
    UNIQUE INDEX `wallet_transactions_harvestPayoutId_key`(`harvestPayoutId`),
    UNIQUE INDEX `wallet_transactions_withdrawalId_key`(`withdrawalId`),
    INDEX `wallet_transactions_walletId_idx`(`walletId`),
    INDEX `wallet_transactions_userId_idx`(`userId`),
    INDEX `wallet_transactions_reference_idx`(`reference`),
    INDEX `wallet_transactions_created_at_idx`(`created_at`),
    INDEX `wallet_transactions_category_idx`(`category`),
    INDEX `wallet_transactions_type_status_idx`(`type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transfers` (
    `id` VARCHAR(191) NOT NULL,
    `fromWalletId` VARCHAR(191) NOT NULL,
    `toWalletId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `fee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `totalDebited` DECIMAL(18, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `wallet_transfers_reference_key`(`reference`),
    INDEX `wallet_transfers_fromWalletId_idx`(`fromWalletId`),
    INDEX `wallet_transfers_toWalletId_idx`(`toWalletId`),
    INDEX `wallet_transfers_reference_idx`(`reference`),
    INDEX `wallet_transfers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_withdrawals` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `fee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `netAmount` DECIMAL(18, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `providerReference` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `wallet_withdrawals_reference_key`(`reference`),
    INDEX `wallet_withdrawals_walletId_idx`(`walletId`),
    INDEX `wallet_withdrawals_reference_idx`(`reference`),
    INDEX `wallet_withdrawals_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_holds` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `referenceType` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `releasedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wallet_holds_walletId_idx`(`walletId`),
    INDEX `wallet_holds_status_idx`(`status`),
    INDEX `wallet_holds_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `palmpay_webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NULL,
    `currency` VARCHAR(191) NULL DEFAULT 'NGN',
    `payload` JSON NOT NULL,
    `signature` VARCHAR(191) NULL,
    `signatureValid` BOOLEAN NOT NULL DEFAULT false,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `walletId` VARCHAR(191) NULL,
    `walletFundingId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `palmpay_webhook_events_eventId_key`(`eventId`),
    INDEX `palmpay_webhook_events_eventId_idx`(`eventId`),
    INDEX `palmpay_webhook_events_reference_idx`(`reference`),
    INDEX `palmpay_webhook_events_accountNumber_idx`(`accountNumber`),
    INDEX `palmpay_webhook_events_processed_idx`(`processed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harvest_payouts` (
    `id` VARCHAR(191) NOT NULL,
    `harvestId` VARCHAR(191) NULL,
    `cycleId` VARCHAR(191) NULL,
    `farmId` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `paidById` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `toWalletId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `reference` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `harvest_payouts_reference_key`(`reference`),
    INDEX `harvest_payouts_farmerId_idx`(`farmerId`),
    INDEX `harvest_payouts_farmId_idx`(`farmId`),
    INDEX `harvest_payouts_status_idx`(`status`),
    INDEX `harvest_payouts_reference_idx`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bank_name` VARCHAR(191) NOT NULL,
    `bank_code` VARCHAR(191) NULL,
    `account_name` VARCHAR(191) NOT NULL,
    `account_number` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bank_accounts_userId_account_number_bank_code_key`(`userId`, `account_number`, `bank_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farm_groups` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `adminId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `group_type` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `local_government` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `gps_boundary` LONGTEXT NULL,
    `total_area_ha` DOUBLE NULL,
    `member_count` INTEGER NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `farm_groups_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farm_group_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `membership_status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `joined_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `exit_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `farm_group_members_groupId_idx`(`groupId`),
    INDEX `farm_group_members_userId_idx`(`userId`),
    UNIQUE INDEX `farm_group_members_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farms` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `farm_type` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `gps_boundary` LONGTEXT NULL,
    `total_area_ha` DOUBLE NOT NULL,
    `cultivable_ha` DOUBLE NULL,
    `soil_type` VARCHAR(191) NULL,
    `soil_ph` DOUBLE NULL,
    `irrigation_type` VARCHAR(191) NULL,
    `irrigation_source` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `current_crop` VARCHAR(191) NULL,
    `crop_variety` VARCHAR(191) NULL,
    `planting_date` DATETIME(3) NULL,
    `expected_harvest` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `farms_userId_idx`(`userId`),
    INDEX `farms_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farm_fields` (
    `id` VARCHAR(191) NOT NULL,
    `farmId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `field_number` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `gps_boundary` LONGTEXT NULL,
    `area_ha` DOUBLE NOT NULL,
    `soil_type` VARCHAR(191) NULL,
    `soil_depth` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `irrigation_method` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `farm_fields_farmId_idx`(`farmId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crop_cycles` (
    `id` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NOT NULL,
    `cycle_number` INTEGER NOT NULL,
    `cycle_name` VARCHAR(191) NULL,
    `crop_type` VARCHAR(191) NOT NULL,
    `variety` VARCHAR(191) NULL,
    `planting_date` DATETIME(3) NOT NULL,
    `expected_harvest` DATETIME(3) NULL,
    `actual_harvest` DATETIME(3) NULL,
    `status` ENUM('PLANNED', 'PLANTED', 'GROWING', 'HARVESTING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PLANTED',
    `seeds_used_kg` DOUBLE NULL,
    `fertilizer_used` LONGTEXT NULL,
    `pesticides_used` LONGTEXT NULL,
    `total_yield_kg` DOUBLE NULL DEFAULT 0,
    `yield_per_ha` DOUBLE NULL,
    `total_cost` DOUBLE NULL DEFAULT 0,
    `revenue` DOUBLE NULL DEFAULT 0,
    `profit` DOUBLE NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `crop_cycles_fieldId_cycle_number_idx`(`fieldId`, `cycle_number`),
    INDEX `crop_cycles_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crop_activities` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `activity_type` ENUM('PLANTING', 'IRRIGATION', 'FERTILIZING', 'PEST_CONTROL', 'WEEDING', 'HARVESTING', 'OTHER') NOT NULL,
    `activity_date` DATETIME(3) NOT NULL,
    `performed_by` VARCHAR(191) NULL,
    `details` LONGTEXT NULL,
    `water_volume` DOUBLE NULL,
    `duration_hours` DOUBLE NULL,
    `product_name` VARCHAR(191) NULL,
    `product_quantity` DOUBLE NULL,
    `product_unit` VARCHAR(191) NULL,
    `observations` VARCHAR(191) NULL,
    `photos` LONGTEXT NULL,
    `total_cost` DOUBLE NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crop_activities_cycleId_activity_date_idx`(`cycleId`, `activity_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harvests` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NOT NULL,
    `farmId` VARCHAR(191) NOT NULL,
    `harvest_date` DATETIME(3) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'KG',
    `quality_grade` VARCHAR(191) NULL,
    `moisture_pct` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECORDED',
    `harvested_by` VARCHAR(191) NULL,
    `verified_by` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `harvests_cycleId_idx`(`cycleId`),
    INDEX `harvests_farmId_harvest_date_idx`(`farmId`, `harvest_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_devices` (
    `id` VARCHAR(191) NOT NULL,
    `farmId` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `device_type` ENUM('SOIL_SENSOR', 'WEATHER_STATION', 'MOISTURE_PROBE', 'CAMERA', 'MULTI_SENSOR') NOT NULL,
    `device_model` VARCHAR(191) NULL,
    `manufacturer` VARCHAR(191) NULL,
    `serial_number` VARCHAR(191) NULL,
    `installed_date` DATETIME(3) NOT NULL,
    `location_lat` DOUBLE NULL,
    `location_lng` DOUBLE NULL,
    `connection_type` VARCHAR(191) NULL,
    `sim_card_number` VARCHAR(191) NULL,
    `signal_strength` INTEGER NULL,
    `power_source` VARCHAR(191) NULL,
    `battery_level` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE') NOT NULL DEFAULT 'ACTIVE',
    `reading_frequency` INTEGER NULL,
    `last_reading` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `iot_devices_serial_number_key`(`serial_number`),
    INDEX `iot_devices_farmId_idx`(`farmId`),
    INDEX `iot_devices_device_type_status_idx`(`device_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_readings` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `reading_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reading_type` VARCHAR(191) NOT NULL,
    `reading_value` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `sensor_index` INTEGER NULL,
    `sensor_depth` DOUBLE NULL,
    `reading_quality` VARCHAR(191) NULL,
    `is_calibrated` BOOLEAN NOT NULL DEFAULT true,
    `raw_data` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `iot_readings_deviceId_reading_time_idx`(`deviceId`, `reading_time`),
    INDEX `iot_readings_reading_type_idx`(`reading_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `alert_type` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `threshold_min` DOUBLE NULL,
    `threshold_max` DOUBLE NULL,
    `actual_value` DOUBLE NOT NULL,
    `detected_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notification_sent` BOOLEAN NOT NULL DEFAULT false,
    `farm_id` VARCHAR(191) NULL,
    `field_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iot_alerts_deviceId_status_idx`(`deviceId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weather_stations` (
    `id` VARCHAR(191) NOT NULL,
    `farmId` VARCHAR(191) NOT NULL,
    `station_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `elevation` DOUBLE NULL,
    `provider` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `weather_stations_station_code_key`(`station_code`),
    INDEX `weather_stations_farmId_idx`(`farmId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weather_readings` (
    `id` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `reading_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `temperature_c` DOUBLE NULL,
    `humidity_pct` DOUBLE NULL,
    `rainfall_mm` DOUBLE NULL,
    `wind_speed_kmh` DOUBLE NULL,
    `wind_direction` VARCHAR(191) NULL,
    `pressure_hpa` DOUBLE NULL,
    `solar_radiation` DOUBLE NULL,
    `uv_index` DOUBLE NULL,
    `forecast_3day` LONGTEXT NULL,
    `forecast_7day` LONGTEXT NULL,
    `source` VARCHAR(191) NULL DEFAULT 'STATION',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `weather_readings_stationId_reading_time_idx`(`stationId`, `reading_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_agronomy_advice` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `farmId` VARCHAR(191) NULL,
    `fieldId` VARCHAR(191) NULL,
    `cycleId` VARCHAR(191) NULL,
    `advice_type` ENUM('IRRIGATION', 'FERTILIZER', 'PEST', 'DISEASE', 'PLANTING', 'HARVEST', 'GENERAL') NOT NULL,
    `crop_type` VARCHAR(191) NULL,
    `prompt` LONGTEXT NULL,
    `context` LONGTEXT NULL,
    `advice_text` LONGTEXT NOT NULL,
    `confidence_score` DOUBLE NULL,
    `model_used` VARCHAR(191) NULL DEFAULT 'gemini',
    `weather_snapshot` LONGTEXT NULL,
    `sensor_snapshot` LONGTEXT NULL,
    `action_items` LONGTEXT NULL,
    `is_actioned` BOOLEAN NOT NULL DEFAULT false,
    `actioned_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_agronomy_advice_userId_idx`(`userId`),
    INDEX `ai_agronomy_advice_cycleId_idx`(`cycleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `item_type` VARCHAR(191) NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `manufacturer` VARCHAR(191) NULL,
    `unit_type` VARCHAR(191) NOT NULL,
    `unit_cost` DOUBLE NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `current_stock` DOUBLE NOT NULL DEFAULT 0,
    `min_stock` DOUBLE NULL,
    `reorder_point` DOUBLE NULL,
    `storage_requirements` LONGTEXT NULL,
    `category` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `input_inventory_item_code_key`(`item_code`),
    INDEX `input_inventory_item_type_idx`(`item_type`),
    INDEX `input_inventory_category_idx`(`category`),
    INDEX `input_inventory_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_requests` (
    `id` VARCHAR(191) NOT NULL,
    `request_number` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `farmId` VARCHAR(191) NULL,
    `cycleId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FUNDED', 'ORDERED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `requested_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `needed_by_date` DATETIME(3) NULL,
    `total_amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `notes` TEXT NULL,
    `approved_by_id` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `funded_by_id` VARCHAR(191) NULL,
    `funded_at` DATETIME(3) NULL,
    `funded_amount` DOUBLE NULL,
    `fundedFromWalletId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `input_requests_request_number_key`(`request_number`),
    INDEX `input_requests_farmerId_idx`(`farmerId`),
    INDEX `input_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_request_items` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `inventoryId` VARCHAR(191) NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `item_type` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `unit_price` DOUBLE NULL,
    `total_price` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `input_request_items_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `ordered_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expected_delivery` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `total_amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NGN',
    `delivery_address` TEXT NULL,
    `delivery_lat` DOUBLE NULL,
    `delivery_lng` DOUBLE NULL,
    `tracking_number` VARCHAR(191) NULL,
    `delivered_by_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `paidFromWalletId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `input_orders_order_number_key`(`order_number`),
    INDEX `input_orders_farmerId_idx`(`farmerId`),
    INDEX `input_orders_supplierId_idx`(`supplierId`),
    INDEX `input_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_order_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `from_status` VARCHAR(191) NULL,
    `to_status` VARCHAR(191) NOT NULL,
    `changed_by` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `input_order_status_history_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `reference_type` VARCHAR(191) NULL,
    `reference_id` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_is_read_idx`(`userId`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `old_values` LONGTEXT NULL,
    `new_values` LONGTEXT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(191) NOT NULL,
    `setting_key` VARCHAR(191) NOT NULL,
    `setting_value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `data_type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `group` VARCHAR(191) NULL,
    `is_editable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_setting_key_key`(`setting_key`),
    INDEX `system_settings_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `fk_account_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_session_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_created_by` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_organization` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmer_profiles` ADD CONSTRAINT `fk_farmer_profile_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmer_profiles` ADD CONSTRAINT `fk_farmer_profile_org` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_profiles` ADD CONSTRAINT `fk_supplier_profile_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_profiles` ADD CONSTRAINT `fk_supplier_profile_org` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_invites` ADD CONSTRAINT `fk_admin_invite_invited_by` FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_invites` ADD CONSTRAINT `fk_admin_invite_accepted_by` FOREIGN KEY (`acceptedByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_applications` ADD CONSTRAINT `fk_supplier_app_reviewed_by` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_applications` ADD CONSTRAINT `fk_supplier_app_approved_user` FOREIGN KEY (`approvedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `fk_wallet_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_fundings` ADD CONSTRAINT `fk_wallet_funding_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_fundings` ADD CONSTRAINT `fk_wallet_funding_initiator` FOREIGN KEY (`initiatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_fundings` ADD CONSTRAINT `fk_wallet_funding_approver` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_funding` FOREIGN KEY (`fundingId`) REFERENCES `wallet_fundings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_debit_transfer` FOREIGN KEY (`debitTransferId`) REFERENCES `wallet_transfers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_credit_transfer` FOREIGN KEY (`creditTransferId`) REFERENCES `wallet_transfers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_input_order` FOREIGN KEY (`inputOrderId`) REFERENCES `input_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_input_request` FOREIGN KEY (`inputRequestId`) REFERENCES `input_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_harvest_payout` FOREIGN KEY (`harvestPayoutId`) REFERENCES `harvest_payouts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wallet_tx_withdrawal` FOREIGN KEY (`withdrawalId`) REFERENCES `wallet_withdrawals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transfers` ADD CONSTRAINT `fk_wallet_transfer_from` FOREIGN KEY (`fromWalletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transfers` ADD CONSTRAINT `fk_wallet_transfer_to` FOREIGN KEY (`toWalletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_withdrawals` ADD CONSTRAINT `fk_wallet_withdrawal_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_holds` ADD CONSTRAINT `fk_wallet_hold_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `palmpay_webhook_events` ADD CONSTRAINT `fk_palmpay_event_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harvest_payouts` ADD CONSTRAINT `fk_harvest_payout_farmer` FOREIGN KEY (`farmerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harvest_payouts` ADD CONSTRAINT `fk_harvest_payout_admin` FOREIGN KEY (`paidById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harvest_payouts` ADD CONSTRAINT `fk_harvest_payout_wallet` FOREIGN KEY (`toWalletId`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `fk_bank_account_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farm_groups` ADD CONSTRAINT `fk_farm_group_org` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farm_group_members` ADD CONSTRAINT `fk_farm_group_member_group` FOREIGN KEY (`groupId`) REFERENCES `farm_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farm_group_members` ADD CONSTRAINT `fk_farm_group_member_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farms` ADD CONSTRAINT `fk_farm_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farms` ADD CONSTRAINT `fk_farm_group` FOREIGN KEY (`groupId`) REFERENCES `farm_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farm_fields` ADD CONSTRAINT `fk_farm_field_farm` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crop_cycles` ADD CONSTRAINT `fk_crop_cycle_field` FOREIGN KEY (`fieldId`) REFERENCES `farm_fields`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crop_activities` ADD CONSTRAINT `fk_crop_activity_cycle` FOREIGN KEY (`cycleId`) REFERENCES `crop_cycles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harvests` ADD CONSTRAINT `fk_harvest_cycle` FOREIGN KEY (`cycleId`) REFERENCES `crop_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `fk_iot_device_farm` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `fk_iot_device_field` FOREIGN KEY (`fieldId`) REFERENCES `farm_fields`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `fk_iot_device_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_readings` ADD CONSTRAINT `fk_iot_reading_device` FOREIGN KEY (`deviceId`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_alerts` ADD CONSTRAINT `fk_iot_alert_device` FOREIGN KEY (`deviceId`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weather_stations` ADD CONSTRAINT `fk_weather_station_farm` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weather_readings` ADD CONSTRAINT `fk_weather_reading_station` FOREIGN KEY (`stationId`) REFERENCES `weather_stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agronomy_advice` ADD CONSTRAINT `fk_ai_advice_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agronomy_advice` ADD CONSTRAINT `fk_ai_advice_cycle` FOREIGN KEY (`cycleId`) REFERENCES `crop_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_inventory` ADD CONSTRAINT `fk_input_inventory_supplier` FOREIGN KEY (`supplierId`) REFERENCES `supplier_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_requests` ADD CONSTRAINT `fk_input_request_farmer` FOREIGN KEY (`farmerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_requests` ADD CONSTRAINT `fk_input_request_approver` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_requests` ADD CONSTRAINT `fk_input_request_funder` FOREIGN KEY (`funded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_requests` ADD CONSTRAINT `fk_input_request_wallet` FOREIGN KEY (`fundedFromWalletId`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_request_items` ADD CONSTRAINT `fk_input_request_item_request` FOREIGN KEY (`requestId`) REFERENCES `input_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_request_items` ADD CONSTRAINT `fk_input_request_item_inventory` FOREIGN KEY (`inventoryId`) REFERENCES `input_inventory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_orders` ADD CONSTRAINT `fk_input_order_request` FOREIGN KEY (`requestId`) REFERENCES `input_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_orders` ADD CONSTRAINT `fk_input_order_farmer` FOREIGN KEY (`farmerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_orders` ADD CONSTRAINT `fk_input_order_supplier` FOREIGN KEY (`supplierId`) REFERENCES `supplier_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_orders` ADD CONSTRAINT `fk_input_order_deliverer` FOREIGN KEY (`delivered_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_orders` ADD CONSTRAINT `fk_input_order_wallet` FOREIGN KEY (`paidFromWalletId`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_order_status_history` ADD CONSTRAINT `fk_input_order_status_order` FOREIGN KEY (`orderId`) REFERENCES `input_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
