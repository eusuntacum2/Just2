<?php
/**
 * Header Template - Bootstrap Layout
 */

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/includes/config.php';

$page_title = $page_title ?? 'Portal Dosare';
$show_navbar = $show_navbar ?? true;
$user = get_current_user();
?>
<!DOCTYPE html>
<html lang="ro" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($page_title) ?> - Portal Dosare</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="/php/assets/css/style.css" rel="stylesheet">
</head>
<body>
    <?php if ($show_navbar): ?>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2" href="/php/pages/index.php">
                <i class="bi bi-briefcase"></i>
                <span>Portal Dosare</span>
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/php/pages/search.php">
                            <i class="bi bi-search me-1"></i>Căutare
                        </a>
                    </li>
                    <?php if (is_logged_in()): ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/php/pages/dashboard.php">
                            <i class="bi bi-speedometer2 me-1"></i>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/php/pages/monitored.php">
                            <i class="bi bi-bookmark me-1"></i>Monitorizare
                        </a>
                    </li>
                    <?php if (is_admin()): ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/php/pages/admin.php">
                            <i class="bi bi-gear me-1"></i>Admin
                        </a>
                    </li>
                    <?php endif; ?>
                    <?php endif; ?>
                </ul>
                
                <ul class="navbar-nav">
                    <!-- Theme Toggle -->
                    <li class="nav-item">
                        <button class="nav-link theme-toggle" data-toggle-theme title="Schimbă tema">
                            <i class="bi bi-sun theme-icon-light" style="display:none"></i>
                            <i class="bi bi-moon theme-icon-dark"></i>
                        </button>
                    </li>
                    
                    <?php if (is_logged_in()): ?>
                    <!-- Notifications -->
                    <li class="nav-item position-relative">
                        <a class="nav-link" href="/php/pages/notifications.php" title="Notificări">
                            <i class="bi bi-bell"></i>
                            <?php 
                            require_once APP_ROOT . '/includes/db.php';
                            $unread = get_unread_notification_count($user['id']);
                            if ($unread > 0): 
                            ?>
                            <span class="notification-badge"><?= $unread > 9 ? '9+' : $unread ?></span>
                            <?php endif; ?>
                        </a>
                    </li>
                    
                    <!-- User Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle me-1"></i>
                            <?= h($user['name']) ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="/php/pages/settings.php">
                                    <i class="bi bi-gear me-2"></i>Setări
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="/php/pages/logout.php">
                                    <i class="bi bi-box-arrow-right me-2"></i>Deconectare
                                </a>
                            </li>
                        </ul>
                    </li>
                    <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/php/pages/login.php">
                            <i class="bi bi-box-arrow-in-right me-1"></i>Login
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="btn btn-primary btn-sm ms-2" href="/php/pages/register.php">
                            Înregistrare
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </nav>
    <?php endif; ?>
    
    <!-- Flash Messages -->
    <?php $flash_messages = get_flash(); ?>
    <?php if (!empty($flash_messages)): ?>
    <div class="container mt-3">
        <?php foreach ($flash_messages as $flash): ?>
        <div class="alert alert-<?= $flash['type'] === 'error' ? 'danger' : h($flash['type']) ?> alert-dismissible fade show">
            <?= h($flash['message']) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
    
    <!-- Main Content -->
    <main>
