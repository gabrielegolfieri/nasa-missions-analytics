-- Tabella 1: Anagrafica degli Asteroidi
CREATE TABLE IF NOT EXISTS asteroids (
    id SERIAL PRIMARY KEY,
    designation VARCHAR(50) UNIQUE NOT NULL,
    absolute_magnitude REAL
);

-- Tabella 2: Eventi di Avvicinamento (Close Approaches)
CREATE TABLE IF NOT EXISTS close_approaches (
    id SERIAL PRIMARY KEY,
    asteroid_id INTEGER NOT NULL,
    approach_date TIMESTAMP NOT NULL,
    distance_au REAL NOT NULL,
    velocity_km_s REAL NOT NULL,
    
    FOREIGN KEY (asteroid_id) REFERENCES asteroids (id) ON DELETE CASCADE,
    CONSTRAINT unique_approach UNIQUE (asteroid_id, approach_date)
);

-- Funzione 1: Salva l'asteroide e restituisci l'ID
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

-- Funzione 2: Salva l'avvicinamento
CREATE OR REPLACE FUNCTION save_approach(p_ast_id INTEGER, p_date TIMESTAMP, p_dist NUMERIC, p_vel NUMERIC)
RETURNS VOID AS $$
BEGIN
    INSERT INTO close_approaches (asteroid_id, approach_date, distance_au, velocity_km_s)
    VALUES (p_ast_id, p_date, p_dist, p_vel)
    ON CONFLICT (asteroid_id, approach_date) 
    DO UPDATE SET 
        distance_au = EXCLUDED.distance_au,
        velocity_km_s = EXCLUDED.velocity_km_s;
END;
$$ LANGUAGE plpgsql;