import requests

from database import get_connection

NASA_URL = "https://ssd-api.jpl.nasa.gov/cad.api"

def main():
    try:
        # Recupero dati dalla NASA
        print("Recupero dati dalla NASA (con API Key)...")
        #params = {"dist-max": "0.05","limit": "50"} # Limitiamo a 50 eventi per evitare sovraccarichi (per ora)
        # In ingest.py, prova a espandere la ricerca:
        params = {
    "dist-max": "0.2",          # Aumentiamo la distanza a 0.2 AU (molti più oggetti)
    "date-min": "2023-01-01",   # Prendiamo dati a partire dall'anno scorso
    "date-max": "2027-01-01",   # Guardiamo anche nel futuro prossimo
    "h-max": "25",              # Includiamo anche asteroidi più piccoli (magnitudine assoluta)
    "limit": "1000"
        }
        response = requests.get(NASA_URL, params=params)
        #response = requests.get(NASA_URL)
        response.raise_for_status()
        payload = response.json()
        
        # Inserimento dati nel database
        rows = payload.get('data', []) # Indici: des=0, cd=3, dist=4, v_rel=7, h=10
        
        connection = get_connection()
        cursor = connection.cursor()
        
        print(f"Trovati {len(rows)} eventi. Inserimento nel database...")

        for row in rows:
            des = row[0]   # Nome asteroide
            cd = row[3]    # Data passaggio
            dist = row[4]  # Distanza
            v_rel = row[7] # Velocità
            h = row[10]    # Magnitudine (grandezza)

            cursor.execute("SELECT save_asteroid(%s, %s);", (str(des), float(h))) # Tabella 1: ASTEROIDS
            asteroid_id = cursor.fetchone()[0] # Recupera l'ID dell'asteroide appena inserito
            cursor.execute("SELECT save_approach(%s, %s, %s, %s);", (asteroid_id, cd, float(dist), float(v_rel))) # Tabella 2: CLOSE_APPROACHES

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