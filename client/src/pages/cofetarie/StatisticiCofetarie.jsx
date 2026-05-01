import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import SidebarCofetarie from '../../components/SidebarCofetarie'

function StatisticiCofetarie(){
    const [statistici, setStatistici] = useState(null);
    const [loading, setLoading] = useState(true);

    const CULORI_PIE = ['#bd081c', '#7a5230', '#bdc3c7', '#e67e22', '#2c3e50'];

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

    if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Se analizează datele...</div>;
    if (!statistici) return <div>Nu s-au putut încărca statisticile.</div>;

    const totalProduseVandute = statistici.distributieCategorii.reduce((acc, curr) => acc + curr.cantitateVanduta, 0);

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h2>Privire de ansamblu</h2>
                <p>Monitorizează performanța cofetăriei tale și impactul vânzărilor.</p>
            </div>

            <div className="dash-grid-top">
                {/* 1. Graficul de Bare - Evoluție Vânzări */}
                <div className="dash-card">
                    <h3 className="dash-card-title">Evoluție Vânzări</h3>
                    <p className="dash-card-subtitle">Performanță zilnică în ultimele 30 de zile (Lei)</p>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={statistici.evolutieVanzari} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="_id" tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12, fill: '#95a5a6'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="totalZilnic" fill="#fad4cc" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Graficul Gogoașă - Distribuție Comenzi */}
                <div className="dash-card" style={{position: 'relative'}}>
                    <h3 className="dash-card-title">Distribuție Comenzi</h3>
                    <p className="dash-card-subtitle">După categorii principale</p>
                    
                    <div style={{ width: '100%', height: 200, position: 'relative' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={statistici.distributieCategorii} 
                                    innerRadius={70} 
                                    outerRadius={90} 
                                    paddingAngle={2}
                                    dataKey="cantitateVanduta"
                                    nameKey="_id"
                                    stroke="none"
                                >
                                    {statistici.distributieCategorii.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CULORI_PIE[index % CULORI_PIE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Textul din centrul gogoșei */}
                        <div className="dash-pie-center">
                            <h3>{totalProduseVandute}</h3>
                            <span>TOTAL</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dash-grid-bottom">
                {/* 3. Impact Anti-Risipă */}
                <div className="dash-card" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                    <div style={{background: '#e8f5e9', padding: '20px', borderRadius: '50%', marginBottom: '15px'}}>
                        <span style={{fontSize: '2rem'}}>🌍</span>
                    </div>
                    <h3 className="dash-card-title" style={{fontSize: '1.4rem'}}>Impact Anti-Risipă</h3>
                    <p className="dash-card-subtitle" style={{marginBottom: '10px'}}>Produse salvate de la aruncare</p>
                    <h2 style={{color: '#27ae60', fontSize: '2.5rem', margin: 0}}>
                        {statistici.produseSalvate} <span style={{fontSize: '1rem', color: '#7f8c8d'}}>unități</span>
                    </h2>
                </div>

                {/* 4. Insight de Top (Cardul Roșu) */}
                <div className="dash-card-red">
                    <span className="dash-badge">Insight de top</span>
                    {statistici.insightOraVarf ? (
                        <>
                            <h2 className="dash-red-title">
                                Ora de vârf: {statistici.insightOraVarf.ziua} la {statistici.insightOraVarf.ora}
                            </h2>
                            <p className="dash-red-desc">
                                Cele mai multe comenzi ({statistici.insightOraVarf.comenzi}) sunt plasate în acest interval. 
                                Ia în considerare suplimentarea stocului și a personalului pentru această perioadă!
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="dash-red-title">Suficiente date indisponibile</h2>
                            <p className="dash-red-desc">Mai ai nevoie de câteva comenzi finalizate pentru a putea calcula ora ta de vârf.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatisticiCofetarie;