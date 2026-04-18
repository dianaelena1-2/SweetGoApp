import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, Bell, Hourglass, Coins, Package, User, Calendar, MapPin } from 'lucide-react'
import api from '../../services/api'
import NavbarCofetarie from '../../components/NavbarCofetarie';

const statusLabel = {
    plasata: { text: 'Plasată', cls: 'status-plasata' },
    confirmata: { text: 'Confirmată', cls: 'status-confirmata' },
    in_preparare: { text: 'În preparare', cls: 'status-in-preparare' },
    in_livrare: { text: 'În livrare', cls: 'status-in-livrare' },
    livrata: { text: 'Livrată', cls: 'status-livrata' },
    anulata: { text: 'Anulată', cls: 'status-anulata' }
}

function DashboardCofetarie() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [date, setDate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [alerteExpirare, setAlerteExpirare] = useState([])
    const [arataAlerte, setArataAlerte] = useState(false)
    const [esteDupaOra20, setEsteDupaOra20] = useState(false)

    useEffect(() => {
        const fetchDate = async () => {
            try {
                const raspuns = await api.get('/dashboard/cofetarie')
                setDate(raspuns.data)
            } catch (err) {
                setEroare('Eroare la încărcarea datelor')
            } finally {
                setLoading(false)
            }
        }
        fetchDate()
        fetchAlerte()

        const checkOra = () => {
        const now = new Date()
        setEsteDupaOra20(now.getHours() >= 20)
        }

        checkOra()
        const interval = setInterval(checkOra, 60000)

        return () => clearInterval(interval)
    }, [])

    const fetchAlerte = async () => {
        try {
            const raspuns = await api.get('/produse/alerte-expirare')
            setAlerteExpirare(raspuns.data)
        } catch (err) {
            console.error("Eroare incarcare alerte", err)
        }
    }

    const aplicaOferta = async (produsId) => {
        if (!esteDupaOra20) return;

        try {
            await api.put(`/produse/${produsId}/aplica-oferta`)
            setSucces('Oferta de 40% a fost aplicată cu succes!')
            setTimeout(() => setSucces(''), 3000)
            fetchAlerte()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la aplicarea ofertei')
            setTimeout(() => setEroare(''), 3000)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const formatData = (data) => {
        return new Date(data + 'Z').toLocaleDateString('ro-RO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="acasa-container">
            <NavbarCofetarie />

            <div className="acasa-continut">
                <h2>Bună, {utilizator?.nume}! 👋</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : (
                    <>
                        {/* CARDURI STATISTICI */}
                        <div className="db-stats-grid">
                            <div className="db-stat-card db-stat-nou">
                                <div className="db-stat-icon"><Bell size={32} /></div>
                                <div className="db-stat-info">
                                    <p className="db-stat-numar">{date.comenziNoi}</p>
                                    <p className="db-stat-label">Comenzi noi</p>
                                </div>
                            </div>
                            <div className="db-stat-card db-stat-curs">
                                <div className="db-stat-icon"><Hourglass size={32} /></div>
                                <div className="db-stat-info">
                                    <p className="db-stat-numar">{date.comenziInCurs}</p>
                                    <p className="db-stat-label">Comenzi în curs</p>
                                </div>
                            </div>
                            <div className="db-stat-card db-stat-incasari">
                                <div className="db-stat-icon"><Coins size={32} /></div>
                                <div className="db-stat-info">
                                    <p className="db-stat-numar">{date.totalIncasari.toFixed(2)} lei</p>
                                    <p className="db-stat-label">Total încasări</p>
                                </div>
                            </div>
                            <div className="db-stat-card db-stat-produse">
                                <div className="db-stat-icon"><Cake size={32} /></div>
                                <div className="db-stat-info">
                                    <p className="db-stat-numar">{date.produseActive}</p>
                                    <p className="db-stat-label">Produse active</p>
                                </div>
                            </div>
                        </div>

                        {/* ACTIUNI RAPIDE */}
                        <div className="db-actiuni">
                            <button className="db-actiune-btn" onClick={() => navigate('/cofetarie/produse')}>
                                🍰 Gestionează produse
                            </button>
                            <button className="db-actiune-btn" onClick={() => navigate('/cofetarie/comenzi')}>
                                📦 Vezi toate comenzile
                            </button>
                            <button className="db-actiune-btn" onClick={() => navigate('/cofetarie/recenzii')}>
                                ⭐Vezi recenziile tale
                            </button>
                            {alerteExpirare.length > 0 && (
                                <button 
                                    className="db-actiune-btn" 
                                    style={{ backgroundColor: arataAlerte ? '#ffebee' : '#fff', borderColor: '#f44336', color: '#d32f2f' }}
                                    onClick={() => setArataAlerte(!arataAlerte)}
                                > 
                                    ⚠️ Oferte anti-risipă ({alerteExpirare.length})
                                </button>
                            )}
                            {date.comenziNoi > 0 && (
                                <button className="db-actiune-btn db-actiune-urgent" onClick={() => navigate('/cofetarie/comenzi?status=plasata')}>
                                    🔔 {date.comenziNoi} comenzi noi de confirmat!
                                </button>
                            )}
                        </div>

                        {arataAlerte && alerteExpirare.length > 0 && (
                            <div className="alerta-expirare-container" style={{ marginTop: '0', marginBottom: '30px' }}>
                                <h3 className="alerta-expirare-header">
                                    ⚠️ Produse care expiră mâine
                                </h3>
                                <p className="alerta-expirare-text">
                                    Aplică o reducere de 40% pentru a preveni risipa. { !esteDupaOra20 && <strong>Această acțiune va fi deblocată la ora 20:00.</strong>}
                                </p>
                                
                                <div className="alerta-expirare-lista">
                                    {alerteExpirare.map(produs => (
                                        <div key={produs.id} className="alerta-expirare-item">
                                            <div className="alerta-expirare-detalii">
                                                <strong>{produs.numeProdus}</strong> (Stoc: {produs.stoc} buc)
                                                <span className="alerta-expirare-preturi">
                                                    Preț normal: {produs.pret} lei → Preț redus: {(produs.pret * 0.6).toFixed(2)} lei
                                                </span>
                                            </div>
                                            <button 
                                                className="btn-aplica-oferta" 
                                                style={{ 
                                                    backgroundColor: esteDupaOra20 ? '#4CAF50' : '#e0e0e0', 
                                                    cursor: esteDupaOra20 ? 'pointer' : 'not-allowed',
                                                    color: esteDupaOra20 ? 'white' : '#9e9e9e'
                                                }}
                                                disabled={!esteDupaOra20}
                                                onClick={() => aplicaOferta(produs.id)}
                                            >
                                                {esteDupaOra20 ? 'Aplică ofertă -40%' : '⏳ Așteaptă ora 20:00'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ULTIMELE COMENZI */}
                        <h3 className="sectiune-titlu">Ultimele comenzi primite</h3>
                        {date.ultimeleComenzi.length === 0 ? (
                            <p className="gol">Nu ai primit nicio comandă încă.</p>
                        ) : (
                            <div className="ic-lista">
                                {date.ultimeleComenzi.map(comanda => (
                                    <div
                                        key={comanda.id}
                                        className="ic-comanda-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate('/cofetarie/comenzi')}
                                    >
                                        <div className="ic-comanda-header">
                                            <div className="ic-comanda-info">
                                                <h4><User size={16} /> {comanda.numeClient}</h4>
                                                <p className="ic-data"><Calendar size={14} /> {formatData(comanda.creat_la)}</p>
                                                <p className="ic-adresa"><MapPin size={14} /> {comanda.adresa_livrare}</p>
                                            </div>
                                            <div className="ic-comanda-dreapta">
                                                <span className={`ic-status ${statusLabel[comanda.status]?.cls}`}>
                                                    {statusLabel[comanda.status]?.text}
                                                </span>
                                                <p className="ic-total">{comanda.total.toFixed(2)} lei</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default DashboardCofetarie