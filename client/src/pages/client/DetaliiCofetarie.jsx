import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, ShoppingCart, Store, MapPin, Phone, Pencil, Tag, ChevronDown, ChevronUp, Check, Filter  } from 'lucide-react'
import api from '../../services/api'
import NavbarClient from '../../components/NavbarClient';

function DetaliiCofetarie() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { utilizator, logout } = useContext(AuthContext)

    const [cofetarie, setCofetarie] = useState(null)
    const [cautare, setCautare] = useState('')
    const [produse, setProduse] = useState([])
    const [loading, setLoading] = useState(true)
    const [categorieActiva, setCategorieActiva] = useState('Toate')
    const [esteFavorita, setEsteFavorita] = useState(false);
    const [loadingFav, setLoadingFav] = useState(false);
    const [eroare, setEroare] = useState('');

    const [ingredienteExtinse, setIngredienteExtinse] = useState(false)

    const categoriiUnice = ['Toate', ...new Set(produse.map(p => p.categorie))];

    const [cos, setCos] = useState(() => {
        const cosSalvat = localStorage.getItem('cos')
        return cosSalvat ? JSON.parse(cosSalvat) : { cofetarie_id: null, produse: [] }
    })

    const [modalDeschis, setModalDeschis] = useState(false)
    const [produsMmodal, setProdusModal] = useState(null)
    const [cantitateModal, setCantitateModal] = useState(1)
    const [optiuniDecorModal, setOptiuniDecorModal] = useState([])
    const [optiuneSelectata, setOptiuneSelectata] = useState('')
    const [optiuneCustom, setOptiuneCustom] = useState('')
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
        window.dispatchEvent(new Event('cos-updated'));
    }, [cos])

    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const res = await api.get('/client/favorite');
                setEsteFavorita(res.data.some(fav => fav.id === parseInt(id)));
            } catch (err) {
                console.error(err);
            }
        };
        if (utilizator?.rol === 'client') checkFavorite();
    }, [id, utilizator])

    const toggleFavorite = async () => {
        setLoadingFav(true);
        try {
            if (esteFavorita) {
                await api.delete(`/client/favorite/${id}`);
                setEsteFavorita(false);
            } else {
                await api.post(`/client/favorite/${id}`);
                setEsteFavorita(true);
            }
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la modificarea favorite.');
        } finally {
            setLoadingFav(false);
        }
    };

    const produseFiltrate = produse.filter(produs => {
        const term = cautare.toLowerCase().trim();

        const numeMatch = produs.numeProdus.toLowerCase().includes(term);
        const descriereMatch = produs.descriere?.toLowerCase().includes(term);
        const meciuriCautare = numeMatch || descriereMatch;

        const meciuriCategorie = categorieActiva === 'Toate' || produs.categorie === categorieActiva;

        return meciuriCautare && meciuriCategorie;
    });

    const deschideModal = async (produs) => {
        setProdusModal(produs)
        setCantitateModal(1)
        setOptiuneSelectata('')
        setOptiuneCustom('')
        setObservatiiModal('')
        setOptiuniDecorModal([])
        setIngredienteExtinse(false)

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

        const optiuneFinala = optiuneSelectata === 'Alta'
            ? (optiuneCustom.trim() || null)
            : (optiuneSelectata || null)

        const pretFinal = produs.este_la_oferta === 1 ? produs.pret * 0.6 : produs.pret;

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
                    pret: pretFinal,
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
                pret: pretFinal,
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
           <NavbarClient 
            utilizator={utilizator}
            logout={logout}
            searchValue=""
            onSearchChange={setCautare}
            showSearch={true}
        />

            <div className="acasa-continut">
                <button className="btn-inapoi" onClick={() => navigate('/')}>← Înapoi</button>

                <div className="cofetarie-detalii-header">
                    <div className="cofetarie-detalii-coperta">
                        {cofetarie.imagine_coperta ? (
                            <img src={`http://localhost:7000/${cofetarie.imagine_coperta}`} alt={cofetarie.numeCofetarie} />
                        ) : (
                            <Store size={64} color="#c97c2e" strokeWidth={1.5} />
                        )}
                    </div>
                    <div className="cofetarie-detalii-info">
                        <h2>{cofetarie.numeCofetarie}</h2>
                        <p><MapPin size={16} /> {cofetarie.adresa}</p>
                        <p><Phone size={16} /> {cofetarie.telefon}</p>
                        <div className="rating">
                            <span className="stele">{renderStele(cofetarie.rating_mediu)}</span>
                            <span className="numar-recenzii">
                                {cofetarie.numar_recenzii > 0
                                    ? `(${cofetarie.numar_recenzii} recenzii)`
                                    : '(fără recenzii)'}
                            </span>
                        </div>
                        {utilizator?.rol === 'client' && (
                            <button 
                                onClick={toggleFavorite} 
                                disabled={loadingFav} 
                                className="btn-secundar" 
                                style={{ marginTop: '12px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                {esteFavorita ? '❤️ Favorită' : '🤍 Adaugă la favorite'}
                            </button>
                        )}
                        {eroare && <div className="eroare" style={{ marginTop: '8px' }}>{eroare}</div>}
                    </div>
                </div>

                <div className="detalii-layout-container">
                    
                    <aside className="sidebar-filtrare">
                        <div className="sidebar-sectiune">
                            <h3 className="sidebar-titlu-filtru">
                                Filtrează <Filter size={20} color="#c97c2e" strokeWidth={2.5} />
                            </h3>
                            
                            <div className="filtru-grup">
                                <h4>Categorii</h4>
                                <div className="categorii-lista-verticala">
                                    {categoriiUnice.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategorieActiva(cat)}
                                            className={`filtru-item ${categorieActiva === cat ? 'activ' : ''}`}
                                        >
                                            <span className="filtru-text">{cat}</span>
                                            {categorieActiva === cat && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="zona-produse-main">
                        <div className="produse-header-flex">
                            <h3 className="sectiune-titlu fara-margine">
                                {categorieActiva === 'Toate' ? 'Toate produsele' : categorieActiva}
                            </h3>
                            <span className="numar-rezultate">{produseFiltrate.length} produse</span>
                        </div>
                        
                        {produse.length === 0 ? (
                            <p className="gol">Această cofetărie nu are produse disponibile momentan.</p>
                        ) : produseFiltrate.length === 0 ? (
                            <div className="cautare-fara-rezultat">
                                <p>Niciun rezultat pentru "<strong>{cautare}</strong>" în categoria "{categorieActiva}".</p>
                            </div>
                        ) : (
                            <div className="produse-grid">
                                {produseFiltrate.map(produs => (
                                    <div key={produs.id} className={`produs-card ${!produs.disponibil || produs.stoc === 0 ? 'produs-indisponibil' : ''}`}>
                                        <div className="produs-card-imagine">
                                            {produs.imagine ? (
                                                <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                            ) : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                        </div>
                                        <div className="produs-card-info">
                                            <h4>{produs.numeProdus}</h4>
                                            <p className="produs-descriere">{produs.descriere}</p>
                                            <p className="produs-categorie"><Tag size={14} /> {produs.categorie}</p>
                                            {produs.ingrediente && produs.ingrediente.length > 0 && (
                                                <div className="produs-ingrediente-preview">
                                                    <span className="ingrediente-label">Ingrediente: </span>
                                                    {produs.ingrediente.slice(0, 3).map(i => i.nume).join(', ')}{produs.ingrediente.length > 3 && '...'}
                                                </div>
                                            )}
                                            {produs.este_la_oferta === 1 && (
                                                <div style={{marginTop: '8px', marginBottom: '8px'}}>
                                                    <span className="badge-oferta">🔥 SALVEAZĂ-MĂ! -40%</span>
                                                </div>
                                            )}
                                            <div className="produs-footer">
                                                {produs.este_la_oferta === 1 ? (
                                                    <div className="pret-container-oferta">
                                                        <span className="pret-vechi">{produs.pret} lei</span>
                                                        <span className="pret-nou">{(produs.pret * 0.6).toFixed(2)} lei</span>
                                                    </div>
                                                ) : (
                                                    <span className="produs-pret">{produs.pret} lei</span>
                                                )}

                                                {!produs.disponibil || produs.stoc === 0 ? (
                                                    <span className="badge-indisponibil">Indisponibil</span>
                                                ) : cantitateDinCos(produs.id) === 0 ? (
                                                    <button className="btn-adauga-cos" onClick={() => deschideModal(produs)}>+ Adaugă</button>
                                                ) : (
                                                    <div className="cantitate-control">
                                                        <button onClick={() => scadeInCos(produs)}>−</button>
                                                        <span>{cantitateDinCos(produs.id)}</span>
                                                        <button onClick={() => deschideModal(produs)} disabled={cantitateDinCos(produs.id) >= produs.stoc}>+</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* PERSONALIZARE */}
            {modalDeschis && produsMmodal && (
                <div className="modal-overlay" onClick={inchideModal}>
                    <div className="modal-continut" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-inchide" onClick={inchideModal}>✕</button>

                        <div className="modal-produs-imagine">
                            {produsMmodal.imagine ? (
                                <img src={`http://localhost:7000/${produsMmodal.imagine}`} alt={produsMmodal.numeProdus} />
                            ) : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                        </div>

                        <h3 className="modal-titlu">{produsMmodal.numeProdus}</h3>
                        <p className="modal-descriere">{produsMmodal.descriere}</p>

                        {produsMmodal.ingrediente && produsMmodal.ingrediente.length > 0 && (
                            <div className="modal-sectiune-ingrediente">
                                <p className="modal-ingrediente-titlu">
                                    🥣 Ingrediente:
                                </p>
                                <p className="modal-ingrediente-text">
                                    {ingredienteExtinse 
                                        ? produsMmodal.ingrediente.map(i => i.nume).join(', ')
                                        : produsMmodal.ingrediente.slice(0, 5).map(i => i.nume).join(', ') + (produsMmodal.ingrediente.length > 5 ? '...' : '')
                                    }
                                    
                                    {produsMmodal.ingrediente.length > 5 && (
                                        <button 
                                            onClick={() => setIngredienteExtinse(!ingredienteExtinse)}
                                            className="btn-vezi-mai-mult"
                                        >
                                            {ingredienteExtinse ? <><ChevronUp size={14}/> vezi mai puțin</> : <><ChevronDown size={14}/> vezi tot</>}
                                        </button>
                                    )}
                                </p>
                            </div>
                        )}

                        {produsMmodal.este_la_oferta === 1 ? (
                            <div style={{ marginBottom: '15px' }}>
                                <span className="badge-oferta" style={{marginBottom: '5px'}}>🔥 SALVEAZĂ-MĂ! -40%</span>
                                <div className="pret-container-oferta">
                                    <span className="pret-vechi">{produsMmodal.pret} lei</span>
                                    <span className="pret-nou">{(produsMmodal.pret * 0.6).toFixed(2)} lei / buc</span>
                                </div>
                            </div>
                        ) : (
                            <p className="modal-pret">{produsMmodal.pret} lei / buc</p>
                        )}

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
                                        <Pencil size={14} /> Altă opțiune
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
                            <span className="modal-total-pret">
                                {(
                                    (produsMmodal.este_la_oferta === 1 ? produsMmodal.pret * 0.6 : produsMmodal.pret) * cantitateModal
                                ).toFixed(2)} lei
                            </span>
                        </div>

                        <button className="btn-primar modal-btn-adauga" onClick={confirmaAdaugareInCos}>
                            <ShoppingCart size={18} /> Adaugă în coș
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DetaliiCofetarie