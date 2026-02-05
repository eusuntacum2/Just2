import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scale, Sun, Moon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            toast.success('Autentificare reușită!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Autentificare eșuată');
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
                            Bine ai revenit
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">Autentificare</h1>
                        <p className="text-muted-foreground mt-2">
                            Introdu credențialele pentru a accesa contul tău.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
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

                        <Button
                            type="submit"
                            className="w-full h-12 transition-all duration-300 hover:-translate-y-0.5"
                            disabled={loading}
                            data-testid="login-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Se autentifică...
                                </>
                            ) : (
                                'Autentificare'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Nu ai cont?{' '}
                        <Link to="/register" className="text-primary font-medium hover:underline" data-testid="register-link">
                            Înregistrează-te
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Panel - Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1571055931484-22dce9d6c510?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXclMjBvZmZpY2UlMjBpbnRlcmlvciUyMG1pbmltYWxpc3R8ZW58MHx8fHwxNzcwMzA1NTM4fDA&ixlib=rb-4.1.0&q=85"
                    alt="Modern law office"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
            </div>
        </div>
    );
};

export default LoginPage;
