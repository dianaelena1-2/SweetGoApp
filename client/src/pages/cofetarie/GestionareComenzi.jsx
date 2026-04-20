import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, User, Calendar, MapPin, Phone } from 'lucide-react'
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
        return new Date(data).toLocaleDateString('ro-RO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const comenziFiltrate = filtruStatus === 'toate'
        ? comenzi
        : comenzi.filter(c => c.status === filtruStatus)

    const esteComandaCadou = (comanda) => {
        return comanda.este_cadou === true || comanda.este_cadou === 'true'
    }

    return (
        <div className="acasa-container">
            <NavbarCofetarie />

            <div className="acasa-continut">
                <h2>Comenzi primite</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

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
                            <div key={comanda._id} className="ic-comanda-card">
                                <div className="ic-comanda-header" onClick={() => toggleExpandare(comanda._id)}>
                                    <div className="ic-comanda-info">
                                        <h4><User size={18} color="#c97c2e" /> {comanda.client_id?.nume}</h4>
                                        <p className="ic-data"><Calendar size={14} /> {formatData(comanda.createdAt)}</p>
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
                                            {comenziExpandate[comanda._id] ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {comenziExpandate[comanda._id] && (
                                    <div className="ic-produse">
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
                                        {/* Am schimbat "produse" în "detalii" conform MongoDB */}
                                        {comanda.detalii.map((detaliu, index) => (
                                            <div key={index} className="ic-produs-rand">
                                                <div className="ic-produs-imagine">
                                                    {detaliu.produs_id?.imagine ? (
                                                        <img src={`https://sweetgoapp.onrender.com/${detaliu.produs_id.imagine}`} alt={detaliu.numeProdus} />
                                                    ) : <Cake size={32} color="#c97c2e" strokeWidth={1.5} />}
                                                </div>
                                                <div className="ic-produs-info">
                                                    <span className="ic-produs-nume">{detaliu.numeProdus}</span>
                                                    <span className="ic-produs-cantitate">x{detaliu.cantitate}</span>
                                                    <span className="ic-produs-pret">{(detaliu.pret_unitar * detaliu.cantitate).toFixed(2)} lei</span>
                                                </div>
                                                {(detaliu.optiune_decor || detaliu.observatii) && (
                                                    <div className="ic-produs-detalii">
                                                        {detaliu.optiune_decor && <p>🎨 Decor: {detaliu.optiune_decor}</p>}
                                                        {detaliu.observatii && <p>📝 {detaliu.observatii}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {comanda.observatii && (
                                            <div className="ic-observatii-generale">
                                                <p>📝 Observații generale: {comanda.observatii}</p>
                                            </div>
                                        )}

                                        {comanda.status !== 'livrata' && comanda.status !== 'anulata' && (
                                            <div className="gc-butoane-status">
                                                <button
                                                    className="btn-primar"
                                                    onClick={() => handleSchimbaStatus(comanda._id, statusUrmator[comanda.status])}
                                                >
                                                    {statusUrmatorLabel[comanda.status]}
                                                </button>
                                                <button
                                                    className="btn-stergere"
                                                    onClick={() => handleAnuleaza(comanda._id)}
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