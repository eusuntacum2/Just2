<?php
/**
 * Utility Functions for Portal Dosare
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/soap_client.php';

/**
 * Normalize diacritics for search (Iasi = IAȘI)
 */
function normalize_diacritics($text) {
    if (empty($text)) return '';
    
    $diacritics = [
        'ă' => 'a', 'Ă' => 'A',
        'â' => 'a', 'Â' => 'A',
        'î' => 'i', 'Î' => 'I',
        'ș' => 's', 'Ș' => 'S', 'ş' => 's', 'Ş' => 'S',
        'ț' => 't', 'Ț' => 'T', 'ţ' => 't', 'Ţ' => 'T'
    ];
    
    $normalized = strtr($text, $diacritics);
    return mb_strtoupper($normalized, 'UTF-8');
}

/**
 * Detect search type (case number or party name)
 */
function detect_search_type($term) {
    $term = trim($term);
    // Pattern: digits/digits/digits (e.g., 123/45/2024)
    if (preg_match('/^\d+\/\d+\/\d{4}$/', $term)) {
        return 'Număr dosar';
    }
    return 'Nume parte';
}

/**
 * Format date from various formats
 */
function format_date($date, $default = '-') {
    if (empty($date)) return $default;
    
    if (is_string($date)) {
        if (strpos($date, 'T') !== false) {
            return substr($date, 0, 10);
        }
        return strlen($date) >= 10 ? substr($date, 0, 10) : $date;
    }
    
    if ($date instanceof DateTime) {
        return $date->format('Y-m-d');
    }
    
    return $default;
}

/**
 * Safe string with default
 */
function safe_str($val, $default = '-') {
    if ($val === null || $val === '') return $default;
    return (string) $val;
}

/**
 * Process dosar to row for search results
 */
function process_dosar_to_row($dosar, $search_term, $search_type) {
    if (!$dosar || !is_array($dosar)) return null;
    
    $instanta_key = $dosar['institutie'] ?? '';
    $instanta_name = get_institutie_name($instanta_key);
    
    // Parse date
    $data_str = format_date($dosar['data'] ?? '');
    
    // Get ultima modificare from sedinte
    $ultima_modificare = '';
    $sedinte = extract_list($dosar, 'sedinte', 'DosarSedinta');
    if (!empty($sedinte)) {
        $dates = [];
        foreach ($sedinte as $s) {
            if (is_array($s) && !empty($s['data'])) {
                $dates[] = format_date($s['data']);
            }
        }
        if (!empty($dates)) {
            rsort($dates);
            $ultima_modificare = $dates[0];
        }
    }
    
    $row = [
        'termen_cautare' => $search_term,
        'tip_detectat' => $search_type,
        'numar_dosar' => $dosar['numar'] ?? '',
        'instanta' => $instanta_name,
        'obiect' => $dosar['obiect'] ?? '',
        'stadiu_procesual' => (string)($dosar['stadiuProcesual'] ?? ''),
        'data' => $data_str,
        'ultima_modificare' => $ultima_modificare,
        'categorie_caz' => (string)($dosar['categorieCaz'] ?? ''),
        'nume_parte' => '',
        'calitate_parte' => '',
        'observatii' => ''
    ];
    
    // If search by "Nume parte" -> find matching party
    if ($search_type === 'Nume parte') {
        $parti = extract_list($dosar, 'parti', 'DosarParte');
        $search_normalized = normalize_diacritics($search_term);
        $found_party = null;
        
        foreach ($parti as $parte) {
            if (is_array($parte) && isset($parte['nume'])) {
                if (strpos(normalize_diacritics($parte['nume']), $search_normalized) !== false) {
                    $found_party = $parte;
                    break;
                }
            }
        }
        
        if ($found_party) {
            $row['nume_parte'] = $found_party['nume'] ?? '';
            $row['calitate_parte'] = $found_party['calitateParte'] ?? '';
        } elseif (!empty($parti)) {
            $first = $parti[0];
            if (is_array($first)) {
                $row['nume_parte'] = $first['nume'] ?? '';
                $row['calitate_parte'] = $first['calitateParte'] ?? '';
            }
        }
    }
    
    return $row;
}

