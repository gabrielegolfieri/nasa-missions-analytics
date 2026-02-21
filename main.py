from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor

import ingest
from database import get_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nasa-missions-analytics-frontend.onrender.com",
        "http://localhost:5173"  # per sviluppo locale
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/data")
def get_dashboard_data():
    connection = get_connection()
    cursor = connection.cursor(cursor_factory=RealDictCursor) # Restituisce JSON pulito
    query = """
        SELECT a.designation, a.absolute_magnitude, c.approach_date, c.distance_au, c.velocity_km_s
        FROM asteroids a
        JOIN close_approaches c ON a.id = c.asteroid_id
        ORDER BY c.approach_date DESC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    connection.close()
    return data

@app.post("/api/refresh")
async def refresh_data(background_tasks: BackgroundTasks):
    # Lancia l'ingestione in background per non bloccare la dashboard
    background_tasks.add_task(ingest.main)
    return {"message": "Aggiornamento dati avviato!"}