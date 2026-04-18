import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, User, Calendar, MapPin, Phone, Palette, StickyNote, Check, ChefHat, Bike, CheckCircle, X } from 'lucide-react'
import api from '../../services/api'
import NavbarCofetarie from '../../components/NavbarCofetarie';

const STATUSURI = ['toate', 'plasata', 'confirmata', 'in_preparare', 'in_livrare', 'livrata', 'anulata']

const statusLabel = {
    plasata: { text: 'Plasată', cls: 'status-plasata' },
    confirmata: { text: 'Confirmată', cls: 'status-confirmata' },
    in_preparare: { text: 'În preparare', cls: 'status-in-preparare' },
    in_livrare: { text: 'În livrare', cls: 'status-in-livrare' },
    livrata: { text: 'Livrată', cls: 'status-livrata' },
    anulata: { text: 'Anulată', cls: 'status-anulata' }
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
    const { utilizator, logout } = useContext(AuthContext)
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

    const handleLogout = () => {
        logout()
        navigate('/login')
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

    const formatData = (data) => {
        return new Date(data + 'Z').toLocaleDateString('ro-RO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    const esteComandaCadou = (comanda) => {
        return comanda.este_cadou === true || comanda.este_cadou === 1 || comanda.este_cadou === '1' || comanda.este_cadou === 'true'
    }

    return (
        <div className="acasa-container">
            <NavbarCofetarie />

            <div className="acasa-continut">
                <h2>Comenzi primite</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

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
                    <p className="gol">Nu există comenzi {filtruStatus !== 'toate' ? `cu statusul "${statusLabel[filtruStatus]?.text}"` : 'încă'}.</p>
                ) : (
                    <div className="ic-lista">
                        {comenziFiltrate.map(comanda => (
                            <div key={comanda.id} className="ic-comanda-card">
                                {/* HEADER COMANDA */}
                                <div className="ic-comanda-header" onClick={() => toggleExpandare(comanda.id)}>
                                    <div className="ic-comanda-info">
                                        <h4><User size={18} color="#c97c2e" /> {comanda.numeClient}</h4>
                                        <p className="ic-data"><Calendar size={14} /> {formatData(comanda.creat_la)}</p>
                                        <p className="ic-adresa"><MapPin size={14} /> {comanda.adresa_livrare}</p>
                                        <p className="ic-adresa"><Phone size={14} /> {comanda.telefon}</p>
                                        {comanda.tip_transport && (
                                            <div className={`badge-transport transport-${comanda.tip_transport}`}>
                                                {comanda.tip_transport === 'bicicleta' && <> 🚲 Bicicletă</>}
                                                {comanda.tip_transport === 'masina' && <> 🚗 Mașină</>}
                                                {comanda.tip_transport === 'frigorific' && <> ❄️ Frigorific</>}
                                            </div>
                                        )}
                                        {comanda.metoda_plata && (
                                            <div className={`badge-plata plata-${comanda.metoda_plata}`}>
                                                {comanda.metoda_plata === 'numerar' ? (
                                                    <>💵 Numerar (Ramburs)</>
                                                ) : (
                                                    <>💳 Plătit cu Cardul</>
                                                )}
                                            </div>
                                        )}
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

                                {/* DETALII - vizibile cand e expandat */}
                                {comenziExpandate[comanda.id] && (
                                    <div className="ic-produse">
                                        {/* PRODUSE */}
                                        {esteComandaCadou(comanda) ? (
                                            <div className="alerta-cadou">
                                                <h5 className="alerta-cadou-titlu">
                                                    <span className="alerta-cadou-icon">🎁</span> COMANDĂ CADOU!
                                                </h5>
                                                <p className="alerta-cadou-text">
                                                    Atenție: Nu treceți numele clientului expeditor pe eticheta de livrare.
                                                </p>
                                                {comanda.mesaj_cadou && (
                                                    <div className="alerta-cadou-mesaj-box">
                                                        <p className="alerta-cadou-mesaj-label">Mesaj pentru felicitare:</p>
                                                        <p className="alerta-cadou-mesaj-text">
                                                            "{comanda.mesaj_cadou}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
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
                                                        {produs.optiune_decor && <p>🎨 Decor: {produs.optiune_decor}</p>}
                                                        {produs.observatii && <p>📝 {produs.observatii}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* OBSERVATII GENERALE */}
                                        {comanda.observatii && (
                                            <div className="ic-observatii-generale">
                                                <p>📝 Observații generale: {comanda.observatii}</p>
                                            </div>
                                        )}

                                        {/* BUTOANE STATUS */}
                                        {comanda.status !== 'livrata' && comanda.status !== 'anulata' && (
                                            <div className="gc-butoane-status">
                                                <button
                                                    className="btn-primar"
                                                    onClick={() => handleSchimbaStatus(comanda.id, statusUrmator[comanda.status])}
                                                >
                                                    {statusUrmatorLabel[comanda.status]}
                                                </button>
                                                <button
                                                    className="btn-stergere"
                                                    onClick={() => handleAnuleaza(comanda.id)}
                                                >
                                                    ✕ Anulează
                                                </button>
                                            </div>
                                        )}
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

export default GestionareComenzi