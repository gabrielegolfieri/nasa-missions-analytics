import requests
from database import get_connection

NASA_URL = "https://ssd-api.jpl.nasa.gov/cad.api"

def fetch_nasa_data():
    """Recupera i dati dall'API NASA con parametri predefiniti."""
    params = {
        "dist-max": "0.2",          # Distanza massima in AU
        "date-min": "2025-01-01",   # Data inizio ricerca
        "h-max": "25",              # Magnitudine massima
        "limit": "5000"             # Limite record
    }
    response = requests.get(NASA_URL, params=params)
    response.raise_for_status()
    return response.json().get('data', [])

def main():
    try:
        print("Inizio recupero dati dalla NASA...")
        rows = fetch_nasa_data()
        print(f"Trovati {len(rows)} eventi. Inizio sincronizzazione database...")

        with get_connection() as conn:
            with conn.cursor() as cur:
                for row in rows:
                    try:
                        # Estrazione dati basata sugli indici NASA
                        des, cd, dist, v_rel, h = row[0], row[3], row[4], row[7], row[10]

                        # Salva/Aggiorna anagrafica asteroide
                        cur.execute("SELECT save_asteroid(%s, %s);", (str(des), float(h)))
                        asteroid_id = cur.fetchone()[0]  # Otteniamo l'ID dell'asteroide appena salvato/aggiornato
                        
                        # Salva l'avvicinamento usando l'ID dell'asteroide
                        cur.execute(
                            "SELECT save_approach(%s, %s, %s, %s);", 
                            (asteroid_id, cd, float(dist), float(v_rel))
                        )
                        
                        conn.commit() # Salvataggio atomico per ogni record

                    except Exception as row_error:
                        conn.rollback()
                        print(f"Errore durante l'inserimento dell'asteroide {row[0]}: {row_error}")

        print("Sincronizzazione completata con successo!")

    except Exception as e:
        print(f"Errore critico durante l'esecuzione: {e}")

if __name__ == "__main__":
    main()