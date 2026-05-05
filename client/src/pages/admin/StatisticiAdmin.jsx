import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LayoutDashboard, BarChart3, LogOut, PackageCheck } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../services/api';

function StatisticiAdmin() {
    const { utilizator, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // Pentru a evidenția butonul activ din Sidebar

    const [statistici, setStatistici] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eroare, setEroare] = useState('');

    useEffect(() => {
        const fetchStatistici = async () => {
            try {
                const raspuns = await api.get('/admin/dashboard-statistici');
                setStatistici(raspuns.data);
            } catch (err) {
                setEroare('Eroare la încărcarea statisticilor globale.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatistici();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="admin-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se generează rapoartele...</p></div>;
    if (eroare) return <div className="admin-layout"><p className="gol" style={{color: 'red', width:'100%', marginTop:'5rem'}}>{eroare}</p></div>;
    if (!statistici) return null;

    return (
        <div className="admin-layout">
            
            {/* ================= SIDEBAR LATERAL (Fix la fel ca in Dashboard) ================= */}
            <aside className="admin-sidebar">
                <div className="admin-logo">SweetGo 🍰</div>

                <nav className="admin-nav">
                    <button 
                        className={`admin-nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button 
                        className={`admin-nav-item ${location.pathname === '/admin/statistici' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/statistici')}
                    >
                        <BarChart3 size={20}/> Statistici
                    </button>
                </nav>

                <button className="cd-btn-logout" onClick={handleLogout}>
                    <LogOut size={20}/> Deconectează-te
                </button>
            </aside>

            {/* ================= CONȚINUT PRINCIPAL (Grafice) ================= */}
            <main className="admin-main">
                
                <div className="admin-topbar">
                    <div className="admin-top-user">
                        <div>
                            <h4>{utilizator?.nume || 'Administrator'}</h4>
                            <p>Overview Platformă</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: '#3d2c1e', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Statistici Platformă</h2>
                    <p style={{ color: '#9a7a5a', fontSize: '0.95rem' }}>O privire de ansamblu asupra creșterii și sănătății ecosistemului SweetGo.</p>
                </div>

                {/* 1. Impactul Anti-Risipă (Highlight mare) */}
                <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
                    <div className="admin-stat-card" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: 'white', border: 'none', flexDirection: 'row', justifyContent: 'space-between', padding: '2rem' }}>
                        <div>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Misiune Îndeplinită: Impact Ecologic</span>
                            <h3 style={{ fontSize: '3rem', margin: '10px 0', fontWeight: '900' }}>
                                {statistici.produseSalvateGlobal}
                            </h3>
                            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>Deserturi salvate de la risipă pe întreaga platformă.</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PackageCheck size={64} color="white" />
                        </div>
                    </div>
                </div>

                <div className="dash-grid-top">
                    {/* 2. Creșterea Platformei (Area Chart) */}
                    <div className="dash-card">
                        <h3 className="dash-card-title">Creșterea Ecosistemului</h3>
                        <p className="dash-card-subtitle">Conturi noi create în ultimele 30 de zile</p>
                        <div className="dash-chart-container">
                            <ResponsiveContainer>
                                <AreaChart data={statistici.cresterePlatforma} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorClienti" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCofetarii" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#c97c2e" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#c97c2e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="data" tick={{fontSize: 10, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: '1px solid #f5d5a8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} 
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Area type="monotone" dataKey="clientiNovi" name="Clienți Noi" stroke="#3498db" fillOpacity={1} fill="url(#colorClienti)" />
                                    <Area type="monotone" dataKey="cofetariiNoi" name="Cofetării Noi" stroke="#c97c2e" fillOpacity={1} fill="url(#colorCofetarii)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Rata de succes comenzi (Stacked Bar Chart) */}
                    <div className="dash-card">
                        <h3 className="dash-card-title">Rata de Succes Comenzi</h3>
                        <p className="dash-card-subtitle">Performanța comenzilor (ultimele 14 zile)</p>
                        <div className="dash-chart-container">
                            <ResponsiveContainer>
                                <BarChart data={statistici.rataSuccesComenzi} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="data" tick={{fontSize: 10, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: '1px solid #f5d5a8'}} 
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Bar dataKey="livrate" name="Succes / În curs" stackId="a" fill="#2ecc71" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="anulate" name="Anulate" stackId="a" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 4. Top Cofetării (Bar Chart Orizontal) */}
                <div className="dash-card" style={{ marginTop: '20px' }}>
                    <h3 className="dash-card-title">Top Parteneri (Cofetării)</h3>
                    <p className="dash-card-subtitle">Cei mai performanți parteneri după volumul total al vânzărilor (Lei)</p>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={statistici.topCofetarii} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false}/>
                                <YAxis dataKey="nume" type="category" tick={{fontSize: 12, fill: '#3d2c1e', fontWeight: 'bold'}} axisLine={false} tickLine={false} width={150}/>
                                <Tooltip 
                                    cursor={{fill: '#fffaf5'}} 
                                    contentStyle={{borderRadius: '12px', border: '1px solid #f5d5a8'}} 
                                    formatter={(value, name) => [
                                        name === 'totalVenit' ? `${value} Lei` : value, 
                                        name === 'totalVenit' ? 'Încasări Totale' : 'Număr Comenzi'
                                    ]}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="totalVenit" name="Încasări Totale (Lei)" fill="#c97c2e" radius={[0, 6, 6, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default StatisticiAdmin;