/**
 * Extract list from dosar (handles nested structures)
 */
function extract_list($dosar, $key, $nested_key) {
    $raw = $dosar[$key] ?? null;
    if (!$raw) return [];
    
    if (is_array($raw) && isset($raw[$nested_key])) {
        $list = $raw[$nested_key];
        return is_array($list) ? $list : [$list];
    }
    
    if (is_array($raw) && !isset($raw[$nested_key])) {
        // Check if it's already a list
        if (isset($raw[0])) return $raw;
    }
    
    return [];
}

/**
 * Universal search function
 */
function universal_search($terms, $page = 1, $page_size = 20) {
    $all_rows = [];
    $seen_cases = [];
    $max_terms = min(count($terms), MAX_SEARCH_TERMS);
    
    for ($i = 0; $i < $max_terms; $i++) {
        $term = trim($terms[$i]);
        if (empty($term)) continue;
        
        $search_type = detect_search_type($term);
        
        try {
            if ($search_type === 'Număr dosar') {
                $results = soap()->cautareDosare($term);
            } else {
                $results = soap()->cautareDosare('', '', $term);
            }
            
            if (!empty($results)) {
                foreach ($results as $dosar) {
                    if ($dosar && is_array($dosar)) {
                        $case_key = $term . '|' . ($dosar['numar'] ?? '');
                        if (!isset($seen_cases[$case_key])) {
                            $seen_cases[$case_key] = true;
                            $row = process_dosar_to_row($dosar, $term, $search_type);
                            if ($row) {
                                $all_rows[] = $row;
                            }
                        }
                    }
                }
            } else {
                // No results row
                $all_rows[] = [
                    'termen_cautare' => $term,
                    'tip_detectat' => $search_type,
                    'numar_dosar' => '',
                    'instanta' => '',
                    'obiect' => '',
                    'stadiu_procesual' => '',
                    'data' => '',
                    'ultima_modificare' => '',
                    'categorie_caz' => '',
                    'nume_parte' => '',
                    'calitate_parte' => '',
                    'observatii' => 'Niciun rezultat găsit'
                ];
            }
        } catch (Exception $e) {
            $all_rows[] = [
                'termen_cautare' => $term,
                'tip_detectat' => $search_type,
                'numar_dosar' => '',
                'instanta' => '',
                'obiect' => '',
                'stadiu_procesual' => '',
                'data' => '',
                'ultima_modificare' => '',
                'categorie_caz' => '',
                'nume_parte' => '',
                'calitate_parte' => '',
                'observatii' => 'Eroare: ' . substr($e->getMessage(), 0, 50)
            ];
        }
    }
    
    // Pagination
    $total_count = count($all_rows);
    $page = max(1, $page);
    $page_size = min(max(1, $page_size), MAX_PAGE_SIZE);
    $total_pages = max(1, ceil($total_count / $page_size));
    
    $start_idx = ($page - 1) * $page_size;
    $paginated_rows = array_slice($all_rows, $start_idx, $page_size);
    
    return [
        'rows' => $paginated_rows,
        'total_count' => $total_count,
        'page' => $page,
        'page_size' => $page_size,
        'total_pages' => $total_pages
    ];
}

/**
 * Get case details
 */
