import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, Users, FileText, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminStatsPage = () => {
    const { api } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            toast.error('Eroare la încărcarea statisticilor');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="admin-stats-page">
            {/* Header */}
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Administrare
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Statistici sistem</h1>
                <p className="text-muted-foreground mt-1">
                    Privire de ansamblu asupra utilizării platformei.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-border" data-testid="stat-total-users">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Total utilizatori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-mono font-bold">{stats?.total_users || 0}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.active_users || 0} activi
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border" data-testid="stat-monitored-cases">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Dosare monitorizate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-mono font-bold">{stats?.total_monitored_cases || 0}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            În toate conturile
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border" data-testid="stat-notifications">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Total notificări
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-mono font-bold">{stats?.total_notifications || 0}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Generate de sistem
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border" data-testid="stat-api">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Status API
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-mono font-bold text-green-500">OK</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            just.ro conectat
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Summary */}
            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Sumar activitate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <p className="text-4xl font-mono font-bold text-primary">
                                {stats?.active_users || 0}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Utilizatori activi
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-mono font-bold text-accent">
                                {Math.round((stats?.total_monitored_cases || 0) / Math.max(stats?.active_users || 1, 1) * 10) / 10}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Dosare/utilizator
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-mono font-bold">
                                {Math.round((stats?.total_notifications || 0) / Math.max(stats?.total_monitored_cases || 1, 1) * 10) / 10}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Notificări/dosar
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-mono font-bold text-green-500">
                                {Math.round((stats?.active_users || 0) / Math.max(stats?.total_users || 1, 1) * 100)}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Rată activare
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Info */}
            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Informații sistem</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground">API Endpoint</p>
                            <p className="font-mono text-sm">http://portalquery.just.ro/query.asmx</p>
                        </div>
                        <div className="p-4 bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground">Protocol</p>
                            <p className="font-mono text-sm">SOAP 1.1/1.2</p>
                        </div>
                        <div className="p-4 bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground">Metode disponibile</p>
                            <p className="font-mono text-sm">CautareDosare, CautareDosare2, CautareSedinte</p>
                        </div>
                        <div className="p-4 bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground">Versiune Portal</p>
                            <p className="font-mono text-sm">1.0.0</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminStatsPage;
