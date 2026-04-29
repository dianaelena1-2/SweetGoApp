import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Users, Store, ShoppingCart, Banknote, LayoutDashboard, BarChart3, LogOut, Trash2, Check, X, FileText } from 'lucide-react'
import api from '../../services/api'

function DashboardAdmin() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [date, setDate] = useState(null)
    const [utilizatori, setUtilizatori] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')
    const [tabActiv, setTabActiv] = useState('utilizatori') // Implicit tab-ul cu utilizatori ca în poză

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
       if (!window.confirm('Ești sigur că vrei să respingi această cofetărie? Datele vor fi șterse.')) return;

        try {
            await api.put(`/admin/cofetarii/${id}/respingere`)
            afiseazaSucces('Cofetărie respinsă și ștearsă!')
            fetchDate()
        } catch (err) {
            setEroare('Eroare la respingerea cofetăriei')
        }
    }

    const handleStergeUtilizator = async (id, nume) => {
        if (!window.confirm(`Ești sigur că vrei să ștergi utilizatorul "${nume}"? Această acțiune este ireversibilă.`)) return;
        try {
            await api.delete(`/admin/utilizatori/${id}`);
            fetchUtilizatori();
            fetchDate();
            setSucces('Utilizator șters cu succes.');
            setTimeout(() => setSucces(''), 3000);
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la ștergerea utilizatorului.');
            setTimeout(() => setEroare(''), 3000);
        }
    }

    const getRolBadgeClass = (rol) => {
        if (rol === 'admin') return 'rol-admin'
        if (rol === 'cofetarie' || rol === 'cofetar') return 'rol-cofetar'
        return 'rol-client'
    }

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0].toUpperCase();
    }

    if (loading) return <div className="admin-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se încarcă...</p></div>

    return (
        <div className="admin-layout">
            
            {/* ================= SIDEBAR LATERAL ================= */}
            <aside className="admin-sidebar">
                <div className="admin-logo">SweetGo 🍰</div>

                <nav className="admin-nav">
                    <button className="admin-nav-item active">
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button className="admin-nav-item">
                        <BarChart3 size={20}/> Statistici
                    </button>
                </nav>

                {/* Buton Deconectare la fel ca la cofetarie, cu text rosu */}
                <button className="cd-btn-logout" onClick={handleLogout}>
                    <LogOut size={20}/> Deconectează-te
                </button>
            </aside>

            {/* ================= CONȚINUT PRINCIPAL ================= */}
            <main className="admin-main">
                
                {/* Topbar: Fără search, doar admin info în dreapta */}
                <div className="admin-topbar">
                    <div className="admin-top-user">
                        <div>
                            <h4>{utilizator?.nume || 'Administrator'}</h4>
                            
                        </div>
                        {/* <div className="admin-avatar">
                            {getInitials(utilizator?.nume || 'Admin')}
                        </div> */}
                    </div>
                </div>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {/* STATISTICI GRID (Cele 4 carduri din poză) */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-header">
                            <div className="admin-stat-icon icon-blue"><Users size={22} /></div>
                            <span className="admin-stat-label">Utilizatori</span>
                        </div>
                        <div className="admin-stat-value">{date.totalUtilizatori}</div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-header">
                            <div className="admin-stat-icon icon-pink"><Store size={22} /></div>
                            <span className="admin-stat-label">Cofetării aprobate</span>
                        </div>
                        <div className="admin-stat-value">{date.totalCofetarii}</div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-header">
                            <div className="admin-stat-icon icon-yellow"><ShoppingCart size={22} /></div>
                            <span className="admin-stat-label">Total comenzi</span>
                        </div>
                        <div className="admin-stat-value">{date.totalComenzi}</div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-header">
                            <div className="admin-stat-icon icon-green"><Banknote size={22} /></div>
                            <span className="admin-stat-label">Încasări platformă</span>
                        </div>
                        <div className="admin-stat-value">{date.totalIncasari.toFixed(2)} lei</div>
                    </div>
                </div>

                {/* TAB-URI */}
                <div className="admin-tabs-modern">
                    <button
                        className={`admin-tab-modern ${tabActiv === 'asteptare' ? 'activ' : ''}`}
                        onClick={() => setTabActiv('asteptare')}
                        style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                    >
                        ⏳Cofetării în așteptare
                        {date.cofetariiInAsteptare.length > 0 && (
                            <span style={{background: '#c0392b', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem'}}>
                                {date.cofetariiInAsteptare.length} noi
                            </span>
                        )}
                    </button>
                    <button
                        className={`admin-tab-modern ${tabActiv === 'utilizatori' ? 'activ' : ''}`}
                        onClick={() => setTabActiv('utilizatori')}
                    >
                        👥Utilizatori
                    </button>
                    
                </div>

                {/* TAB: UTILIZATORI */}
                {tabActiv === 'utilizatori' && (
                    <div className="admin-table-container">
                        <table className="admin-table-modern">
                            <thead>
                                <tr>
                                    <th>Nume</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Data Înregistrării</th>
                                    <th>Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {utilizatori.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div className="admin-td-nume">
                                                <div className="admin-avatar-mic">{getInitials(u.nume)}</div>
                                                {u.nume}
                                            </div>
                                        </td>
                                        <td style={{color: '#9a7a5a'}}>{u.email}</td>
                                        <td>
                                            <span className={`admin-badge ${getRolBadgeClass(u.rol)}`}>
                                                {u.rol === 'cofetarie' ? 'cofetarie' : u.rol}
                                            </span>
                                        </td>
                                        <td style={{color: '#9a7a5a'}}>{new Date(u.createdAt).toLocaleDateString('ro-RO', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                                        <td>
                                            <button 
                                                className="btn-icon-red" 
                                                onClick={() => handleStergeUtilizator(u._id, u.nume)}
                                                title="Șterge utilizator"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB: COFETARII IN ASTEPTARE */}
                {tabActiv === 'asteptare' && (
                    <div className="admin-table-container">
                        {date.cofetariiInAsteptare.length === 0 ? (
                            <p className="gol" style={{padding: '2rem'}}>Nu există cereri de aprobare în așteptare.</p>
                        ) : (
                            <table className="admin-table-modern">
                                <thead>
                                    <tr>
                                        <th>Cofetărie</th>
                                        <th>Proprietar & Contact</th>
                                        <th>Adresă</th>
                                        <th>Documente</th>
                                        <th>Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {date.cofetariiInAsteptare.map(cofetarie => (
                                        <tr key={cofetarie._id}>
                                            <td>
                                                <div className="admin-td-nume">
                                                    <div className="admin-avatar-mic" style={{background: '#fce4ec', color: '#c2185b'}}><Store size={14}/></div>
                                                    {cofetarie.numeCofetarie}
                                                </div>
                                            </td>
                                            <td style={{color: '#9a7a5a'}}>
                                                <strong>{cofetarie.nume}</strong><br/>
                                                {cofetarie.email}<br/>
                                                {cofetarie.telefon}
                                            </td>
                                            <td style={{color: '#9a7a5a'}}>{cofetarie.adresa}</td>
                                            <td>
                                                <div style={{display: 'flex', gap: '5px'}}>
                                                    {cofetarie.certificat_inregistrare && (
                                                        <a href={cofetarie.certificat_inregistrare.startsWith('http') ? cofetarie.certificat_inregistrare : `https://sweetgoapp.onrender.com/${cofetarie.certificat_inregistrare}`} target="_blank" rel="noopener noreferrer" className="btn-icon-blue" title="Certificat Înregistrare">
                                                            <FileText size={16} />
                                                        </a>
                                                    )}
                                                    {cofetarie.certificat_sanitar && (
                                                        <a href={cofetarie.certificat_sanitar.startsWith('http') ? cofetarie.certificat_sanitar : `https://sweetgoapp.onrender.com/${cofetarie.certificat_sanitar}`} target="_blank" rel="noopener noreferrer" className="btn-icon-blue" title="Certificat Sanitar">
                                                            <FileText size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{display: 'flex', gap: '8px'}}>
                                                    <button className="btn-icon-green" onClick={() => handleAproba(cofetarie._id)} title="Aprobă">
                                                        <Check size={16} />
                                                    </button>
                                                    <button className="btn-icon-red" onClick={() => handleRespinge(cofetarie._id)} title="Respinge">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

            </main>
        </div>
    )
}

export default DashboardAdmin