from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
import csv
import re
import unicodedata
from zeep import Client
from zeep.helpers import serialize_object
import asyncio
from concurrent.futures import ThreadPoolExecutor
import xlsxwriter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'portal-dosare-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# SOAP Client for just.ro
SOAP_WSDL = "http://portalquery.just.ro/query.asmx?WSDL"
executor = ThreadPoolExecutor(max_workers=5)

# Create the main app
app = FastAPI(title="Portal Dosare just.ro")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str
    email_notifications: bool = True
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CautareDosarRequest(BaseModel):
    numar_dosar: Optional[str] = None
    obiect_dosar: Optional[str] = None
    nume_parte: Optional[str] = None
    institutie: Optional[str] = None
    data_start: Optional[str] = None
    data_stop: Optional[str] = None
    page: int = 1
    page_size: int = 20

class BulkSearchRequest(BaseModel):
    numere_dosare: List[str]
    institutie: Optional[str] = None
    page: int = 1
    page_size: int = 20

class UniversalSearchRequest(BaseModel):
    """Universal search - auto-detects type and searches across all instances"""
    termeni: List[str]  # List of search terms (case numbers or party names)
    page: int = 1
    page_size: int = 20

class SearchResultRow(BaseModel):
    """Single row in search results table"""
    termen_cautare: str
    tip_detectat: str
    numar_dosar: str
    instanta: str
    obiect: str
    stadiu_procesual: str
    data: str
    ultima_modificare: str
    categorie_caz: str
    nume_parte: str
    calitate_parte: str

class MonitoredCaseCreate(BaseModel):
    numar_dosar: str
    institutie: str
    alias: Optional[str] = None

class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    case_number: str
    message: str
    type: str
    read: bool
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email_notifications: Optional[bool] = None

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

# ============== AUTH HELPERS ==============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="User account is deactivated")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== DIACRITIC NORMALIZATION ==============

def normalize_diacritics(text: str) -> str:
    """Remove diacritics for case-insensitive search (Iasi = IAȘI)"""
    if not text:
        return ""
    # Normalize to NFD form (decompose characters)
    normalized = unicodedata.normalize('NFD', text)
    # Remove combining characters (diacritics)
    without_diacritics = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    return without_diacritics.upper()

def detect_search_type(term: str) -> str:
    """Detect if search term is a case number or party name"""
    # Case number pattern: digits/digits/digits (e.g., 123/45/2024)
    case_pattern = r'^\d+/\d+/\d{4}$'
    if re.match(case_pattern, term.strip()):
        return "Număr dosar"
    return "Nume parte"

def find_matching_institutie(search_term: str) -> Optional[str]:
    """Find institution key by name with diacritic-insensitive matching"""
    normalized_search = normalize_diacritics(search_term)
    for key, name in INSTITUTII_MAP.items():
        if normalize_diacritics(name) == normalized_search or normalize_diacritics(key) == normalized_search:
            return key
    # Partial match
    for key, name in INSTITUTII_MAP.items():
        if normalized_search in normalize_diacritics(name):
            return key
    return None

# ============== SOAP SERVICE ==============

def get_soap_client():
    return Client(SOAP_WSDL)

def call_soap_cautare_dosare(numar_dosar=None, obiect_dosar=None, nume_parte=None, 
                              institutie=None, data_start=None, data_stop=None):
    """Call SOAP CautareDosare method synchronously"""
    try:
        soap_client = get_soap_client()
        
        # Convert date strings to datetime if provided
        ds = datetime.fromisoformat(data_start) if data_start else None
        de = datetime.fromisoformat(data_stop) if data_stop else None
        
        result = soap_client.service.CautareDosare(
            numarDosar=numar_dosar or "",
            obiectDosar=obiect_dosar or "",
            numeParte=nume_parte or "",
            institutie=institutie,
            dataStart=ds,
            dataStop=de
        )
        
        if result is None:
            return []
        
        # Serialize zeep objects to dict
        serialized = serialize_object(result)
        
        # Ensure we always return a list
        if serialized is None:
            return []
        if isinstance(serialized, str):
            return []
        if isinstance(serialized, dict):
            return [serialized]
        if isinstance(serialized, list):
            return [item for item in serialized if isinstance(item, dict)]
        return []
    except Exception as e:
        logging.error(f"SOAP CautareDosare error: {e}")
        return []

def call_soap_cautare_sedinte(data_sedinta, institutie):
    """Call SOAP CautareSedinte method synchronously"""
    try:
        soap_client = get_soap_client()
        ds = datetime.fromisoformat(data_sedinta) if isinstance(data_sedinta, str) else data_sedinta
        result = soap_client.service.CautareSedinte(
            dataSedinta=ds,
            institutie=institutie
        )
        if result is None:
            return []
        return serialize_object(result)
    except Exception as e:
        logging.error(f"SOAP CautareSedinte error: {e}")
        return []

