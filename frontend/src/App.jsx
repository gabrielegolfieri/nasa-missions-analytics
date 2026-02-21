import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Rocket, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function App() {
  // --- 1. STATI ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'approach_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [minDate, setMinDate] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- 2. CHIAMATE API ---
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data`);
      setData(response.data);
    } catch (error) {
      console.error("Errore nel recupero dati:", error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/refresh`);
      setTimeout(async () => {
        await fetchData();
        setLoading(false);
        alert("Database aggiornato con i dati NASA!");
      }, 20000);
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      setLoading(false);
    }
  };

  // --- 3. EFFETTI ---
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset pagina se cambia la ricerca
  }, [searchTerm, minDate]); // Aggiunto minDate per resettare anche al cambio data

  // --- 4. LOGICA DATI (Filtri, Ordinamento, Paginazione) ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesName = item.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !minDate || new Date(item.approach_date) >= new Date(minDate);
      return matchesName && matchesDate;
    });
  }, [data, searchTerm, minDate]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Unica logica di paginazione ottimizzata
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(firstPageIndex, firstPageIndex + itemsPerPage);
  }, [currentPage, sortedData, itemsPerPage]);

  // Funzioni di supporto tabella
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // --- 5. PREPARAZIONE DATI GRAFICI ---
  const dangerData = useMemo(() => {
    const dangerous = filteredData.filter(item => parseFloat(item.distance_au) <= 0.05).length;
    const safe = filteredData.length - dangerous;
    return [
      { name: 'Pericolosi (< 0.05 AU)', value: dangerous, color: '#ef4444' },
      { name: 'Sicuri', value: safe, color: '#22c55e' }
    ];
  }, [filteredData]);

  const proximityData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => parseFloat(a.distance_au) - parseFloat(b.distance_au))
      .slice(0, 10)
      .map(item => ({
        name: item.designation,
        distanza: parseFloat(item.distance_au)
      }));
  }, [filteredData]);

  // --- 6. RENDER UI ---
  return (
    <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>

      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2><Rocket /> NASA Near-Earth Object Analytics</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{ 
            cursor: loading ? 'not-allowed' : 'pointer', 
            padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Scarico dati...' : 'Aggiorna Dati NASA'}
        </button>
      </header>

      {/* BARRA CONTROLLI (Filtri + Paginazione) */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
        gap: '20px', marginBottom: '20px', padding: '15px',
        backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155'
      }}>
        {/* Gruppo Sinistro */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filtra per nome (es. 2024 OU)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '4px', minWidth: '250px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Dal:</span>
            <input
              type="date"
              value={minDate}
              onChange={(e) => setMinDate(e.target.value)}
              style={{ padding: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Gruppo Destro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Mostra:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ padding: '6px 10px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          >
            <option value={10}>10 righe</option>
            <option value={25}>25 righe</option>
            <option value={50}>50 righe</option>
            <option value={100}>100 righe</option>
          </select>
        </div>
      </div>

      {/* GRAFICI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', height: '300px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Livello di Allerta (0.05 AU Threshold)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={dangerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {dangerData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', height: '300px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Top 10 Asteroidi più Vicini (AU)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={proximityData} layout="vertical">
              <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={80} />
              <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
              <Bar dataKey="distanza" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABELLA */}
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
                <td>
                  {new Date(item.approach_date).toLocaleString('it-IT', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td style={{ color: parseFloat(item.distance_au) <= 0.05 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>
                  {parseFloat(item.distance_au).toFixed(5)}
                </td>
                <td style={{ color: '#fbbf24' }}>{parseFloat(item.velocity_km_s).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CONTROLLI PAGINAZIONE FONDO PAGINA */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(p => p - 1)}
          style={{ padding: '5px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft />
        </button>
        <span style={{ fontSize: '14px' }}>Pagina {currentPage} di {totalPages || 1}</span>
        <button 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setCurrentPage(p => p + 1)}
          style={{ padding: '5px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight />
        </button>
      </div>

    </div>
  );
}

export default App;