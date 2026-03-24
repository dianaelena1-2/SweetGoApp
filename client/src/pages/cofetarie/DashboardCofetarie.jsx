import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, Bell, Hourglass, Coins, Package, User, Calendar, MapPin } from 'lucide-react'
import api from '../../services/api'

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
    }, [])

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
            <nav className="navbar">
                <h1 className="navbar-logo" style={{ cursor: 'default' }}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>{utilizator?.nume}</span>
                    <button onClick={() => navigate('/cofetarie/produse')}>Produse</button>
                    <button onClick={() => navigate('/cofetarie/comenzi')}>Comenzi</button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Bună, {utilizator?.nume}! 👋</h2>

                {eroare && <div className="eroare">{eroare}</div>}

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
                            {date.comenziNoi > 0 && (
                                <button className="db-actiune-btn db-actiune-urgent" onClick={() => navigate('/cofetarie/comenzi')}>
                                    🔔 {date.comenziNoi} comenzi noi de confirmat!
                                </button>
                            )}
                        </div>

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