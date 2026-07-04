import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import SidebarCofetarie from '../../components/SidebarCofetarie';

function StatisticiCofetarie(){
    const [statistici, setStatistici] = useState(null);
    const [loading, setLoading] = useState(true);

    const [ziSelectata, setZiSelectata] = useState(null);
    const [dateZi, setDateZi] = useState([]);
    const [loadingZi, setLoadingZi] = useState(false);

    const CULORI_PIE = ['#c97c2e', '#bd081c', '#7a5230', '#2ecc71', '#f39c12'];

    useEffect(() => {
        const fetchStatistici = async () => {
            try {
                const raspuns = await api.get('/cofetarii/dashboard-statistici');
                setStatistici(raspuns.data);
            } catch (eroare) {
                console.error("Eroare la încărcarea statisticilor", eroare);
            } finally {
                setLoading(false);
            }
        };
        fetchStatistici();
    }, []);

    const handleBarClick = async (data) => {
        if (!data || !data._id) return;
        setZiSelectata(data._id); 
        setLoadingZi(true);
        
        try {
            const raspuns = await api.get(`/cofetarii/dashboard-statistici/ziua?data=${data._id}`);
            setDateZi(raspuns.data);
        } catch (err) {
            console.error("Eroare aducere date zilnice", err);
        } finally {
            setLoadingZi(false);
        }
    };

    const renderLegendaPersonalizata = (props) => {
        const { payload } = props;
        return (
            <ul className="dash-legend-list">
                {payload.map((entry, index) => (
                    <li key={`item-${index}`} className="dash-legend-item">
                        <span className="dash-legend-dot" style={{ backgroundColor: entry.color }}></span>
                        {entry.value}: <strong>{entry.payload.cantitateVanduta}</strong>
                    </li>
                ))}
            </ul>
        );
    };

    const CustomTooltipGogoasa = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="dash-custom-tooltip">
                    <span className="dash-tooltip-label">{payload[0].name}</span>
                    <span className="dash-tooltip-value">{payload[0].value} produse</span>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="cd-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se analizează datele...</p></div>;
    if (!statistici) return <div className="cd-layout"><p className="gol" style={{width:'100%', marginTop:'5rem'}}>Nu s-au putut încărca statisticile.</p></div>;

    const totalProduseVandute = statistici.distributieCategorii.reduce((acc, curr) => acc + curr.cantitateVanduta, 0);

    return (
        <div className="cd-layout">
            <SidebarCofetarie />
            
            <main className="cd-main">
                <div className="cd-topbar">
                    <div>
                        <h1>Privire de ansamblu</h1>
                        <p>Monitorizează performanța cofetăriei tale din ultimele 30 de zile.</p>
                    </div>
                </div>

                <div className="dash-grid-top">
                    <div className="dash-card">
                        {!ziSelectata ? (
                            <>
                                <h3 className="dash-card-title">Evoluție vânzări</h3>
                                <p className="dash-card-subtitle">Performanță zilnică (Apasă pe o bară pentru detalii pe ore)</p>
                            </>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 className="dash-card-title" style={{ color: '#c97c2e' }}>Vânzări: {ziSelectata}</h3>
                                    <p className="dash-card-subtitle" style={{ margin: 0 }}>Distribuție pe ore</p>
                                </div>
                                <button 
                                    onClick={() => setZiSelectata(null)} 
                                    style={{ background: '#fffaf5', border: '1px solid #f5d5a8', color: '#c97c2e', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ← Înapoi
                                </button>
                            </div>
                        )}
                        <div className="dash-chart-container">
                            {ziSelectata && loadingZi ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a7a5a' }}>Se încarcă...</div>
                            ) : ziSelectata ? (
                                <ResponsiveContainer>
                                    <BarChart data={dateZi} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="oraText" tick={{fontSize: 11, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#fffaf5'}} 
                                            contentStyle={{borderRadius: '12px', border: '1px solid #f5d5a8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} 
                                            itemStyle={{ color: '#c97c2e', fontWeight: 700, fontSize: '1.1rem' }}
                                            formatter={(value) => [`${value} Lei`, 'Total ora']}
                                        />
                                        <Bar dataKey="totalZilnic" fill="#c97c2e" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer>
                                    <BarChart data={statistici.evolutieVanzari} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="_id" tick={{fontSize: 10, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#fffaf5'}} 
                                            contentStyle={{borderRadius: '12px', border: '1px solid #f5d5a8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} 
                                            itemStyle={{ color: '#c97c2e', fontWeight: 700, fontSize: '1.1rem' }}
                                            formatter={(value) => [`${value} Lei`, 'Total încasări']}
                                        />
                                        <Bar dataKey="totalZilnic" fill="#fdecd8" radius={[6, 6, 0, 0]} activeBar={{ fill: '#c97c2e' }} onClick={handleBarClick} cursor="pointer" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="dash-card">
                        <h3 className="dash-card-title">Distribuție comenzi</h3>
                        <p className="dash-card-subtitle">Produse vândute pe categorii</p>
                        <div className="dash-chart-container-pie">
                            <div className="dash-pie-center">
                                <h3>{totalProduseVandute}</h3>
                                <span>TOTAL</span>
                            </div>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie 
                                        data={statistici.distributieCategorii} 
                                        cx="50%" cy="40%" innerRadius={55} outerRadius={75} paddingAngle={3}
                                        dataKey="cantitateVanduta" nameKey="_id" stroke="none"
                                    >
                                        {statistici.distributieCategorii.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CULORI_PIE[index % CULORI_PIE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltipGogoasa />} cursor={false} offset={25} />
                                    <Legend content={renderLegendaPersonalizata} verticalAlign="bottom" align="center" wrapperStyle={{ bottom: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="dash-grid-bottom">
                    <div className="dash-card dash-card-anti-waste">
                        <div className="dash-icon-earth"><span>🌍</span></div>
                        <div>
                            <h3 className="dash-aw-title">Efectul Anti-Risipă</h3>
                            <div className="dash-aw-value-wrapper">
                                <h2 className="dash-aw-number">{statistici.produseSalvate}</h2>
                                <span className="dash-aw-text">{statistici.produseSalvate === 1 ? 'desert salvat' : 'deserturi salvate'}</span>
                            </div>
                            <p className="dash-aw-desc">Prin activarea ofertei de seară, ai transformat posibile pierderi în vânzări și ai contribuit la reducerea risipei.</p>
                        </div>
                    </div>

                    <div className="dash-card dash-card-insight">
                        <div className="dash-insight-badge-wrapper"><span className="dash-insight-badge">💡 Recomandare</span></div>
                        {statistici.insightOraVarf ? (
                            <>
                                <h2 className="dash-insight-title">Ora de vârf: <span>{statistici.insightOraVarf.ziua} la {statistici.insightOraVarf.ora}</span></h2>
                                <p className="dash-insight-desc">Cele mai multe comenzi (<strong>{statistici.insightOraVarf.comenzi}</strong>) sunt plasate în acest interval.</p>
                            </>
                        ) : (
                            <p className="dash-insight-desc">Date în curs de colectare pentru calcularea orei de vârf.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default StatisticiCofetarie;