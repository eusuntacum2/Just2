import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scale, Sun, Moon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
    const { register } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Parolele nu coincid');
            return;
        }
        
        if (formData.password.length < 6) {
            toast.error('Parola trebuie să aibă minim 6 caractere');
            return;
        }

        setLoading(true);
        try {
            await register(formData.email, formData.password, formData.name);
            toast.success('Cont creat cu succes!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Înregistrare eșuată');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
                        <Scale className="h-8 w-8 text-primary" />
                        <span className="font-serif text-xl font-bold tracking-tight">Portal Dosare</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle">
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </div>

                <div className="max-w-md w-full space-y-8">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                            Cont nou
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">Înregistrare</h1>
                        <p className="text-muted-foreground mt-2">
                            Creează un cont pentru a începe monitorizarea dosarelor.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nume complet</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Ion Popescu"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="h-12"
                                data-testid="name-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nume@exemplu.ro"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="h-12"
                                data-testid="email-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Parolă</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="h-12 pr-10"
                                    data-testid="password-input"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-12 w-12"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmă parola</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                className="h-12"
                                data-testid="confirm-password-input"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 transition-all duration-300 hover:-translate-y-0.5"
                            disabled={loading}
                            data-testid="register-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Se creează contul...
                                </>
                            ) : (
                                'Creează cont'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Ai deja cont?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
                            Autentifică-te
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Panel - Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1545184180-25d471fe75eb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxsYXd5ZXIlMjB3b3JraW5nJTIwb24lMjBsYXB0b3AlMjBjb2ZmZWUlMjBzaG9wfGVufDB8fHx8MTc3MDMwNTU0NXww&ixlib=rb-4.1.0&q=85"
                    alt="Lawyer working"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
            </div>
        </div>
    );
};

export default RegisterPage;
