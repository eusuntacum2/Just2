-- ============================================================
-- Portal Dosare just.ro - Schema Bază de Date MySQL
-- Version: 1.0.0
-- ============================================================
-- 
-- INSTRUCȚIUNI DE UTILIZARE:
-- 1. Creează o bază de date nouă:
--    CREATE DATABASE portal_dosare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 2. Selectează baza de date:
--    USE portal_dosare;
-- 3. Rulează acest script pentru a crea tabelele
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'TRADITIONAL';

-- ============================================================
-- Tabela: users
-- Descriere: Stochează informațiile utilizatorilor
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL COMMENT 'UUID unic pentru fiecare utilizator',
    `email` VARCHAR(255) NOT NULL COMMENT 'Adresa de email (folosită pentru autentificare)',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt al parolei',
    `name` VARCHAR(255) NOT NULL COMMENT 'Numele complet al utilizatorului',
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Rolul utilizatorului în sistem',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Dacă contul este activ (1) sau dezactivat (0)',
    `email_notifications` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Dacă utilizatorul primește notificări email',
    `created_at` DATETIME NOT NULL COMMENT 'Data și ora creării contului',
    `updated_at` DATETIME NOT NULL COMMENT 'Data și ora ultimei actualizări',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    KEY `idx_users_email` (`email`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel utilizatori';

-- ============================================================
-- Tabela: monitored_cases
-- Descriere: Dosarele monitorizate de fiecare utilizator
-- ============================================================
DROP TABLE IF EXISTS `monitored_cases`;
CREATE TABLE `monitored_cases` (
    `id` VARCHAR(36) NOT NULL COMMENT 'UUID unic pentru fiecare înregistrare',
    `user_id` VARCHAR(36) NOT NULL COMMENT 'ID-ul utilizatorului care monitorizează',
    `numar_dosar` VARCHAR(50) NOT NULL COMMENT 'Numărul dosarului (ex: 123/45/2024)',
    `institutie` VARCHAR(100) DEFAULT NULL COMMENT 'Codul instituției (ex: JudecatoriaIASI)',
    `alias` VARCHAR(255) DEFAULT NULL COMMENT 'Nume personalizat pentru identificare rapidă',
    `last_snapshot` JSON DEFAULT NULL COMMENT 'Ultima captură a datelor dosarului (JSON)',
    `last_check` DATETIME DEFAULT NULL COMMENT 'Data și ora ultimei verificări',
    `created_at` DATETIME NOT NULL COMMENT 'Data adăugării în monitorizare',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Dacă monitorizarea este activă',
    PRIMARY KEY (`id`),
    KEY `idx_mc_user_id` (`user_id`),
    KEY `idx_mc_numar_dosar` (`numar_dosar`),
    KEY `idx_mc_is_active` (`is_active`),
    KEY `idx_mc_user_active` (`user_id`, `is_active`),
    CONSTRAINT `fk_mc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dosare monitorizate';

-- ============================================================
-- Tabela: notifications
-- Descriere: Notificările pentru utilizatori
-- ============================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL COMMENT 'UUID unic pentru fiecare notificare',
    `user_id` VARCHAR(36) NOT NULL COMMENT 'ID-ul utilizatorului destinatar',
    `case_number` VARCHAR(50) DEFAULT NULL COMMENT 'Numărul dosarului asociat (dacă există)',
    `message` TEXT NOT NULL COMMENT 'Conținutul notificării',
    `type` VARCHAR(50) NOT NULL DEFAULT 'case_update' COMMENT 'Tipul notificării',
    `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Dacă notificarea a fost citită',
    `created_at` DATETIME NOT NULL COMMENT 'Data și ora creării',
    PRIMARY KEY (`id`),
    KEY `idx_notif_user_id` (`user_id`),
    KEY `idx_notif_is_read` (`is_read`),
    KEY `idx_notif_created_at` (`created_at`),
    KEY `idx_notif_user_unread` (`user_id`, `is_read`),
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notificări utilizatori';

-- ============================================================
-- Tabela: search_history (opțională - pentru statistici)
-- Descriere: Istoricul căutărilor pentru analiză
-- ============================================================
DROP TABLE IF EXISTS `search_history`;
CREATE TABLE `search_history` (
    `id` VARCHAR(36) NOT NULL COMMENT 'UUID unic',
    `user_id` VARCHAR(36) DEFAULT NULL COMMENT 'ID-ul utilizatorului (NULL pentru căutări anonime)',
    `search_term` VARCHAR(255) NOT NULL COMMENT 'Termenul căutat',
    `search_type` ENUM('numar_dosar', 'nume_parte', 'bulk', 'csv') NOT NULL COMMENT 'Tipul căutării',
    `results_count` INT NOT NULL DEFAULT 0 COMMENT 'Numărul de rezultate găsite',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Adresa IP (IPv4 sau IPv6)',
    `created_at` DATETIME NOT NULL COMMENT 'Data și ora căutării',
    PRIMARY KEY (`id`),
    KEY `idx_sh_user_id` (`user_id`),
    KEY `idx_sh_created_at` (`created_at`),
    KEY `idx_sh_search_type` (`search_type`),
    CONSTRAINT `fk_sh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Istoric căutări';

-- ============================================================
-- Tabela: settings (opțională - pentru configurări sistem)
-- Descriere: Configurări globale ale aplicației
-- ============================================================
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
    `key` VARCHAR(100) NOT NULL COMMENT 'Cheia configurării',
    `value` TEXT DEFAULT NULL COMMENT 'Valoarea configurării',
    `description` VARCHAR(255) DEFAULT NULL COMMENT 'Descrierea configurării',
    `updated_at` DATETIME DEFAULT NULL COMMENT 'Ultima actualizare',
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Setări sistem';

-- ============================================================
-- Date inițiale
-- ============================================================

-- Setări implicite
INSERT INTO `settings` (`key`, `value`, `description`, `updated_at`) VALUES
('app_name', 'Portal Dosare', 'Numele aplicației', NOW()),
('app_version', '1.0.0', 'Versiunea aplicației', NOW()),
('maintenance_mode', '0', 'Mod mentenanță (0=dezactivat, 1=activat)', NOW()),
('max_search_terms', '50', 'Numărul maxim de termeni în căutare bulk', NOW()),
('session_lifetime', '86400', 'Durata sesiunii în secunde (24h)', NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICARE
-- ============================================================
-- După rularea scriptului, verifică cu:
-- SHOW TABLES;
-- DESCRIBE users;
-- SELECT * FROM settings;
-- ============================================================
