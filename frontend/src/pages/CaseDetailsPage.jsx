import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
    Scale, Sun, Moon, LogIn, ArrowLeft, Loader2, 
    FileText, Users, Calendar, Gavel, AlertCircle, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CaseDetailsPage = () => {
    const { isAuthenticated, api } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const numarDosar = searchParams.get('numar');
    const institutie = searchParams.get('institutie');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (numarDosar) {
            fetchCaseDetails();
        }
    }, [numarDosar, institutie]);

    const fetchCaseDetails = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(`${API_URL}/dosare/detalii`, {
                numar_dosar: numarDosar,
                institutie: institutie || null
            });
            
            if (!response.data.found) {
                setError(response.data.error || 'Dosarul nu a fost găsit');
                return;
            }
            
            setData(response.data);
        } catch (err) {
            setError('Eroare la încărcarea dosarului');
        } finally {
            setLoading(false);
        }
    };

    const addToMonitoring = async () => {
        if (!isAuthenticated) {
            toast.error('Autentifică-te pentru a monitoriza dosare');
            navigate('/login');
            return;
        }
        
        try {
            await api.post('/monitorizare', {
                numar_dosar: numarDosar,
                institutie: institutie || data?.detalii?.instanta || '',
                alias: ''
            });
            toast.success(`Dosar ${numarDosar} adăugat la monitorizare`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la adăugare');
        }
    };

    return (
        <div className="min-h-screen bg-background" data-testid="case-details-page">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
                        <Scale className="h-6 w-6 text-primary" />
                        <span className="font-serif text-lg font-semibold">Portal Dosare</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full h-8 w-8"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        {isAuthenticated ? (
                            <Button size="sm" onClick={() => navigate('/dashboard')}>
                                Dashboard
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => navigate('/login')}>
                                <LogIn className="mr-1 h-4 w-4" />
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Back Button */}
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la căutare
                </Button>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Se încarcă dosarul...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Dosar negăsit</h3>
                            <p className="text-muted-foreground">{error}</p>
                            <Button className="mt-4" onClick={() => navigate('/search')}>
                                Caută alt dosar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Case Details */}
                {data && !loading && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold font-mono">{data.detalii.numar_dosar}</h1>
                                <p className="text-muted-foreground">{data.detalii.instanta}</p>
                            </div>
                            <Button onClick={addToMonitoring} data-testid="monitor-btn">
                                <Plus className="mr-2 h-4 w-4" />
                                Monitorizează
                            </Button>
                        </div>

                        {/* Section A: Detalii Dosar */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Detalii Dosar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {[
                                                { label: "Număr dosar", value: data.detalii.numar_dosar },
                                                { label: "Număr dosar vechi", value: data.detalii.numar_dosar_vechi },
                                                { label: "Data", value: data.detalii.data },
                                                { label: "Instanță", value: data.detalii.instanta },
                                                { label: "Departament/Secție", value: data.detalii.departament },
                                                { label: "Obiect", value: data.detalii.obiect },
                                                { label: "Stadiu procesual", value: data.detalii.stadiu_procesual },
                                                { label: "Categorie caz", value: data.detalii.categorie_caz },
                                                { label: "Data ultimei modificări", value: data.detalii.ultima_modificare }
                                            ].map((row, idx) => (
                                                <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                                    <td className="px-4 py-2 font-medium w-1/3 border-r">{row.label}</td>
                                                    <td className="px-4 py-2">{row.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section B: Părți implicate */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-primary" />
                                    Părți implicate
                                    <Badge variant="secondary" className="ml-2">{data.parti.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.parti.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">Nicio parte înregistrată</p>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Nume</th>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Calitate</th>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Info</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.parti.map((parte, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                                                        <td className="px-4 py-2 border-b">{parte.nume}</td>
                                                        <td className="px-4 py-2 border-b">
                                                            <Badge variant="outline">{parte.calitate}</Badge>
                                                        </td>
                                                        <td className="px-4 py-2 border-b text-muted-foreground">{parte.info}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section C: Ședințe de judecată */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Ședințe de judecată
                                    <Badge variant="secondary" className="ml-2">{data.sedinte.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.sedinte.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">Nicio ședință înregistrată</p>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold border-b whitespace-nowrap">Data ședință</th>
                                                    <th className="px-3 py-2 text-left font-semibold border-b">Ora</th>
                                                    <th className="px-3 py-2 text-left font-semibold border-b">Complet</th>
                                                    <th className="px-3 py-2 text-left font-semibold border-b min-w-[300px]">Soluție</th>
                                                    <th className="px-3 py-2 text-left font-semibold border-b whitespace-nowrap">Data pronunțare</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.sedinte.map((sedinta, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                                                        <td className="px-3 py-2 border-b font-mono whitespace-nowrap">{sedinta.data_sedinta}</td>
                                                        <td className="px-3 py-2 border-b">{sedinta.ora}</td>
                                                        <td className="px-3 py-2 border-b">{sedinta.complet}</td>
                                                        <td className="px-3 py-2 border-b">
                                                            {sedinta.solutie !== '-' ? (
                                                                <div className="max-w-md">
                                                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                                                        {sedinta.solutie}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 border-b font-mono whitespace-nowrap">{sedinta.data_pronuntare}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section D: Căi de atac */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Gavel className="h-5 w-5 text-primary" />
                                    Căi de atac
                                    <Badge variant="secondary" className="ml-2">{data.cai_atac.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.cai_atac.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">Nicio cale de atac înregistrată</p>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Data declarație</th>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Parte declaratoare</th>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Cale atac</th>
                                                    <th className="px-4 py-2 text-left font-semibold border-b">Dosar instanță superioară</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.cai_atac.map((cale, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                                                        <td className="px-4 py-2 border-b font-mono">{cale.data_declaratie}</td>
                                                        <td className="px-4 py-2 border-b">{cale.parte_declaratoare}</td>
                                                        <td className="px-4 py-2 border-b">
                                                            <Badge variant="outline">{cale.cale_atac}</Badge>
                                                        </td>
                                                        <td className="px-4 py-2 border-b font-mono">{cale.dosar_instanta_superioara}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseDetailsPage;
