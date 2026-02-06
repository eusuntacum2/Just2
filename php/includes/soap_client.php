<?php
/**
 * SOAP Client for just.ro API
 */

require_once __DIR__ . '/config.php';

class JustRoSoapClient {
    private $client = null;
    private static $instance = null;
    
    private function __construct() {
        try {
            $options = [
                'trace' => true,
                'exceptions' => true,
                'connection_timeout' => SOAP_TIMEOUT,
                'default_socket_timeout' => SOAP_TIMEOUT,
                'cache_wsdl' => WSDL_CACHE_MEMORY,
                'encoding' => 'UTF-8'
            ];
            
            $this->client = new SoapClient(SOAP_WSDL, $options);
        } catch (SoapFault $e) {
            error_log("SOAP Client initialization failed: " . $e->getMessage());
            throw new Exception("Eroare la conectarea la serviciul just.ro");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Search for cases
     */
    public function cautareDosare($numar_dosar = '', $obiect_dosar = '', $nume_parte = '', 
                                   $institutie = null, $data_start = null, $data_stop = null) {
        try {
            $params = [
                'numarDosar' => $numar_dosar ?: '',
                'obiectDosar' => $obiect_dosar ?: '',
                'numeParte' => $nume_parte ?: '',
                'institutie' => $institutie,
                'dataStart' => $data_start ? new DateTime($data_start) : null,
                'dataStop' => $data_stop ? new DateTime($data_stop) : null
            ];
            
            $result = $this->client->CautareDosare($params);
            
            return $this->parseResult($result);
        } catch (SoapFault $e) {
            error_log("SOAP CautareDosare error: " . $e->getMessage());
            return [];
        } catch (Exception $e) {
            error_log("CautareDosare error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Parse SOAP result to array
     */
    private function parseResult($result) {
        if ($result === null) {
            return [];
        }
        
        // Handle CautareDosareResult wrapper
        if (is_object($result) && isset($result->CautareDosareResult)) {
            $result = $result->CautareDosareResult;
        }
        
        // Handle Dosar wrapper
        if (is_object($result) && isset($result->Dosar)) {
            $result = $result->Dosar;
        }
        
        if (!is_array($result)) {
            $result = [$result];
        }
        
        $parsed = [];
        foreach ($result as $item) {
            if ($item && is_object($item)) {
                $parsed[] = $this->objectToArray($item);
            } elseif ($item && is_array($item)) {
                $parsed[] = $item;
            }
        }
        
        return $parsed;
    }
    
    /**
     * Convert object to array recursively
     */
    private function objectToArray($obj) {
        if (is_object($obj)) {
            $obj = get_object_vars($obj);
        }
        
        if (is_array($obj)) {
            return array_map([$this, 'objectToArray'], $obj);
        }
        
        // Handle DateTime objects
        if ($obj instanceof DateTime) {
            return $obj->format('Y-m-d\TH:i:s');
        }
        
        return $obj;
    }
    
    /**
     * Test connection
     */
    public function testConnection() {
        try {
            $result = $this->client->HelloWorld();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Helper function to get SOAP client
function soap() {
    return JustRoSoapClient::getInstance();
}

// ============== INSTITUTIONS LIST (242 courts) ==============

$INSTITUTII_MAP = [
    "CurteadeApelALBAIULIA" => "Curtea de Apel ALBA IULIA",
    "CurteadeApelBACAU" => "Curtea de Apel BACĂU",
    "CurteadeApelBRASOV" => "Curtea de Apel BRAȘOV",
    "CurteadeApelBUCURESTI" => "Curtea de Apel BUCUREȘTI",
    "CurteadeApelCLUJ" => "Curtea de Apel CLUJ",
    "CurteadeApelCONSTANTA" => "Curtea de Apel CONSTANȚA",
    "CurteadeApelCRAIOVA" => "Curtea de Apel CRAIOVA",
    "CurteadeApelGALATI" => "Curtea de Apel GALAȚI",
    "CurteadeApelIASI" => "Curtea de Apel IAȘI",
    "CurteadeApelORADEA" => "Curtea de Apel ORADEA",
    "CurteadeApelPITESTI" => "Curtea de Apel PITEȘTI",
    "CurteadeApelPLOIESTI" => "Curtea de Apel PLOIEȘTI",
    "CurteadeApelSUCEAVA" => "Curtea de Apel SUCEAVA",
    "CurteadeApelTARGUMURES" => "Curtea de Apel TÂRGU MUREȘ",
    "CurteadeApelTIMISOARA" => "Curtea de Apel TIMIȘOARA",
    "JudecatoriaADJUD" => "Judecătoria ADJUD",
    "JudecatoriaAGNITA" => "Judecătoria AGNITA",
    "JudecatoriaAIUD" => "Judecătoria AIUD",
    "JudecatoriaALBAIULIA" => "Judecătoria ALBA IULIA",
    "JudecatoriaALESD" => "Judecătoria ALEȘD",
    "JudecatoriaALEXANDRIA" => "Judecătoria ALEXANDRIA",
    "JudecatoriaARAD" => "Judecătoria ARAD",
    "JudecatoriaAVRIG" => "Judecătoria AVRIG",
    "JudecatoriaBABADAG" => "Judecătoria BABADAG",
    "JudecatoriaBACAU" => "Judecătoria BACĂU",
    "JudecatoriaBAIADEARAMA" => "Judecătoria BAIA DE ARAMĂ",
    "JudecatoriaBAIAMARE" => "Judecătoria BAIA MARE",
    "JudecatoriaBAILESTI" => "Judecătoria BĂILEȘTI",
    "JudecatoriaBALCESTI" => "Judecătoria BĂLCEȘTI",
    "JudecatoriaBALS" => "Judecătoria BALȘ",
    "JudecatoriaBARLAD" => "Judecătoria BÂRLAD",
    "JudecatoriaBECLEAN" => "Judecătoria BECLEAN",
    "JudecatoriaBEIUS" => "Judecătoria BEIUȘ",
    "JudecatoriaBICAZ" => "Judecătoria BICAZ",
    "JudecatoriaBISTRITA" => "Judecătoria BISTRIȚA",
    "JudecatoriaBLAJ" => "Judecătoria BLAJ",
    "JudecatoriaBOLINTINVALE" => "Judecătoria BOLINTIN VALE",
    "JudecatoriaBOTOSANI" => "Judecătoria BOTOȘANI",
    "JudecatoriaBRAD" => "Judecătoria BRAD",
    "JudecatoriaBRAILA" => "Judecătoria BRĂILA",
    "JudecatoriaBRASOV" => "Judecătoria BRAȘOV",
    "JudecatoriaBREZOI" => "Judecătoria BREZOI",
    "JudecatoriaBUFTEA" => "Judecătoria BUFTEA",
    "JudecatoriaBUHUSI" => "Judecătoria BUHUSI",
    "JudecatoriaBUZAU" => "Judecătoria BUZĂU",
    "JudecatoriaCALAFAT" => "Judecătoria CALAFAT",
    "JudecatoriaCALARASI" => "Judecătoria CĂLĂRAȘI",
    "JudecatoriaCAMPENI" => "Judecătoria CÂMPENI",
    "JudecatoriaCAMPINA" => "Judecătoria CÂMPINA",
    "JudecatoriaCAMPULUNG" => "Judecătoria CÂMPULUNG",
    "JudecatoriaCAMPULUNGMOLDOVENESK" => "Judecătoria CÂMPULUNG MOLDOVENESC",
    "JudecatoriaCARACal" => "Judecătoria CARACAL",
    "JudecatoriaCARAnSEBES" => "Judecătoria CARANSEBEȘ",
    "JudecatoriaCARei" => "Judecătoria CAREI",
    "JudecatoriaCHISINEUCRIS" => "Judecătoria CHIȘINEU CRIȘ",
    "JudecatoriaCLUJNAPOCA" => "Judecătoria CLUJ-NAPOCA",
    "JudecatoriaCONSTANTA" => "Judecătoria CONSTANȚA",
    "JudecatoriaCORABIA" => "Judecătoria CORABIA",
    "JudecatoriaCORNETU" => "Judecătoria CORNETU",
    "JudecatoriaCOSTESTI" => "Judecătoria COSTEȘTI",
    "JudecatoriaCRAIOVA" => "Judecătoria CRAIOVA",
    "JudecatoriaCURTEADEARGES" => "Judecătoria CURTEA DE ARGEȘ",
    "JudecatoriaDARABANI" => "Judecătoria DARABANI",
    "JudecatoriaDEJ" => "Judecătoria DEJ",
    "JudecatoriaDETA" => "Judecătoria DETA",
    "JudecatoriaDEVA" => "Judecătoria DEVA",
    "JudecatoriaDOROHOI" => "Judecătoria DOROHOI",
    "JudecatoriaDRAGASANI" => "Judecătoria DRĂGĂȘANI",
    "JudecatoriaDRAGOMIRESTI" => "Judecătoria DRAGOMIREȘTI",
    "JudecatoriaDROBETATURNUSEVERIN" => "Judecătoria DROBETA-TURNU SEVERIN",
    "JudecatoriaFAGARAS" => "Judecătoria FĂGĂRAȘ",
    "JudecatoriaFAGET" => "Judecătoria FĂGET",
    "JudecatoriaFALTICENI" => "Judecătoria FĂLTICENI",
    "JudecatoriaFAUREI" => "Judecătoria FĂUREI",
    "JudecatoriaFETESTI" => "Judecătoria FETEȘTI",
    "JudecatoriaFILIASI" => "Judecătoria FILIAȘI",
    "JudecatoriaFOCSANI" => "Judecătoria FOCȘANI",
    "JudecatoriaGAESTI" => "Judecătoria GĂEȘTI",
    "JudecatoriaGALATI" => "Judecătoria GALAȚI",
    "JudecatoriaGHEORGHENI" => "Judecătoria GHEORGHENI",
    "JudecatoriaGHERLA" => "Judecătoria GHERLA",
    "JudecatoriaGIURGIU" => "Judecătoria GIURGIU",
    "JudecatoriaGURAHONT" => "Judecătoria GURA HONȚ",
    "JudecatoriaGURAHUMORULUI" => "Judecătoria GURA HUMORULUI",
    "JudecatoriaHARLAU" => "Judecătoria HÂRLĂU",
    "JudecatoriaHARSOVA" => "Judecătoria HÂRȘOVA",
    "JudecatoriaHATEG" => "Judecătoria HAȚEG",
    "JudecatoriaHOREZU" => "Judecătoria HOREZU",
    "JudecatoriaHUEDIN" => "Judecătoria HUEDIN",
    "JudecatoriaHUNEDOARA" => "Judecătoria HUNEDOARA",
    "JudecatoriaHUSI" => "Judecătoria HUȘI",
    "JudecatoriaIASI" => "Judecătoria IAȘI",
    "JudecatoriaINEU" => "Judecătoria INEU",
    "JudecatoriaINSURATEI" => "Judecătoria ÎNSURĂȚEI",
    "JudecatoriaINTORSURABUZAULUI" => "Judecătoria ÎNTORSURA BUZĂULUI",
    "JudecatoriaJIBOU" => "Judecătoria JIBOU",
    "JudecatoriaLEHLIUGARA" => "Judecătoria LEHLIU-GARA",
    "JudecatoriaLIESTI" => "Judecătoria LIEȘTI",
    "JudecatoriaLIPOVA" => "Judecătoria LIPOVA",
    "JudecatoriaLUDUS" => "Judecătoria LUDUȘ",
    "JudecatoriaLUGOJ" => "Judecătoria LUGOJ",
    "JudecatoriaMACIN" => "Judecătoria MĂCIN",
    "JudecatoriaMANGALIA" => "Judecătoria MANGALIA",
    "JudecatoriaMARGHITA" => "Judecătoria MARGHITA",
    "JudecatoriaMEDGIDIA" => "Judecătoria MEDGIDIA",
    "JudecatoriaMEDIAS" => "Judecătoria MEDIAȘ",
    "JudecatoriaMIERCUREACIUC" => "Judecătoria MIERCUREA CIUC",
    "JudecatoriaMIZIL" => "Judecătoria MIZIL",
    "JudecatoriaMOINESTI" => "Judecătoria MOINEȘTI",
    "JudecatoriaMOTRU" => "Judecătoria MOTRU",
    "JudecatoriaNASAUD" => "Judecătoria NĂSĂUD",
    "JudecatoriaNEGRESTIOAS" => "Judecătoria NEGREȘTI-OAȘ",
    "JudecatoriaNOVACI" => "Judecătoria NOVACI",
    "JudecatoriaODORHEIUSECUIESC" => "Judecătoria ODORHEIU SECUIESC",
    "JudecatoriaOLTENITA" => "Judecătoria OLTENIȚA",
    "JudecatoriaONESTI" => "Judecătoria ONEȘTI",
    "JudecatoriaORADEA" => "Judecătoria ORADEA",
    "JudecatoriaORAVITA" => "Judecătoria ORAVIȚA",
    "JudecatoriaORSOVA" => "Judecătoria ORȘOVA",
    "JudecatoriaPANCIU" => "Judecătoria PANCIU",
    "JudecatoriaPASCANI" => "Judecătoria PAȘCANI",
    "JudecatoriaPETROSANI" => "Judecătoria PETROȘANI",
    "JudecatoriaPIATRANEAMT" => "Judecătoria PIATRA NEAMȚ",
    "JudecatoriaPITESTI" => "Judecătoria PITEȘTI",
    "JudecatoriaPLOIESTI" => "Judecătoria PLOIEȘTI",
    "JudecatoriaPOGOANELE" => "Judecătoria POGOANELE",
    "JudecatoriaRADAUTI" => "Judecătoria RĂDĂUȚI",
    "JudecatoriaRAMNICUSARAT" => "Judecătoria RÂMNICU SĂRAT",
    "JudecatoriaRAMNICUVALCEA" => "Judecătoria RÂMNICU VÂLCEA",
    "JudecatoriaREGHIN" => "Judecătoria REGHIN",
    "JudecatoriaRESITA" => "Judecătoria REȘIȚA",
    "JudecatoriaROSIORIDEVEDE" => "Judecătoria ROȘIORII DE VEDE",
    "JudecatoriaRUPEA" => "Judecătoria RUPEA",
    "JudecatoriaSANNICOLAUMARE" => "Judecătoria SÂNNICOLAU MARE",
    "JudecatoriaSATUMARE" => "Judecătoria SATU MARE",
    "JudecatoriaSEBES" => "Judecătoria SEBEȘ",
    "JudecatoriaSECTORUL1BUCURESTI" => "Judecătoria SECTORUL 1 BUCUREȘTI",
    "JudecatoriaSECTORUL2BUCURESTI" => "Judecătoria SECTORUL 2 BUCUREȘTI",
    "JudecatoriaSECTORUL3BUCURESTI" => "Judecătoria SECTORUL 3 BUCUREȘTI",
    "JudecatoriaSECTORUL4BUCURESTI" => "Judecătoria SECTORUL 4 BUCUREȘTI",
    "JudecatoriaSECTORUL5BUCURESTI" => "Judecătoria SECTORUL 5 BUCUREȘTI",
    "JudecatoriaSECTORUL6BUCURESTI" => "Judecătoria SECTORUL 6 BUCUREȘTI",
    "JudecatoriaSIBIU" => "Judecătoria SIBIU",
    "JudecatoriaSIGHETUMARMATIEI" => "Judecătoria SIGHETU MARMAȚIEI",
    "JudecatoriaSIGHISOARA" => "Judecătoria SIGHIȘOARA",
    "JudecatoriaSIMERIA" => "Judecătoria SIMERIA",
    "JudecatoriaSINAIA" => "Judecătoria SINAIA",
    "JudecatoriaSLATINA" => "Judecătoria SLATINA",
    "JudecatoriaSLOBOZIA" => "Judecătoria SLOBOZIA",
    "JudecatoriaSTREHAIA" => "Judecătoria STREHAIA",
    "JudecatoriaSUCEAVA" => "Judecătoria SUCEAVA",
    "JudecatoriaTARGOVISTE" => "Judecătoria TÂRGOVIȘTE",
    "JudecatoriaTARGUBUJOR" => "Judecătoria TÂRGU BUJOR",
    "JudecatoriaTARGUCARBUNESTI" => "Judecătoria TÂRGU CĂRBUNEȘTI",
    "JudecatoriaTARGUJIU" => "Judecătoria TÂRGU JIU",
    "JudecatoriaTARGULAPUS" => "Judecătoria TÂRGU LĂPUȘ",
    "JudecatoriaTARGUMURES" => "Judecătoria TÂRGU MUREȘ",
    "JudecatoriaTARGUNEAMT" => "Judecătoria TÂRGU NEAMȚ",
    "JudecatoriaTARGUSECUIESC" => "Judecătoria TÂRGU SECUIESC",
    "JudecatoriaTECUCI" => "Judecătoria TECUCI",
    "JudecatoriaTIMISOARA" => "Judecătoria TIMIȘOARA",
    "JudecatoriaTOPLITA" => "Judecătoria TOPLIȚA",
    "JudecatoriaTURDA" => "Judecătoria TURDA",
    "JudecatoriaTURNUMAGURELE" => "Judecătoria TURNU MĂGURELE",
    "JudecatoriaURZICENI" => "Judecătoria URZICENI",
    "JudecatoriaVALENIIDEMUNTE" => "Judecătoria VĂLENII DE MUNTE",
    "JudecatoriaVASLUI" => "Judecătoria VASLUI",
    "JudecatoriaVATRADORNEI" => "Judecătoria VATRA DORNEI",
    "JudecatoriaVIDELE" => "Judecătoria VIDELE",
    "JudecatoriaVISEUDESUS" => "Judecătoria VIȘEU DE SUS",
    "JudecatoriaZALAU" => "Judecătoria ZALĂU",
    "JudecatoriaZARNESTI" => "Judecătoria ZĂRNEȘTI",
    "JudecatoriaZIMNICEA" => "Judecătoria ZIMNICEA",
    "TribunalulALBA" => "Tribunalul ALBA",
    "TribunalulARAD" => "Tribunalul ARAD",
    "TribunalulARGES" => "Tribunalul ARGEȘ",
    "TribunalulBACAU" => "Tribunalul BACĂU",
    "TribunalulBIHOR" => "Tribunalul BIHOR",
    "TribunalulBISTRITANASAUD" => "Tribunalul BISTRIȚA NĂSĂUD",
    "TribunalulBOTOSANI" => "Tribunalul BOTOȘANI",
    "TribunalulBRAILA" => "Tribunalul BRĂILA",
    "TribunalulBRASOV" => "Tribunalul BRAȘOV",
    "TribunalulBUCURESTI" => "Tribunalul BUCUREȘTI",
    "TribunalulBUZAU" => "Tribunalul BUZĂU",
    "TribunalulCALARASI" => "Tribunalul CĂLĂRAȘI",
    "TribunalulCARASSEVERIN" => "Tribunalul CARAȘ SEVERIN",
    "TribunalulCLUJ" => "Tribunalul CLUJ",
    "TribunalulCONSTANTA" => "Tribunalul CONSTANȚA",
    "TribunalulCOVASNA" => "Tribunalul COVASNA",
    "TribunalulDAMBOVITA" => "Tribunalul DÂMBOVIȚA",
    "TribunalulDOLJ" => "Tribunalul DOLJ",
    "TribunalulGALATI" => "Tribunalul GALAȚI",
    "TribunalulGIURGIU" => "Tribunalul GIURGIU",
    "TribunalulGORJ" => "Tribunalul GORJ",
    "TribunalulHARGHITA" => "Tribunalul HARGHITA",
    "TribunalulHUNEDOARA" => "Tribunalul HUNEDOARA",
    "TribunalulIALOMITA" => "Tribunalul IALOMIȚA",
    "TribunalulIASI" => "Tribunalul IAȘI",
    "TribunalulILFOV" => "Tribunalul ILFOV",
    "TribunalulMARAMURES" => "Tribunalul MARAMUREȘ",
    "TribunalulMEHEDINTI" => "Tribunalul MEHEDINȚI",
    "TribunalulMilitarBUCURESTI" => "Tribunalul Militar BUCUREȘTI",
    "TribunalulMilitarCLUJNAPOCA" => "Tribunalul Militar CLUJ-NAPOCA",
    "TribunalulMilitarIASI" => "Tribunalul Militar IAȘI",
    "TribunalulMilitarTeritorialBUCURESTI" => "Tribunalul Militar Teritorial BUCUREȘTI",
    "TribunalulMilitarTIMISOARA" => "Tribunalul Militar TIMIȘOARA",
    "TribunalulMURES" => "Tribunalul MUREȘ",
    "TribunalulNEAMT" => "Tribunalul NEAMȚ",
    "TribunalulOLT" => "Tribunalul OLT",
    "TribunalulpentruMinorisiFamily" => "Tribunalul pentru minori și familie BRAȘOV",
    "TribunalulPRAHOVA" => "Tribunalul PRAHOVA",
    "TribunalulSALAJ" => "Tribunalul SĂLAJ",
    "TribunalulSATUMARE" => "Tribunalul SATU MARE",
    "TribunalulSIBIU" => "Tribunalul SIBIU",
    "TribunalulSpecializatARGES" => "Tribunalul Specializat ARGEȘ",
    "TribunalulSpecializatCLUJ" => "Tribunalul Specializat CLUJ",
    "TribunalulSpecializatMURES" => "Tribunalul Specializat MUREȘ",
    "TribunalulSUCEAVA" => "Tribunalul SUCEAVA",
    "TribunalulTELEORMAN" => "Tribunalul TELEORMAN",
    "TribunalulTIMIS" => "Tribunalul TIMIȘ",
    "TribunalulTULCEA" => "Tribunalul TULCEA",
    "TribunalulVALCEA" => "Tribunalul VÂLCEA",
    "TribunalulVASLUI" => "Tribunalul VASLUI",
    "TribunalulVRANCEA" => "Tribunalul VRANCEA",
];

function get_institutii_list() {
    global $INSTITUTII_MAP;
    $list = [];
    foreach ($INSTITUTII_MAP as $key => $name) {
        $list[] = ['key' => $key, 'name' => $name];
    }
    usort($list, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    return $list;
}

function get_institutie_name($key) {
    global $INSTITUTII_MAP;
    return $INSTITUTII_MAP[$key] ?? $key;
}