function get_case_details($numar_dosar, $institutie = null) {
    try {
        $results = soap()->cautareDosare($numar_dosar, '', '', $institutie);
        
        if (empty($results)) {
            return ['error' => 'Dosarul nu a fost găsit', 'found' => false];
        }
        
        $dosar = $results[0];
        if (!$dosar || !is_array($dosar)) {
            return ['error' => 'Dosarul nu a fost găsit', 'found' => false];
        }
        
        $instanta_key = $dosar['institutie'] ?? '';
        $instanta_name = get_institutie_name($instanta_key);
        
        // Get ultima modificare
        $ultima_modificare = '-';
        $sedinte_raw = extract_list($dosar, 'sedinte', 'DosarSedinta');
        if (!empty($sedinte_raw)) {
            $dates = [];
            foreach ($sedinte_raw as $s) {
                if (is_array($s) && !empty($s['data'])) {
                    $dates[] = format_date($s['data']);
                }
            }
            if (!empty($dates)) {
                rsort($dates);
                $ultima_modificare = $dates[0];
            }
        }
        
        // Section A: Detalii Dosar
        $detalii = [
            'numar_dosar' => safe_str($dosar['numar'] ?? ''),
            'numar_dosar_vechi' => safe_str($dosar['numarVechi'] ?? ''),
            'data' => format_date($dosar['data'] ?? ''),
            'instanta' => $instanta_name,
            'departament' => safe_str($dosar['departament'] ?? ''),
            'obiect' => safe_str($dosar['obiect'] ?? ''),
            'stadiu_procesual' => safe_str($dosar['stadiuProcesual'] ?? ''),
            'categorie_caz' => safe_str($dosar['categorieCaz'] ?? ''),
            'ultima_modificare' => $ultima_modificare
        ];
        
        // Section B: Părți
        $parti_raw = extract_list($dosar, 'parti', 'DosarParte');
        $parti = [];
        foreach ($parti_raw as $p) {
            if (is_array($p)) {
                $parti[] = [
                    'nume' => safe_str($p['nume'] ?? ''),
                    'calitate' => safe_str($p['calitateParte'] ?? ''),
                    'info' => '-'
                ];
            }
        }
        
        // Section C: Ședințe
        $sedinte = [];
        foreach ($sedinte_raw as $s) {
            if (is_array($s)) {
                $sedinte[] = [
                    'data_sedinta' => format_date($s['data'] ?? ''),
                    'ora' => safe_str($s['ora'] ?? ''),
                    'solutie' => safe_str($s['solutie'] ?? ''),
                    'solutie_sumar' => safe_str($s['solutieSumar'] ?? ''),
                    'data_pronuntare' => format_date($s['dataPronuntare'] ?? ''),
                    'complet' => safe_str($s['complet'] ?? ''),
                    'document' => '-'
                ];
            }
        }
        usort($sedinte, function($a, $b) {
            return strcmp($b['data_sedinta'], $a['data_sedinta']);
        });
        
        // Section D: Căi de atac
        $cai_raw = extract_list($dosar, 'caiAtac', 'DosarCaleAtac');
        $cai_atac = [];
        foreach ($cai_raw as $c) {
            if (is_array($c)) {
                $cai_atac[] = [
                    'data_declaratie' => format_date($c['dataDeclarare'] ?? ''),
                    'parte_declaratoare' => safe_str($c['parteDeclaratoare'] ?? ''),
                    'cale_atac' => safe_str($c['tipCaleAtac'] ?? ''),
                    'dosar_instanta_superioara' => safe_str($c['dosarInstantaSuperioara'] ?? '')
                ];
            }
        }
        
        return [
            'found' => true,
            'detalii' => $detalii,
            'parti' => $parti,
            'sedinte' => $sedinte,
            'cai_atac' => $cai_atac
        ];
    } catch (Exception $e) {
        error_log("Case details error: " . $e->getMessage());
        return ['error' => 'Eroare la încărcarea dosarului: ' . $e->getMessage(), 'found' => false];
    }
}

/**
 * Check for case changes between snapshots
 */
function check_case_changes($old, $new) {
    if (empty($old) && !empty($new)) return true;
    if (empty($old) || empty($new)) return false;
    
    $old_sedinte = count($old['sedinte'] ?? []);
    $new_sedinte = count($new['sedinte'] ?? []);
    if ($new_sedinte > $old_sedinte) return true;
    
    $old_cai = count($old['caiAtac'] ?? []);
    $new_cai = count($new['caiAtac'] ?? []);
    if ($new_cai > $old_cai) return true;
    
    return false;
}
