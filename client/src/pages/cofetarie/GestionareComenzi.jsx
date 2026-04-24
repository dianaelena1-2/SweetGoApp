import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { LayoutDashboard, ShoppingBag, Package, Star, LogOut, Search, Cake, User, Calendar, MapPin, Phone, SlidersHorizontal, CheckCircle, Hourglass, CheckSquare, Coins, Truck, CreditCard } from 'lucide-react'
import api from '../../services/api'
import SidebarCofetarie from '../../components/NavbarCofetarie';

const STATUSURI = ['toate', 'plasata', 'confirmata', 'in_preparare', 'in_livrare', 'livrata', 'anulata']

const statusLabel = {
    plasata: { text: 'Nou', cls: 'plasata' },
    confirmata: { text: 'Confirmată', cls: 'confirmata' },
    in_preparare: { text: 'În preparare', cls: 'in_preparare' },
    in_livrare: { text: 'Gata de livrare', cls: 'in_livrare' },
    livrata: { text: 'Livrat', cls: 'livrata' },
    anulata: { text: 'Anulată', cls: 'anulata' }
}

const statusUrmator = {
    plasata: 'confirmata',
    confirmata: 'in_preparare',
    in_preparare: 'in_livrare',
    in_livrare: 'livrata'
}

const statusUrmatorLabel = {
    plasata: '✓ Confirmă comanda',
    confirmata: '👨‍🍳 Începe prepararea',
    in_preparare: '🚴 Trimite spre livrare',
    in_livrare: '✅ Comandă livrată'
}

