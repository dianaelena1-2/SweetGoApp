import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { LayoutDashboard, ShoppingBag, Package, Star, LogOut, Bell, Search, TrendingUp, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import SidebarCofetarie from '../../components/SidebarCofetarie'

// Statusurile si culorile pentru etichete
const getStatusLabel = (status) => {
    const labels = {
        plasata: { text: 'NOUĂ', bg: '#fff3cd', color: '#856404' },
        confirmata: { text: 'CONFIRMATĂ', bg: '#cce5ff', color: '#004085' },
        in_preparare: { text: 'ÎN PREPARARE', bg: '#fdecd8', color: '#c97c2e' },
        in_livrare: { text: 'ÎN LIVRARE', bg: '#d4edda', color: '#155724' },
        livrata: { text: 'LIVRATĂ', bg: '#d4edda', color: '#155724' },
        anulata: { text: 'ANULATĂ', bg: '#f8d7da', color: '#721c24' }
    };
    return labels[status] || { text: status, bg: '#eee', color: '#333' };
}

function DashboardCofetarie() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [date, setDate] = useState({ totalIncasari: 0, comenziInCurs: 0, produseActive: 0, comenziNoi: 0, ultimeleComenzi: [] })
    const [rating, setRating] = useState(0)
    const [topProduse, setTopProduse] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [alerteExpirare, setAlerteExpirare] = useState([])
    const [arataAlerte, setArataAlerte] = useState(false)
    const [esteDupaOra20, setEsteDupaOra20] = useState(false)

    useEffect(() => {
        const fetchToateDatele = async () => {
            try {
                // Cerem informatiile din mai multe endpoint-uri simultan
                const [resDash, resComenzi, resRecenzii, resAlerte] = await Promise.all([
                    api.get('/dashboard/cofetarie').catch(() => ({ data: date })),
                    api.get('/comenzi/cofetarie'),
                    api.get('/cofetarii/recenzii').catch(() => ({ data: { ratingMediu: 0 } })),
                    api.get('/produse/alerte-expirare').catch(() => ({ data: [] }))
                ]);

                if(resDash.data) setDate(resDash.data);
                setRating(resRecenzii.data.ratingMediu || 0);
                setAlerteExpirare(resAlerte.data);

                // CALCUL: Cele mai vandute produse (pe bune!)
                if (resComenzi.data) {
                    const comenziValide = resComenzi.data.filter(c => c.status !== 'anulata');
                    const contorProduse = {};

                    comenziValide.forEach(comanda => {
                        comanda.detalii.forEach(item => {
                            const id = item.produs_id?._id;
                            if(id) {
                                if(!contorProduse[id]) {
                                    contorProduse[id] = {
                                        _id: id,
                                        numeProdus: item.produs_id.numeProdus || item.numeProdus,
                                        imagine: item.produs_id.imagine,
                                        vandute: 0
                                    };
                                }
                                contorProduse[id].vandute += item.cantitate;
                            }
                        });
                    });

                    // Sortam descrescator dupa cantitatea vanduta si luam primele 3
                    const top = Object.values(contorProduse).sort((a,b) => b.vandute - a.vandute).slice(0, 3);
                    setTopProduse(top);
                }

            } catch (err) {
                setEroare('Eroare la încărcarea datelor');
            } finally {
                setLoading(false);
            }
        }

        fetchToateDatele();

        const checkOra = () => {
            const now = new Date()
            setEsteDupaOra20(now.getHours() >= 20)
        }
        checkOra()
        const interval = setInterval(checkOra, 60000)
        return () => clearInterval(interval)
    }, [])

    const aplicaOferta = async (produsId) => {
        if (!esteDupaOra20) return;
        try {
            await api.put(`/produse/${produsId}/aplica-oferta`)
            setSucces('Oferta anti-risipă a fost aplicată cu succes!')
            setTimeout(() => setSucces(''), 3000)
            
            // Re-fetch alerte
            const raspuns = await api.get('/produse/alerte-expirare')
            setAlerteExpirare(raspuns.data)
            if(raspuns.data.length === 0) setArataAlerte(false);
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la aplicarea ofertei')
            setTimeout(() => setEroare(''), 3000)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `https://sweetgoapp.onrender.com/${img}`;
    }

    // Pentru extragerea initialelor in tabelul de comenzi
    const getInitials = (name) => {
        if (!name) return 'C';
        const parts = name.split(' ');
        if(parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    // Pentru a calcula "procentajul" barei la produsele vandute
    const maxVandute = topProduse.length > 0 ? topProduse[0].vandute : 1;

    if (loading) return <div className="cd-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se încarcă laboratorul...</p></div>

    return (
        <div className="cd-layout">
            {/* ================= SIDEBAR LATERAL ================= */}
            <SidebarCofetarie />

            {/* ================= CONTINUT PRINCIPAL ================= */}
            <main className="cd-main">
                {/* Bara de Sus */}
                <div className="cd-topbar">
                    <div>
                        <h1>Bună, {utilizator?.nume}!</h1>
                        <p>Iată ce se întâmplă astăzi în laboratorul tău.</p>
                    </div>
                    <div className="cd-top-actions">
                        <button className="cd-btn-urgent" onClick={() => navigate('/cofetarie/comenzi?status=plasata')}>
                            Confirmă Comenzi ({date.comenziNoi})
                        </button>
                        <button className="cd-btn-antiwaste" onClick={() => setArataAlerte(!arataAlerte)}>
                            Oferte Anti-Risipă {alerteExpirare.length > 0 ? `(${alerteExpirare.length})` : ''}
                        </button>
                        {/* <div style={{width:'40px', height:'40px', background:'#fdecd8', color:'#c97c2e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                            {getInitials(utilizator?.nume)}
                        </div> */}
                    </div>
                </div>

                {/* Mesaje Eroare/Succes */}
                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {/* Dropdown Alerte Anti-risipă (Ascuns inițial) */}
                {arataAlerte && alerteExpirare.length > 0 && (
                    <div className="alerta-expirare-container" style={{ marginBottom: '2rem' }}>
                        <h3 className="alerta-expirare-header"><AlertTriangle size={20}/> Atenție! Produse care expiră mâine</h3>
                        <p className="alerta-expirare-text">Aplică o reducere de 40% pentru a preveni risipa. { !esteDupaOra20 && <strong>Disponibil după ora 20:00.</strong>}</p>
                        <div className="alerta-expirare-lista">
                            {alerteExpirare.map(produs => (
                                <div key={produs._id} className="alerta-expirare-item">
                                    <div className="alerta-expirare-detalii">
                                        <strong>{produs.numeProdus}</strong> (Stoc: {produs.stoc})
                                    </div>
                                    <button 
                                        className="btn-aplica-oferta" 
                                        style={{ backgroundColor: esteDupaOra20 ? '#4CAF50' : '#e0e0e0', color: esteDupaOra20 ? 'white' : '#9e9e9e', cursor: esteDupaOra20 ? 'pointer' : 'not-allowed' }}
                                        disabled={!esteDupaOra20}
                                        onClick={() => aplicaOferta(produs._id)}
                                    >
                                        {esteDupaOra20 ? 'Aplică ofertă -40%' : '⏳ Așteaptă ora 20:00'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Carduri Statistici (Păstrând Produse Active) */}
                <div className="cd-stats-grid">
                    <div className="cd-stat-card">
                        <div className="cd-stat-icon-wrapper" style={{background: '#ffebee', color: '#e74c3c'}}>
                            <TrendingUp size={20} />
                        </div>
                        <div className="cd-stat-label">Vânzări Totale</div>
                        <div className="cd-stat-value">{date.totalIncasari.toFixed(2)} RON</div>
                    </div>

                    <div className="cd-stat-card">
                        <div className="cd-stat-icon-wrapper" style={{background: '#fdf3f4', color: '#e18f99'}}>
                            <ShoppingBag size={20} />
                        </div>
                        <div className="cd-stat-label">Comenzi Active</div>
                        {/* Comenzile active = cele noi + cele in preparare/livrare */}
                        <div className="cd-stat-value">{date.comenziInCurs + date.comenziNoi}</div>
                    </div>

                    <div className="cd-stat-card">
                        <div className="cd-stat-icon-wrapper" style={{background: '#fff8e1', color: '#f5b041'}}>
                            <Star size={20} />
                        </div>
                        <div className="cd-stat-label">Rating Mediu</div>
                        <div className="cd-stat-value">{rating > 0 ? rating.toFixed(1) : '0.0'} <span style={{fontSize:'1rem', color:'#9a7a5a'}}>/ 5.0</span></div>
                    </div>

                    <div className="cd-stat-card">
                        <div className="cd-stat-icon-wrapper" style={{background: '#e8f5e9', color: '#2ecc71'}}>
                            <Package size={20} />
                        </div>
                        <div className="cd-stat-label">Produse Active</div>
                        <div className="cd-stat-value">{date.produseActive}</div>
                    </div>
                </div>

                {/* Sectiunea de jos (Comenzi Recente + Cele mai vandute) */}
                <div className="cd-bottom-grid">
                    
                    {/* Panel Stânga: Comenzi Recente */}
                    <div className="cd-panel">
                        <div className="cd-panel-header">
                            <h3>Comenzi Recente</h3>
                            <span className="cd-link-vezi" onClick={() => navigate('/cofetarie/comenzi')}>Vezi Toate</span>
                        </div>
                        
                        <div className="cd-table-row cd-table-header">
                            <div>Client</div>
                            <div>Produse</div>
                            <div>Status</div>
                            <div style={{textAlign: 'right'}}>Preț</div>
                        </div>

                        {date.ultimeleComenzi && date.ultimeleComenzi.length > 0 ? (
                            date.ultimeleComenzi.slice(0, 4).map(comanda => {
                                const statusInfo = getStatusLabel(comanda.status);
                                // Aratam doar primele 2 produse pt descriere pe scurt
                                const produseScurt = comanda.detalii.slice(0,2).map(d => d.numeProdus).join(', ') + (comanda.detalii.length > 2 ? '...' : '');

                                return (
                                    <div className="cd-table-row" key={comanda._id}>
                                        <div className="cd-client-info">
                                            <div className="cd-avatar-mic">{getInitials(comanda.numeClient)}</div>
                                            <strong style={{fontSize:'0.9rem', color:'#3d2c1e'}}>{comanda.numeClient}</strong>
                                        </div>
                                        <div style={{fontSize:'0.85rem', color:'#7a5230'}}>{produseScurt}</div>
                                        <div>
                                            <span style={{background: statusInfo.bg, color: statusInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700'}}>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                        <div style={{textAlign: 'right', fontWeight: '700', color: '#3d2c1e'}}>{comanda.total.toFixed(2)} RON</div>
                                    </div>
                                )
                            })
                        ) : (
                            <p style={{padding:'1rem 0', color:'#9a7a5a', textAlign:'center'}}>Nicio comandă recentă.</p>
                        )}
                    </div>

                    {/* Panel Dreapta: Cele mai Vandute */}
                    <div className="cd-panel">
                        <div className="cd-panel-header">
                            <h3>Cele mai Vândute</h3>
                        </div>

                        {topProduse.length > 0 ? (
                            topProduse.map((prod, index) => (
                                <div className="cd-top-item" key={prod._id}>
                                    <img 
                                        src={getImageUrl(prod.imagine) || 'https://via.placeholder.com/50'} 
                                        alt={prod.numeProdus} 
                                        className="cd-top-img" 
                                    />
                                    <div className="cd-top-info">
                                        <div className="cd-top-nume">{prod.numeProdus}</div>
                                        <div className="cd-top-vandute">{prod.vandute} unități vândute</div>
                                        <div className="cd-top-procent-container">
                                            {/* Bara vizuala proportionala cu cel mai vandut produs */}
                                            <div className="cd-top-procent-bara" style={{ width: `${(prod.vandute / maxVandute) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div style={{fontWeight:'700', color:'#3d2c1e'}}>
                                        #{index + 1}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{color:'#9a7a5a', textAlign:'center', marginTop:'2rem'}}>Nu există date suficiente.</p>
                        )}
                    </div>

                </div>
            </main>
        </div>
    )
}

export default DashboardCofetarie