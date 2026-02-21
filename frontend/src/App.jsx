import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Rocket, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Stato per gestire il caricamento
  
  const [sortConfig, setSortConfig] = useState({ key: 'approach_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Questa funzione LEGGE solo i dati dal DB
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/data');
      setData(response.data);
    } catch (error) {
      console.error("Errore nel recupero dati:", error);
    }
  };

  // Questa funzione SCARICA i nuovi dati dalla NASA
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Chiamiamo l'endpoint POST che abbiamo creato nel backend
      await axios.post('http://localhost:8000/api/refresh');
      
      // Aspettiamo 10 secondi per dare tempo al backend di finire l'ingestione
      setTimeout(async () => {
        await fetchData();
        setLoading(false);
        alert("Database aggiornato con i dati NASA!");
      }, 10000); 

    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);


const [searchTerm, setSearchTerm] = useState("");

// Filtriamo i dati in base a ciò che scrive l'utente prima di ordinarli
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [data, searchTerm]);

// Ora la logica di ordinamento e paginazione deve usare filteredData
const sortedData = useMemo(() => {
  let sortableItems = [...filteredData]; // <--- USA I DATI FILTRATI
  if (sortConfig !== null) {
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return sortableItems;
}, [filteredData, sortConfig]);

  // --- Logica di Paginazione ---
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentItems = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2><Rocket /> NASA Mission Analytics</h2>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          style={{ cursor: loading ? 'not-allowed' : 'pointer', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          {loading ? 'Scarico dati dalla NASA...' : 'Aggiorna Dati NASA'}
        </button>
      </header>

      <div style={{ marginBottom: '15px' }}>
  <input 
    type="text"
    placeholder="Filtra per nome (es. 2024 BX)..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{ 
      padding: '10px', width: '100%', maxWidth: '400px', 
      backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px' 
    }}
  />
</div>

      <div style={{ backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#334155', cursor: 'pointer', textAlign: 'left' }}>
              <th onClick={() => requestSort('designation')} style={{ padding: '10px' }}>Designazione {getSortIcon('designation')}</th>
              <th onClick={() => requestSort('approach_date')}>Data {getSortIcon('approach_date')}</th>
              <th onClick={() => requestSort('distance_au')}>Distanza (AU) {getSortIcon('distance_au')}</th>
              <th onClick={() => requestSort('velocity_km_s')}>Velocità (km/s) {getSortIcon('velocity_km_s')}</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#1e293b' : '#1e293b80' }}>
                <td style={{ padding: '8px 10px', color: '#60a5fa' }}>{item.designation}</td>
                <td>{item.approach_date}</td>
                <td>{parseFloat(item.distance_au).toFixed(5)}</td>
                <td style={{ color: '#fbbf24' }}>{parseFloat(item.velocity_km_s).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft /></button>
        <span>Pagina {currentPage} di {totalPages || 1}</span>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight /></button>
      </div>
    </div>
  );
}

export default App;