function GestionareComenzi() {
    const { utilizator } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

    const [comenzi, setComenzi] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [filtruStatus, setFiltruStatus] = useState('toate')
    const [comenziExpandate, setComenziExpandate] = useState({})

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const statusParam = params.get('status')
        if (statusParam && STATUSURI.includes(statusParam)) {
            setFiltruStatus(statusParam)
        } else {
            setFiltruStatus('toate')
        }
    }, [location.search])

    useEffect(() => {
        const params = new URLSearchParams()
        if (filtruStatus !== 'toate') {
            params.set('status', filtruStatus)
        }
        const newUrl = `/cofetarie/comenzi${params.toString() ? `?${params.toString()}` : ''}`
        navigate(newUrl, { replace: true })
    }, [filtruStatus, navigate])

    useEffect(() => {
        fetchComenzi()
    }, [])

    const fetchComenzi = async () => {
        try {
            const raspuns = await api.get('/comenzi/cofetarie')
            setComenzi(raspuns.data)
        } catch (err) {
            setEroare('Eroare la încărcarea comenzilor')
        } finally {
            setLoading(false)
        }
    }

    const afiseazaSucces = (mesaj) => {
        setSucces(mesaj)
        setTimeout(() => setSucces(''), 3000)
    }

    const toggleExpandare = (comandaId) => {
        setComenziExpandate(prev => ({ ...prev, [comandaId]: !prev[comandaId] }))
    }

    const handleSchimbaStatus = async (comandaId, statusNou) => {
        try {
            await api.put(`/comenzi/${comandaId}/status`, { status: statusNou })
            afiseazaSucces('Status actualizat cu succes!')
            fetchComenzi()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la actualizarea statusului')
        }
    }

    const handleAnuleaza = async (comandaId) => {
        if (!window.confirm('Ești sigur că vrei să anulezi această comandă?')) return
        try {
            await api.put(`/comenzi/${comandaId}/status`, { status: 'anulata' })
            afiseazaSucces('Comandă anulată')
            fetchComenzi()
        } catch (err) {
            setEroare('Eroare la anularea comenzii')
        }
    }

    const getAziIeriFormat = (dateString) => {
        const date = new Date(dateString)
        const azi = new Date()
        const ieri = new Date(azi)
        ieri.setDate(ieri.getDate() - 1)

        const isAzi = date.getDate() === azi.getDate() && date.getMonth() === azi.getMonth() && date.getFullYear() === azi.getFullYear()
        const isIeri = date.getDate() === ieri.getDate() && date.getMonth() === ieri.getMonth() && date.getFullYear() === ieri.getFullYear()

        const ora = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

        if (isAzi) return `Astăzi, ${ora}`
        if (isIeri) return `Ieri, ${ora}`
        return `${date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}, ${ora}`
    }

    const getInitials = (name) => {
        if (!name) return 'C';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0].toUpperCase();
    }

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    const azi = new Date();
    const isAzi = (d) => {
        const date = new Date(d);
        return date.getDate() === azi.getDate() && date.getMonth() === azi.getMonth() && date.getFullYear() === azi.getFullYear();
    }

    const statNoi = comenzi.filter(c => c.status === 'plasata').length;
    const statPreparare = comenzi.filter(c => c.status === 'in_preparare').length;
    const statLivrateAzi = comenzi.filter(c => c.status === 'livrata' && isAzi(c.updatedAt || c.createdAt)).length;
    const statIncasariAzi = comenzi
        .filter(c => c.status === 'livrata' && isAzi(c.updatedAt || c.createdAt))
        .reduce((sum, c) => sum + c.total, 0);

    const esteComandaCadou = (comanda) => {
        return comanda.este_cadou === true || comanda.este_cadou === 'true'
    }

    if (loading) return <div className="cd-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se încarcă comenzile...</p></div>

    return (
        <div className="cd-layout">
            <NavbarCofetarie />

            <main className="cd-main">
                
                <div className="cd-topbar" style={{marginBottom: '1.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                        <h2 style={{fontSize: '1.6rem', color: '#3d2c1e', margin: 0}}>Gestionare Comenzi</h2>
                    </div>
                    
                    <div className="cd-top-actions">
                        <button className="cd-btn-urgent" onClick={() => setFiltruStatus('plasata')}>
                            Confirmă Comenzi
                        </button>
                    </div>
                </div>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                <div className="gc-tabs-wrapper">
                    <div className="gc-tabs">
                        {STATUSURI.map(s => (
                            <button
                                key={s}
                                className={`gc-tab-btn ${filtruStatus === s ? 'activ' : ''}`}
                                onClick={() => setFiltruStatus(s)}
                            >
                                {s === 'toate' ? 'Toate' : statusLabel[s]?.text}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="gc-table-container">
                    <div className="gc-table-header">
                        <div>ID Comandă</div>
                        <div>Client</div>
                        <div>Produse</div>
                        <div>Data / Ora</div>
                        <div>Total</div>
                        <div>Status</div>
                        <div style={{textAlign: 'right'}}>Acțiuni</div>
                    </div>

                    {comenziFiltrate.length === 0 ? (
                        <p className="gol" style={{padding: '2rem 0'}}>Nu există comenzi pentru acest filtru.</p>
                    ) : (
                        comenziFiltrate.map(comanda => {
                            const produsPrincipal = comanda.detalii[0];
                            const numeDeAfisat = produsPrincipal?.produs_id?.numeProdus || produsPrincipal?.numeProdus || 'Produs sters';
                            const descriereProduse = produsPrincipal 
                                ? `${produsPrincipal.cantitate}x ${numeDeAfisat}${comanda.detalii.length > 1 ? '...' : ''}`
                                : 'Fără produse';

                            return (
                                <div key={comanda._id} style={{borderBottom: '1px solid #f5eadd'}}>
                                    <div className="gc-table-row">
                                        <div className="gc-id-comanda">#SO-{comanda._id.substring(18, 24)}</div>
                                        
                                        <div className="gc-client-cell">
                                            <div className="cd-avatar-mic">{getInitials(comanda.client_id?.nume)}</div>
                                            <div className="gc-client-name">{comanda.client_id?.nume || 'Client Necunoscut'}</div>
                                        </div>
                                        
                                        <div className="gc-prod-desc">{descriereProduse}</div>
                                        
                                        <div className="gc-date-cell">{getAziIeriFormat(comanda.createdAt)}</div>
                                        
                                        <div className="gc-total-cell">{comanda.total.toFixed(2)} RON</div>
                                        
                                        <div>
                                            <span className={`gc-badge ${statusLabel[comanda.status]?.cls}`}>
                                                {statusLabel[comanda.status]?.text}
                                            </span>
                                        </div>
                                        
                                        <div style={{textAlign: 'right'}}>
                                            <button className="btn-detalii-row" onClick={() => toggleExpandare(comanda._id)}>
                                                {comenziExpandate[comanda._id] ? 'Ascunde' : 'Detalii'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ================= ZONA EXPANDATĂ (DETALII COMANDĂ) ================= */}
                                    {comenziExpandate[comanda._id] && (
                                        <div className="ic-produse" style={{borderTop: 'none', background: '#fafafa', borderRadius: '16px', margin: '0.5rem 0 1.5rem 0', padding: '1.5rem'}}>
                                            {esteComandaCadou(comanda) && (
                                                <div className="alerta-cadou">
                                                    <h5 className="alerta-cadou-titlu">
                                                        <span className="alerta-cadou-icon">🎁</span> COMANDĂ CADOU!
                                                    </h5>
                                                    <p className="alerta-cadou-text">Atenție: Nu treceți numele expeditorului pe pachet.</p>
                                                    {comanda.mesaj_cadou && (
                                                        <div className="alerta-cadou-mesaj-box">
                                                            <p className="alerta-cadou-mesaj-text">"{comanda.mesaj_cadou}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Detalii Livrare & Plată */}
                                            <div className="gc-detalii-grid">
                                                <div className="gc-detalii-item">
                                                    <MapPin size={16} /> <strong>Adresa:</strong> {comanda.adresa_livrare}
                                                </div>
                                                <div className="gc-detalii-item">
                                                    <Phone size={16} /> <strong>Telefon:</strong> {comanda.telefon}
                                                </div>
                                                <div className="gc-detalii-item">
                                                    <Truck size={16} /> <strong>Transport:</strong> 
                                                    {comanda.tip_transport === 'bicicleta' ? ' Bicicletă' : comanda.tip_transport === 'frigorific' ? ' Frigorific' : ' Mașină Standard'}
                                                </div>
                                                <div className="gc-detalii-item">
                                                    <CreditCard size={16} /> <strong>Plată:</strong> 
                                                    {comanda.metoda_plata === 'numerar' ? ' Numerar la livrare' : ' Card online'}
                                                </div>
                                            </div>

                                            {/* Lista Produse */}
                                            {comanda.detalii.map((detaliu, index) => {
                                                const numeProdusDetalii = detaliu.produs_id?.numeProdus || detaliu.numeProdus || 'Produs sters';
                                                const imgUrl = detaliu.produs_id?.imagine 
                                                    ? (detaliu.produs_id.imagine.startsWith('http') ? detaliu.produs_id.imagine : `https://sweetgoapp.onrender.com/${detaliu.produs_id.imagine}`) 
                                                    : null;

                                                return (
                                                    <div key={index} className="gc-produs-card-modern">
                                                        {imgUrl ? <img src={imgUrl} alt="" className="gc-produs-img"/> : <Cake size={40} color="#c97c2e" className="gc-produs-img" style={{padding: '5px'}} />}
                                                        
                                                        <div style={{display: 'flex', alignItems: 'center'}}>
                                                            <span className="gc-produs-nume">{numeProdusDetalii}</span>
                                                            <span className="gc-produs-cantitate">x{detaliu.cantitate}</span>
                                                        </div>

                                                        <span className="gc-produs-pret">
                                                            {(detaliu.pret_unitar * detaliu.cantitate).toFixed(2)} RON
                                                        </span>

                                                        {(detaliu.optiune_decor || detaliu.observatii) && (
                                                            <div style={{ width: '100%', paddingLeft: '64px', marginTop: '-5px' }}>
                                                                {detaliu.optiune_decor && <p style={{fontSize: '0.8rem', color: '#7a5230', margin: '0 0 2px 0'}}>🎨 Decor: {detaliu.optiune_decor}</p>}
                                                                {detaliu.observatii && <p style={{fontSize: '0.8rem', color: '#7a5230', margin: 0}}>📝 Obs: {detaliu.observatii}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Cutie Sumar Comandă */}
                                            {(() => {
                                                const totalProduse = comanda.detalii.reduce((sum, d) => sum + (d.pret_unitar * d.cantitate), 0);
                                                const costLivrare = comanda.cost_livrare !== undefined ? comanda.cost_livrare : (comanda.tip_transport === 'bicicleta' ? 5 : comanda.tip_transport === 'frigorific' ? 15 : 10);
                                                const tva = totalProduse * 0.21;
                                                
                                                return (
                                                    <div className="gc-summary-box">
                                                        <div className="gc-summary-row">
                                                            <span>Cost Transport:</span>
                                                            <span>{costLivrare.toFixed(2)} RON</span>
                                                        </div>
                                                        <div className="gc-summary-row">
                                                            <span>TVA (21%):</span>
                                                            <span>{tva.toFixed(2)} RON</span>
                                                        </div>
                                                        <div className="gc-summary-row gc-summary-total">
                                                            <span>Total Final:</span>
                                                            <span>{comanda.total.toFixed(2)} RON</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {comanda.observatii && (
                                                <div style={{ marginTop: '1.5rem', padding: '12px 16px', background: '#fff3e0', borderRadius: '12px', borderLeft: '4px solid #c97c2e' }}>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#7a5230' }}><strong>📝 Observații client:</strong> {comanda.observatii}</p>
                                                </div>
                                            )}

                                            {comanda.status !== 'livrata' && comanda.status !== 'anulata' && (
                                                <div className="gc-butoane-status">
                                                    <button className="btn-actiune-primar" onClick={() => handleSchimbaStatus(comanda._id, statusUrmator[comanda.status])}>
                                                        {statusUrmatorLabel[comanda.status]}
                                                    </button>
                                                    <button className="btn-actiune-secundar" onClick={() => handleAnuleaza(comanda._id)}>
                                                        ✕ Anulează
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="gc-bottom-stats">
                    <div className="gc-stat-box">
                        <div className="gc-stat-box-header">
                            <div className="gc-stat-icon-wrap" style={{background: '#e3f2fd', color: '#1565c0'}}><CheckCircle size={20}/></div>
                        </div>
                        <div>
                            <div className="gc-stat-value">{statNoi}</div>
                            <div className="gc-stat-label">Comenzi Noi</div>
                        </div>
                    </div>

                    <div className="gc-stat-box">
                        <div className="gc-stat-box-header">
                            <div className="gc-stat-icon-wrap" style={{background: '#fff3e0', color: '#e65100'}}><Hourglass size={20}/></div>
                        </div>
                        <div>
                            <div className="gc-stat-value">{statPreparare}</div>
                            <div className="gc-stat-label">În preparare</div>
                        </div>
                    </div>

                    <div className="gc-stat-box">
                        <div className="gc-stat-box-header">
                            <div className="gc-stat-icon-wrap" style={{background: '#e8f5e9', color: '#2e7d32'}}><CheckSquare size={20}/></div>
                            <span className="gc-stat-trend" style={{color: '#2e7d32'}}>Astăzi</span>
                        </div>
                        <div>
                            <div className="gc-stat-value">{statLivrateAzi}</div>
                            <div className="gc-stat-label">Livrate astăzi</div>
                        </div>
                    </div>

                    <div className="gc-stat-box accent">
                        <div className="gc-stat-box-header">
                            <div className="gc-stat-icon-wrap" style={{background: 'rgba(255,255,255,0.2)'}}><Coins size={20}/></div>
                            <span className="gc-stat-trend" style={{color: '#fdecd8'}}>Încasări zilnice</span>
                        </div>
                        <div>
                            <div className="gc-stat-value">{statIncasariAzi.toFixed(2)} RON</div>
                            <div className="gc-stat-label">Venit generat azi</div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}

export default GestionareComenzi