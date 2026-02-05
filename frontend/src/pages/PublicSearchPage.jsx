import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { 
    Search, Loader2, Scale, Sun, Moon, LogIn, Download,
    FileSpreadsheet, FileText, FileDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TABLE_HEADERS = [
    "Termen Căutare",
    "Tip Detectat", 
    "Număr Dosar",
    "Instanță",
    "Obiect",
    "Stadiu Procesual",
    "Data",
    "Ultima Modificare",
    "Categorie Caz",
    "Nume Parte",
    "Calitate parte"
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
                toast.success(`${response.data.total_count} rezultat(e) găsite`);
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
            
            // Create download link
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
            toast.error('Trebuie să fii autentificat pentru a monitoriza dosare');
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
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Caută dosare
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Căutare universală după număr dosar sau nume parte. 
                        Suportă căutare cu sau fără diacritice (ex: Iasi = IAȘI).
                    </p>
                </div>

                {/* Search Form */}
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Termeni de căutare (unul pe linie)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Introduceți numere de dosar (ex: 123/45/2024) sau nume părți (ex: Popescu Ion)
                            </p>
                            <Textarea
                                placeholder={"8893/99/2009\nPopescu Ion\n456/78/2024"}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="min-h-[150px] font-mono text-base"
                                data-testid="search-textarea"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <Button 
                                onClick={() => handleSearch(1)}
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
                                        Caută
                                    </>
                                )}
                            </Button>

                            {/* Export Buttons */}
                            <div className="flex gap-2 ml-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport('xlsx')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-xlsx-btn"
                                >
                                    {exporting === 'xlsx' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    )}
                                    Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport('csv')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-csv-btn"
                                >
                                    {exporting === 'csv' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport('txt')}
                                    disabled={exporting !== null || searchText.trim() === ''}
                                    data-testid="export-txt-btn"
                                >
                                    {exporting === 'txt' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileDown className="mr-2 h-4 w-4" />
                                    )}
                                    TXT
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table */}
                {rows.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                Rezultate
                                <span className="text-muted-foreground font-normal ml-2">
                                    ({pagination.total_count} rânduri)
                                </span>
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Pagina {pagination.page} din {pagination.total_pages}
                            </p>
                        </div>

                        <Card className="border-border/50 overflow-hidden">
                            <ScrollArea className="w-full">
                                <div className="min-w-[1400px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                {TABLE_HEADERS.map((header, idx) => (
                                                    <TableHead 
                                                        key={idx} 
                                                        className="font-semibold whitespace-nowrap px-4 py-3"
                                                    >
                                                        {header}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row, rowIdx) => (
                                                <TableRow 
                                                    key={rowIdx}
                                                    className="hover:bg-muted/30"
                                                    data-testid={`result-row-${rowIdx}`}
                                                >
                                                    <TableCell className="font-mono text-sm px-4 py-3">
                                                        {row.termen_cautare}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                            row.tip_detectat === 'Număr dosar' 
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        }`}>
                                                            {row.tip_detectat}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm px-4 py-3">
                                                        {row.numar_dosar && (
                                                            <button
                                                                onClick={() => addToMonitoring(row.numar_dosar, row.instanta)}
                                                                className="text-primary hover:underline cursor-pointer"
                                                                title="Click pentru a monitoriza"
                                                            >
                                                                {row.numar_dosar}
                                                            </button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-[200px] truncate" title={row.instanta}>
                                                        {row.instanta}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-[250px] truncate" title={row.obiect}>
                                                        {row.obiect}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        {row.stadiu_procesual}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm px-4 py-3 whitespace-nowrap">
                                                        {row.data}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm px-4 py-3 whitespace-nowrap">
                                                        {row.ultima_modificare}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        {row.categorie_caz}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-[200px] truncate" title={row.nume_parte}>
                                                        {row.nume_parte}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        {row.calitate_parte}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </Card>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
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
                {!loading && rows.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Caută dosare</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Introduceți numere de dosar sau nume de părți pentru a căuta în toate instanțele din România.
                            <br/>
                            <span className="text-sm">Căutarea funcționează cu sau fără diacritice.</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicSearchPage;
