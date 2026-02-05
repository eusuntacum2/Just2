# Portal Dosare just.ro - PRD

## Original Problem Statement
Portal pentru monitorizarea dosarelor de pe just.ro integrat cu API-ul SOAP http://portalquery.just.ro/query.asmx. Funcționalități:
- Căutare dosare (individual și bulk)
- Monitorizare dosare
- Notificări când apar modificări
- Roluri: User și Admin (admin administrează utilizatorii și funcționalitățile)
- Autentificare JWT, notificări email + in-app
- Temă light/dark selectabilă

## User Personas
1. **Avocat/Jurist** - Monitorizează multiple dosare pentru clienți, necesită căutare bulk și notificări
2. **Persoană fizică** - Urmărește unul sau câteva dosare proprii
3. **Administrator** - Gestionează utilizatorii și monitorizează sistemul

## Core Requirements (Static)
- [x] Integrare API SOAP just.ro (CautareDosare, CautareDosare2, CautareSedinte)
- [x] Autentificare JWT cu roluri (User/Admin)
- [x] Căutare individuală: număr dosar, nume parte, instituție, interval date
- [x] Căutare bulk: textarea + upload CSV
- [x] Monitorizare dosare per utilizator
- [x] Notificări in-app (stocate în MongoDB)
- [x] Panou admin pentru gestionare utilizatori
- [x] Toggle light/dark theme

## What's Been Implemented (05.02.2026)

### Backend (FastAPI + MongoDB)
- `/api/auth/*` - Register, Login, Me, Update profile (JWT)
- `/api/dosare/search` - Căutare individuală **PUBLIC**
- `/api/dosare/search/bulk` - Căutare multiple numere **PUBLIC**
- `/api/dosare/search/csv` - Upload CSV pentru căutare **PUBLIC**
- `/api/monitorizare/*` - CRUD dosare monitorizate + refresh (AUTH REQUIRED)
- `/api/notifications/*` - Get, mark read, mark all read (AUTH REQUIRED)
- `/api/admin/users` - Gestionare utilizatori (ADMIN)
- `/api/admin/stats` - Statistici sistem (ADMIN)
- `/api/institutii` - Lista instituțiilor

### Recent Update: Lista Instanțe Completă + Design Modern (05.02.2026)
- Lista completă cu 232 instanțe judiciare
- Dropdown cu căutare/filtrare rapidă (Command component)
- Instanțe sortate alfabetic după nume
- Design modern: fonturi Inter + Source Serif 4
- Spațiu generos, culori deschise, interfață aerisită
- Tema light/dark cu tranziție fluidă

### Frontend (React + Tailwind + shadcn/ui)
- Landing page cu CTA
- Login/Register pages
- Dashboard cu statistici și acțiuni rapide
- Căutare dosare (tabs: individual, bulk, CSV)
- Dosare monitorizate cu refresh și detalii
- Centrul de notificări
- Setări (profil, notificări, temă)
- Admin: gestionare utilizatori și statistici

### Design System
- Light theme: Paper & Ink (cream background, navy text, terracotta accent)
- Dark theme: Obsidian & Gold (charcoal background, gold accent)
- Font serif: Libre Baskerville (headings)
- Font sans: DM Sans (body)

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Auth system cu JWT
- [x] Integrare SOAP just.ro
- [x] Căutare dosare
- [x] Monitorizare dosare

### P1 - Important (Partial)
- [x] Notificări in-app
- [ ] Notificări email (necesită integrare SendGrid/Resend)
- [ ] Job programat pentru verificare automată modificări

### P2 - Nice to Have
- [ ] Export rezultate în PDF/Excel
- [ ] Filtru avansat pentru monitorizare
- [ ] Dashboard analytics pentru admin
- [ ] Căutare ședințe (CautareSedinte endpoint)
- [ ] Alertă SMS (Twilio)

## Next Tasks List
1. **Integrare email notifications** - SendGrid sau Resend pentru alerte modificări
2. **Background job** - Cron sau Celery pentru verificare automată dosare monitorizate
3. **Îmbunătățiri UX** - Loading states, error handling, mobile responsive
4. **Export funcționalitate** - PDF/Excel pentru rezultate căutare

## Architecture
```
/app
├── backend/
│   └── server.py          # FastAPI + zeep SOAP client + MongoDB
├── frontend/
│   └── src/
│       ├── contexts/      # AuthContext, ThemeContext
│       ├── pages/         # All page components
│       └── components/    # DashboardLayout, shadcn/ui
```

## API Reference
- SOAP Endpoint: `http://portalquery.just.ro/query.asmx`
- Methods: CautareDosare, CautareDosare2, CautareSedinte, HelloWorld
- WSDL: `http://portalquery.just.ro/query.asmx?WSDL`
