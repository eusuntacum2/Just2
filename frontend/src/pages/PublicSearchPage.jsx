import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Textarea } from '../components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { 
    Search, Loader2, FileText, Users, Calendar, Upload, Scale,
    ChevronDown, ChevronUp, Plus, AlertCircle, Sun, Moon,
    ChevronLeft, ChevronRight, LogIn, Check, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PublicSearchPage = () => {
    const { isAuthenticated, api } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [institutii, setInstitutii] = useState([]);
    const [results, setResults] = useState([]);
    const [errors, setErrors] = useState([]);
    const [expandedCase, setExpandedCase] = useState(null);
    const [instOpen, setInstOpen] = useState(false);
    const [instOpenBulk, setInstOpenBulk] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        total_count: 0,
        total_pages: 1,
        page_size: 20
    });
    
    const [singleForm, setSingleForm] = useState({
        numar_dosar: '',
        nume_parte: '',
        institutie: '',
        data_start: '',
        data_stop: ''
    });

    const [bulkText, setBulkText] = useState('');
    const [bulkInstitutie, setBulkInstitutie] = useState('');

    useEffect(() => {
        fetchInstitutii();
    }, []);

    const fetchInstitutii = async () => {
        try {
            const response = await axios.get(`${API_URL}/institutii`);
            setInstitutii(response.data.institutii);
        } catch (error) {
            console.error('Failed to fetch institutions:', error);
        }
    };

    const selectedInstitutie = useMemo(() => {
        return institutii.find(i => i.key === singleForm.institutie);
    }, [institutii, singleForm.institutie]);

    const selectedBulkInstitutie = useMemo(() => {
        return institutii.find(i => i.key === bulkInstitutie);
    }, [institutii, bulkInstitutie]);

    const handleSingleSearch = async (e, page = 1) => {
        if (e) e.preventDefault();
        setLoading(true);
        setResults([]);
        setErrors([]);
        
        try {
            const requestData = { page, page_size: 20 };
            if (singleForm.numar_dosar) requestData.numar_dosar = singleForm.numar_dosar;
            if (singleForm.nume_parte) requestData.nume_parte = singleForm.nume_parte;
            if (singleForm.institutie) requestData.institutie = singleForm.institutie;
            if (singleForm.data_start) requestData.data_start = singleForm.data_start;
            if (singleForm.data_stop) requestData.data_stop = singleForm.data_stop;

            const response = await axios.post(`${API_URL}/dosare/search`, requestData);
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            setResults(response.data.results);
            setPagination({
                page: response.data.page,
                total_count: response.data.total_count,
                total_pages: response.data.total_pages,
                page_size: response.data.page_size
            });
            
            if (response.data.total_count === 0) {
                toast.info('Nu s-au găsit rezultate');
            } else {
                toast.success(`${response.data.total_count} dosar(e) găsite`);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Căutare eșuată');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSearch = async (page = 1) => {
        if (!bulkText.trim()) {
            toast.error('Introduceți numerele dosarelor');
            return;
        }

        const numere = bulkText.split('\n').map(n => n.trim()).filter(n => n);
        if (numere.length === 0) {
            toast.error('Niciun număr valid de dosar');
            return;
        }

        setLoading(true);
        setResults([]);
        setErrors([]);

        try {
            const requestData = { numere_dosare: numere, page, page_size: 20 };
            if (bulkInstitutie) requestData.institutie = bulkInstitutie;

            const response = await axios.post(`${API_URL}/dosare/search/bulk`, requestData);
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            setResults(response.data.results);
            setErrors(response.data.errors || []);
            setPagination({
                page: response.data.page,
                total_count: response.data.total_count,
                total_pages: response.data.total_pages,
                page_size: response.data.page_size
            });
            toast.success(`${response.data.total_count} dosar(e) găsite din ${numere.length}`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Căutare bulk eșuată');
        } finally {
            setLoading(false);
        }
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Fișierul trebuie să fie CSV');
            return;
        }

        setLoading(true);
        setResults([]);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/dosare/search/csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            setResults(response.data.results);
            setErrors(response.data.errors || []);
            setPagination({
                page: 1,
                total_count: response.data.total_count,
                total_pages: 1,
                page_size: response.data.total_count
            });
            toast.success(`${response.data.total_count} dosar(e) găsite din ${response.data.total_searched}`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload CSV eșuat');
        } finally {
            setLoading(false);
        }
    };

    const addToMonitoring = async (dosar) => {
        if (!isAuthenticated) {
            toast.error('Trebuie să fii autentificat pentru a monitoriza dosare');
            navigate('/login');
            return;
        }
        
        try {
            await api.post('/monitorizare', {
                numar_dosar: dosar.numar,
                institutie: dosar.institutie,
                alias: ''
            });
            toast.success(`Dosar ${dosar.numar} adăugat la monitorizare`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la adăugare');
        }
    };

    const getInstitutieDisplay = (key) => {
        const inst = institutii.find(i => i.key === key);
        return inst ? inst.name : key;
    };

    const goToPage = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            handleSingleSearch(null, newPage);
        }
    };

    return (
        <div className="min-h-screen bg-background" data-testid="public-search-page">
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
                            </Button>
                        ) : (
                            <Button onClick={() => navigate('/login')} data-testid="login-btn">
                                <LogIn className="mr-2 h-4 w-4" />
                                Autentificare
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Caută dosare în instanțe
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Accesează informații despre dosare din toate instanțele din România.
                        {!isAuthenticated && (
                            <span className="block mt-2 text-base">
                                <Link to="/login" className="text-primary hover:underline">Autentifică-te</Link> pentru a monitoriza dosare.
                            </span>
                        )}
                    </p>
                </div>

                {/* Search Form */}
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-8">
                        <Tabs defaultValue="single" className="space-y-8">
                            <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50">
                                <TabsTrigger value="single" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-single">
                                    <Search className="h-4 w-4 mr-2" />
                                    Căutare
                                </TabsTrigger>
                                <TabsTrigger value="bulk" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-bulk">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Căutare bulk
                                </TabsTrigger>
                                <TabsTrigger value="csv" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-csv">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import CSV
                                </TabsTrigger>
                            </TabsList>

                            {/* Single Search */}
                            <TabsContent value="single" className="animate-fade-in">
                                <form onSubmit={handleSingleSearch} className="space-y-6" data-testid="single-search-form">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="numar_dosar" className="text-sm font-medium">Număr dosar</Label>
                                            <Input
                                                id="numar_dosar"
                                                placeholder="ex: 123/45/2024"
                                                value={singleForm.numar_dosar}
                                                onChange={(e) => setSingleForm({ ...singleForm, numar_dosar: e.target.value })}
                                                className="h-12 font-mono text-base"
                                                data-testid="input-numar-dosar"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nume_parte" className="text-sm font-medium">Parte implicată</Label>
                                            <Input
                                                id="nume_parte"
                                                placeholder="ex: Popescu Ion"
                                                value={singleForm.nume_parte}
                                                onChange={(e) => setSingleForm({ ...singleForm, nume_parte: e.target.value })}
                                                className="h-12 text-base"
                                                data-testid="input-nume-parte"
                                            />
                                        </div>
                                    </div>

                                    {/* Institution Selector with Search */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Instanță</Label>
                                        <Popover open={instOpen} onOpenChange={setInstOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={instOpen}
                                                    className="w-full h-12 justify-between text-base font-normal"
                                                    data-testid="select-institutie"
                                                >
                                                    <span className="flex items-center gap-2 truncate">
                                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        {selectedInstitutie ? selectedInstitutie.name : "Toate instanțele"}
                                                    </span>
                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[500px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Caută instanță..." className="h-11" />
                                                    <CommandList>
                                                        <CommandEmpty>Nicio instanță găsită.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value=""
                                                                onSelect={() => {
                                                                    setSingleForm({ ...singleForm, institutie: '' });
                                                                    setInstOpen(false);
                                                                }}
                                                            >
                                                                <Check className={`mr-2 h-4 w-4 ${!singleForm.institutie ? 'opacity-100' : 'opacity-0'}`} />
                                                                Toate instanțele
                                                            </CommandItem>
                                                            {institutii.map((inst) => (
                                                                <CommandItem
                                                                    key={inst.key}
                                                                    value={inst.name}
                                                                    onSelect={() => {
                                                                        setSingleForm({ ...singleForm, institutie: inst.key });
                                                                        setInstOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={`mr-2 h-4 w-4 ${singleForm.institutie === inst.key ? 'opacity-100' : 'opacity-0'}`} />
                                                                    {inst.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="data_start" className="text-sm font-medium">Data dosar (de la)</Label>
                                            <Input
                                                id="data_start"
                                                type="date"
                                                value={singleForm.data_start}
                                                onChange={(e) => setSingleForm({ ...singleForm, data_start: e.target.value })}
                                                className="h-12"
                                                data-testid="input-data-start"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="data_stop" className="text-sm font-medium">Data dosar (până la)</Label>
                                            <Input
                                                id="data_stop"
                                                type="date"
                                                value={singleForm.data_stop}
                                                onChange={(e) => setSingleForm({ ...singleForm, data_stop: e.target.value })}
                                                className="h-12"
                                                data-testid="input-data-stop"
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        size="lg"
                                        className="h-12 px-8"
                                        disabled={loading}
                                        data-testid="search-btn"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Se caută...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="mr-2 h-5 w-5" />
                                                Caută dosare
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Bulk Search */}
                            <TabsContent value="bulk" className="space-y-6 animate-fade-in">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Numere dosare (unul pe linie)</Label>
                                    <Textarea
                                        placeholder={"123/45/2024\n456/78/2024\n789/12/2024"}
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                        className="min-h-[180px] font-mono text-base"
                                        data-testid="bulk-textarea"
                                    />
                                </div>
                                
                                {/* Bulk Institution Selector */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Instanță (opțional)</Label>
                                    <Popover open={instOpenBulk} onOpenChange={setInstOpenBulk}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={instOpenBulk}
                                                className="w-full h-12 justify-between text-base font-normal"
                                                data-testid="bulk-select-institutie"
                                            >
                                                <span className="flex items-center gap-2 truncate">
                                                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    {selectedBulkInstitutie ? selectedBulkInstitutie.name : "Toate instanțele"}
                                                </span>
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[500px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Caută instanță..." className="h-11" />
                                                <CommandList>
                                                    <CommandEmpty>Nicio instanță găsită.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value=""
                                                            onSelect={() => {
                                                                setBulkInstitutie('');
                                                                setInstOpenBulk(false);
                                                            }}
                                                        >
                                                            <Check className={`mr-2 h-4 w-4 ${!bulkInstitutie ? 'opacity-100' : 'opacity-0'}`} />
                                                            Toate instanțele
                                                        </CommandItem>
                                                        {institutii.map((inst) => (
                                                            <CommandItem
                                                                key={inst.key}
                                                                value={inst.name}
                                                                onSelect={() => {
                                                                    setBulkInstitutie(inst.key);
                                                                    setInstOpenBulk(false);
                                                                }}
                                                            >
                                                                <Check className={`mr-2 h-4 w-4 ${bulkInstitutie === inst.key ? 'opacity-100' : 'opacity-0'}`} />
                                                                {inst.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Button 
                                    onClick={() => handleBulkSearch(1)}
                                    size="lg"
                                    className="h-12 px-8"
                                    disabled={loading}
                                    data-testid="bulk-search-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Se caută...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-5 w-5" />
                                            Caută toate
                                        </>
                                    )}
                                </Button>
                            </TabsContent>

                            {/* CSV Upload */}
                            <TabsContent value="csv" className="animate-fade-in">
                                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/20">
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-6">
                                        Încarcă un fișier CSV cu numerele dosarelor<br/>
                                        <span className="text-sm">(un număr pe linie sau în prima coloană)</span>
                                    </p>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCSVUpload}
                                        className="max-w-xs mx-auto cursor-pointer"
                                        disabled={loading}
                                        data-testid="csv-input"
                                    />
                                </div>
                                {loading && (
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground pt-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Se procesează fișierul...
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Errors */}
                {errors.length > 0 && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                {errors.length} dosar(e) negăsite
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {errors.map((err, i) => (
                                    <Badge key={i} variant="outline" className="font-mono text-sm">
                                        {err.numar}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">
                                Rezultate
                                <span className="text-muted-foreground font-normal ml-2">({pagination.total_count})</span>
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Pagina {pagination.page} din {pagination.total_pages}
                            </p>
                        </div>

                        <div className="space-y-4 stagger-children">
                            {results.map((dosar, index) => (
                                <Card 
                                    key={index} 
                                    className="border-border/50 overflow-hidden card-hover"
                                    data-testid={`result-${index}`}
                                >
                                    <CardContent className="p-0">
                                        {/* Case Header */}
                                        <div 
                                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                            onClick={() => setExpandedCase(expandedCase === index ? null : index)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-mono text-lg font-semibold">{dosar.numar}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {getInstitutieDisplay(dosar.institutie)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-sm font-mono text-muted-foreground">{dosar.data?.split('T')[0]}</p>
                                                    {dosar.stadiuProcesual && (
                                                        <Badge variant="secondary" className="mt-1">{dosar.stadiuProcesual}</Badge>
                                                    )}
                                                </div>
                                                {expandedCase === index ? (
                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {expandedCase === index && (
                                            <div className="border-t border-border p-5 space-y-6 bg-muted/10 animate-slide-down">
                                                {/* Basic Info Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                                            Data înregistrării
                                                        </p>
                                                        <p className="font-mono font-medium">{dosar.data?.split('T')[0] || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                                            Stadiu procesual
                                                        </p>
                                                        <p className="font-medium">{dosar.stadiuProcesual || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                                            Categorie
                                                        </p>
                                                        <p className="font-medium">{dosar.categorieCaz || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                                            Departament
                                                        </p>
                                                        <p className="font-medium">{dosar.departament || '-'}</p>
                                                    </div>
                                                </div>

                                                {/* Object */}
                                                {dosar.obiect && (
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                                            Obiect
                                                        </p>
                                                        <p className="text-sm leading-relaxed">{dosar.obiect}</p>
                                                    </div>
                                                )}

                                                {/* Parties */}
                                                {dosar.parti && dosar.parti.length > 0 && (
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                                                            Părți implicate ({dosar.parti.length})
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {dosar.parti.slice(0, 10).map((parte, i) => (
                                                                <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/50">
                                                                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                    <span className="font-medium text-sm truncate">{parte.nume}</span>
                                                                    <Badge variant="outline" className="text-xs ml-auto shrink-0">
                                                                        {parte.calitateParte}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                            {dosar.parti.length > 10 && (
                                                                <p className="text-sm text-muted-foreground col-span-2 text-center py-2">
                                                                    ... și încă {dosar.parti.length - 10} părți
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Hearings */}
                                                {dosar.sedinte && dosar.sedinte.length > 0 && (
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                                                            Ședințe ({dosar.sedinte.length})
                                                        </p>
                                                        <ScrollArea className="max-h-64">
                                                            <div className="space-y-2">
                                                                {dosar.sedinte.map((sedinta, i) => (
                                                                    <div key={i} className="p-4 bg-background rounded-lg border border-border/50">
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="font-mono font-medium">
                                                                                {sedinta.data?.split('T')[0]}
                                                                            </span>
                                                                            {sedinta.ora && (
                                                                                <span className="text-muted-foreground">
                                                                                    ora {sedinta.ora}
                                                                                </span>
                                                                            )}
                                                                            {sedinta.complet && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    {sedinta.complet}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {sedinta.solutie && (
                                                                            <p className="text-sm mt-2 text-muted-foreground leading-relaxed">
                                                                                {sedinta.solutieSumar || sedinta.solutie}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-2 border-t border-border">
                                                    <Button
                                                        onClick={() => addToMonitoring(dosar)}
                                                        data-testid={`monitor-btn-${index}`}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        {isAuthenticated ? 'Adaugă la monitorizare' : 'Autentifică-te pentru monitorizare'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-6">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    data-testid="prev-page-btn"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.total_pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.page >= pagination.total_pages - 2) {
                                            pageNum = pagination.total_pages - 4 + i;
                                        } else {
                                            pageNum = pagination.page - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => goToPage(pageNum)}
                                                data-testid={`page-${pageNum}-btn`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.total_pages}
                                    data-testid="next-page-btn"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && results.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Caută dosare</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Completează formularul pentru a căuta dosare în baza de date a instanțelor din România.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicSearchPage;
