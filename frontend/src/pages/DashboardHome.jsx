import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Search, FileText, Bell, Plus, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const DashboardHome = () => {
    const { user, api } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ monitored: 0, unreadNotifications: 0 });
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [monitoredRes, notifRes] = await Promise.all([
                api.get('/monitorizare'),
                api.get('/notifications')
            ]);
            setStats({
                monitored: monitoredRes.data.count,
                unreadNotifications: notifRes.data.unread_count
            });
            setRecentCases(monitoredRes.data.cases.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="dashboard-home">
            {/* Header */}
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Dashboard
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                    Bună ziua, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Aici găsești o privire de ansamblu asupra dosarelor monitorizate.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-border bg-card transition-all duration-300 hover:shadow-md" data-testid="stat-monitored">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Dosare monitorizate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-mono font-bold">{stats.monitored}</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card transition-all duration-300 hover:shadow-md" data-testid="stat-notifications">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notificări necitite
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-mono font-bold">{stats.unreadNotifications}</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card transition-all duration-300 hover:shadow-md" data-testid="stat-role">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Rol
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-mono font-bold capitalize">{user?.role}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-lg font-serif font-bold">Acțiuni rapide</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-3 border-2 transition-all duration-300 hover:-translate-y-0.5"
                        onClick={() => navigate('/dashboard/search')}
                        data-testid="quick-search-btn"
                    >
                        <Search className="h-8 w-8" />
                        <span>Caută dosar</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-3 border-2 transition-all duration-300 hover:-translate-y-0.5"
                        onClick={() => navigate('/dashboard/monitored')}
                        data-testid="quick-monitored-btn"
                    >
                        <FileText className="h-8 w-8" />
                        <span>Vezi dosare monitorizate</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-3 border-2 transition-all duration-300 hover:-translate-y-0.5"
                        onClick={() => navigate('/dashboard/notifications')}
                        data-testid="quick-notifications-btn"
                    >
                        <Bell className="h-8 w-8" />
                        <span>Verifică notificări</span>
                    </Button>
                </div>
            </div>

            {/* Recent Monitored Cases */}
            {recentCases.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-serif font-bold">Dosare recente</h2>
                        <Button variant="ghost" onClick={() => navigate('/dashboard/monitored')} data-testid="view-all-cases">
                            Vezi toate
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {recentCases.map((caseItem) => (
                            <Card key={caseItem.id} className="border border-border" data-testid={`recent-case-${caseItem.id}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-mono text-sm font-bold">{caseItem.numar_dosar}</p>
                                        <p className="text-xs text-muted-foreground">{caseItem.institutie}</p>
                                        {caseItem.alias && (
                                            <p className="text-xs text-accent mt-1">{caseItem.alias}</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Verificat: {new Date(caseItem.last_check).toLocaleDateString('ro-RO')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && stats.monitored === 0 && (
                <Card className="border-2 border-dashed border-border" data-testid="empty-state">
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold mb-2">Niciun dosar monitorizat</h3>
                        <p className="text-muted-foreground mb-6">
                            Începe prin a căuta și adăuga un dosar în lista de monitorizare.
                        </p>
                        <Button onClick={() => navigate('/dashboard/search')} data-testid="empty-search-btn">
                            <Plus className="mr-2 h-4 w-4" />
                            Caută primul dosar
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DashboardHome;
