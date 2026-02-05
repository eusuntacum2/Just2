import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Textarea } from '../components/ui/textarea';
import { 
    Search, Loader2, FileText, Users, Calendar, Upload, 
    ChevronDown, ChevronUp, Plus, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const SearchPage = () => {
    const { api } = useAuth();
    const [loading, setLoading] = useState(false);
    const [institutii, setInstitutii] = useState([]);
    const [results, setResults] = useState([]);
    const [errors, setErrors] = useState([]);
    const [expandedCase, setExpandedCase] = useState(null);
    
    // Single search form
    const [singleForm, setSingleForm] = useState({
        numar_dosar: '',
        nume_parte: '',
        institutie: '',
        data_start: '',
        data_stop: ''
    });

    // Bulk search
    const [bulkText, setBulkText] = useState('');
    const [bulkInstitutie, setBulkInstitutie] = useState('');

    useEffect(() => {
        fetchInstitutii();
    }, []);

    const fetchInstitutii = async () => {
        try {
            const response = await api.get('/institutii');
            setInstitutii(response.data.institutii);
        } catch (error) {
            console.error('Failed to fetch institutions:', error);
        }
    };

    const handleSingleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResults([]);
        setErrors([]);
        
        try {
            const searchData = {
                ...singleForm,
                institutie: singleForm.institutie === 'all' ? '' : singleForm.institutie
            };
            const response = await api.post('/dosare/search', searchData);
            setResults(response.data.results);
            if (response.data.count === 0) {
                toast.info('Nu s-au găsit rezultate');
            } else {
                toast.success(`${response.data.count} dosar(e) găsite`);
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Căutare eșuată');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSearch = async () => {
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
            const response = await api.post('/dosare/search/bulk', {
                numere_dosare: numere,
                institutie: bulkInstitutie === 'all' ? null : (bulkInstitutie || null)
            });
            setResults(response.data.results);
            setErrors(response.data.errors || []);
            toast.success(`${response.data.count} dosar(e) găsite din ${numere.length}`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Căutare bulk eșuată');
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
            const response = await api.post('/dosare/search/csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(response.data.results);
            setErrors(response.data.errors || []);
            toast.success(`${response.data.count} dosar(e) găsite din ${response.data.total_searched}`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Upload CSV eșuat');
        } finally {
            setLoading(false);
        }
    };

    const addToMonitoring = async (dosar) => {
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

    const formatInstitutie = (inst) => {
        if (!inst) return '';
        return inst.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    };

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="search-page">
            {/* Header */}
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Căutare
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Caută dosare</h1>
                <p className="text-muted-foreground mt-1">
                    Caută dosare individual sau în mod bulk folosind API-ul just.ro
                </p>
            </div>

            {/* Search Tabs */}
            <Tabs defaultValue="single" className="space-y-6">
                <TabsList className="h-12">
                    <TabsTrigger value="single" className="h-10 px-6" data-testid="tab-single">
                        <Search className="h-4 w-4 mr-2" />
                        Căutare individuală
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="h-10 px-6" data-testid="tab-bulk">
                        <FileText className="h-4 w-4 mr-2" />
                        Căutare bulk
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="h-10 px-6" data-testid="tab-csv">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CSV
                    </TabsTrigger>
                </TabsList>

                {/* Single Search */}
                <TabsContent value="single">
                    <Card className="border border-border">
                        <CardContent className="p-6">
                            <form onSubmit={handleSingleSearch} className="space-y-6" data-testid="single-search-form">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="numar_dosar">Număr dosar</Label>
                                        <Input
                                            id="numar_dosar"
                                            placeholder="ex: 123/45/2024"
                                            value={singleForm.numar_dosar}
                                            onChange={(e) => setSingleForm({ ...singleForm, numar_dosar: e.target.value })}
                                            className="h-12 font-mono"
                                            data-testid="input-numar-dosar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nume_parte">Nume parte</Label>
                                        <Input
                                            id="nume_parte"
                                            placeholder="ex: Popescu Ion"
                                            value={singleForm.nume_parte}
                                            onChange={(e) => setSingleForm({ ...singleForm, nume_parte: e.target.value })}
                                            className="h-12"
                                            data-testid="input-nume-parte"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instituție</Label>
                                        <Select
                                            value={singleForm.institutie}
                                            onValueChange={(value) => setSingleForm({ ...singleForm, institutie: value === "all" ? "" : value })}
                                        >
                                            <SelectTrigger className="h-12" data-testid="select-institutie">
                                                <SelectValue placeholder="Selectează instituția" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Toate instituțiile</SelectItem>
                                                {institutii.map((inst) => (
                                                    <SelectItem key={inst} value={inst}>
                                                        {formatInstitutie(inst)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="data_start">De la data</Label>
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
                                            <Label htmlFor="data_stop">Până la data</Label>
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
                                </div>
                                <Button 
                                    type="submit" 
                                    className="h-12 px-8"
                                    disabled={loading}
                                    data-testid="search-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Se caută...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Caută
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bulk Search */}
                <TabsContent value="bulk">
                    <Card className="border border-border">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Numere dosare (unul pe linie)</Label>
                                <Textarea
                                    placeholder="123/45/2024
456/78/2024
789/12/2024"
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    className="min-h-[200px] font-mono"
                                    data-testid="bulk-textarea"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instituție (opțional)</Label>
                                <Select value={bulkInstitutie} onValueChange={(value) => setBulkInstitutie(value === "all" ? "" : value)}>
                                    <SelectTrigger className="h-12" data-testid="bulk-select-institutie">
                                        <SelectValue placeholder="Toate instituțiile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toate instituțiile</SelectItem>
                                        {institutii.map((inst) => (
                                            <SelectItem key={inst} value={inst}>
                                                {formatInstitutie(inst)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleBulkSearch}
                                className="h-12 px-8"
                                disabled={loading}
                                data-testid="bulk-search-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Se caută...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Caută toate
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CSV Upload */}
                <TabsContent value="csv">
                    <Card className="border border-border">
                        <CardContent className="p-6 space-y-6">
                            <div className="border-2 border-dashed border-border p-12 text-center">
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    Încarcă un fișier CSV cu numerele dosarelor (un număr pe linie)
                                </p>
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="max-w-xs mx-auto"
                                    disabled={loading}
                                    data-testid="csv-input"
                                />
                            </div>
                            {loading && (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Se procesează fișierul...
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Errors */}
            {errors.length > 0 && (
                <Card className="border border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            {errors.length} dosar(e) negăsite
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {errors.map((err, i) => (
                                <Badge key={i} variant="outline" className="font-mono">
                                    {err.numar}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-serif font-bold">
                        Rezultate ({results.length})
                    </h2>
                    <div className="space-y-4">
                        {results.map((dosar, index) => (
                            <Card 
                                key={index} 
                                className="border border-border overflow-hidden"
                                data-testid={`result-${index}`}
                            >
                                <CardContent className="p-0">
                                    {/* Case Header */}
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setExpandedCase(expandedCase === index ? null : index)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-lg font-bold">{dosar.numar}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatInstitutie(dosar.institutie)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <Badge variant="outline">{dosar.categorieCaz}</Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {dosar.stadiuProcesual}
                                                </p>
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
                                        <div className="border-t border-border p-4 space-y-6 bg-muted/20">
                                            {/* Object */}
                                            {dosar.obiect && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                                                        Obiect
                                                    </p>
                                                    <p className="text-sm">{dosar.obiect}</p>
                                                </div>
                                            )}

                                            {/* Parties */}
                                            {dosar.parti && dosar.parti.length > 0 && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                                        Părți ({dosar.parti.length})
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {dosar.parti.map((parte, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">{parte.nume}</span>
                                                                <span className="text-muted-foreground">
                                                                    ({parte.calitateParte})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hearings */}
                                            {dosar.sedinte && dosar.sedinte.length > 0 && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                                        Ședințe ({dosar.sedinte.length})
                                                    </p>
                                                    <ScrollArea className="max-h-60">
                                                        <div className="space-y-2">
                                                            {dosar.sedinte.map((sedinta, i) => (
                                                                <div key={i} className="p-3 bg-background border border-border">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-mono">
                                                                            {sedinta.data?.split('T')[0]}
                                                                        </span>
                                                                        {sedinta.ora && (
                                                                            <span className="text-muted-foreground">
                                                                                {sedinta.ora}
                                                                            </span>
                                                                        )}
                                                                        {sedinta.complet && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {sedinta.complet}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {sedinta.solutie && (
                                                                        <p className="text-sm mt-2 text-muted-foreground">
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
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => addToMonitoring(dosar)}
                                                    className="h-10"
                                                    data-testid={`monitor-btn-${index}`}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Adaugă la monitorizare
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
