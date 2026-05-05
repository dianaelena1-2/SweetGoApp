import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LayoutDashboard, BarChart3, LogOut, PackageCheck } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';

function StatisticiAdmin() {
    const { utilizator, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

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

    const CustomTooltipTopCofetarii = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="dash-custom-tooltip">
                <p className="dash-tooltip-label">{data.nume}</p>
                <p className="dash-tooltip-value">
                    Vânzări: <span>{payload[0].value.toFixed(2)} Lei</span>
                </p>
                <p className="dash-tooltip-subtext">
                    Total: {data.totalComenzi} comenzi finalizate
                </p>
            </div>
        );
    }
    return null;
};

    if (loading) return <div className="admin-layout"><p className="loading">Se generează rapoartele...</p></div>;
    if (eroare) return <div className="admin-layout"><p className="gol">{eroare}</p></div>;
    if (!statistici) return null;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">SweetGo 🍰</div>

                <nav className="admin-nav">
                    <button 
                        className={`admin-nav-item ${location.pathname === '/admin/dashboard-admin' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/dashboard-admin')}
                    >
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button 
                        className={`admin-nav-item ${location.pathname === '/admin/statistici-admin' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/statistici-admin')}
                    >
                        <BarChart3 size={20}/> Statistici
                    </button>
                </nav>

                <button className="cd-btn-logout" onClick={handleLogout}>
                    <LogOut size={20}/> Deconectează-te
                </button>
            </aside>

            <main className="admin-main">
                <div className="admin-topbar">
                    <div className="admin-top-user">
                        <div>
                            <h4>{utilizator?.nume || 'Administrator'}</h4>
                        </div>
                    </div>
                </div>

                <div className="admin-sectiune">
                    <h2>Performanța platformei</h2>
                    <p className="text-muted">Urmărește evoluția, vânzările și activitatea generală din aplicația SweetGo.</p>
                </div>

                <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '2.5rem' }}>
                    <div className="admin-eco-card">
                        <div className="eco-card-content">
                            <span className="eco-card-label">Misiune îndeplinită: Deserturi salvate cu oferta anti-risipă</span>
                            <h3 className="eco-card-value">
                                {statistici.produseSalvateGlobal} 
                            </h3>
                            <p className="eco-card-desc">
                                <strong>Felicitări!</strong> Acesta este numărul total de deserturi care au ajuns pe masa clienților în loc să fie aruncate.
                            </p>
                        </div>
                        <div className="eco-card-icon" style={{ fontSize: '4.5rem', lineHeight: 1 }}>
                            🌍
                        </div>
                    </div>
                </div>

                <div className="dash-grid-top">
                    <div className="dash-card">
                        <h3 className="dash-card-title">Evoluția aplicației </h3>
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

                    <div className="dash-card">
                        <h3 className="dash-card-title">Rata de succes - comenzi</h3>
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

                <div className="dash-card pt-margin">
                    <h3 className="dash-card-title">Top parteneri (Cofetării)</h3>
                    <p className="dash-card-subtitle">Cei mai performanți parteneri după volumul total al vânzărilor (lei)</p>
                    <div className="dash-chart-container" style={{ height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={statistici.topCofetarii} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false}/>
                                <YAxis dataKey="nume" type="category" tick={{fontSize: 12, fill: '#3d2c1e', fontWeight: 'bold'}} axisLine={false} tickLine={false} width={150}/>
                                <Tooltip 
                                    content={<CustomTooltipTopCofetarii />} 
                                    cursor={{ fill: '#fffaf5' }} 
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="totalVenit" name="Încasări totale (lei)" fill="#c97c2e" radius={[0, 6, 6, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default StatisticiAdmin;