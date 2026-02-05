import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
    FileText, RefreshCw, Trash2, Loader2, Search, 
    Calendar, Users, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const MonitoredPage = () => {
    const { api } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(null);
    const [expandedCase, setExpandedCase] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const response = await api.get('/monitorizare');
            setCases(response.data.cases);
        } catch (error) {
            toast.error('Eroare la încărcarea dosarelor');
        } finally {
            setLoading(false);
        }
    };

    const refreshCase = async (caseId) => {
        setRefreshing(caseId);
        try {
            const response = await api.post(`/monitorizare/${caseId}/refresh`);
            if (response.data.has_changes) {
                toast.success('Dosarul a fost actualizat! Verifică notificările.');
            } else {
                toast.info('Nicio modificare detectată');
            }
            fetchCases();
        } catch (error) {
            toast.error('Eroare la actualizare');
        } finally {
            setRefreshing(null);
        }
    };

    const removeCase = async (caseId) => {
        try {
            await api.delete(`/monitorizare/${caseId}`);
            setCases(cases.filter(c => c.id !== caseId));
            toast.success('Dosar eliminat din monitorizare');
        } catch (error) {
            toast.error('Eroare la eliminare');
        }
    };

    const formatInstitutie = (inst) => {
        if (!inst) return '';
        return inst.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    };

    const filteredCases = cases.filter(c => 
        c.numar_dosar.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.institutie?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.alias?.toLowerCase().includes(searchFilter.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6 md:p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-12 space-y-8" data-testid="monitored-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Monitorizare
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Dosare monitorizate</h1>
                    <p className="text-muted-foreground mt-1">
                        {cases.length} dosar(e) în lista de monitorizare
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Caută în dosare..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="search-filter"
                    />
                </div>
            </div>

            {/* Empty State */}
            {cases.length === 0 && (
                <Card className="border-2 border-dashed border-border" data-testid="empty-state">
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold mb-2">Niciun dosar monitorizat</h3>
                        <p className="text-muted-foreground mb-6">
                            Caută dosare și adaugă-le în lista de monitorizare pentru a primi notificări.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Cases List */}
            {filteredCases.length > 0 && (
                <div className="space-y-4">
                    {filteredCases.map((caseItem) => {
                        const snapshot = caseItem.last_snapshot;
                        const isExpanded = expandedCase === caseItem.id;

                        return (
                            <Card 
                                key={caseItem.id} 
                                className="border border-border overflow-hidden"
                                data-testid={`case-${caseItem.id}`}
                            >
                                <CardContent className="p-0">
                                    {/* Case Header */}
                                    <div className="p-4 flex items-center justify-between">
                                        <div 
                                            className="flex items-center gap-4 flex-1 cursor-pointer"
                                            onClick={() => setExpandedCase(isExpanded ? null : caseItem.id)}
                                        >
                                            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-lg font-bold">{caseItem.numar_dosar}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatInstitutie(caseItem.institutie)}
                                                </p>
                                                {caseItem.alias && (
                                                    <Badge variant="secondary" className="mt-1">
                                                        {caseItem.alias}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground hidden md:block">
                                                Verificat: {new Date(caseItem.last_check).toLocaleDateString('ro-RO')}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => refreshCase(caseItem.id)}
                                                disabled={refreshing === caseItem.id}
                                                data-testid={`refresh-${caseItem.id}`}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${refreshing === caseItem.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeCase(caseItem.id)}
                                                data-testid={`remove-${caseItem.id}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExpandedCase(isExpanded ? null : caseItem.id)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && snapshot && (
                                        <div className="border-t border-border p-4 space-y-6 bg-muted/20">
                                            {/* Case Info */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                                        Categorie
                                                    </p>
                                                    <p className="text-sm font-medium">{snapshot.categorieCaz || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                                        Stadiu
                                                    </p>
                                                    <p className="text-sm font-medium">{snapshot.stadiuProcesual || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                                        Data
                                                    </p>
                                                    <p className="text-sm font-medium font-mono">
                                                        {snapshot.data?.split('T')[0] || '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                                        Departament
                                                    </p>
                                                    <p className="text-sm font-medium">{snapshot.departament || '-'}</p>
                                                </div>
                                            </div>

                                            {/* Object */}
                                            {snapshot.obiect && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                                                        Obiect
                                                    </p>
                                                    <p className="text-sm">{snapshot.obiect}</p>
                                                </div>
                                            )}

                                            {/* Parties */}
                                            {snapshot.parti && snapshot.parti.length > 0 && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                                        Părți ({snapshot.parti.length})
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {snapshot.parti.map((parte, i) => (
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
                                            {snapshot.sedinte && snapshot.sedinte.length > 0 && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                                        Ultimele ședințe
                                                    </p>
                                                    <div className="space-y-2">
                                                        {snapshot.sedinte.slice(0, 5).map((sedinta, i) => (
                                                            <div key={i} className="p-3 bg-background border border-border">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-mono">
                                                                        {sedinta.data?.split('T')[0]}
                                                                    </span>
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
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* No snapshot */}
                                    {isExpanded && !snapshot && (
                                        <div className="border-t border-border p-6 text-center bg-muted/20">
                                            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">
                                                Nu există date salvate. Apasă pe butonul de actualizare.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* No results for filter */}
            {cases.length > 0 && filteredCases.length === 0 && (
                <Card className="border border-border">
                    <CardContent className="p-6 text-center">
                        <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                            Niciun dosar nu corespunde căutării "{searchFilter}"
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MonitoredPage;
