# Portal Dosare just.ro - Versiunea PHP

Aplicație PHP pentru căutarea și monitorizarea dosarelor judecătorești din România,
integrat cu API-ul SOAP de la `portalquery.just.ro`.

## 📋 Cerințe Sistem

- **PHP**: >= 7.4 (recomandat 8.0+)
- **MySQL**: >= 5.7 sau MariaDB >= 10.3
- **Extensii PHP necesare**:
  - `pdo_mysql` - pentru conexiunea la baza de date
  - `soap` - pentru integrarea cu API-ul just.ro
  - `json` - pentru procesarea datelor
  - `mbstring` - pentru suport caractere Unicode/diacritice

## 🚀 Instalare Rapidă

### Metoda 1: Instalare Automată

1. Copiază fișierele pe serverul web (XAMPP, WAMP, LAMP sau hosting)
2. Accesează în browser: `http://localhost/php/` sau `http://domeniul-tau.ro/php/`
3. Urmează instrucțiunile din pagina de instalare

### Metoda 2: Instalare Manuală

#### Pasul 1: Crearea bazei de date

```sql
-- Conectează-te la MySQL ca administrator
mysql -u root -p

-- Creează baza de date
CREATE DATABASE portal_dosare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Creează un utilizator dedicat (opțional, recomandat pentru producție)
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'parola_securizata';
GRANT ALL PRIVILEGES ON portal_dosare.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;

-- Selectează baza de date și rulează schema
USE portal_dosare;
SOURCE sql/init.sql;
```

#### Pasul 2: Configurarea conexiunii

Editează fișierul `includes/config.php` sau setează variabilele de mediu:

**Opțiunea A: Editare directă în config.php**
```php
// Găsește aceste linii și modifică valorile:
define('DB_HOST', 'localhost');        // Host-ul serverului MySQL
define('DB_PORT', '3306');             // Portul MySQL (default: 3306)
define('DB_NAME', 'portal_dosare');    // Numele bazei de date
define('DB_USER', 'portal_user');      // Utilizatorul MySQL
define('DB_PASS', 'parola_ta');        // Parola MySQL
```

**Opțiunea B: Variabile de mediu (recomandat pentru producție)**
```bash
# În .htaccess sau configurația serverului
SetEnv MYSQL_HOST localhost
SetEnv MYSQL_PORT 3306
SetEnv MYSQL_DATABASE portal_dosare
SetEnv MYSQL_USER portal_user
SetEnv MYSQL_PASSWORD parola_securizata
```

**Opțiunea C: Fișier .env (pentru hosting-uri compatibile)**
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=portal_dosare
MYSQL_USER=portal_user
MYSQL_PASSWORD=parola_securizata
APP_URL=http://localhost/php
```

#### Pasul 3: Verificare permisiuni

```bash
# Asigură-te că directorul logs este writable
mkdir -p logs
chmod 755 logs
```

## 📁 Structura Proiectului

```
/php
├── index.php              # Punct de intrare principal
├── config.php             # (alternativ) Configurare la nivel rădăcină
├── README.md              # Acest fișier
│
├── /includes              # Fișiere incluse în toate paginile
│   ├── config.php         # Configurare aplicație și DB
│   ├── db.php             # Clasa Database și funcții helper
│   ├── functions.php      # Funcții utilitare
│   ├── soap_client.php    # Client SOAP pentru just.ro
│   ├── header.php         # Header HTML comun
│   └── footer.php         # Footer HTML comun
│
├── /pages                 # Paginile aplicației
│   ├── index.php          # Landing page
│   ├── search.php         # Pagina de căutare
│   ├── login.php          # Autentificare
│   ├── register.php       # Înregistrare cont nou
│   ├── logout.php         # Deconectare
│   ├── dashboard.php      # Panou utilizator
│   └── ...                # Alte pagini
│
├── /sql                   # Scripturi SQL
│   └── init.sql           # Schema bazei de date
│
├── /install               # Fișiere pentru instalare
│   ├── install.php        # Script de instalare automată
│   └── schema.sql         # Schema (duplicate pentru compatibilitate)
│
├── /assets                # Resurse statice
│   ├── /css               # Stiluri CSS
│   └── /js                # JavaScript
│
└── /logs                  # Loguri erori (nu se commit)
    └── error.log
```

## ⚙️ Configurare pentru Diferite Medii

### Local (XAMPP/WAMP/MAMP)

```php
// includes/config.php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'portal_dosare');
define('DB_USER', 'root');
define('DB_PASS', '');  // XAMPP implicit nu are parolă
```

### Producție (cPanel, Plesk, etc.)

```php
// includes/config.php
define('DB_HOST', 'localhost');  // sau IP-ul serverului MySQL
define('DB_PORT', '3306');
define('DB_NAME', 'numecont_portal');  // prefixat cu numele contului
define('DB_USER', 'numecont_portaluser');
define('DB_PASS', 'parola_complexa_aici');
```

## 🧪 Testare

### Verificare conexiune la baza de date:
```bash
# Din linia de comandă
php -r "require 'includes/db.php'; echo 'Conexiune OK!';"
```

### Testare manuală în browser:
1. Accesează `http://localhost/php/`
2. Dacă apare pagina de bun venit → **Succes!**
3. Dacă apare eroare → Verifică mesajul și corectează configurația

### Verificare API SOAP:
```php
// test_soap.php (șterge după testare)
<?php
require_once 'includes/soap_client.php';
$result = test_soap_connection();
var_dump($result);
```

## 🔒 Securitate

1. **Nu expune `config.php`** - Asigură-te că fișierul nu este accesibil direct
2. **Folosește HTTPS** în producție
3. **Actualizează parolele** implicite
4. **Verifică permisiunile** fișierelor (755 pentru directoare, 644 pentru fișiere)

## 🐛 Depanare Probleme Comune

| Problemă | Soluție |
|----------|--------|
| `Connection refused` | Verifică dacă MySQL rulează |
| `Access denied` | Verifică user/parolă în config.php |
| `Unknown database` | Rulează sql/init.sql pentru a crea tabelele |
| `SOAP error` | Verifică dacă extensia PHP SOAP este instalată |
| `Class 'PDO' not found` | Activează extensia pdo_mysql în php.ini |

## 📝 Licență

Acest proiect este oferit sub licența MIT.

## 📞 Contact

Pentru întrebări sau probleme, creează un Issue în repository.
