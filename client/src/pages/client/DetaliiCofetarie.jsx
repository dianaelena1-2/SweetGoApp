import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'

function DetaliiCofetarie() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { utilizator, logout } = useContext(AuthContext)

    const [cofetarie, setCofetarie] = useState(null)
    const [produse, setProduse] = useState([])
    const [loading, setLoading] = useState(true)

    const [cos, setCos] = useState(() => {
        const cosSalvat = localStorage.getItem('cos')
        return cosSalvat ? JSON.parse(cosSalvat) : { cofetarie_id: null, produse: [] }
    })

    const [modalDeschis, setModalDeschis] = useState(false)
    const [produsMmodal, setProdusModal] = useState(null)
    const [cantitateModal, setCantitateModal] = useState(1)
    const [optiuniDecorModal, setOptiuniDecorModal] = useState([])
    const [optiuneSelectata, setOptiuneSelectata] = useState('') // 'Trandafiri roz' sau 'Alta' sau ''
    const [optiuneCustom, setOptiuneCustom] = useState('') // textul custom cand e selectat 'Alta'
    const [observatiiModal, setObservatiiModal] = useState('')

    useEffect(() => {
        const fetchDetalii = async () => {
            try {
                const raspuns = await api.get(`/cofetarii/${id}`)
                setCofetarie(raspuns.data.cofetarie)
                setProduse(raspuns.data.produse)
            } catch (err) {
                console.error('Eroare la incarcarea detaliilor', err)
            } finally {
                setLoading(false)
            }
        }
        fetchDetalii()
    }, [id])

    useEffect(() => {
        localStorage.setItem('cos', JSON.stringify(cos))
    }, [cos])

    const deschideModal = async (produs) => {
        setProdusModal(produs)
        setCantitateModal(1)
        setOptiuneSelectata('')
        setOptiuneCustom('')
        setObservatiiModal('')
        setOptiuniDecorModal([])

        if (produs.categorie === 'Torturi') {
            try {
                const raspuns = await api.get(`/optiuni-decor/produs/${produs.id}`)
                setOptiuniDecorModal(raspuns.data)
            } catch (err) {
                console.error('Eroare la incarcarea optiunilor', err)
            }
        }

        setModalDeschis(true)
    }

    const inchideModal = () => {
        setModalDeschis(false)
        setProdusModal(null)
        setOptiuneCustom('')
    }

    const confirmaAdaugareInCos = () => {
        const produs = produsMmodal
        // daca e 'Alta', folosim textul custom, altfel optiunea selectata
        const optiuneFinala = optiuneSelectata === 'Alta'
            ? (optiuneCustom.trim() || null)
            : (optiuneSelectata || null)

        if (cos.cofetarie_id && cos.cofetarie_id !== id) {
            const confirmare = window.confirm(
                'Ai produse din altă cofetărie în coș. Vrei să golești coșul și să adaugi din această cofetărie?'
            )
            if (!confirmare) {
                inchideModal()
                return
            }
            setCos({
                cofetarie_id: id,
                produse: [{
                    ...produs,
                    cantitate: cantitateModal,
                    optiune_decor: optiuneFinala,
                    observatii: observatiiModal || null
                }]
            })
            inchideModal()
            return
        }

        const produseActualizate = [...cos.produse]
        const indexExistent = produseActualizate.findIndex(p => p.id === produs.id)

        if (indexExistent >= 0) {
            produseActualizate[indexExistent].cantitate += cantitateModal
            produseActualizate[indexExistent].optiune_decor = optiuneFinala
            produseActualizate[indexExistent].observatii = observatiiModal || null
        } else {
            produseActualizate.push({
                ...produs,
                cantitate: cantitateModal,
                optiune_decor: optiuneFinala,
                observatii: observatiiModal || null
            })
        }

        setCos({ cofetarie_id: id, produse: produseActualizate })
        inchideModal()
    }

    const scadeInCos = (produs) => {
        const produseActualizate = [...cos.produse]
        const indexExistent = produseActualizate.findIndex(p => p.id === produs.id)

        if (indexExistent >= 0) {
            if (produseActualizate[indexExistent].cantitate === 1) {
                produseActualizate.splice(indexExistent, 1)
            } else {
                produseActualizate[indexExistent].cantitate -= 1
            }
        }

        setCos({
            cofetarie_id: produseActualizate.length > 0 ? id : null,
            produse: produseActualizate
        })
    }

    const cantitateDinCos = (produsId) => {
        const produs = cos.produse.find(p => p.id === produsId)
        return produs ? produs.cantitate : 0
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const renderStele = (rating) => {
        if (!rating) return '☆☆☆☆☆'
        const stelePane = Math.round(rating)
        return '★'.repeat(stelePane) + '☆'.repeat(5 - stelePane)
    }

    const totalCos = cos.produse.reduce((acc, p) => acc + p.cantitate, 0)

    if (loading) return <p className="loading">Se încarcă...</p>
    if (!cofetarie) return <p className="gol">Cofetăria nu a fost găsită.</p>

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/comenzile-mele')}>Comenzile mele</button>
                    <button onClick={() => navigate('/cos-cumparaturi')}>
                        🛒 Coș {totalCos > 0 && `(${totalCos})`}
                    </button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <button className="btn-inapoi" onClick={() => navigate('/')}>← Înapoi</button>

                <div className="cofetarie-detalii-header">
                    <div className="cofetarie-detalii-coperta">
                        {cofetarie.imagine_coperta ? (
                            <img src={`http://localhost:7000/${cofetarie.imagine_coperta}`} alt={cofetarie.numeCofetarie} />
                        ) : (
                            <span>🏪</span>
                        )}
                    </div>
                    <div className="cofetarie-detalii-info">
                        <h2>{cofetarie.numeCofetarie}</h2>
                        <p>📍 {cofetarie.adresa}</p>
                        <p>📞 {cofetarie.telefon}</p>
                        <div className="rating">
                            <span className="stele">{renderStele(cofetarie.rating_mediu)}</span>
                            <span className="numar-recenzii">
                                {cofetarie.numar_recenzii > 0
                                    ? `(${cofetarie.numar_recenzii} recenzii)`
                                    : '(fără recenzii)'}
                            </span>
                        </div>
                    </div>
                </div>

                <h3 className="sectiune-titlu">Produse disponibile</h3>
                {produse.length === 0 ? (
                    <p className="gol">Această cofetărie nu are produse disponibile momentan.</p>
                ) : (
                    <div className="produse-grid">
                        {produse.map(produs => (
                            <div key={produs.id} className={`produs-card ${!produs.disponibil || produs.stoc === 0 ? 'produs-indisponibil' : ''}`}>
                                <div className="produs-card-imagine">
                                    {produs.imagine ? (
                                        <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                    ) : <span>🎂</span>}
                                </div>
                                <div className="produs-card-info">
                                    <h4>{produs.numeProdus}</h4>
                                    <p className="produs-descriere">{produs.descriere}</p>
                                    <p className="produs-categorie">📌 {produs.categorie}</p>
                                    <div className="produs-footer">
                                        <span className="produs-pret">{produs.pret} lei</span>

                                        {!produs.disponibil || produs.stoc === 0 ? (
                                            <span className="badge-indisponibil">Indisponibil</span>
                                        ) : cantitateDinCos(produs.id) === 0 ? (
                                            <button
                                                className="btn-adauga-cos"
                                                onClick={() => deschideModal(produs)}
                                            >
                                                + Adaugă
                                            </button>
                                        ) : (
                                            <div className="cantitate-control">
                                                <button onClick={() => scadeInCos(produs)}>−</button>
                                                <span>{cantitateDinCos(produs.id)}</span>
                                                <button
                                                    onClick={() => deschideModal(produs)}
                                                    disabled={cantitateDinCos(produs.id) >= produs.stoc}
                                                >+</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL PERSONALIZARE */}
            {modalDeschis && produsMmodal && (
                <div className="modal-overlay" onClick={inchideModal}>
                    <div className="modal-continut" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-inchide" onClick={inchideModal}>✕</button>

                        <div className="modal-produs-imagine">
                            {produsMmodal.imagine ? (
                                <img src={`http://localhost:7000/${produsMmodal.imagine}`} alt={produsMmodal.numeProdus} />
                            ) : <span>🎂</span>}
                        </div>

                        <h3 className="modal-titlu">{produsMmodal.numeProdus}</h3>
                        <p className="modal-descriere">{produsMmodal.descriere}</p>
                        <p className="modal-pret">{produsMmodal.pret} lei / buc</p>

                        {/* SELECTOR CANTITATE */}
                        <div className="modal-sectiune">
                            <label className="modal-label">Cantitate</label>
                            <div className="cantitate-control">
                                <button onClick={() => setCantitateModal(c => Math.max(1, c - 1))}>−</button>
                                <span>{cantitateModal}</span>
                                <button
                                    onClick={() => setCantitateModal(c => Math.min(produsMmodal.stoc - cantitateDinCos(produsMmodal.id), c + 1))}
                                    disabled={cantitateModal >= produsMmodal.stoc - cantitateDinCos(produsMmodal.id)}
                                >+</button>
                            </div>
                            <p className="modal-stoc-info">Stoc disponibil: {produsMmodal.stoc - cantitateDinCos(produsMmodal.id)} buc</p>
                        </div>

                        {/* OPTIUNI DECOR - doar pentru torturi */}
                        {produsMmodal.categorie === 'Torturi' && optiuniDecorModal.length > 0 && (
                            <div className="modal-sectiune">
                                <label className="modal-label">🎨 Opțiune decor</label>
                                <div className="modal-optiuni-decor">
                                    {optiuniDecorModal.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`modal-optiune-btn ${optiuneSelectata === opt.denumire ? 'activa' : ''}`}
                                            onClick={() => {
                                                setOptiuneSelectata(optiuneSelectata === opt.denumire ? '' : opt.denumire)
                                                setOptiuneCustom('')
                                            }}
                                        >
                                            {opt.denumire}
                                        </button>
                                    ))}
                                    <button
                                        className={`modal-optiune-btn ${optiuneSelectata === 'Alta' ? 'activa' : ''}`}
                                        onClick={() => setOptiuneSelectata(optiuneSelectata === 'Alta' ? '' : 'Alta')}
                                    >
                                        ✏️ Altă opțiune
                                    </button>
                                </div>
                                {optiuneSelectata === 'Alta' && (
                                    <input
                                        type="text"
                                        className="modal-input-alta"
                                        placeholder="Descrie opțiunea dorită..."
                                        value={optiuneCustom}
                                        onChange={(e) => setOptiuneCustom(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        {/* OBSERVATII */}
                        <div className="modal-sectiune">
                            <label className="modal-label">📝 Observații (opțional)</label>
                            <textarea
                                className="modal-textarea"
                                placeholder="ex: Scrie pe tort 'La mulți ani Ana!', fără zahăr..."
                                value={observatiiModal}
                                onChange={(e) => setObservatiiModal(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="modal-total">
                            <span>Total</span>
                            <span className="modal-total-pret">{(produsMmodal.pret * cantitateModal).toFixed(2)} lei</span>
                        </div>

                        <button className="btn-primar modal-btn-adauga" onClick={confirmaAdaugareInCos}>
                            🛒 Adaugă în coș
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DetaliiCofetarie