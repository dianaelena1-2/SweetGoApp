import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, ShoppingCart, Store, Calendar, MapPin, Star, MessageSquare, Check, X } from 'lucide-react'

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
            comandaId: comanda.id,
            numeCofetarie: comanda.numeCofetarie
        })
        setRatingSelectat(0)
        setComentariuRecenzie('')
        setEroare('')
        setSucces('')
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
                comentariu: comentariuRecenzie,
                comanda_id: modalRecenzie.comandaId
            })

            setComenzi(prevComenzi =>
                 prevComenzi.map(c =>
                     c.id === modalRecenzie.comandaId
                     ? { ...c, are_recenzie: true } 
                     : c
                    )
                )
                
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

    const handleAnuleazaComanda = async (comandaId) => {
    if (!window.confirm('Ești sigur că vrei să anulezi această comandă?')) return;

    try {
        await api.put(`/comenzi/${comandaId}/anulare-client`);

        setComenzi(prevComenzi => 
            prevComenzi.map(c => 
                c.id === comandaId ? { ...c, status: 'anulata' } : c
            )
        );
        
        alert('Comanda a fost anulată cu succes.');
    } catch (err) {
        setEroare(err.response?.data?.mesaj || 'Eroare la anularea comenzii. Probabil a fost deja confirmată.');
    }
};

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/')}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/')}>Acasă</button>
                    <button className="btn-nav-icon" onClick={() => navigate('/cos-cumparaturi')}>
                        🛒 Coș
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
                                    <h4>
                                        <Store size={18} color="#c97c2e" /> {comanda.numeCofetarie}
                                    </h4>
                                    <p className="ic-data"><Calendar size={14} /> {formatData(comanda.creat_la)}</p>
                                    <p className="ic-adresa"><MapPin size={14} /> {comanda.adresa_livrare}</p>
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
                                        </div>
                                    ))}
                                    
                                    {comanda.status === 'livrata' && !comanda.are_recenzie && (
                                        <div className="ic-actiuni-comanda">
                                            <button className="btn-secundar btn-nav-icon" onClick={(e) => deschideModalRecenzie(comanda, e)}>
                                                <Star size={16} /> Lasă o recenzie
                                            </button>
                                        </div>
                                    )}

                                    {comanda.status === 'plasata' && (
                                        <div className="ic-actiuni-comanda">
                                            <button 
                                                className="btn-stergere btn-nav-icon" 
                                                onClick={(e) => { e.stopPropagation(); handleAnuleazaComanda(comanda.id); }}
                                            >
                                                <X size={16} /> Anulează comanda
                                            </button>
                                        </div>
                                        
                                    )}

                                    {comanda.are_recenzie && (
                                        <div className="ic-mesaj-recenzie">
                                            <span>
                                                <Check size={14} /> Recenzie trimisă
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {modalRecenzie && (
                <div className="modal-overlay" onClick={() => setModalRecenzie(null)}>
                    <div className="modal-continut modal-mic" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-inchide" onClick={() => setModalRecenzie(null)}>✕</button>
                        <h3 className="modal-titlu"><MessageSquare size={24} color="#c97c2e" /> Recenzie</h3>
                        <p className="modal-subtitlu">Cum a fost experiența cu <strong>{modalRecenzie?.numeCofetarie}</strong>?</p>
                        
                        {eroare && <div className="eroare pt-margin">{eroare}</div>}
                        {succes && <div className="succes pt-margin">{succes}</div>}

                        <div className="modal-rating-selectie">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                    key={s} 
                                    size={32} 
                                    className="star-pointer"
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
                        />
                        <button className="btn-primar modal-btn-trimite" onClick={handleTrimiteRecenzie} disabled={loadingRecenzie || succes}>
                            {loadingRecenzie ? 'Se trimite...' : 'Trimite recenzia'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IstoricComenzi