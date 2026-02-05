import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, Check, CheckCheck, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsPage = () => {
    const { api } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            toast.error('Eroare la încărcarea notificărilor');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notifId) => {
        try {
            await api.put(`/notifications/${notifId}/read`);
            setNotifications(notifications.map(n => 
                n.id === notifId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Eroare la marcarea notificării');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('Toate notificările au fost marcate ca citite');
        } catch (error) {
            toast.error('Eroare la marcarea notificărilor');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'case_update':
                return FileText;
            default:
                return Bell;
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours} ore`;
        if (diffDays < 7) return `${diffDays} zile`;
        return date.toLocaleDateString('ro-RO');
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="notifications-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Notificări
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Centrul de notificări</h1>
                    <p className="text-muted-foreground mt-1">
                        {unreadCount > 0 ? `${unreadCount} notificare(ări) necitite` : 'Toate notificările au fost citite'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        className="h-10"
                        data-testid="mark-all-read-btn"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Marchează toate ca citite
                    </Button>
                )}
            </div>

            {/* Empty State */}
            {notifications.length === 0 && (
                <Card className="border-2 border-dashed border-border" data-testid="empty-state">
                    <CardContent className="p-12 text-center">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold mb-2">Nicio notificare</h3>
                        <p className="text-muted-foreground">
                            Vei primi notificări când apar modificări în dosarele monitorizate.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Notifications List */}
            {notifications.length > 0 && (
                <div className="space-y-2">
                    {notifications.map((notif) => {
                        const Icon = getNotificationIcon(notif.type);
                        
                        return (
                            <Card 
                                key={notif.id} 
                                className={`border border-border transition-all duration-200 ${
                                    !notif.read ? 'bg-primary/5 border-primary/20' : ''
                                }`}
                                data-testid={`notification-${notif.id}`}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`h-10 w-10 flex items-center justify-center ${
                                        !notif.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm font-bold">{notif.case_number}</p>
                                            {!notif.read && (
                                                <Badge variant="default" className="text-xs">Nou</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {notif.message}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(notif.created_at)}
                                        </span>
                                        {!notif.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => markAsRead(notif.id)}
                                                data-testid={`mark-read-${notif.id}`}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
