import os
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_CONFIG = {
    "host": "localhost",
    "database": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD")
}
NASA_URL = "https://ssd-api.jpl.nasa.gov/cad.api"

def main():
    try:
        # Recupero dati dalla NASA
        print("Recupero dati dalla NASA (con API Key)...")
        params = {"dist-max": "0.05","limit": "50"} # Limitiamo a 50 eventi per evitare sovraccarichi
        response = requests.get(NASA_URL, params=params)
        response.raise_for_status()
        payload = response.json()
        
        # Inserimento dati nel database
        rows = payload.get('data', []) # Indici: des=0, cd=3, dist=4, v_rel=7, h=10
        
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print(f"Trovati {len(rows)} eventi. Inserimento nel database...")

        for row in rows:
            des = row[0]   # Nome asteroide
            cd = row[3]    # Data passaggio
            dist = row[4]  # Distanza
            v_rel = row[7] # Velocità
            h = row[10]    # Magnitudine (grandezza)

            cursor.execute("SELECT save_asteroid(%s, %s);", (des, h)) # Tabella 1: ASTEROIDS
            
            asteroid_id = cursor.fetchone()[0]

            cursor.execute("SELECT save_approach(%s, %s, %s, %s);", (asteroid_id, cd, dist, v_rel)) # Tabella 2: CLOSE_APPROACHES

        # Salvataggio delle modifiche
        connection.commit()
        print("Dati salvati correttamente!")

    except Exception as e:
        print(f"Errore durante l'operazione: {e}")
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    main()