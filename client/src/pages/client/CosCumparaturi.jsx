import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, ShoppingCart, Trash2, Check, CreditCard, Banknote, Truck, ChevronRight, Gift, EyeOff } from 'lucide-react'
import api from '../../services/api'
import NavbarClient from '../../components/NavbarClient'

const MIJLOACE_TRANSPORT = [
    { id: 'bicicleta', nume: 'Bicicletă / Trotinetă', desc: '5 RON • Produse mici', icon: '🚲' },
    { id: 'masina', nume: 'Mașină Standard', desc: '10 RON • Pachete medii', icon: '🚗' },
    { id: 'frigorific', nume: 'Mașină Frigorifică', desc: '15 RON • Produse sensibile', icon: '❄️' }
]

function CosCumparaturi() {
    const { utilizator, logout, salveazaCosPeServer } = useContext(AuthContext)
    const navigate = useNavigate()
    const isFirstRender = useRef(true)

    const [step, setStep] = useState(1)

    const [cos, setCos] = useState(() => {
        const cosSalvat = localStorage.getItem('cos')
        return cosSalvat ? JSON.parse(cosSalvat) : { cofetarie_id: null, produse: [] }
    })
    const [produseProduse, setProduseProduse] = useState([])
    const [cofetarie, setCofetarie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingComanda, setLoadingComanda] = useState(false)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    // Date Checkout
    const [adresaLivrare, setAdresaLivrare] = useState('')
    const [telefon, setTelefon] = useState('')
    const [observatii, setObservatii] = useState('')
    const [tipTransport, setTipTransport] = useState('masina')
    const [esteCadou, setEsteCadou] = useState(false)
    const [mesajCadou, setMesajCadou] = useState('')
    const [metodaPlata, setMetodaPlata] = useState('card')
    const [simularePlata, setSimularePlata] = useState({ activa: false, status: 'procesare' })
    const [costLivrare, setCostLivrare] = useState(10);

    useEffect(() => {
        if (cos.cofetarie_id) {
            fetchDetalii(cos.cofetarie_id)
        } else {
            setLoading(false)
        }
    }, [cos.cofetarie_id])

    useEffect(() => {
        const fetchDateProfil = async () => {
            try {
                const res = await api.get('/client/profil')
                if (res.data.adresa_default) setAdresaLivrare(res.data.adresa_default)
                if (res.data.telefon) setTelefon(res.data.telefon)
            } catch (err) {}
        }
        fetchDateProfil()
    }, [])

    useEffect(() => {
        localStorage.setItem('cos', JSON.stringify(cos))
        if (!isFirstRender.current) {
            window.dispatchEvent(new Event('cos-updated'))
            if (salveazaCosPeServer) salveazaCosPeServer()
        } else {
            isFirstRender.current = false
        }
    }, [cos, salveazaCosPeServer])

    const fetchDetalii = async (cofetarieId) => {
        try {
            const raspuns = await api.get(`/cofetarii/${cofetarieId}`)
            setCofetarie(raspuns.data.cofetarie)
            setProduseProduse(raspuns.data.produse)
        } catch (err) {
            setEroare('Eroare la încărcarea detaliilor')
        } finally {
            setLoading(false)
        }
    }

    const obtineMetodaRecomandata = () => {
        if (cos.produse.length === 0 || produseProduse.length === 0) return 'masina'
        const detaliiProduseCos = cos.produse.map(itemCos => 
            produseProduse.find(p => p._id === (itemCos._id || itemCos.id))
        ).filter(Boolean)
        
        if (detaliiProduseCos.some(p => p.transport_recomandat === 'frigorific')) return 'frigorific'
        if (detaliiProduseCos.some(p => p.transport_recomandat === 'masina')) return 'masina'
        return 'bicicleta'
    }

    const recomandat = obtineMetodaRecomandata()

    useEffect(() => {
        if (produseProduse.length > 0) {
            setTipTransport(obtineMetodaRecomandata())
        }
    }, [produseProduse.length])

    useEffect(() => {
        let cost = 0;
        if (tipTransport === 'bicicleta') cost = 5;
        else if (tipTransport === 'masina') cost = 10;
        else if (tipTransport === 'frigorific') cost = 15;
        setCostLivrare(cost);
    }, [tipTransport])

    const scadeInCos = (produsId) => {
        const produseActualizate = [...cos.produse]
        const index = produseActualizate.findIndex(p => (p._id || p.id) === produsId)
        if (index >= 0) {
            if (produseActualizate[index].cantitate === 1) {
                produseActualizate.splice(index, 1)
            } else {
                produseActualizate[index].cantitate -= 1
            }
        }
        setCos({
            cofetarie_id: produseActualizate.length > 0 ? cos.cofetarie_id : null,
            produse: produseActualizate
        })
    }

    const cresteInCos = (produsId, stocRamas) => {
        const produseActualizate = [...cos.produse]
        const index = produseActualizate.findIndex(p => (p._id || p.id) === produsId)
        if (index >= 0 && produseActualizate[index].cantitate < stocRamas) {
            produseActualizate[index].cantitate += 1
        }
        setCos({ ...cos, produse: produseActualizate })
    }

    const stergeProdusDinCos = (produsId) => {
        const produseActualizate = cos.produse.filter(p => (p._id || p.id) !== produsId)
        setCos({
            cofetarie_id: produseActualizate.length > 0 ? cos.cofetarie_id : null,
            produse: produseActualizate
        })
    }

    // ================= CALCUL SUME =================
    const totalProduse = cos.produse.reduce((acc, p) => {
        const produsDB = produseProduse.find(db => db._id === (p._id || p.id));
        const pretUnitar = produsDB?.este_la_oferta ? (produsDB.pret * 0.6) : (produsDB?.pret || p.pret);
        return acc + pretUnitar * p.cantitate;
    }, 0);
    
    const subtotalBaza = step === 1 ? totalProduse : totalProduse + costLivrare;
    
    const valoareTvaAdaugat = totalProduse * 0.21;

    const totalDePlata = step === 3 ? subtotalBaza + valoareTvaAdaugat : subtotalBaza;

    const plaseazaComandaFinala = async (statusPlata) => {
        try {
            await api.post('/comenzi', {
                cofetarie_id: cos.cofetarie_id,
                adresa_livrare: adresaLivrare,
                telefon,
                observatii,
                tip_transport: tipTransport,
                este_cadou: esteCadou,
                mesaj_cadou: mesajCadou,
                metoda_plata: metodaPlata,
                status_plata: statusPlata,
                cost_livrare: costLivrare,
                produse: cos.produse.map(p => ({
                    id: p._id || p.id,
                    cantitate: p.cantitate,
                    optiune_decor: p.optiune_decor || null,
                    observatii: p.observatii || null
                }))
            })
            setCos({ cofetarie_id: null, produse: [] })
            await api.delete('/client/cos')
            localStorage.removeItem('cos')
            window.dispatchEvent(new Event('cos-updated'))
            setSucces('Comandă plasată cu succes!')
            setTimeout(() => navigate('/comenzile-mele'), 2000)
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la plasarea comenzii')
            setLoadingComanda(false)
            setSimularePlata({ activa: false, status: 'procesare' })
        }
    }

    const handleNextStep = () => {
        setEroare('')
        if (step === 1) {
            if (cos.produse.length === 0) return setEroare('Coșul este gol')
            setStep(2)
        } else if (step === 2) {
            if (!adresaLivrare.trim()) return setEroare('Adresa de livrare este obligatorie')
            if (!telefon.trim()) return setEroare('Telefonul este obligatoriu')
            setStep(3)
        } else if (step === 3) {
            setLoadingComanda(true)
            if (metodaPlata === 'card') {
                setSimularePlata({ activa: true, status: 'procesare' })
                setTimeout(() => {
                    setSimularePlata({ activa: true, status: 'succes' })
                    setTimeout(() => plaseazaComandaFinala('platita'), 1000)
                }, 2000)
            } else {
                plaseazaComandaFinala('in_asteptare')
            }
        }
    }

    const getImageUrl = (produsDB) => {
        if (!produsDB?.imagine) return null;
        if (produsDB.imagine.startsWith('http')) return produsDB.imagine;
        return `https://sweetgoapp.onrender.com/${produsDB.imagine}`;
    }

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <NavbarClient utilizator={utilizator} logout={logout} searchValue="" onSearchChange={() => {}} showSearch={false}/>
            
            <div className="acasa-continut">
                
                <div className="checkout-breadcrumb">
                    <span className={`breadcrumb-step ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`} onClick={() => step > 1 && setStep(1)}>
                        <ShoppingCart size={18} /> Coș
                    </span>
                    <ChevronRight size={16} className="breadcrumb-separator" />
                    <span className={`breadcrumb-step ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`} onClick={() => step > 2 && setStep(2)}>
                        <Truck size={18} /> Livrare
                    </span>
                    <ChevronRight size={16} className="breadcrumb-separator" />
                    <span className={`breadcrumb-step ${step === 3 ? 'active' : ''}`}>
                        <CreditCard size={18} /> Plată
                    </span>
                </div>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {cos.produse.length === 0 && step === 1 ? (
                    <div className="cos-gol">
                        <p><ShoppingCart size={28} /> Coșul tău este gol.</p>
                        <button className="btn-primar" onClick={() => navigate('/')}>Explorează cofetăriile</button>
                    </div>
                ) : (
                    <div className="checkout-layout">
                        
                        <div className="checkout-main-content">
                            
                            {/* ====== PAS 1: COȘ ====== */}
                            {step === 1 && (
                                <>
                                    <h2 style={{fontSize: '1.8rem', color: '#3d2c1e', marginBottom: '0.5rem'}}>Coșul tău</h2>
                                    <p style={{color: '#9a7a5a', marginBottom: '2rem'}}>Verifică produsele și adaugă un mesaj special pentru a face ziua cuiva mai frumoasă.</p>
                                    
                                    <div className="cos-produse">
                                        {cos.produse.map(produs => {
                                            const PID = produs._id || produs.id
                                            const produsDB = produseProduse.find(p => p._id === PID)
                                            const pretUnitar = produsDB?.este_la_oferta ? (produsDB.pret * 0.6) : (produsDB?.pret || produs.pret)
                                            
                                            return (
                                                <div key={PID} className="cos-produs-card">
                                                    <div className="cos-produs-imagine">
                                                        {getImageUrl(produsDB) ? <img src={getImageUrl(produsDB)} alt={produs.numeProdus}/> : <Cake size={48} color="#c97c2e"/>}
                                                    </div>
                                                    <div className="cos-produs-info">
                                                        <h4>{produs.numeProdus}</h4>
                                                        
                                                        {produs.optiune_decor && <p className="cos-produs-detaliu" style={{fontSize: '0.85rem', color: '#7a5230', margin: '2px 0'}}>🎨 Decor: {produs.optiune_decor}</p>}
                                                        {produs.observatii && <p className="cos-produs-detaliu" style={{fontSize: '0.85rem', color: '#7a5230', margin: '2px 0'}}>📝 {produs.observatii}</p>}

                                                        <div className="cantitate-control" style={{width: 'fit-content', marginTop: '10px'}}>
                                                            <button onClick={() => scadeInCos(PID)}>−</button>
                                                            <span>{produs.cantitate}</span>
                                                            <button onClick={() => cresteInCos(PID, produsDB?.stoc || 0)}>+</button>
                                                        </div>
                                                    </div>
                                                    <div style={{textAlign: 'right'}}>
                                                        <button className="cos-sterge-produs" onClick={() => stergeProdusDinCos(PID)}><Trash2 size={18}/></button>
                                                        <p className="cos-subtotal" style={{marginTop: '25px', fontSize:'1.1rem', color:'#e74c3c'}}>{(pretUnitar * produs.cantitate).toFixed(2)} RON</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* SECTIUNE CADOU */}
                                    <div className="cadou-sectiune-moderna">
                                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                                            <div style={{background:'#fffaf5', padding:'8px', borderRadius:'10px', border:'1px solid #f5eadd'}}>
                                                <Gift size={20} color="#e74c3c"/>
                                            </div>
                                            <h3 style={{margin:0, color:'#3d2c1e', fontSize:'1.1rem'}}>Opțiuni Cadou</h3>
                                        </div>
                                        
                                        <label style={{fontSize:'0.9rem', color:'#7a5230', fontWeight:'600', display:'block', marginBottom:'8px'}}>Mesaj personalizat (Opțional)</label>
                                        <textarea 
                                            value={mesajCadou} 
                                            onChange={(e) => setMesajCadou(e.target.value)} 
                                            placeholder="Scrie aici un gând dulce pentru destinatar..." 
                                            rows={3} 
                                            className="cadou-mesaj-textarea"
                                        />

                                        <label className="cadou-checkbox-wrapper">
                                            <input 
                                                type="checkbox" 
                                                checked={esteCadou} 
                                                onChange={(e) => setEsteCadou(e.target.checked)} 
                                            />
                                            <div className="cadou-checkbox-info" style={{flex: 1}}>
                                                <span className="cadou-titlu">Este o surpriză?</span>
                                                <span className="cadou-desc">Dacă bifezi, ascundem prețul și numele tău de pe nota de livrare.</span>
                                            </div>
                                            <EyeOff size={24} color="#f5a623" style={{opacity: esteCadou ? 1 : 0.4}}/>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* ====== PAS 2: LIVRARE ====== */}
                            {step === 2 && (
                                <>
                                    <div className="checkout-form-section">
                                        <h2>Metodă de Livrare</h2>
                                        <p>Alege tipul de transport potrivit pentru produsele tale.</p>
                                        
                                        <div className="transport-selectie-grid" style={{flexDirection: 'row', gap: '15px', flexWrap: 'wrap'}}>
                                            {MIJLOACE_TRANSPORT.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    className={`transport-option ${tipTransport === t.id ? 'active' : ''} ${recomandat === t.id ? 'recommended' : ''}`} 
                                                    onClick={() => setTipTransport(t.id)} 
                                                    style={{flex: '1 1 30%', padding:'1.2rem', alignItems:'center', textAlign:'center', background: tipTransport === t.id ? '#fff9f2' : 'white', minWidth: '140px'}}
                                                >
                                                    <div style={{fontSize: '2rem', marginBottom: '8px'}}>{t.icon}</div>
                                                    <span className="transport-nume">{t.nume}</span>
                                                    <span style={{fontSize:'0.8rem', color:'#9a7a5a', marginTop:'5px'}}>{t.desc}</span>
                                                    
                                                    {recomandat === t.id && (
                                                        <span style={{fontSize: '0.7rem', background: '#fdecd8', color: '#c97c2e', padding: '2px 8px', borderRadius: '10px', marginTop: '8px', fontWeight: 'bold'}}>Recomandat</span>
                                                    )}
                                                    {tipTransport === t.id && <Check size={18} color="#c97c2e" style={{position:'absolute', top:'10px', right:'10px'}}/>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="checkout-form-section">
                                        <h3 style={{marginBottom:'1rem'}}>Detalii Livrare</h3>
                                        
                                        <div className="form-group">
                                            <label>Adresă completă *</label>
                                            <input type="text" value={adresaLivrare} onChange={(e) => setAdresaLivrare(e.target.value)} placeholder="Ex: Str. Florilor, Nr. 10, Ap. 5" />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Telefon de contact *</label>
                                            <input type="text" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="07xxxxxxxx" />
                                        </div>
                                        <div className="form-group">
                                            <label>Observații pentru curier (Opțional)</label>
                                            <textarea value={observatii} onChange={(e) => setObservatii(e.target.value)} placeholder="Ex: Sunați când ajungeți la interfon" rows={2}/>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ====== PAS 3: PLATA ====== */}
                            {step === 3 && (
                                <div className="checkout-form-section">
                                    <h2>Metodă de Plată</h2>
                                    <p>Alege cum dorești să achiți comanda.</p>
                                    
                                    <div className="plata-selectie-grid">
                                        <div className={`plata-option ${metodaPlata === 'card' ? 'active recommended' : ''}`} onClick={() => setMetodaPlata('card')} style={{padding:'2rem'}}>
                                            <CreditCard size={32} color={metodaPlata === 'card' ? '#c97c2e' : '#9a7a5a'} />
                                            <span className="plata-nume">Card online</span>
                                            <span className="plata-desc">Plată securizată</span>
                                            {metodaPlata === 'card' && <Check size={20} color="#c97c2e" style={{position:'absolute', top:'10px', right:'10px'}}/>}
                                        </div>
                                        <div className={`plata-option ${metodaPlata === 'numerar' ? 'active recommended' : ''}`} onClick={() => setMetodaPlata('numerar')} style={{padding:'2rem'}}>
                                            <Banknote size={32} color={metodaPlata === 'numerar' ? '#c97c2e' : '#9a7a5a'} />
                                            <span className="plata-nume">Numerar la livrare</span>
                                            <span className="plata-desc">Plătești curierului</span>
                                            {metodaPlata === 'numerar' && <Check size={20} color="#c97c2e" style={{position:'absolute', top:'10px', right:'10px'}}/>}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* COLOANA DREAPTA: SUMAR COMANDĂ */}
                        <div className="checkout-sumar-card">
                            <h3>Sumar Comandă</h3>
                            
                            {step > 1 && (
                                <div style={{marginBottom: '1.5rem'}}>
                                    {cos.produse.map(p => {
                                        const pDB = produseProduse.find(db => db._id === (p._id || p.id))
                                        const pret = pDB?.este_la_oferta ? (pDB.pret * 0.6) : (pDB?.pret || p.pret)
                                        return (
                                            <div key={p._id || p.id} className="sumar-mini-produs">
                                                <div className="sumar-mini-info">
                                                    {getImageUrl(pDB) ? <img src={getImageUrl(pDB)} alt="" className="sumar-mini-img"/> : <div className="sumar-mini-img"></div>}
                                                    <div className="sumar-mini-text">
                                                        <h4>{p.numeProdus}</h4>
                                                        {/* AICI APARE DECORUL SI IN MINI-SUMAR */}
                                                        {p.optiune_decor && <p style={{fontSize: '0.75rem', color: '#c97c2e', margin: '2px 0'}}>🎨 {p.optiune_decor}</p>}
                                                        <p>x{p.cantitate}</p>
                                                    </div>
                                                </div>
                                                <span className="sumar-mini-pret">{(pret * p.cantitate).toFixed(2)} RON</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="cos-total" style={{border: 'none', padding: '0.2rem 0', margin:0}}>
                                <span style={{color: '#9a7a5a', fontWeight:'normal'}}>Subtotal produse</span>
                                <span>{totalProduse.toFixed(2)} RON</span>
                            </div>
                            
                            {/* AFISAM TRANSPORT DOAR DACA SUNTEM DUPA PASUL 1 */}
                            {step > 1 && (
                                <div className="cos-total" style={{border: 'none', padding: '0.2rem 0', margin:0}}>
                                    <span style={{color: '#9a7a5a', fontWeight:'normal'}}>Transport</span>
                                    <span style={{color: '#3d2c1e'}}>{costLivrare.toFixed(2)} RON</span>
                                </div>
                            )}

                            {/* TVA-ul ADAUGAT DE 21% (APARE DOAR LA PASUL 3) */}
                            {step === 3 && (
                                <div className="cos-total" style={{border: 'none', padding: '0.2rem 0', margin:'0 0 1rem 0'}}>
                                    <span style={{color: '#9a7a5a', fontWeight:'normal', fontSize: '0.85rem'}}>TVA (21%)</span>
                                    <span style={{color: '#9a7a5a', fontSize: '0.85rem'}}>+ {valoareTvaAdaugat.toFixed(2)} RON</span>
                                </div>
                            )}

                            <div className="cos-total" style={{ borderTop: '1px solid #f5eadd', paddingTop: '1rem' }}>
                                <span style={{fontSize:'1.2rem', color:'#3d2c1e'}}>Total</span>
                                <span className="cos-total-pret" style={{color:'#e74c3c'}}>{totalDePlata.toFixed(2)} RON</span>
                            </div>

                            <button className="btn-primar cos-btn-comanda" onClick={handleNextStep} disabled={loadingComanda}>
                                {loadingComanda ? 'Se procesează...' : (step === 3 ? 'Finalizează Comanda →' : 'Continuă →')}
                            </button>
                            
                            {step === 3 && (
                                <div style={{textAlign:'center', marginTop:'1rem', color:'#2ecc71', fontSize:'0.8rem', display:'flex', justifyContent:'center', alignItems:'center', gap:'5px'}}>
                                    <Check size={14}/> Plată securizată 100%
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Simulatie Plata */}
            {simularePlata.activa && (
                <div className="modal-plata-overlay">
                    <div className="modal-plata-content">
                        {simularePlata.status === 'procesare' ? (
                            <>
                                <div className="spinner-plata"></div>
                                <h3 style={{color: '#7a5230', marginBottom: '10px'}}>Se procesează plata...</h3>
                                <p style={{color: '#9a7a5a', fontSize: '0.9rem'}}>Te rugăm să nu închizi această pagină.</p>
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