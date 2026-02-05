import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { 
    Scale, Search, Bell, FileText, Settings, LogOut, 
    Sun, Moon, Users, BarChart3, Home, ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Search, label: 'Căutare', path: '/dashboard/search' },
        { icon: FileText, label: 'Monitorizare', path: '/dashboard/monitored' },
        { icon: Bell, label: 'Notificări', path: '/dashboard/notifications' },
        { icon: Settings, label: 'Setări', path: '/dashboard/settings' },
    ];

    const adminItems = [
        { icon: Users, label: 'Utilizatori', path: '/dashboard/admin/users' },
        { icon: BarChart3, label: 'Statistici', path: '/dashboard/admin/stats' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <NavLink to="/" className="flex items-center gap-3" data-testid="sidebar-logo">
                        <Scale className="h-7 w-7 text-primary" />
                        <span className="font-serif text-lg font-bold tracking-tight">Portal Dosare</span>
                    </NavLink>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`
                            }
                            data-testid={`nav-${item.label.toLowerCase()}`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}

                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Administrare
                                </p>
                            </div>
                            {adminItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`
                                    }
                                    data-testid={`nav-admin-${item.label.toLowerCase()}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-none bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="flex-1 h-10"
                            onClick={toggleTheme}
                            data-testid="sidebar-theme-toggle"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="flex-1 h-10"
                            onClick={handleLogout}
                            data-testid="logout-btn"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
