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
    id SERIAL PRIMARY KEY,                   -- ID auto-incrementante
    asteroid_id INTEGER NOT NULL,            -- Chiave Esterna che punta alla tabella asteroids
    approach_date TIMESTAMP NOT NULL,        -- Corrisponde al campo NASA 'cd'
    distance_au REAL NOT NULL,               -- Corrisponde al campo NASA 'dist'
    velocity_km_s REAL NOT NULL,             -- Corrisponde al campo NASA 'v_rel'
    
    -- Definiamo il legame tra le due tabelle
    FOREIGN KEY (asteroid_id) REFERENCES asteroids (id) ON DELETE CASCADE,
    CONSTRAINT unique_approach UNIQUE (asteroid_id, approach_date)
);

-- Funzione per gestire l'inserimento dell'asteroide e restituire l'ID
CREATE OR REPLACE FUNCTION save_asteroid(p_des TEXT, p_h NUMERIC)
RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO asteroids (designation, absolute_magnitude)
    VALUES (p_des, p_h)
    ON CONFLICT (designation)
    DO UPDATE SET absolute_magnitude = EXCLUDED.absolute_magnitude
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per gestire l'inserimento dei Passaggi
CREATE OR REPLACE FUNCTION save_approach(p_desig INTEGER, p_date TIMESTAMP, p_dist NUMERIC, p_vel NUMERIC)
RETURNS VOID AS $$
DECLARE v_ast_id INT;
BEGIN
    SELECT id INTO v_ast_id FROM asteroids WHERE id = p_desig;
    
    IF v_ast_id IS NOT NULL THEN
        INSERT INTO close_approaches (asteroid_id, approach_date, distance_au, velocity_km_s)
        VALUES (v_ast_id, p_date, p_dist, p_vel)
        ON CONFLICT (asteroid_id, approach_date) 
        DO UPDATE SET 
            distance_au = EXCLUDED.distance_au,
            velocity_km_s = EXCLUDED.velocity_km_s;
    END IF;
END;
$$ LANGUAGE plpgsql;