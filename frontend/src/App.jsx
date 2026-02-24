import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Rocket, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis, ReferenceDot } from 'recharts';

// --- STILI GLOBALI ---
const s = {
  box: { backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' },
  input: { padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '4px' },
  th: { padding: '12px 10px', textAlign: 'left', cursor: 'pointer' },
  td: { padding: '10px' },
  btn: { padding: '8px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px' }
};

function App() {
  // --- STATI ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: 'approach_date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [minDate, setMinDate] = useState("");
  const [limit, setLimit] = useState(10);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- CHIAMATE API E EFFETTI ---
  const fetchData = async () => {
    try { setData((await axios.get(`${API_URL}/api/data`)).data); }
    catch (e) { console.error("Errore recupero dati:", e); }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/refresh`);
      setTimeout(async () => { await fetchData(); setLoading(false); alert("Database aggiornato con i dati NASA!"); }, 20000);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPage(1); }, [search, minDate]);

  // --- LOGICA TABELLA E DATI ---
  const filtered = useMemo(() => data.filter(i =>
    i.designation.toLowerCase().includes(search.toLowerCase()) &&
    (!minDate || new Date(i.approach_date) >= new Date(minDate))
  ), [data, search, minDate]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (!sort.key) return 0;
    return (a[sort.key] < b[sort.key] ? -1 : 1) * (sort.dir === 'asc' ? 1 : -1);
  }), [filtered, sort]);

  const totalPages = Math.ceil(sorted.length / limit) || 1;
  const paginated = useMemo(() => sorted.slice((page - 1) * limit, page * limit), [page, sorted, limit]);

  const reqSort = k => setSort({ key: k, dir: sort.key === k && sort.dir === 'desc' ? 'asc' : 'desc' });
  const SortIcon = ({ k }) => sort.key !== k ? null : sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;

  // --- PREPARAZIONE GRAFICI ---
  const dangerCount = data.filter(i => parseFloat(i.distance_au) <= 0.05).length;
  const dangerData = useMemo(() => [
    { name: 'Pericolosi (< 0.05 AU)', value: dangerCount, color: '#ef4444' },
    { name: 'Sicuri', value: data.length - dangerCount, color: '#22c55e' }
  ], [data, dangerCount]);

  const proxData = useMemo(() => [...data].sort((a, b) => a.distance_au - b.distance_au).slice(0, 10).map(i => ({
    name: i.designation, distanza: parseFloat(i.distance_au)
  })), [data]);

  const univData = useMemo(() => [...data].sort((a, b) => a.distance_au - b.distance_au).slice(0, 1500).map(i => {
    const d = parseFloat(i.distance_au), ang = Math.random() * 2 * Math.PI;
    return { name: i.designation, distanza: d, x: d * Math.cos(ang), y: d * Math.sin(ang), isDanger: d <= 0.05 };
  }), [data]);

  // --- COMPONENTI RIUTILIZZABILI ---
  const SharedTooltip = ({ active, payload, type }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload, isPie = type === 'pie';
    const c = isPie ? d.color : (d.isDanger ? '#ff4d4d' : type === 'bar' ? '#60a5fa' : '#4ade80');

    return (
      <div style={{ background: 'rgba(15,23,42,0.85)', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backdropFilter: 'blur(4px)' }}>
        <p style={{ margin: isPie ? 0 : '0 0 5px 0', fontWeight: 'bold', color: c }}>
          {isPie ? d.name : `${d.name}`} {isPie && <span style={{ color: 'white' }}>: {d.value}</span>}
        </p>
        {!isPie && <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Distanza: <span style={{ color: 'white' }}>{d.distanza.toFixed(5)} AU</span></p>}
      </div>
    );
  };

  const PBtn = ({ Ico, cond, onClick }) => (
    <button onClick={onClick} disabled={cond} style={{ ...s.btn, cursor: cond ? 'not-allowed' : 'pointer', opacity: cond ? 0.5 : 1 }}>
      <Ico size={18} />
    </button>
  );

  // --- RENDER GRAFICI MEMOIZZATI ---
  const charts = useMemo(() => (
    <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
      <div style={{ ...s.box, height: '300px' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: '#cbd5e1' }}>Radar di Prossimità (Terra al centro)</h3>
        <ResponsiveContainer width="100%" height="90%"><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} /><YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} /><ZAxis type="number" dataKey="distanza" range={[8, 12]} />
          <Tooltip content={<SharedTooltip type="scatter" />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />
          <ReferenceDot x={0} y={0} r={8} fill="#3b82f6" stroke="#ffffff" />
          <Scatter data={univData} fillOpacity={0.85}>{univData.map((e, i) => <Cell key={i} fill={e.isDanger ? '#ef4444' : '#22c55e'} />)}</Scatter>
        </ScatterChart></ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ ...s.box, height: '300px' }}>
          <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: '#cbd5e1' }}>Livello di Allerta Globale (Soglia 0.05 AU)</h3>
          <ResponsiveContainer width="100%" height="90%"><PieChart>
            <Pie data={dangerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{dangerData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
            <Tooltip content={<SharedTooltip type="pie" />} /><Legend />
          </PieChart></ResponsiveContainer>
        </div>
        <div style={{ ...s.box, height: '300px' }}>
          <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: '#cbd5e1' }}>Top 10 Asteroidi più Vicini</h3>
          <ResponsiveContainer width="100%" height="90%"><BarChart data={proxData} layout="vertical" margin={{ right: 20 }}>
            <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 'dataMax']} tickFormatter={(value) => value.toFixed(4)} /><YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={80} />
            <Tooltip content={<SharedTooltip type="bar" />} cursor={{ fill: '#334155' }} />
            <Bar dataKey="distanza" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  ), [univData, dangerData, proxData]);

  // --- UI PRINCIPALE ---
  return (
    <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>

        <h2 style={{display: 'flex', alignItems: 'center', gap: '12px', margin: 0,fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'}}>
            <Rocket size={26} strokeWidth={2.5} />
          </div>
          <span>NASA{' '}
            <span style={{background: 'linear-gradient(to right, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent'}}>Near-Earth Object</span>
            {' '}Analytics
          </span>
        </h2>

        <button onClick={handleRefresh} disabled={loading} style={{ ...s.btn, backgroundColor: '#3b82f6', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Scarico dati...' : 'Aggiorna Dati NASA'}
        </button>
      </header>

      {charts}

      <div>
        <h3 style={{ fontSize: '18px', margin: '0 0 15px', paddingBottom: '10px', borderBottom: '1px solid #334155' }}>Esplora Dati Dettagliati</h3>

        <div style={{ ...s.box, display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', flex: 1, flexWrap: 'wrap' }}>
            <input type="text" placeholder="Filtra per nome (es. 2024)..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...s.input, minWidth: '250px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#94a3b8' }}>Dal:</span>
              <input type="date" value={minDate} onChange={e => setMinDate(e.target.value)} style={s.input} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#94a3b8' }}>Mostra:</span>
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ ...s.input, cursor: 'pointer' }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} righe</option>)}
            </select>
          </div>
        </div>

        <div style={{ ...s.box, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#334155' }}><tr>
              {[{ k: 'designation', l: 'Designazione' }, { k: 'approach_date', l: 'Data' }, { k: 'distance_au', l: 'Distanza (AU)' }, { k: 'velocity_km_s', l: 'Velocità (km/s)' }].map(c => (
                <th key={c.k} onClick={() => reqSort(c.k)} style={s.th}>{c.l} <SortIcon k={c.k} /></th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length ? paginated.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #334155', backgroundColor: i % 2 ? '#0f172a' : '#1e293b' }}>
                  <td style={{ ...s.td, color: '#60a5fa' }}>{item.designation}</td>
                  <td style={{ ...s.td, color: '#cbd5e1' }}>{new Date(item.approach_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ ...s.td, color: item.distance_au <= 0.05 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>{parseFloat(item.distance_au).toFixed(5)}</td>
                  <td style={{ ...s.td, color: '#fbbf24' }}>{parseFloat(item.velocity_km_s).toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Nessun asteroide trovato.</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
          <PBtn Ico={ChevronsLeft} cond={page === 1} onClick={() => setPage(1)} />
          <PBtn Ico={ChevronLeft} cond={page === 1} onClick={() => setPage(page - 1)} />
          <span style={{ fontWeight: 'bold' }}>Pagina {page} di {totalPages}</span>
          <PBtn Ico={ChevronRight} cond={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} />
          <PBtn Ico={ChevronsRight} cond={page === totalPages || totalPages === 0} onClick={() => setPage(totalPages)} />
        </div>
      </div>

    </div>
  );
}

export default App;