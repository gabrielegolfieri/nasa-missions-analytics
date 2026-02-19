# NASA Asteroid Close Approach Tracker

Uno strumento professionale di **data ingestion** progettato per recuperare, elaborare e memorizzare i dati relativi agli avvicinamenti degli asteroidi (Close Approaches) forniti dalle API **NASA JPL SSD**, salvandoli in un database locale **PostgreSQL**.

## Panoramica del Progetto
Questo progetto automatizza il recupero dei dati Near-Earth Object (NEO). Si concentra sugli asteroidi che si avvicinano alla Terra entro una distanza specifica, memorizzando le loro caratteristiche fisiche e i dettagli del passaggio per analisi future.

## Architettura e Schema Database
Il database è stato progettato con una struttura relazionale per garantire l'integrità dei dati e ridurre al minimo la ridondanza.

```mermaid
erDiagram
    ASTEROIDS ||--o{ CLOSE_APPROACHES : "possiede"
    ASTEROIDS {
        int id PK
        string designation UK "Designazione ufficiale NASA"
        float absolute_magnitude "Parametro H (magnitudine)"
    }
    CLOSE_APPROACHES {
        int id PK
        int asteroid_id FK "Riferimento a ASTEROIDS"
        timestamp approach_date "Data del passaggio"
        float distance_au "Distanza in Unità Astronomiche"
        float velocity_km_s "Velocità in km/s"
    }