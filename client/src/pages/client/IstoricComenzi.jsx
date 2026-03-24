import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, ShoppingCart, Store, Calendar, MapPin, Palette, StickyNote, Package } from 'lucide-react'
import api from '../../services/api'

const STATUSURI = ['toate', 'plasata', 'confirmata', 'in_preparare', 'in_livrare', 'livrata', 'anulata']

const statusLabel = {
    plasata: { text: 'Plasată', cls: 'status-plasata' },
    confirmata: { text: 'Confirmată', cls: 'status-confirmata' },
    in_preparare: { text: 'În preparare', cls: 'status-in-preparare' },
    in_livrare: { text: 'În livrare', cls: 'status-in-livrare' },
    livrata: { text: 'Livrată', cls: 'status-livrata' },
    anulata: { text: 'Anulată', cls: 'status-anulata' }
}

function IstoricComenzi() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [comenzi, setComenzi] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [filtruStatus, setFiltruStatus] = useState('toate')
    const [comenziExpandate, setComenziExpandate] = useState({})

    useEffect(() => {
        const fetchComenzi = async () => {
            try {
                const raspuns = await api.get('/comenzi/istoricul-meu')
                setComenzi(raspuns.data)
            } catch (err) {
                setEroare('Eroare la încărcarea comenzilor')
            } finally {
                setLoading(false)
            }
        }
        fetchComenzi()
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleExpandare = (comandaId) => {
        setComenziExpandate(prev => ({ ...prev, [comandaId]: !prev[comandaId] }))
    }

    const formatData = (data) => {
        return new Date(data + 'Z').toLocaleDateString('ro-RO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    return (
        <div className="acasa-container">
            {/* NAVBAR */}
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/')}>Acasă</button>
                    <button onClick={() => navigate('/cos-cumparaturi')}>🛒 Coș</button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Comenzile mele</h2>

                {eroare && <div className="eroare">{eroare}</div>}

                {/* FILTRE STATUS */}
                <div className="ic-filtre">
                    {STATUSURI.map(s => (
                        <button
                            key={s}
                            className={`ic-filtru-btn ${filtruStatus === s ? 'activ' : ''}`}
                            onClick={() => setFiltruStatus(s)}
                        >
                            {s === 'toate' ? 'Toate' : statusLabel[s]?.text}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : comenziFiltrate.length === 0 ? (
                    <div className="cos-gol">
                        <p><Package size={20} /> Nu ai comenzi {filtruStatus !== 'toate' ? `cu statusul "${statusLabel[filtruStatus]?.text}"` : 'încă'}.</p>
                        {filtruStatus === 'toate' && (
                            <button className="btn-primar" onClick={() => navigate('/')}>
                                Explorează cofetăriile
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="ic-lista">
                        {comenziFiltrate.map(comanda => (
                            <div key={comanda.id} className="ic-comanda-card">
                                {/* HEADER COMANDA */}
                                <div className="ic-comanda-header" onClick={() => toggleExpandare(comanda.id)}>
                                    <div className="ic-comanda-info">
                                        <h4 className="icon-text-align"><Store size={18} color="#c97c2e" /> {comanda.numeCofetarie}</h4>
                                        <p className="ic-data"><Calendar size={14} /> {formatData(comanda.creat_la)}</p>
                                        <p className="ic-adresa icon-text-align"><MapPin size={14} /> {comanda.adresa_livrare}</p>
                                    </div>
                                    <div className="ic-comanda-dreapta">
                                        <span className={`ic-status ${statusLabel[comanda.status]?.cls}`}>
                                            {statusLabel[comanda.status]?.text}
                                        </span>
                                        <p className="ic-total">{comanda.total.toFixed(2)} lei</p>
                                        <span className="ic-expand">
                                            {comenziExpandate[comanda.id] ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {/* PRODUSE - vizibile doar cand e expandat */}
                                {comenziExpandate[comanda.id] && (
                                    <div className="ic-produse">
                                        <h5>Produse comandate:</h5>
                                        {comanda.produse.map((produs, index) => (
                                            <div key={index} className="ic-produs-rand">
                                                <div className="ic-produs-imagine">
                                                    {produs.imagine ? (
                                                        <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                                    ) : <Cake size={32} color="#c97c2e" strokeWidth={1.5} />}
                                                </div>
                                                <div className="ic-produs-info">
                                                    <span className="ic-produs-nume">{produs.numeProdus}</span>
                                                    <span className="ic-produs-cantitate">x{produs.cantitate}</span>
                                                    <span className="ic-produs-pret">{(produs.pret_unitar * produs.cantitate).toFixed(2)} lei</span>
                                                </div>
                                                {(produs.optiune_decor || produs.observatii) && (
                                                    <div className="ic-produs-detalii">
                                                        {produs.optiune_decor && (
                                                            <p>🎨 Decor: {produs.optiune_decor}</p>
                                                        )}
                                                        {produs.observatii && (
                                                            <p>📝 {produs.observatii}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default IstoricComenzi