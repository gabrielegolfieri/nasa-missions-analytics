# NASA Near-Earth Object Analytics Dashboard

**[🔗 VAI ALLA DASHBOARD (Render)](https://nasa-missions-analytics-frontend.onrender.com/)**

> **Nota tecnica sul Deploy Cloud:** Il backend e il database di questo progetto sono ospitati sul piano gratuito di **Render**. In caso di inattività prolungata, il server entra in modalità standby. Al primo accesso, l'API potrebbe richiedere circa 50 secondi per "svegliarsi" e caricare i dati. Le richieste successive saranno istantanee.

Una piattaforma per il monitoraggio, l'ingestione e l'analisi visiva degli asteroidi in avvicinamento alla Terra, basata sui dati ufficiali della NASA.

---

## Funzionalità Principali

* **Dashboard Interattiva**: Un'interfaccia React a singola pagina che reagisce in tempo reale agli input dell'utente.
* **Visualizzazione Dati e Trend**: 
  * **Pie Chart**: Evidenzia il rapporto tra asteroidi sicuri e quelli "Potenzialmente Pericolosi" (soglia di attenzione impostata a 0.05 AU, standard astronomico per i PHA).
  * **Bar Chart**: Mostra i trend di prossimità per i 10 asteroidi più vicini in base ai filtri attivi.
* **Tabella Dinamica Avanzata**: 
  * Ricerca istantanea per designazione (nome).
  * Filtro temporale interattivo per escludere eventi passati.
  * Paginazione personalizzabile e ordinamento multi-colonna.
  * Formattazione condizionale (rosso/verde) per evidenziare immediatamente i fattori di rischio spaziale.
* **Data Pipeline Resiliente**: Il backend esegue un controllo all'avvio: se il database è vuoto, innesca automaticamente uno script Python (`ingest.py`) per il download massivo dei dati NASA (fino a 5000 record storici e futuri)

---

## Stack Tecnologico

L'infrastruttura è completamente deploata su **Render.com**, garantendo la persistenza dei dati e l'accessibilità via web:

* **Frontend**: React.js (Vite), Recharts per la data visualization, Lucide-React per l'iconografia.
* **Backend**: Python 3, FastAPI, Psycopg2.
* **Database**: PostgreSQL.

---

## Architettura del Database
Il database è progettato per garantire efficienza e assenza di duplicati:
1. `asteroids`: Tabella anagrafica contenente Designazione e Magnitudine Assoluta.
2. `close_approaches`: Tabella degli eventi temporali contenente ID Asteroide, Data di avvicinamento, Distanza, Velocità.

---

## Guida all'Avvio (Sviluppo Locale)

Se si desidera clonare il repository ed eseguire l'applicazione sul proprio ambiente locale:

### Prerequisiti
* Docker e Docker Compose (per il DB locale)
* Python 3.10+
* Node.js e npm

### 1. Database & Backend
```
# Avviare PostgreSQL tramite Docker
docker compose up -d
```

#### Configurare l'ambiente Python
```
python -m venv .venv
source .venv/bin/activate # (Su Windows: .venv\Scripts\activate)
pip install -r requirements.txt
```

#### Avviare il server FastAPI (il DB si popolerà da solo all'avvio)
```
uvicorn main:app --reload
```

### 2. Frontend
In un nuovo terminale, nella cartella del frontend:
```
npm install
npm run dev
```