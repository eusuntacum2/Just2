import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Scale, Search, Bell, FileText, ChevronRight, Shield, Clock, Sun, Moon, Building2, Users } from 'lucide-react';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
                        <Scale className="h-7 w-7 text-primary" />
                        <span className="font-serif text-xl font-semibold">Portal Dosare</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
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
            <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                <div className="max-w-3xl mx-auto text-center space-y-8 animate-slide-up">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                        Caută și monitorizează
                        <span className="text-primary block mt-2">dosare juridice</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Accesează informații despre dosarele din toate instanțele din România. 
                        Primește notificări când apar modificări în dosarele tale.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button 
                            size="lg" 
                            className="h-14 px-8 text-base"
                            onClick={() => navigate('/search')}
                            data-testid="hero-search-btn"
                        >
                            <Search className="mr-2 h-5 w-5" />
                            Caută dosare
                        </Button>
                        {!isAuthenticated && (
                            <Button 
                                variant="outline" 
                                size="lg"
                                className="h-14 px-8 text-base"
                                onClick={() => navigate('/register')}
                                data-testid="hero-cta-btn"
                            >
                                Creează cont gratuit
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="border-y border-border bg-muted/30">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="text-center mb-16">
                        <p className="text-sm uppercase tracking-wider text-primary font-medium mb-3">
                            Funcționalități
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Tot ce ai nevoie pentru dosarele tale
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Search,
                                title: 'Căutare avansată',
                                description: 'Caută după număr, parte sau instanță. Suport pentru căutare bulk.'
                            },
                            {
                                icon: Building2,
                                title: '240+ instanțe',
                                description: 'Acces la toate judecătoriile, tribunalele și curțile de apel.'
                            },
                            {
                                icon: Bell,
                                title: 'Notificări',
                                description: 'Primește alerte când apar modificări în dosarele monitorizate.'
                            },
                            {
                                icon: Shield,
                                title: 'Securitate',
                                description: 'Date protejate cu autentificare JWT și acces controlat.'
                            }
                        ].map((feature, index) => (
                            <div 
                                key={index}
                                className="p-6 rounded-xl bg-background border border-border/50 card-hover"
                                data-testid={`feature-card-${index}`}
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { value: '240+', label: 'Instanțe' },
                        { value: '24/7', label: 'Disponibilitate' },
                        { value: 'API', label: 'Sursa just.ro' },
                        { value: '∞', label: 'Dosare' }
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <p className="font-mono text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-t border-border bg-primary text-primary-foreground">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Începe să cauți dosare acum
                        </h2>
                        <p className="text-primary-foreground/80 text-lg">
                            Căutarea este gratuită și nu necesită autentificare. 
                            Creează cont doar pentru monitorizare.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button 
                                size="lg"
                                variant="secondary"
                                className="h-14 px-8 text-base"
                                onClick={() => navigate('/search')}
                                data-testid="cta-search-btn"
                            >
                                <Search className="mr-2 h-5 w-5" />
                                Caută dosare
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Scale className="h-5 w-5 text-muted-foreground" />
                            <span className="font-serif font-semibold">Portal Dosare</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Date furnizate de portalul just.ro
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Actualizări în timp real
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
