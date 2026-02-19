-- Tabella 1: Anagrafica degli Asteroidi
-- Contiene i dati fisici "fissi" dell'oggetto celeste
CREATE TABLE IF NOT EXISTS asteroids (
    id SERIAL PRIMARY KEY,                   -- ID auto-incrementante
    designation VARCHAR(50) UNIQUE NOT NULL, -- Corrisponde al campo NASA 'des'
    absolute_magnitude REAL                  -- Corrisponde al campo NASA 'h' (magnitudine assoluta)
);

-- Tabella 2: Eventi di Avvicinamento (Close Approaches)
-- Contiene i dati di ogni singolo passaggio vicino alla Terra
CREATE TABLE IF NOT EXISTS close_approaches (
    id SERIAL PRIMARY KEY,
    asteroid_id INTEGER NOT NULL,            -- Chiave Esterna che punta alla tabella asteroids
    approach_date TIMESTAMP NOT NULL,        -- Corrisponde al campo NASA 'cd'
    distance_au REAL NOT NULL,               -- Corrisponde al campo NASA 'dist'
    velocity_km_s REAL NOT NULL,             -- Corrisponde al campo NASA 'v_rel'
    
    -- Definiamo il legame tra le due tabelle
    CONSTRAINT fk_asteroid
        FOREIGN KEY(asteroid_id)
        REFERENCES asteroids(id)
        ON DELETE CASCADE
);