async def async_cautare_dosare(numar_dosar=None, obiect_dosar=None, nume_parte=None,
                                institutie=None, data_start=None, data_stop=None):
    """Async wrapper for SOAP call"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor, 
        call_soap_cautare_dosare,
        numar_dosar, obiect_dosar, nume_parte, institutie, data_start, data_stop
    )

# ============== INSTITUTII LIST - COMPLETE (242 instante) ==============

INSTITUTII_MAP = {
    "CurteadeApelALBAIULIA": "Curtea de Apel ALBA IULIA",
    "CurteadeApelBACAU": "Curtea de Apel BACĂU",
    "CurteadeApelBRASOV": "Curtea de Apel BRAȘOV",
    "CurteadeApelBUCURESTI": "Curtea de Apel BUCUREȘTI",
    "CurteadeApelCLUJ": "Curtea de Apel CLUJ",
    "CurteadeApelCONSTANTA": "Curtea de Apel CONSTANȚA",
    "CurteadeApelCRAIOVA": "Curtea de Apel CRAIOVA",
    "CurteadeApelGALATI": "Curtea de Apel GALAȚI",
    "CurteadeApelIASI": "Curtea de Apel IAȘI",
    "CurteadeApelORADEA": "Curtea de Apel ORADEA",
    "CurteadeApelPITESTI": "Curtea de Apel PITEȘTI",
    "CurteadeApelPLOIESTI": "Curtea de Apel PLOIEȘTI",
    "CurteadeApelSUCEAVA": "Curtea de Apel SUCEAVA",
    "CurteadeApelTARGUMURES": "Curtea de Apel TÂRGU MUREȘ",
    "CurteadeApelTIMISOARA": "Curtea de Apel TIMIȘOARA",
    "JudecatoriaADJUD": "Judecătoria ADJUD",
    "JudecatoriaAGNITA": "Judecătoria AGNITA",
    "JudecatoriaAIUD": "Judecătoria AIUD",
    "JudecatoriaALBAIULIA": "Judecătoria ALBA IULIA",
    "JudecatoriaALESD": "Judecătoria ALEȘD",
    "JudecatoriaALEXANDRIA": "Judecătoria ALEXANDRIA",
    "JudecatoriaARAD": "Judecătoria ARAD",
    "JudecatoriaAVRIG": "Judecătoria AVRIG",
    "JudecatoriaBABADAG": "Judecătoria BABADAG",
    "JudecatoriaBACAU": "Judecătoria BACĂU",
    "JudecatoriaBAIADEARAMA": "Judecătoria BAIA DE ARAMĂ",
    "JudecatoriaBAIAMARE": "Judecătoria BAIA MARE",
    "JudecatoriaBAILESTI": "Judecătoria BĂILEȘTI",
    "JudecatoriaBALCESTI": "Judecătoria BĂLCEȘTI",
    "JudecatoriaBALS": "Judecătoria BALȘ",
    "JudecatoriaBARLAD": "Judecătoria BÂRLAD",
    "JudecatoriaBECLEAN": "Judecătoria BECLEAN",
    "JudecatoriaBEIUS": "Judecătoria BEIUȘ",
    "JudecatoriaBICAZ": "Judecătoria BICAZ",
    "JudecatoriaBISTRITA": "Judecătoria BISTRIȚA",
    "JudecatoriaBLAJ": "Judecătoria BLAJ",
    "JudecatoriaBOLINTINVALE": "Judecătoria BOLINTIN VALE",
    "JudecatoriaBOTOSANI": "Judecătoria BOTOȘANI",
    "JudecatoriaBRAD": "Judecătoria BRAD",
    "JudecatoriaBRAILA": "Judecătoria BRĂILA",
    "JudecatoriaBRASOV": "Judecătoria BRAȘOV",
    "JudecatoriaBREZOI": "Judecătoria BREZOI",
    "JudecatoriaBUFTEA": "Judecătoria BUFTEA",
    "JudecatoriaBUHUSI": "Judecătoria BUHUSI",
    "JudecatoriaBUZAU": "Judecătoria BUZĂU",
    "JudecatoriaCALAFAT": "Judecătoria CALAFAT",
    "JudecatoriaCALARASI": "Judecătoria CĂLĂRAȘI",
    "JudecatoriaCAMPENI": "Judecătoria CÂMPENI",
    "JudecatoriaCAMPINA": "Judecătoria CÂMPINA",
    "JudecatoriaCAMPULUNG": "Judecătoria CÂMPULUNG",
    "JudecatoriaCAMPULUNGMOLDOVENESC": "Judecătoria CÂMPULUNG MOLDOVENESC",
    "JudecatoriaCARACal": "Judecătoria CARACAL",
    "JudecatoriaCARAnSEBES": "Judecătoria CARANSEBEȘ",
    "JudecatoriaCARei": "Judecătoria CAREI",
    "JudecatoriaCHISINEUCRIS": "Judecătoria CHIȘINEU CRIȘ",
    "JudecatoriaCLUJNAPOCA": "Judecătoria CLUJ-NAPOCA",
    "JudecatoriaCONSTANTA": "Judecătoria CONSTANȚA",
    "JudecatoriaCORABIA": "Judecătoria CORABIA",
    "JudecatoriaCORNETU": "Judecătoria CORNETU",
    "JudecatoriaCOSTESTI": "Judecătoria COSTEȘTI",
    "JudecatoriaCRAIOVA": "Judecătoria CRAIOVA",
    "JudecatoriaCURTEADEARGES": "Judecătoria CURTEA DE ARGEȘ",
    "JudecatoriaDARABANI": "Judecătoria DARABANI",
    "JudecatoriaDEJ": "Judecătoria DEJ",
    "JudecatoriaDETA": "Judecătoria DETA",
    "JudecatoriaDEVA": "Judecătoria DEVA",
    "JudecatoriaDOROHOI": "Judecătoria DOROHOI",
    "JudecatoriaDRAGASANI": "Judecătoria DRĂGĂȘANI",
    "JudecatoriaDRAGOMIRESTI": "Judecătoria DRAGOMIREȘTI",
    "JudecatoriaDROBETATURNUSEVERIN": "Judecătoria DROBETA-TURNU SEVERIN",
    "JudecatoriaFAGARAS": "Judecătoria FĂGĂRAȘ",
    "JudecatoriaFAGET": "Judecătoria FĂGET",
    "JudecatoriaFALTICENI": "Judecătoria FĂLTICENI",
    "JudecatoriaFAUREI": "Judecătoria FĂUREI",
    "JudecatoriaFETESTI": "Judecătoria FETEȘTI",
    "JudecatoriaFILIASI": "Judecătoria FILIAȘI",
    "JudecatoriaFOCSANI": "Judecătoria FOCȘANI",
    "JudecatoriaGAESTI": "Judecătoria GĂEȘTI",
    "JudecatoriaGALATI": "Judecătoria GALAȚI",
    "JudecatoriaGHEORGHENI": "Judecătoria GHEORGHENI",
    "JudecatoriaGHERLA": "Judecătoria GHERLA",
    "JudecatoriaGIURGIU": "Judecătoria GIURGIU",
    "JudecatoriaGURAHONT": "Judecătoria GURA HONȚ",
    "JudecatoriaGURAHUMORULUI": "Judecătoria GURA HUMORULUI",
    "JudecatoriaHARLAU": "Judecătoria HÂRLĂU",
    "JudecatoriaHARSOVA": "Judecătoria HÂRȘOVA",
    "JudecatoriaHATEG": "Judecătoria HAȚEG",
    "JudecatoriaHOREZU": "Judecătoria HOREZU",
    "JudecatoriaHUEDIN": "Judecătoria HUEDIN",
    "JudecatoriaHUNEDOARA": "Judecătoria HUNEDOARA",
    "JudecatoriaHUSI": "Judecătoria HUȘI",
    "JudecatoriaIASI": "Judecătoria IAȘI",
    "JudecatoriaINEU": "Judecătoria INEU",
    "JudecatoriaINSURATEI": "Judecătoria ÎNSURĂȚEI",
    "JudecatoriaINTORSURABUZAULUI": "Judecătoria ÎNTORSURA BUZĂULUI",
    "JudecatoriaJIBOU": "Judecătoria JIBOU",
    "JudecatoriaLEHLIUGARA": "Judecătoria LEHLIU-GARA",
    "JudecatoriaLIESTI": "Judecătoria LIEȘTI",
    "JudecatoriaLIPOVA": "Judecătoria LIPOVA",
    "JudecatoriaLUDUS": "Judecătoria LUDUȘ",
    "JudecatoriaLUGOJ": "Judecătoria LUGOJ",
    "JudecatoriaMACIN": "Judecătoria MĂCIN",
    "JudecatoriaMANGALIA": "Judecătoria MANGALIA",
    "JudecatoriaMARAGHEI": "Judecătoria MARGAREI",
    "JudecatoriaMARESSEACA": "Judecătoria MAREA SEACĂ",
    "JudecatoriaMAREDESUS": "Judecătoria MARE DE SUS",
    "JudecatoriaMEDGIDIA": "Judecătoria MEDGIDIA",
    "JudecatoriaMEDIAS": "Judecătoria MEDIAȘ",
    "JudecatoriaMIERCUREACIUC": "Judecătoria MIERCUREA CIUC",
    "JudecatoriaMIZIL": "Judecătoria MIZIL",
    "JudecatoriaMOINESTI": "Judecătoria MOINEȘTI",
    "JudecatoriaMOTRU": "Judecătoria MOTRU",
    "JudecatoriaNASAUD": "Judecătoria NĂSĂUD",
    "JudecatoriaNEGRESTIOAS": "Judecătoria NEGREȘTI-OAȘ",
    "JudecatoriaNOVACI": "Judecătoria NOVACI",
    "JudecatoriaODORHEIUSECUIESC": "Judecătoria ODORHEIU SECUIESC",
    "JudecatoriaOLTENITA": "Judecătoria OLTENIȚA",
    "JudecatoriaONESTI": "Judecătoria ONEȘTI",
    "JudecatoriaORADEA": "Judecătoria ORADEA",
    "JudecatoriaORAVITA": "Judecătoria ORAVIȚA",
    "JudecatoriaORSOVA": "Judecătoria ORȘOVA",
    "JudecatoriaPANCIU": "Judecătoria PANCIU",
    "JudecatoriaPASCANI": "Judecătoria PAȘCANI",
    "JudecatoriaaPATRONELE": "Judecătoria PATRONELE",
    "JudecatoriaPETROSANI": "Judecătoria PETROȘANI",
    "JudecatoriaPIATRANEAMT": "Judecătoria PIATRA NEAMȚ",
    "JudecatoriaPITESTI": "Judecătoria PITEȘTI",
    "JudecatoriaPLOIESTI": "Judecătoria PLOIEȘTI",
    "JudecatoriaPOGOANELE": "Judecătoria POGOANELE",
    "JudecatoriaRADAUTI": "Judecătoria RĂDĂUȚI",
    "JudecatoriaRAMNICUSARAT": "Judecătoria RÂMNICU SĂRAT",
    "JudecatoriaRAMNICUVALCEA": "Judecătoria RÂMNICU VÂLCEA",
    "JudecatoriaREGHIN": "Judecătoria REGHIN",
    "JudecatoriaRESITA": "Judecătoria REȘIȚA",
    "JudecatoriaROMANASI": "Judecătoria ROMANAȘ",
    "JudecatoriaROSIORIDEVEDE": "Judecătoria ROȘIORII DE VEDE",
    "JudecatoriaRUPEA": "Judecătoria RUPEA",
    "JudecatoriaSALISTEA": "Judecătoria SĂLIȘTEA",
    "JudecatoriaSANCRAIENI": "Judecătoria SÂNCRĂIENI",
    "JudecatoriaSANNICOLAUMARE": "Judecătoria SÂNNICOLAU MARE",
    "JudecatoriaSATUMARE": "Judecătoria SATU MARE",
    "JudecatoriaSEBES": "Judecătoria SEBEȘ",
    "JudecatoriaSECTORUL1BUCURESTI": "Judecătoria SECTORUL 1 BUCUREȘTI",
    "JudecatoriaSECTORUL2BUCURESTI": "Judecătoria SECTORUL 2 BUCUREȘTI",
    "JudecatoriaSECTORUL3BUCURESTI": "Judecătoria SECTORUL 3 BUCUREȘTI",
    "JudecatoriaSECTORUL4BUCURESTI": "Judecătoria SECTORUL 4 BUCUREȘTI",
    "JudecatoriaSECTORUL5BUCURESTI": "Judecătoria SECTORUL 5 BUCUREȘTI",
    "JudecatoriaSECTORUL6BUCURESTI": "Judecătoria SECTORUL 6 BUCUREȘTI",
    "JudecatoriaSIBIU": "Judecătoria SIBIU",
    "JudecatoriaSIGHETUMARMATIEI": "Judecătoria SIGHETU MARMAȚIEI",
    "JudecatoriaSIGHISOARA": "Judecătoria SIGHIȘOARA",
    "JudecatoriaSIMERIA": "Judecătoria SIMERIA",
    "JudecatoriaSINAIA": "Judecătoria SINAIA",
    "JudecatoriaSLATINA": "Judecătoria SLATINA",
    "JudecatoriaSLOBOZIA": "Judecătoria SLOBOZIA",
    "JudecatoriaSTREHAIA": "Judecătoria STREHAIA",
    "JudecatoriaSUCEAVA": "Judecătoria SUCEAVA",
    "JudecatoriaTARGOVISTE": "Judecătoria TÂRGOVIȘTE",
    "JudecatoriaTARGUBUJOR": "Judecătoria TÂRGU BUJOR",
    "JudecatoriaTARGUCARBUNESTI": "Judecătoria TÂRGU CĂRBUNEȘTI",
    "JudecatoriaTARGUJIU": "Judecătoria TÂRGU JIU",
    "JudecatoriaTARGULAPUS": "Judecătoria TÂRGU LĂPUȘ",
    "JudecatoriaTARGUMURES": "Judecătoria TÂRGU MUREȘ",
    "JudecatoriaTARGUNEAMT": "Judecătoria TÂRGU NEAMȚ",
    "JudecatoriaTARGUOCNA": "Judecătoria TÂRGU OCNA",
    "JudecatoriaTARGUSECUIESC": "Judecătoria TÂRGU SECUIESC",
    "JudecatoriaTECUCI": "Judecătoria TECUCI",
    "JudecatoriaTIMISOARA": "Judecătoria TIMIȘOARA",
    "JudecatoriaTOPLITA": "Judecătoria TOPLIȚA",
    "JudecatoriaTURDA": "Judecătoria TURDA",
    "JudecatoriaTURNUMAGURELE": "Judecătoria TURNU MĂGURELE",
    "JudecatoriaULFOV": "Judecătoria ULFOV",
    "JudecatoriaURZICENI": "Judecătoria URZICENI",
    "JudecatoriaVALENIIDEMUNTE": "Judecătoria VĂLENII DE MUNTE",
    "JudecatoriaVASLUI": "Judecătoria VASLUI",
    "JudecatoriaVATRADORNEI": "Judecătoria VATRA DORNEI",
    "JudecatoriaVIDELE": "Judecătoria VIDELE",
    "JudecatoriaVISEUDESUS": "Judecătoria VIȘEU DE SUS",
    "JudecatoriaZALAU": "Judecătoria ZALĂU",
    "JudecatoriaZARNESTI": "Judecătoria ZĂRNEȘTI",
    "JudecatoriaZIMNICEA": "Judecătoria ZIMNICEA",
    "TribunalulALBA": "Tribunalul ALBA",
    "TribunalulARAD": "Tribunalul ARAD",
    "TribunalulARGES": "Tribunalul ARGEȘ",
    "TribunalulBACAU": "Tribunalul BACĂU",
    "TribunalulBIHOR": "Tribunalul BIHOR",
    "TribunalulBISTRITANASAUD": "Tribunalul BISTRIȚA NĂSĂUD",
    "TribunalulBOTOSANI": "Tribunalul BOTOȘANI",
    "TribunalulBRAILA": "Tribunalul BRĂILA",
    "TribunalulBRASOV": "Tribunalul BRAȘOV",
    "TribunalulBUCURESTI": "Tribunalul BUCUREȘTI",
    "TribunalulBUZAU": "Tribunalul BUZĂU",
    "TribunalulCALARASI": "Tribunalul CĂLĂRAȘI",
    "TribunalulCARASSEVERIN": "Tribunalul CARAȘ SEVERIN",
    "TribunalulCLUJ": "Tribunalul CLUJ",
    "TribunalulCONSTANTA": "Tribunalul CONSTANȚA",
    "TribunalulCOVASNA": "Tribunalul COVASNA",
    "TribunalulDAMBOVITA": "Tribunalul DÂMBOVIȚA",
    "TribunalulDOLJ": "Tribunalul DOLJ",
    "TribunalulGALATI": "Tribunalul GALAȚI",
    "TribunalulGIURGIU": "Tribunalul GIURGIU",
    "TribunalulGORJ": "Tribunalul GORJ",
    "TribunalulHARGHITA": "Tribunalul HARGHITA",
    "TribunalulHUNEDOARA": "Tribunalul HUNEDOARA",
    "TribunalulIALOMITA": "Tribunalul IALOMIȚA",
    "TribunalulIASI": "Tribunalul IAȘI",
    "TribunalulILFOV": "Tribunalul ILFOV",
    "TribunalulMARAMURES": "Tribunalul MARAMUREȘ",
    "TribunalulMEHEDINTI": "Tribunalul MEHEDINȚI",
    "TribunalulMilitarBUCURESTI": "Tribunalul Militar BUCUREȘTI",
    "TribunalulMilitarCLUJNAPOCA": "Tribunalul Militar CLUJ-NAPOCA",
    "TribunalulMilitarIASI": "Tribunalul Militar IAȘI",
    "TribunalulMilitarTeritorialBUCURESTI": "Tribunalul Militar Teritorial BUCUREȘTI",
    "TribunalulMilitarTIMISOARA": "Tribunalul Militar TIMIȘOARA",
    "TribunalulMURES": "Tribunalul MUREȘ",
    "TribunalulNEAMT": "Tribunalul NEAMȚ",
    "TribunalulOLT": "Tribunalul OLT",
    "TribunalulpentruMinorisiFamily": "Tribunalul pentru minori și familie BRAȘOV",
    "TribunalulPRAHOVA": "Tribunalul PRAHOVA",
    "TribunalulSALAJ": "Tribunalul SĂLAJ",
    "TribunalulSATUMARE": "Tribunalul SATU MARE",
    "TribunalulSIBIU": "Tribunalul SIBIU",
    "TribunalulSpecializatARGES": "Tribunalul Specializat ARGEȘ",
    "TribunalulSpecializatCLUJ": "Tribunalul Specializat CLUJ",
    "TribunalulSpecializatMURES": "Tribunalul Specializat MUREȘ",
    "TribunalulSUCEAVA": "Tribunalul SUCEAVA",
    "TribunalulTELEORMAN": "Tribunalul TELEORMAN",
    "TribunalulTIMIS": "Tribunalul TIMIȘ",
    "TribunalulTULCEA": "Tribunalul TULCEA",
    "TribunalulVALCEA": "Tribunalul VÂLCEA",
    "TribunalulVASLUI": "Tribunalul VASLUI",
    "TribunalulVRANCEA": "Tribunalul VRANCEA",
}

# Get sorted list of API keys for backward compatibility
INSTITUTII = sorted(INSTITUTII_MAP.keys())

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # First user is admin, rest are users
    user_count = await db.users.count_documents({})
    role = "admin" if user_count == 0 else "user"
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": get_password_hash(user_data.password),
        "role": role,
        "is_active": True,
        "email_notifications": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=role,
            created_at=now,
            email_notifications=True
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"],
            email_notifications=user.get("email_notifications", True)
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"],
        email_notifications=user.get("email_notifications", True)
    )

@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, user: dict = Depends(get_current_user)):
    update_fields = {}
    if update_data.name is not None:
        update_fields["name"] = update_data.name
    if update_data.email_notifications is not None:
        update_fields["email_notifications"] = update_data.email_notifications
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user["id"]}, {"$set": update_fields})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],
        created_at=updated_user["created_at"],
        email_notifications=updated_user.get("email_notifications", True)
    )

# ============== DOSARE ROUTES ==============

@api_router.get("/institutii")
async def get_institutii():
    """Get list of available institutions with display names, sorted alphabetically"""
    # Return both key and display name, sorted by display name
    sorted_items = sorted(INSTITUTII_MAP.items(), key=lambda x: x[1])
    return {
        "institutii": [
            {"key": key, "name": name}
            for key, name in sorted_items
        ]
    }

@api_router.post("/dosare/search")
async def search_dosare(request: CautareDosarRequest):
    """Search for cases using just.ro API - PUBLIC (no auth required)"""
    try:
        # Validate date format if provided
        if request.data_start:
            try:
                datetime.fromisoformat(request.data_start)
            except ValueError:
                return {"error": "Format invalid pentru data_start. Folosiți YYYY-MM-DD"}
        
        if request.data_stop:
            try:
                datetime.fromisoformat(request.data_stop)
            except ValueError:
                return {"error": "Format invalid pentru data_stop. Folosiți YYYY-MM-DD"}
        
        results = await async_cautare_dosare(
            numar_dosar=request.numar_dosar if request.numar_dosar else None,
            obiect_dosar=request.obiect_dosar if request.obiect_dosar else None,
            nume_parte=request.nume_parte if request.nume_parte else None,
            institutie=request.institutie if request.institutie else None,
            data_start=request.data_start if request.data_start else None,
            data_stop=request.data_stop if request.data_stop else None
        )
        
        # Process and sort results by date descending
        processed = []
        if results:
            for dosar in results:
                if dosar and isinstance(dosar, dict):
                    p = process_dosar(dosar)
                    if isinstance(p, dict):
                        processed.append(p)
        
        # Sort by data descending (most recent first)
        processed.sort(key=lambda x: x.get("data", "") if isinstance(x, dict) else "", reverse=True)
        
        # Pagination
        total_count = len(processed)
        page = max(1, request.page)
        page_size = min(max(1, request.page_size), 20)  # Max 20 per page
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_results = processed[start_idx:end_idx]
        
        return {
            "results": paginated_results,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    except Exception as e:
        logging.error(f"Search error: {e}")
        return {"error": f"Eroare la căutare: {str(e)}"}

@api_router.post("/dosare/search/bulk")
async def search_dosare_bulk(request: BulkSearchRequest):
    """Bulk search for cases - PUBLIC (no auth required)"""
    if not request.numere_dosare:
        return {"error": "Lista de numere dosare este goală"}
    
    results = []
    errors = []
    
    for numar in request.numere_dosare[:50]:  # Limit to 50
        try:
            dosar_results = await async_cautare_dosare(
                numar_dosar=numar.strip(),
                institutie=request.institutie if request.institutie else None
            )
            if dosar_results:
                for dosar in dosar_results:
                    if dosar:
                        processed = process_dosar(dosar)
                        processed["searched_number"] = numar
                        results.append(processed)
            else:
                errors.append({"numar": numar, "error": "Negăsit"})
        except Exception as e:
            errors.append({"numar": numar, "error": str(e)})
    
    # Sort by data descending
    results.sort(key=lambda x: x.get("data", "") or "", reverse=True)
    
    # Pagination
    total_count = len(results)
    page = max(1, request.page)
    page_size = min(max(1, request.page_size), 20)
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_results = results[start_idx:end_idx]
    
    return {
        "results": paginated_results,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "errors": errors
    }

@api_router.post("/dosare/search/csv")
async def search_dosare_csv(file: UploadFile = File(...)):
    """Search cases from CSV file - PUBLIC (no auth required)"""
    if not file.filename.endswith('.csv'):
        return {"error": "Fișierul trebuie să fie CSV"}
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
    except Exception:
        return {"error": "Eroare la citirea fișierului"}
    
    reader = csv.reader(io.StringIO(decoded))
    
    numere = []
    for row in reader:
        if row:
            numere.append(row[0].strip())
    
    # Remove header if present
    if numere and not any(c.isdigit() for c in numere[0]):
        numere = numere[1:]
    
    if not numere:
        return {"error": "Fișierul nu conține numere de dosare valide"}
    
    results = []
    errors = []
    
    for numar in numere[:50]:  # Limit to 50
        try:
            dosar_results = await async_cautare_dosare(numar_dosar=numar)
            if dosar_results:
                for dosar in dosar_results:
                    if dosar:
                        processed = process_dosar(dosar)
                        processed["searched_number"] = numar
                        results.append(processed)
            else:
                errors.append({"numar": numar, "error": "Negăsit"})
        except Exception as e:
            errors.append({"numar": numar, "error": str(e)})
    
    # Sort by data descending
    results.sort(key=lambda x: x.get("data", "") or "", reverse=True)
    
    return {
        "results": results,
        "total_count": len(results),
        "page": 1,
        "page_size": len(results),
        "total_pages": 1,
        "errors": errors,
        "total_searched": len(numere)
    }

def process_dosar(dosar) -> dict:
    """Process a case to ensure proper serialization"""
    if not dosar:
        return {}
    
    # Handle if dosar is not a dict (string or other type)
    if not isinstance(dosar, dict):
        return {"numar": str(dosar), "parti": [], "sedinte": [], "caiAtac": []}
    
    processed = {
        "numar": dosar.get("numar", ""),
        "numarVechi": dosar.get("numarVechi", ""),
        "data": str(dosar.get("data", "")) if dosar.get("data") else "",
        "institutie": str(dosar.get("institutie", "")),
        "departament": dosar.get("departament", ""),
        "categorieCaz": str(dosar.get("categorieCaz", "")),
        "stadiuProcesual": str(dosar.get("stadiuProcesual", "")),
        "obiect": dosar.get("obiect", ""),
    }
    
    # Process parties - handle nested DosarParte structure
    parti_raw = dosar.get("parti")
    if parti_raw:
        # Check if it's the nested structure with DosarParte
        if isinstance(parti_raw, dict) and "DosarParte" in parti_raw:
            parti_list = parti_raw.get("DosarParte", [])
        elif isinstance(parti_raw, list):
            parti_list = parti_raw
        else:
            parti_list = []
        
        processed["parti"] = [
            {"nume": p.get("nume", ""), "calitateParte": p.get("calitateParte", "")}
            for p in parti_list if p and isinstance(p, dict)
        ]
    else:
        processed["parti"] = []
    
    # Process hearings - handle nested DosarSedinta structure
    sedinte_raw = dosar.get("sedinte")
    if sedinte_raw:
        if isinstance(sedinte_raw, dict) and "DosarSedinta" in sedinte_raw:
            sedinte_list = sedinte_raw.get("DosarSedinta", [])
        elif isinstance(sedinte_raw, list):
            sedinte_list = sedinte_raw
        else:
            sedinte_list = []
        
        processed["sedinte"] = [
            {
                "complet": s.get("complet", ""),
                "data": str(s.get("data", "")) if s.get("data") else "",
                "ora": s.get("ora", ""),
                "solutie": s.get("solutie", ""),
                "solutieSumar": s.get("solutieSumar", "")
            }
            for s in sedinte_list if s and isinstance(s, dict)
        ]
    else:
        processed["sedinte"] = []
    
    # Process appeals - handle nested DosarCaleAtac structure
    cai_raw = dosar.get("caiAtac")
    if cai_raw:
        if isinstance(cai_raw, dict) and "DosarCaleAtac" in cai_raw:
            cai_list = cai_raw.get("DosarCaleAtac", [])
        elif isinstance(cai_raw, list):
            cai_list = cai_raw
        else:
            cai_list = []
        
        processed["caiAtac"] = [
            {
                "dataDeclarare": str(c.get("dataDeclarare", "")) if c.get("dataDeclarare") else "",
                "parteDeclaratoare": c.get("parteDeclaratoare", ""),
                "tipCaleAtac": c.get("tipCaleAtac", "")
            }
            for c in cai_list if c and isinstance(c, dict)
        ]
    else:
        processed["caiAtac"] = []
    
    return processed

# ============== MONITORIZARE ROUTES ==============

@api_router.post("/monitorizare")
async def add_monitored_case(case_data: MonitoredCaseCreate, user: dict = Depends(get_current_user)):
    """Add a case to monitoring list"""
    # Check if already monitoring
    existing = await db.monitored_cases.find_one({
        "user_id": user["id"],
        "numar_dosar": case_data.numar_dosar
    })
    if existing:
        raise HTTPException(status_code=400, detail="Case already monitored")
    
    # Fetch initial case data
    case_snapshot = await async_cautare_dosare(numar_dosar=case_data.numar_dosar, institutie=case_data.institutie)
    
    case_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": case_id,
        "user_id": user["id"],
        "numar_dosar": case_data.numar_dosar,
        "institutie": case_data.institutie,
        "alias": case_data.alias,
        "last_snapshot": case_snapshot[0] if case_snapshot else None,
        "last_check": now,
        "created_at": now,
        "is_active": True
    }
    
    await db.monitored_cases.insert_one(doc)
    
    return {"id": case_id, "message": "Case added to monitoring", "numar_dosar": case_data.numar_dosar}

@api_router.get("/monitorizare")
async def get_monitored_cases(user: dict = Depends(get_current_user)):
    """Get user's monitored cases"""
    cases = await db.monitored_cases.find(
        {"user_id": user["id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {"cases": cases, "count": len(cases)}

@api_router.delete("/monitorizare/{case_id}")
async def remove_monitored_case(case_id: str, user: dict = Depends(get_current_user)):
    """Remove a case from monitoring"""
    result = await db.monitored_cases.update_one(
        {"id": case_id, "user_id": user["id"]},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Monitored case not found")
    
    return {"message": "Case removed from monitoring"}

@api_router.post("/monitorizare/{case_id}/refresh")
async def refresh_monitored_case(case_id: str, user: dict = Depends(get_current_user)):
    """Manually refresh a monitored case"""
    case = await db.monitored_cases.find_one({"id": case_id, "user_id": user["id"]}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Monitored case not found")
    
    # Fetch latest data
    new_data = await async_cautare_dosare(numar_dosar=case["numar_dosar"], institutie=case.get("institutie"))
    new_snapshot = new_data[0] if new_data else None
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check for changes
    old_snapshot = case.get("last_snapshot")
    has_changes = check_case_changes(old_snapshot, new_snapshot)
    
    # Update
    await db.monitored_cases.update_one(
        {"id": case_id},
        {"$set": {"last_snapshot": new_snapshot, "last_check": now}}
    )
    
    if has_changes and new_snapshot:
        await create_notification(
            user["id"],
            case["numar_dosar"],
            "Dosarul a fost actualizat cu informații noi.",
            "case_update"
        )
    
    return {
        "message": "Case refreshed",
        "has_changes": has_changes,
        "data": process_dosar(new_snapshot) if new_snapshot else None
    }

def check_case_changes(old: dict, new: dict) -> bool:
    """Check if there are meaningful changes between snapshots"""
    if not old and new:
        return True
    if not old or not new:
        return False
    
    # Check number of hearings
    old_sedinte = len(old.get("sedinte", []) or [])
    new_sedinte = len(new.get("sedinte", []) or [])
    if new_sedinte > old_sedinte:
        return True
    
    # Check appeals
    old_cai = len(old.get("caiAtac", []) or [])
    new_cai = len(new.get("caiAtac", []) or [])
    if new_cai > old_cai:
        return True
    
    return False

# ============== NOTIFICATIONS ROUTES ==============

async def create_notification(user_id: str, case_number: str, message: str, notif_type: str):
    """Create a notification for a user"""
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": notif_id,
        "user_id": user_id,
        "case_number": case_number,
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": now
    }
    
    await db.notifications.insert_one(doc)
    return notif_id

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get user notifications"""
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    unread_count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return {"users": users, "count": len(users)}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, update_data: AdminUserUpdate, admin: dict = Depends(get_admin_user)):
    """Update user (admin only)"""
    if user_id == admin["id"] and update_data.role == "user":
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
    
    update_fields = {}
    if update_data.role is not None:
        update_fields["role"] = update_data.role
    if update_data.is_active is not None:
        update_fields["is_active"] = update_data.is_active
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.users.update_one({"id": user_id}, {"$set": update_fields})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated"}

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(get_admin_user)):
    """Get system statistics (admin only)"""
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    total_monitored = await db.monitored_cases.count_documents({"is_active": True})
    total_notifications = await db.notifications.count_documents({})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_monitored_cases": total_monitored,
        "total_notifications": total_notifications
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Portal Dosare API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
