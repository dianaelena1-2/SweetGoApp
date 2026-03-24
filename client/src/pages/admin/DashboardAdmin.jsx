import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, Users, Store, Package, Coins, Hourglass, User, MapPin, Phone, FileText, Check, X } from 'lucide-react'
import api from '../../services/api'

function DashboardAdmin() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [date, setDate] = useState(null)
    const [utilizatori, setUtilizatori] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')
    const [tabActiv, setTabActiv] = useState('asteptare')

    useEffect(() => {
        fetchDate()
        fetchUtilizatori()
    }, [])

    const fetchDate = async () => {
        try {
            const raspuns = await api.get('/dashboard/admin')
            setDate(raspuns.data)
        } catch (err) {
            setEroare('Eroare la încărcarea datelor')
        } finally {
            setLoading(false)
        }
    }

    const fetchUtilizatori = async () => {
        try {
            const raspuns = await api.get('/admin/utilizatori')
            setUtilizatori(raspuns.data)
        } catch (err) {
            console.error('Eroare la incarcarea utilizatorilor', err)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const afiseazaSucces = (mesaj) => {
        setSucces(mesaj)
        setTimeout(() => setSucces(''), 3000)
    }

    const handleAproba = async (id) => {
        try {
            await api.put(`/admin/cofetarii/${id}/aprobare`)
            afiseazaSucces('Cofetărie aprobată cu succes!')
            fetchDate()
        } catch (err) {
            setEroare('Eroare la aprobarea cofetăriei')
        }
    }

    const handleRespinge = async (id) => {
        try {
            await api.put(`/admin/cofetarii/${id}/respingere`)
            afiseazaSucces('Cofetărie respinsă')
            fetchDate()
        } catch (err) {
            setEroare('Eroare la respingerea cofetăriei')
        }
    }

    const getRolBadgeClass = (rol) => {
        if (rol === 'client') return 'badge-client'
        if (rol === 'cofetarie') return 'badge-cofetarie'
        return 'badge-admin'
    }

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo">SweetGo 🍰</h1>
                <div className="navbar-actiuni">
                    <span>{utilizator?.nume}</span>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Dashboard Admin</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {/* STATISTICI */}
                <div className="db-stats-grid">
                    <div className="db-stat-card db-stat-nou">
                        <div className="db-stat-icon"><Users size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{date.totalUtilizatori}</p>
                            <p className="db-stat-label">Utilizatori</p>
                        </div>
                    </div>
                    <div className="db-stat-card db-stat-curs">
                        <div className="db-stat-icon"><Store size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{date.totalCofetarii}</p>
                            <p className="db-stat-label">Cofetării aprobate</p>
                        </div>
                    </div>
                    <div className="db-stat-card db-stat-produse">
                        <div className="db-stat-icon"><Package size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{date.totalComenzi}</p>
                            <p className="db-stat-label">Total comenzi</p>
                        </div>
                    </div>
                    <div className="db-stat-card db-stat-incasari">
                        <div className="db-stat-icon"><Coins size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{date.totalIncasari.toFixed(2)} lei</p>
                            <p className="db-stat-label">Total încasări platformă</p>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${tabActiv === 'asteptare' ? 'activ' : ''}`}
                        onClick={() => setTabActiv('asteptare')}
                    >
                        ⏳ Cofetării în așteptare
                        {date.cofetariiInAsteptare.length > 0 && (
                            <span className="admin-tab-badge">{date.cofetariiInAsteptare.length}</span>
                        )}
                    </button>
                    <button
                        className={`admin-tab ${tabActiv === 'utilizatori' ? 'activ' : ''}`}
                        onClick={() => setTabActiv('utilizatori')}
                    >
                        👥 Utilizatori
                    </button>
                </div>

                {/* TAB COFETARII IN ASTEPTARE */}
                {tabActiv === 'asteptare' && (
                    <div className="admin-sectiune">
                        {date.cofetariiInAsteptare.length === 0 ? (
                            <p className="gol">Nu există cofetării în așteptare.</p>
                        ) : (
                            <div className="admin-lista">
                                {date.cofetariiInAsteptare.map(cofetarie => (
                                    <div key={cofetarie.id} className="admin-card">
                                        <div className="admin-card-info">
                                            <h4><Store size={18} color="#c97c2e" /> {cofetarie.numeCofetarie}</h4>
                                            <p><User size={14} /> {cofetarie.nume} — {cofetarie.email}</p>
                                            <p><MapPin size={14} /> {cofetarie.adresa}</p>
                                            <p><Phone size={14} /> {cofetarie.telefon}</p>
                                            <div className="admin-documente">
                                                {cofetarie.certificat_inregistrare && (
                                                    <a
                                                        href={`http://localhost:7000/${cofetarie.certificat_inregistrare}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="admin-doc-link"
                                                    >
                                                        📄 Certificat înregistrare
                                                    </a>
                                                )}
                                                {cofetarie.certificat_sanitar && (
                                                    <a
                                                        href={`http://localhost:7000/${cofetarie.certificat_sanitar}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="admin-doc-link"
                                                    >
                                                        📄 Certificat sanitar
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="admin-card-actiuni">
                                            <button
                                                className="btn-primar"
                                                onClick={() => handleAproba(cofetarie.id)}
                                            >
                                                <Check size={16} /> Aprobă
                                            </button>
                                            <button
                                                className="btn-stergere"
                                                onClick={() => handleRespinge(cofetarie.id)}
                                            >
                                                <X size={16} /> Respinge
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB UTILIZATORI */}
                {tabActiv === 'utilizatori' && (
                    <div className="admin-sectiune">
                        <table className="admin-tabel">
                            <thead>
                                <tr>
                                    <th>Nume</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Data înregistrării</th>
                                </tr>
                            </thead>
                            <tbody>
                                {utilizatori.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.nume}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`admin-rol-badge ${getRolBadgeClass(u.rol)}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td>{new Date(u.creat_la + 'Z').toLocaleDateString('ro-RO')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DashboardAdmin