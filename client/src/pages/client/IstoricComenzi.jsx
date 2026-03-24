import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
// Importurile complete pentru iconițe
import { 
    Cake, 
    ShoppingCart, 
    Store, 
    Calendar, 
    MapPin, 
    Palette, 
    StickyNote, 
    Package, 
    Star, 
    MessageSquare 
} from 'lucide-react'

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
    const [succes, setSucces] = useState('')
    const [filtruStatus, setFiltruStatus] = useState('toate')
    const [comenziExpandate, setComenziExpandate] = useState({})

    // State pentru modalul de recenzie
    const [modalRecenzie, setModalRecenzie] = useState(null)
    const [ratingSelectat, setRatingSelectat] = useState(0)
    const [comentariuRecenzie, setComentariuRecenzie] = useState('')
    const [loadingRecenzie, setLoadingRecenzie] = useState(false)

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

    const deschideModalRecenzie = (comanda, e) => {
        e.stopPropagation()
        setModalRecenzie({
            cofetarieId: comanda.cofetarie_id,
            numeCofetarie: comanda.numeCofetarie
        })
        setRatingSelectat(0)
        setComentariuRecenzie('')
        setEroare('')
    }

    const handleTrimiteRecenzie = async () => {
        if (ratingSelectat === 0) {
            setEroare('Te rugăm să acorzi o notă.')
            return
        }
        setLoadingRecenzie(true)
        try {
            await api.post(`/cofetarii/${modalRecenzie.cofetarieId}/recenzii`, {
                rating: ratingSelectat,
                comentariu: comentariuRecenzie
            })
            setSucces('Recenzie trimisă cu succes!')
            setTimeout(() => {
                setModalRecenzie(null)
                setSucces('')
            }, 2000)
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la trimiterea recenziei.')
        } finally {
            setLoadingRecenzie(false)
        }
    }

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    SweetGo <Cake size={28} />
                </h1>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/')}>Acasă</button>
                    <button onClick={() => navigate('/cos-cumparaturi')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShoppingCart size={18} /> Coș
                    </button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Comenzile mele</h2>
                {eroare && !modalRecenzie && <div className="eroare">{eroare}</div>}
                {succes && !modalRecenzie && <div className="succes">{succes}</div>}

                <div className="ic-filtre">
                    {STATUSURI.map(s => (
                        <button key={s} className={`ic-filtru-btn ${filtruStatus === s ? 'activ' : ''}`} onClick={() => setFiltruStatus(s)}>
                            {s === 'toate' ? 'Toate' : statusLabel[s]?.text}
                        </button>
                    ))}
                </div>

                <div className="ic-lista">
                    {comenziFiltrate.map(comanda => (
                        <div key={comanda.id} className="ic-comanda-card">
                            <div className="ic-comanda-header" onClick={() => toggleExpandare(comanda.id)}>
                                <div className="ic-comanda-info">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Store size={18} color="#c97c2e" /> {comanda.numeCofetarie}
                                    </h4>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {formatData(comanda.creat_la)}</p>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {comanda.adresa_livrare}</p>
                                </div>
                                <div className="ic-comanda-dreapta">
                                    <span className={`ic-status ${statusLabel[comanda.status]?.cls}`}>{statusLabel[comanda.status]?.text}</span>
                                    <p className="ic-total">{comanda.total.toFixed(2)} lei</p>
                                    <span>{comenziExpandate[comanda.id] ? '▲' : '▼'}</span>
                                </div>
                            </div>

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
                                                    {produs.optiune_decor && <p><Palette size={14} /> Decor: {produs.optiune_decor}</p>}
                                                    {produs.observatii && <p><StickyNote size={14} /> {produs.observatii}</p>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {comanda.status === 'livrata' && (
                                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="btn-secundar" onClick={(e) => deschideModalRecenzie(comanda, e)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Star size={16} /> Lasă o recenzie
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL RECENZIE */}
            {modalRecenzie && (
                <div className="modal-overlay" onClick={() => setModalRecenzie(null)}>
                    <div className="modal-continut" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-inchide" onClick={() => setModalRecenzie(null)}>✕</button>
                        <h3 className="modal-titlu"><MessageSquare size={24} color="#c97c2e" /> Recenzie</h3>
                        <p style={{ textAlign: 'center', color: '#7a5230' }}>Cum a fost experiența cu <strong>{modalRecenzie?.numeCofetarie}</strong>?</p>
                        
                        {eroare && <div className="eroare" style={{ marginTop: '10px' }}>{eroare}</div>}
                        {succes && <div className="succes" style={{ marginTop: '10px' }}>{succes}</div>}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                    key={s} 
                                    size={32} 
                                    style={{ cursor: 'pointer' }}
                                    fill={s <= ratingSelectat ? "#c97c2e" : "none"} 
                                    color={s <= ratingSelectat ? "#c97c2e" : "#ccc"}
                                    onClick={() => setRatingSelectat(s)} 
                                />
                            ))}
                        </div>
                        <textarea 
                            className="modal-textarea" 
                            placeholder="Spune-ne părerea ta..." 
                            value={comentariuRecenzie} 
                            onChange={(e) => setComentariuRecenzie(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <button className="btn-primar" onClick={handleTrimiteRecenzie} disabled={loadingRecenzie} style={{ width: '100%', marginTop: '15px' }}>
                            {loadingRecenzie ? 'Se trimite...' : 'Trimite recenzia'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IstoricComenzi