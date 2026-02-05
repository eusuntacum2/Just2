import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
    Users, Shield, ShieldOff, Loader2, Search, 
    UserCheck, UserX, ChevronDown, ChevronUp
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const AdminUsersPage = () => {
    const { api, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users);
        } catch (error) {
            toast.error('Eroare la încărcarea utilizatorilor');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId, data) => {
        try {
            await api.put(`/admin/users/${userId}`, data);
            fetchUsers();
            toast.success('Utilizator actualizat');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la actualizare');
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await updateUser(userId, { role: newRole });
    };

    const toggleActive = async (userId, isActive) => {
        await updateUser(userId, { is_active: !isActive });
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchFilter.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6 md:p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="admin-users-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Administrare
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Gestionare utilizatori</h1>
                    <p className="text-muted-foreground mt-1">
                        {users.length} utilizator(i) înregistrați
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Caută utilizatori..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="search-users"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-border">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-mono font-bold">{users.length}</p>
                    </CardContent>
                </Card>
                <Card className="border border-border">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Activi</p>
                        <p className="text-2xl font-mono font-bold text-green-500">
                            {users.filter(u => u.is_active !== false).length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Admini</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                            {users.filter(u => u.role === 'admin').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Utilizatori</p>
                        <p className="text-2xl font-mono font-bold">
                            {users.filter(u => u.role === 'user').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Users List */}
            <div className="space-y-2">
                {filteredUsers.map((user) => {
                    const isExpanded = expandedUser === user.id;
                    const isCurrentUser = user.id === currentUser?.id;
                    
                    return (
                        <Card 
                            key={user.id} 
                            className={`border border-border ${!user.is_active ? 'opacity-60' : ''}`}
                            data-testid={`user-${user.id}`}
                        >
                            <CardContent className="p-0">
                                <div className="p-4 flex items-center justify-between">
                                    <div 
                                        className="flex items-center gap-4 flex-1 cursor-pointer"
                                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                    >
                                        <div className={`h-12 w-12 flex items-center justify-center font-bold ${
                                            user.role === 'admin' 
                                                ? 'bg-accent/20 text-accent' 
                                                : 'bg-primary/10 text-primary'
                                        }`}>
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{user.name}</p>
                                                {isCurrentUser && (
                                                    <Badge variant="outline" className="text-xs">Tu</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                        <Badge 
                                            variant={user.is_active !== false ? 'outline' : 'destructive'}
                                            className="text-xs"
                                        >
                                            {user.is_active !== false ? 'Activ' : 'Inactiv'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">ID</p>
                                                <p className="font-mono text-xs">{user.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Creat</p>
                                                <p>{new Date(user.created_at).toLocaleDateString('ro-RO')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Notificări email</p>
                                                <p>{user.email_notifications !== false ? 'Da' : 'Nu'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Ultima actualizare</p>
                                                <p>{user.updated_at ? new Date(user.updated_at).toLocaleDateString('ro-RO') : '-'}</p>
                                            </div>
                                        </div>

                                        {!isCurrentUser && (
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleRole(user.id, user.role)}
                                                    data-testid={`toggle-role-${user.id}`}
                                                >
                                                    {user.role === 'admin' ? (
                                                        <>
                                                            <ShieldOff className="mr-2 h-4 w-4" />
                                                            Retrage admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Promovează admin
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant={user.is_active !== false ? 'outline' : 'default'}
                                                    size="sm"
                                                    onClick={() => toggleActive(user.id, user.is_active !== false)}
                                                    data-testid={`toggle-active-${user.id}`}
                                                >
                                                    {user.is_active !== false ? (
                                                        <>
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Dezactivează
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Activează
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminUsersPage;
