import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'

function CosCumparaturi() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [cos, setCos] = useState({ cofetarie_id: null, produse: [] })
    const [produseProduse, setProduseProduse] = useState([])
    const [cofetarie, setCofetarie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingComanda, setLoadingComanda] = useState(false)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [adresaLivrare, setAdresaLivrare] = useState('')
    const [telefon, setTelefon] = useState('')
    const [observatii, setObservatii] = useState('')

    useEffect(() => {
        const cosSalvat = localStorage.getItem('cos')
        if (cosSalvat) {
            const cosParsat = JSON.parse(cosSalvat)
            setCos(cosParsat)
            if (cosParsat.cofetarie_id) {
                fetchDetalii(cosParsat.cofetarie_id)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const fetchDetalii = async (cofetarieId) => {
        try {
            const raspuns = await api.get(`/cofetarii/${cofetarieId}`)
            setCofetarie(raspuns.data.cofetarie)
            setProduseProduse(raspuns.data.produse)
        } catch (err) {
            setEroare('Eroare la incarcarea detaliilor')
        } finally {
            setLoading(false)
        }
    }

    const salveazaCos = (cosNou) => {
        setCos(cosNou)
        localStorage.setItem('cos', JSON.stringify(cosNou))
    }

    const scadeInCos = (produsId) => {
        const produseActualizate = [...cos.produse]
        const index = produseActualizate.findIndex(p => p.id === produsId)

        if (index >= 0) {
            if (produseActualizate[index].cantitate === 1) {
                produseActualizate.splice(index, 1)
            } else {
                produseActualizate[index].cantitate -= 1
            }
        }

        salveazaCos({
            cofetarie_id: produseActualizate.length > 0 ? cos.cofetarie_id : null,
            produse: produseActualizate
        })
    }

    const cresteInCos = (produsId, stocRamas) => {
        const produseActualizate = [...cos.produse]
        const index = produseActualizate.findIndex(p => p.id === produsId)

        if (index >= 0 && produseActualizate[index].cantitate < stocRamas) {
            produseActualizate[index].cantitate += 1
        }

        salveazaCos({ ...cos, produse: produseActualizate })
    }

    const stergeProdusDinCos = (produsId) => {
        const produseActualizate = cos.produse.filter(p => p.id !== produsId)
        salveazaCos({
            cofetarie_id: produseActualizate.length > 0 ? cos.cofetarie_id : null,
            produse: produseActualizate
        })
    }

    const golestesCos = () => {
        salveazaCos({ cofetarie_id: null, produse: [] })
        setCofetarie(null)
    }

    const stocInsuficient = (produs) => {
        const stoc = produseProduse.find(p => p.id === produs.id)?.stoc || 0
        return produs.cantitate > stoc
    }

    const total = cos.produse.reduce((acc, p) => {
        const produsDB = produseProduse.find(db => db.id === p.id)
        return acc + (produsDB?.pret || p.pret) * p.cantitate
    }, 0)

    const areProbleme = cos.produse.some(p => stocInsuficient(p))

    const handlePlaseazaComanda = async () => {
        setEroare('')
        if (!adresaLivrare.trim()) {
            setEroare('Adresa de livrare este obligatorie')
            return
        }
        if (!telefon.trim()) {
            setEroare('Telefonul este obligatoriu')
            return
        }
        if (areProbleme) {
            setEroare('Unele produse din coș depășesc stocul disponibil')
            return
        }

        setLoadingComanda(true)
        try {
            await api.post('/comenzi', {
                cofetarie_id: cos.cofetarie_id,
                adresa_livrare: adresaLivrare,
                telefon,
                observatii,
                produse: cos.produse.map(p => ({
                    id: p.id,
                    cantitate: p.cantitate,
                    optiune_decor: p.optiune_decor || null,
                    observatii: p.observatii || null
                }))
            })

            golestesCos()
            setSucces('Comandă plasată cu succes!')
            setTimeout(() => navigate('/comenzile-mele'), 2000)
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la plasarea comenzii')
        } finally {
            setLoadingComanda(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (loading) return <p className="loading">Se încarcă...</p>

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
                    <button onClick={() => navigate('/comenzile-mele')}>Comenzile mele</button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <button className="btn-inapoi" onClick={() => navigate(-1)}>← Înapoi</button>
                <h2>Coșul meu 🛒</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {cos.produse.length === 0 ? (
                    <div className="cos-gol">
                        <p>🛒 Coșul tău este gol.</p>
                        <button className="btn-primar" onClick={() => navigate('/')}>
                            Explorează cofetăriile
                        </button>
                    </div>
                ) : (
                    <div className="cos-layout">
                        {/* LISTA PRODUSE DIN COS */}
                        <div className="cos-produse">
                            <div className="cos-header">
                                <h3>Produse de la {cofetarie?.numeCofetarie}</h3>
                                <button className="btn-goleste-cos" onClick={golestesCos}>
                                    🗑️ Golește coșul
                                </button>
                            </div>

                            {cos.produse.map(produs => {
                                const produsDB = produseProduse.find(p => p.id === produs.id)
                                const stocRamas = produsDB?.stoc || 0
                                const depasesteStoc = produs.cantitate > stocRamas

                                return (
                                    <div key={produs.id} className={`cos-produs-card ${depasesteStoc ? 'cos-produs-problema' : ''}`}>
                                        <div className="cos-produs-imagine">
                                            {produsDB?.imagine ? (
                                                <img src={`http://localhost:7000/${produsDB.imagine}`} alt={produs.numeProdus} />
                                            ) : <span>🎂</span>}
                                        </div>
                                        <div className="cos-produs-info">
                                            <h4>{produs.numeProdus}</h4>
                                            <p className="cos-produs-pret">{produsDB?.pret || produs.pret} lei / buc</p>
                                            {/* afisam optiunea de decor si observatiile per produs */}
                                            {produs.optiune_decor && (
                                                <p className="cos-produs-detaliu">🎨 Decor: {produs.optiune_decor}</p>
                                            )}
                                            {produs.observatii && (
                                                <p className="cos-produs-detaliu">📝 {produs.observatii}</p>
                                            )}
                                            {depasesteStoc && (
                                                <p className="cos-avertisment">
                                                    ⚠️ Stoc disponibil: doar {stocRamas} buc
                                                </p>
                                            )}
                                        </div>
                                        <div className="cos-produs-cantitate">
                                            <div className="cantitate-control">
                                                <button onClick={() => scadeInCos(produs.id)}>−</button>
                                                <span>{produs.cantitate}</span>
                                                <button
                                                    onClick={() => cresteInCos(produs.id, stocRamas)}
                                                    disabled={produs.cantitate >= stocRamas}
                                                >+</button>
                                            </div>
                                            <p className="cos-subtotal">
                                                {((produsDB?.pret || produs.pret) * produs.cantitate).toFixed(2)} lei
                                            </p>
                                        </div>
                                        <button className="cos-sterge-produs" onClick={() => stergeProdusDinCos(produs.id)}>✕</button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* FORMULAR DE COMANDA */}
                        <div className="cos-comanda-form">
                            <h3>Detalii comandă</h3>

                            <div className="form-group">
                                <label>Adresă de livrare *</label>
                                <input
                                    type="text"
                                    value={adresaLivrare}
                                    onChange={(e) => setAdresaLivrare(e.target.value)}
                                    placeholder="Strada, număr, oraș"
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefon *</label>
                                <input
                                    type="text"
                                    value={telefon}
                                    onChange={(e) => setTelefon(e.target.value)}
                                    placeholder="07xxxxxxxx"
                                />
                            </div>
                            <div className="form-group">
                                <label>Observații generale</label>
                                <textarea
                                    value={observatii}
                                    onChange={(e) => setObservatii(e.target.value)}
                                    placeholder="ex: Etaj 2, interfon 14..."
                                    rows={3}
                                />
                            </div>

                            <div className="cos-total">
                                <span>Total</span>
                                <span className="cos-total-pret">{total.toFixed(2)} lei</span>
                            </div>

                            <button
                                className="btn-primar cos-btn-comanda"
                                onClick={handlePlaseazaComanda}
                                disabled={loadingComanda || areProbleme}
                            >
                                {loadingComanda ? 'Se plasează...' : '✓ Plasează comanda'}
                            </button>

                            {areProbleme && (
                                <p className="cos-avertisment" style={{ marginTop: '0.5rem' }}>
                                    ⚠️ Verifica stocul produselor selectate
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CosCumparaturi