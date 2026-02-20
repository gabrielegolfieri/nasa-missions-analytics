import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Rocket } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Funzione per scaricare i dati dall'API FastAPI
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/data');
      setData(response.data);
    } catch (error) {
      console.error("Errore nel recupero dati:", error);
    }
  };

  // Funzione per il tasto Aggiorna
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/refresh');
      alert("Aggiornamento avviato in background!");
      setTimeout(fetchData, 3000);
    } catch (error) {
      alert("Errore durante l'aggiornamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1><Rocket /> NASA Asteroid Tracker</h1>
      
      <button 
        onClick={handleRefresh} 
        disabled={loading}
        style={{ padding: '10px', cursor: 'pointer', marginBottom: '20px' }}
      >
        <RefreshCw size={16} /> {loading ? 'Aggiornamento...' : 'Aggiorna Dati NASA'}
      </button>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Designazione</th>
            <th>Data Passaggio</th>
            <th>Distanza (AU)</th>
            <th>Velocità (km/s)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.designation}</td>
              <td>{new Date(item.approach_date).toLocaleDateString()}</td>
              <td>{item.distance_au.toFixed(4)}</td>
              <td>{item.velocity_km_s.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;