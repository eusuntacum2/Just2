import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
    Search, Loader2, Scale, Sun, Moon, LogIn, 
    FileSpreadsheet, FileText, FileDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TABLE_HEADERS = [
    { key: "termen_cautare", label: "Termen", width: "w-24" },
    { key: "tip_detectat", label: "Tip", width: "w-20" },
    { key: "numar_dosar", label: "Nr. Dosar", width: "w-28" },
    { key: "instanta", label: "Instanță", width: "w-32" },
    { key: "obiect", label: "Obiect", width: "w-40" },
    { key: "stadiu_procesual", label: "Stadiu", width: "w-20" },
    { key: "data", label: "Data", width: "w-24" },
    { key: "ultima_modificare", label: "Modif.", width: "w-24" },
    { key: "categorie_caz", label: "Categorie", width: "w-24" },
    { key: "nume_parte", label: "Parte", width: "w-32" },
    { key: "calitate_parte", label: "Calitate", width: "w-24" },
    { key: "observatii", label: "Observații", width: "w-32" }
];

const PublicSearchPage = () => {
    const { isAuthenticated, api } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        total_count: 0,
        total_pages: 1,
        page_size: 20
    });

    const handleSearch = async (page = 1) => {
        const terms = searchText.split('\n').map(t => t.trim()).filter(t => t);
        
        if (terms.length === 0) {
            toast.error('Introduceți cel puțin un termen de căutare');
            return;
        }

        setLoading(true);
        setRows([]);

        try {
            const response = await axios.post(`${API_URL}/dosare/search/universal`, {
                termeni: terms,
                page,
                page_size: 20
            });
            
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            
            setRows(response.data.rows);
            setPagination({
                page: response.data.page,
                total_count: response.data.total_count,
                total_pages: response.data.total_pages,
                page_size: response.data.page_size
            });
            
            if (response.data.total_count === 0) {
                toast.info('Nu s-au găsit rezultate');
            } else {
                toast.success(`${response.data.total_count} dosar(e) găsit(e)`);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Căutare eșuată');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        const terms = searchText.split('\n').map(t => t.trim()).filter(t => t);
        
        if (terms.length === 0) {
            toast.error('Introduceți termeni de căutare înainte de export');
            return;
        }

        setExporting(format);

        try {
            const response = await axios.post(
                `${API_URL}/dosare/export/${format}`,
                { termeni: terms, page: 1, page_size: 10000 },
                { responseType: 'blob' }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = `dosare_export.${format}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename=(.+)/);
                if (match) filename = match[1];
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(`Export ${format.toUpperCase()} descărcat`);
        } catch (error) {
            toast.error(`Eroare la export ${format.toUpperCase()}`);
        } finally {
            setExporting(null);
        }
    };

    const goToPage = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            handleSearch(newPage);
        }
    };

    const addToMonitoring = async (numarDosar, instanta) => {
        if (!isAuthenticated) {
            toast.error('Autentifică-te pentru a monitoriza dosare');
            navigate('/login');
            return;
        }
        
        try {
            await api.post('/monitorizare', {
                numar_dosar: numarDosar,
                institutie: instanta,
                alias: ''
            });
            toast.success(`Dosar ${numarDosar} adăugat la monitorizare`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la adăugare');
        }
    };

    return (
        <div className="min-h-screen bg-background" data-testid="public-search-page">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
                <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
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
                            data-testid="theme-toggle"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        {isAuthenticated ? (
                            <Button size="sm" onClick={() => navigate('/dashboard')} data-testid="dashboard-btn">
                                Dashboard
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => navigate('/login')} data-testid="login-btn">
                                <LogIn className="mr-1 h-4 w-4" />
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-full mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Căutare Dosare
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Căutare după număr dosar sau nume parte • Suportă diacritice (Iasi = IAȘI)
                    </p>
                </div>

                {/* Search Form */}
                <Card className="border-border/50">
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Termeni de căutare (unul pe linie)
                            </Label>
                            <Textarea
                                placeholder={"8893/99/2009\nPopescu Ion"}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="min-h-[100px] font-mono text-sm"
                                data-testid="search-textarea"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                            <Button 
                                onClick={() => handleSearch(1)}
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

                            <div className="flex gap-1 ml-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('xlsx')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-xlsx-btn"
                                >
                                    {exporting === 'xlsx' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileSpreadsheet className="h-4 w-4" />
                                    )}
                                    <span className="ml-1 hidden sm:inline">Excel</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('csv')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-csv-btn"
                                >
                                    {exporting === 'csv' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )}
                                    <span className="ml-1 hidden sm:inline">CSV</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('txt')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-txt-btn"
                                >
                                    {exporting === 'txt' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileDown className="h-4 w-4" />
                                    )}
                                    <span className="ml-1 hidden sm:inline">TXT</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table - Compact, no horizontal scroll */}
                {rows.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Rezultate
                                <span className="text-muted-foreground font-normal ml-2 text-sm">
                                    ({pagination.total_count} dosar{pagination.total_count !== 1 ? 'e' : ''})
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Pag. {pagination.page}/{pagination.total_pages}
                            </p>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50">
                                    <tr>
                                        {TABLE_HEADERS.map((header) => (
                                            <th 
                                                key={header.key}
                                                className="px-2 py-2 text-left font-semibold whitespace-nowrap border-b"
                                            >
                                                {header.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIdx) => (
                                        <tr 
                                            key={rowIdx}
                                            className="hover:bg-muted/30 border-b last:border-b-0"
                                            data-testid={`result-row-${rowIdx}`}
                                        >
                                            <td className="px-2 py-2 font-mono truncate max-w-[100px]" title={row.termen_cautare}>
                                                {row.termen_cautare}
                                            </td>
                                            <td className="px-2 py-2">
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                    row.tip_detectat === 'Număr dosar' 
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                    {row.tip_detectat === 'Număr dosar' ? 'Dosar' : 'Parte'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 font-mono">
                                                {row.numar_dosar && (
                                                    <button
                                                        onClick={() => addToMonitoring(row.numar_dosar, row.instanta)}
                                                        className="text-primary hover:underline text-left"
                                                        title="Click pentru monitorizare"
                                                    >
                                                        {row.numar_dosar}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[120px]" title={row.instanta}>
                                                {row.instanta}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[150px]" title={row.obiect}>
                                                {row.obiect}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[80px]" title={row.stadiu_procesual}>
                                                {row.stadiu_procesual}
                                            </td>
                                            <td className="px-2 py-2 font-mono whitespace-nowrap">
                                                {row.data}
                                            </td>
                                            <td className="px-2 py-2 font-mono whitespace-nowrap">
                                                {row.ultima_modificare}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[80px]" title={row.categorie_caz}>
                                                {row.categorie_caz}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[120px]" title={row.nume_parte}>
                                                {row.nume_parte}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[80px]" title={row.calitate_parte}>
                                                {row.calitate_parte}
                                            </td>
                                            <td className="px-2 py-2 truncate max-w-[120px] text-muted-foreground italic" title={row.observatii}>
                                                {row.observatii}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-1 pt-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
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
                                                className="h-8 w-8"
                                                onClick={() => goToPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.total_pages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && rows.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
                            <Search className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Caută dosare</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Introdu numere de dosar (123/45/2024) sau nume părți pentru a căuta în instanțe.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicSearchPage;
