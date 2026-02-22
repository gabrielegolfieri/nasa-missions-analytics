import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor

import ingest
from database import get_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM asteroids")
    count = cursor.fetchone()[0]
    cursor.close()
    connection.close()

    if count == 0:
        print("Database vuoto, avvio ingest automatico...")
        await asyncio.to_thread(ingest.main)
        print("Ingest completato!")

    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "NASA API is running!"}

@app.get("/api/data")
def get_dashboard_data():
    connection = get_connection()
    cursor = connection.cursor(cursor_factory=RealDictCursor)
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
    background_tasks.add_task(ingest.main)
    return {"message": "Aggiornamento dati avviato!"}