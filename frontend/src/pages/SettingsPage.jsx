import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Settings, User, Bell, Palette, Loader2, Check, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
    const { user, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email_notifications: user?.email_notifications ?? true
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUser({
                name: formData.name,
                email_notifications: formData.email_notifications
            });
            toast.success('Setări salvate cu succes');
        } catch (error) {
            toast.error('Eroare la salvarea setărilor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="settings-page">
            {/* Header */}
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Setări
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Setări cont</h1>
                <p className="text-muted-foreground mt-1">
                    Gestionează profilul și preferințele tale.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5" />
                            Profil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nume</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12"
                                data-testid="input-name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user?.email}
                                disabled
                                className="h-12 bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email-ul nu poate fi modificat.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <Input
                                value={user?.role}
                                disabled
                                className="h-12 bg-muted capitalize"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5" />
                            Notificări
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border border-border">
                            <div>
                                <p className="font-medium">Notificări email</p>
                                <p className="text-sm text-muted-foreground">
                                    Primește alerte pe email când dosarele sunt actualizate.
                                </p>
                            </div>
                            <Switch
                                checked={formData.email_notifications}
                                onCheckedChange={(checked) => 
                                    setFormData({ ...formData, email_notifications: checked })
                                }
                                data-testid="switch-email-notifications"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border opacity-50">
                            <div>
                                <p className="font-medium">Notificări în aplicație</p>
                                <p className="text-sm text-muted-foreground">
                                    Notificările în aplicație sunt întotdeauna active.
                                </p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Theme Settings */}
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Palette className="h-5 w-5" />
                            Aspect
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Selectează tema preferată pentru interfață.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => setTheme('light')}
                                data-testid="theme-light-btn"
                            >
                                <Sun className="h-8 w-8" />
                                <span>Light</span>
                                {theme === 'light' && (
                                    <Check className="h-4 w-4 absolute top-2 right-2" />
                                )}
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => setTheme('dark')}
                                data-testid="theme-dark-btn"
                            >
                                <Moon className="h-8 w-8" />
                                <span>Dark</span>
                                {theme === 'dark' && (
                                    <Check className="h-4 w-4 absolute top-2 right-2" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Settings className="h-5 w-5" />
                            Informații cont
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-4 border border-border">
                            <span className="text-sm text-muted-foreground">ID utilizator</span>
                            <span className="font-mono text-xs">{user?.id}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 border border-border">
                            <span className="text-sm text-muted-foreground">Cont creat</span>
                            <span className="text-sm">
                                {new Date(user?.created_at).toLocaleDateString('ro-RO')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-8"
                    data-testid="save-settings-btn"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Se salvează...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Salvează modificările
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;
