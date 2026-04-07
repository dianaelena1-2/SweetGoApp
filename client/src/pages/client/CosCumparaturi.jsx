import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, ShoppingCart, Trash2, AlertTriangle, Check, CreditCard, Banknote } from 'lucide-react'
import api from '../../services/api'

const MIJLOACE_TRANSPORT = [
    { id: 'bicicleta', nume: '🚲Bicicletă / Trotinetă', desc: 'Produse mici și rezistente' },
    { id: 'masina', nume: '🚗Mașină Standard', desc: 'Prăjituri și pachete medii'},
    { id: 'frigorific', nume: '❄️Mașină Frigorifică', desc: 'Torturi și produse sensibile' }
];

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
    
    const [tipTransport, setTipTransport] = useState('masina');
    const [esteCadou, setEsteCadou] = useState(false)
    const [mesajCadou, setMesajCadou] = useState('')

    const [metodaPlata, setMetodaPlata] = useState('numerar')
    const [simularePlata, setSimularePlata] = useState({ activa: false, status: 'procesare' }) 

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

    useEffect(() => {
        const fetchAdresaDefault = async () => {
            try {
                const res = await api.get('/client/profil');
                if (res.data.adresa_default) {
                    setAdresaLivrare(res.data.adresa_default);
                }
            } catch (err) {
                console.error('Nu s-a putut încărca adresa implicită');
            }
        };
        fetchAdresaDefault();
    }, []);

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

    const obtineMetodaRecomandata = () => {
        if (cos.produse.length === 0 || produseProduse.length === 0) return 'masina';

        const detaliiProduseCos = cos.produse.map(itemCos => 
            produseProduse.find(p => p.id === itemCos.id)
        ).filter(Boolean);

        if (detaliiProduseCos.some(p => p.transport_recomandat === 'frigorific')) return 'frigorific';
        if (detaliiProduseCos.some(p => p.transport_recomandat === 'masina')) return 'masina';
        
        return 'bicicleta';
    };

    const recomandat = obtineMetodaRecomandata();

    useEffect(() => {
        if (produseProduse.length > 0) {
            setTipTransport(obtineMetodaRecomandata());
        }
    }, [produseProduse, cos.produse]);

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

    const plaseazaComandaFinala = async (statusPlata) => {
        try {
            await api.post('/comenzi', {
                cofetarie_id: cos.cofetarie_id,
                adresa_livrare: adresaLivrare,
                telefon,
                observatii,
                tip_transport: tipTransport,
                este_cadou: esteCadou,
                mesaj_cadou: esteCadou ? mesajCadou : null,
                metoda_plata: metodaPlata,
                status_plata: statusPlata,
                produse: cos.produse.map(p => ({
                    id: p.id,
                    cantitate: p.cantitate,
                    optiune_decor: p.optiune_decor || null,
                    observatii: p.observatii || null
                }))
            })

            golestesCos()
            setSucces('Comandă plasată cu succes!')
            setTimeout(() => navigate('/cos-cumparaturi'), 2000)
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la plasarea comenzii')
            setLoadingComanda(false)
            setSimularePlata({ activa: false, status: 'procesare' })
        }
    }

    const handlePlaseazaComanda = async () => {
        setEroare('')
        if (!adresaLivrare.trim()) { setEroare('Adresa de livrare este obligatorie'); return; }
        if (!telefon.trim()) { setEroare('Telefonul este obligatoriu'); return; }
        if (areProbleme) { setEroare('Unele produse din coș depășesc stocul disponibil'); return; }

        setLoadingComanda(true)

        // LOGICĂ DE PLATĂ
        if (metodaPlata === 'card') {
            setSimularePlata({ activa: true, status: 'procesare' })
            
            // Așteptăm 2.5 secunde pentru a simula procesarea bancară
            setTimeout(() => {
                setSimularePlata({ activa: true, status: 'succes' })
                
                setTimeout(() => {
                    setSimularePlata({ activa: false, status: 'procesare' })
                    plaseazaComandaFinala('platita')
                }, 1000)
            }, 2500)
        } else {
            plaseazaComandaFinala('in_asteptare')
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/')}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/profil')}>👤Profilul meu</button>
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
                        <p><ShoppingCart size={28} /> Coșul tău este gol.</p>
                        <button className="btn-primar" onClick={() => navigate('/')}>
                            Explorează cofetăriile
                        </button>
                    </div>
                ) : (
                    <div className="cos-layout">
                        <div className="cos-produse">
                            <div className="cos-header">
                                <h3>Produse de la {cofetarie?.numeCofetarie}</h3>
                                <button className="btn-goleste-cos" onClick={golestesCos}>
                                    <Trash2 size={16} /> Golește coșul
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
                                            ) : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                        </div>
                                        <div className="cos-produs-info">
                                            <h4>{produs.numeProdus}</h4>
                                            <p className="cos-produs-pret">{produsDB?.pret || produs.pret} lei / buc</p>
                                            {produs.optiune_decor && (
                                                <p className="cos-produs-detaliu">🎨 Decor: {produs.optiune_decor}</p>
                                            )}
                                            {produs.observatii && (
                                                <p className="cos-produs-detaliu">📝 {produs.observatii}</p>
                                            )}
                                            {depasesteStoc && (
                                                <p className="cos-avertisment">
                                                    <AlertTriangle size={14} /> Stoc disponibil: doar {stocRamas} buc
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
                                <label>Metodă de plată *</label>
                                <div className="plata-selectie-grid">
                                    <div className={`plata-option ${metodaPlata === 'numerar' ? 'active' : ''}`} onClick={() => setMetodaPlata('numerar')}>
                                        <Banknote size={28} color={metodaPlata === 'numerar' ? '#c97c2e' : '#9a7a5a'} />
                                        <span className="plata-nume">Numerar la livrare</span>
                                        <span className="plata-desc">Plătești curierului</span>
                                    </div>
                                    <div className={`plata-option ${metodaPlata === 'card' ? 'active' : ''}`} onClick={() => setMetodaPlata('card')}>
                                        <CreditCard size={28} color={metodaPlata === 'card' ? '#c97c2e' : '#9a7a5a'} />
                                        <span className="plata-nume">Plată cu cardul</span>
                                        <span className="plata-desc">Procesare securizată</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Mijloc de transport livrare *</label>
                                <div className="transport-selectie-grid">
                                    {MIJLOACE_TRANSPORT.map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`transport-option ${tipTransport === t.id ? 'active' : ''} ${recomandat === t.id ? 'recommended' : ''}`}
                                            onClick={() => setTipTransport(t.id)}
                                        >
                                            <div className="transport-header">
                                                {t.icon}
                                                {tipTransport === t.id && <Check size={16} className="check-icon" />}
                                            </div>
                                            <div className="transport-body">
                                                <span className="transport-nume">{t.nume}</span>
                                                {recomandat === t.id && <span className="badge-recomandat">Recomandat de cofetărie</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

                            <div className="cadou-sectiune">
                                <label className="cadou-label">
                                    <input
                                        type="checkbox"
                                        checked={esteCadou}
                                        onChange={(e) => setEsteCadou(e.target.checked)}
                                        className="cadou-checkbox"
                                    />
                                    <span className="cadou-icon">🎁</span> Trimite un cadou dulce!
                                </label>
                                <p className="cadou-help-text">
                                    Numele tău nu va apărea pe eticheta de livrare.
                                </p>

                                {esteCadou && (
                                    <div className="cadou-mesaj-container">
                                        <label className="cadou-mesaj-label">Mesaj pentru destinatar (va fi printat pe felicitare)</label>
                                        <textarea
                                            value={mesajCadou}
                                            onChange={(e) => setMesajCadou(e.target.value)}
                                            placeholder="ex: La mulți ani! Cu drag..."
                                            rows={2}
                                            className="cadou-mesaj-textarea"
                                        />
                                    </div>
                                )}
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
                                <p className="cos-avertisment pt-margin">
                                    <AlertTriangle size={14} /> Verifica stocul produselor selectate
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/*MODAL PLATA*/}
            {simularePlata.activa && (
                <div className="modal-plata-overlay">
                    <div className="modal-plata-content">
                        {simularePlata.status === 'procesare' ? (
                            <>
                                <div className="spinner-plata"></div>
                                <h3 style={{color: '#7a5230', marginBottom: '10px'}}>Se procesează plata...</h3>
                                <p style={{color: '#9a7a5a', fontSize: '0.9rem'}}>Te rugăm să nu închizi această pagină. Comunicăm cu banca ta.</p>
                            </>
                        ) : (
                            <>
                                <div style={{color: '#4CAF50', marginBottom: '20px'}}><Check size={60} strokeWidth={3} style={{margin: '0 auto'}}/></div>
                                <h3 style={{color: '#4CAF50', marginBottom: '10px'}}>Plată acceptată!</h3>
                                <p style={{color: '#9a7a5a', fontSize: '0.9rem'}}>Se plasează comanda...</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CosCumparaturi