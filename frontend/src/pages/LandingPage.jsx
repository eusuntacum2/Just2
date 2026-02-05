import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Scale, Search, Bell, FileText, Users, ChevronRight, Shield, Clock, Sun, Moon } from 'lucide-react';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/70">
                <div className="px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
                        <Scale className="h-8 w-8 text-primary" />
                        <span className="font-serif text-xl font-bold tracking-tight">Portal Dosare</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            data-testid="theme-toggle"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        {isAuthenticated ? (
                            <Button onClick={() => navigate('/dashboard')} data-testid="dashboard-btn">
                                Dashboard
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" onClick={() => navigate('/login')} data-testid="login-btn">
                                    Autentificare
                                </Button>
                                <Button onClick={() => navigate('/register')} data-testid="register-btn">
                                    Înregistrare
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative px-6 md:px-12 lg:px-24 py-20 md:py-32">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-6 animate-slide-up">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
                            Portal Instanțe România
                        </p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight">
                            Monitorizează-ți
                            <span className="text-accent block mt-2">dosarele juridice</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Caută, monitorizează și primește notificări în timp real pentru toate dosarele de pe portalul just.ro. Acces direct la informații oficiale de la instanțele din România.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button 
                                size="lg" 
                                className="h-14 px-8 text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                                data-testid="hero-cta-btn"
                            >
                                Începe acum
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg"
                                className="h-14 px-8 text-base border-2"
                                onClick={() => navigate(isAuthenticated ? '/search' : '/login')}
                                data-testid="hero-search-btn"
                            >
                                <Search className="mr-2 h-5 w-5" />
                                Caută dosar
                            </Button>
                        </div>
                    </div>
                    <div className="md:col-span-5 relative">
                        <div className="aspect-square relative">
                            <img 
                                src="https://images.unsplash.com/photo-1643324896137-f0928e76202a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGp1c3RpY2UlMjBzY2FsZXMlMjBnb2xkJTIwYW5kJTIwYmxhY2t8ZW58MHx8fHwxNzcwMzA1NTM5fDA&ixlib=rb-4.1.0&q=85"
                                alt="Justice scales"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 md:px-12 lg:px-24 py-20 bg-muted/30">
                <div className="text-center mb-16">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                        Funcționalități
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Tot ce ai nevoie pentru dosarele tale
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            icon: Search,
                            title: 'Căutare avansată',
                            description: 'Caută după număr dosar, parte sau instituție. Suport pentru căutare bulk.'
                        },
                        {
                            icon: Bell,
                            title: 'Notificări în timp real',
                            description: 'Primește alerte când apar modificări în dosarele monitorizate.'
                        },
                        {
                            icon: FileText,
                            title: 'Istoric complet',
                            description: 'Vizualizează toate ședințele, soluțiile și căile de atac.'
                        },
                        {
                            icon: Shield,
                            title: 'Securitate',
                            description: 'Date protejate cu autentificare JWT și acces controlat.'
                        }
                    ].map((feature, index) => (
                        <div 
                            key={index}
                            className="bg-card border border-border p-6 h-full transition-all duration-300 hover:shadow-md"
                            data-testid={`feature-card-${index}`}
                        >
                            <feature.icon className="h-10 w-10 text-accent mb-4" />
                            <h3 className="font-serif text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-6 md:px-12 lg:px-24 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { value: '200+', label: 'Instanțe acoperite' },
                        { value: '24/7', label: 'Disponibilitate' },
                        { value: 'API', label: 'Sursa oficială just.ro' },
                        { value: '∞', label: 'Dosare monitorizabile' }
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <p className="font-mono text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 md:px-12 lg:px-24 py-20 bg-primary text-primary-foreground">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Gata să îți monitorizezi dosarele?
                    </h2>
                    <p className="text-primary-foreground/80 text-lg">
                        Creează un cont gratuit și începe să urmărești evoluția dosarelor tale în timp real.
                    </p>
                    <Button 
                        size="lg"
                        variant="secondary"
                        className="h-14 px-8 text-base transition-all duration-300 hover:-translate-y-0.5"
                        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                        data-testid="cta-register-btn"
                    >
                        Creează cont gratuit
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 md:px-12 lg:px-24 py-12 border-t border-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Scale className="h-6 w-6 text-muted-foreground" />
                        <span className="font-serif text-lg font-bold">Portal Dosare</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2024 Portal Dosare. Date furnizate de just.ro
                    </p>
                    <div className="flex items-center gap-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Actualizări în timp real
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
