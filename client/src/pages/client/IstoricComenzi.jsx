import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, Store, Calendar, MapPin, Star, MessageSquare, Check, X, Download, ShoppingCart, PackageCheck, Clock, Wallet, Eye, Store as StoreIcon, Truck, Palette, ReceiptText } from 'lucide-react'
import NavbarClient from '../../components/NavbarClient';

const statusLabel = {
    plasata: { text: 'Plasată', cls: 'status-plasata' },
    confirmata: { text: 'Confirmată', cls: 'status-confirmata' },
    in_preparare: { text: 'În preparare', cls: 'status-in-preparare' },
    in_livrare: { text: 'În livrare', cls: 'status-in-livrare' },
    livrata: { text: 'Livrată', cls: 'status-livrata' },
    anulata: { text: 'Anulată', cls: 'status-anulata' }
}

const transportLabels = {
    bicicleta: { nume: 'Bicicletă / Trotinetă', icon: '🚲' },
    masina: { nume: 'Mașină Standard', icon: '🚗' },
    frigorific: { nume: 'Mașină Frigorifică', icon: '❄️' }
}

function IstoricComenzi() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [comenzi, setComenzi] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('') 
    const [comenziExpandate, setComenziExpandate] = useState({})

    const [modalRecenzie, setModalRecenzie] = useState(null)
    const [ratingSelectat, setRatingSelectat] = useState(0)
    const [comentariuRecenzie, setComentariuRecenzie] = useState('')
    const [loadingRecenzie, setLoadingRecenzie] = useState(false)

    useEffect(() => {
        const fetchComenzi = async () => {
            try {
                const raspuns = await api.get('/comenzi/istoricul-meu')
                const comenziSortate = raspuns.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                setComenzi(comenziSortate)
            } catch (err) {
                setEroare('Eroare la încărcarea comenzilor')
            } finally {
                setLoading(false)
            }
        }
        fetchComenzi()
    }, [])

    const totalComenzi = comenzi.length;
    const comenziLivrate = comenzi.filter(c => c.status === 'livrata').length;
    const comenziInCurs = comenzi.filter(c => ['plasata', 'confirmata', 'in_preparare', 'in_livrare'].includes(c.status)).length;
    
    // CALCUL TOTAL CHELTUIT CU TVA 21% INCLUS
    const totalCheltuit = comenzi
        .filter(c => c.status !== 'anulata')
        .reduce((acc, c) => acc + (c.total * 1.21), 0);

    const extrageFavorite = () => {
        const produsCount = {};
        comenzi.forEach(c => {
            if(c.status !== 'anulata') {
                c.detalii.forEach(d => {
                    const id = d.produs_id?._id;
                    if(id) {
                        if(!produsCount[id]) {
                            produsCount[id] = { 
                                _id: id,
                                imagine: d.produs_id?.imagine,
                                numeProdus: d.numeProdus || d.produs_id?.numeProdus || 'Produs delicios',
                                pret: d.pret_unitar || d.produs_id?.pret || 0,
                                count: 0, 
                                cofetarieNume: c.cofetarie_id?.numeCofetarie,
                                cofetarieId: c.cofetarie_id?._id
                            };
                        }
                        produsCount[id].count += d.cantitate;
                    }
                });
            }
        });
        return Object.values(produsCount).sort((a,b) => b.count - a.count).slice(0, 4);
    }
    const favorite = extrageFavorite();

    const toggleExpandare = (comandaId) => {
        setComenziExpandate(prev => ({ ...prev, [comandaId]: !prev[comandaId] }))
    }

    const formatDataScurt = (data) => {
        return new Date(data).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const formatOra = (data) => {
        return new Date(data).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    }

    const generateIdFals = (idMongo) => {
        return `#CMD-${idMongo.substring(idMongo.length - 5).toUpperCase()}`
    }

    const deschideModalRecenzie = (comanda, e) => {
        e.stopPropagation()
        setModalRecenzie({
            cofetarieId: comanda.cofetarie_id?._id,
            comandaId: comanda._id,
            numeCofetarie: comanda.cofetarie_id?.numeCofetarie
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
            setComenzi(prevComenzi => prevComenzi.map(c => c._id === modalRecenzie.comandaId ? { ...c, are_recenzie: true } : c))
            setSucces('Recenzie trimisă cu succes!')
            setTimeout(() => { setModalRecenzie(null); setSucces(''); }, 2000)
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
            setComenzi(prevComenzi => prevComenzi.map(c => c._id === comandaId ? { ...c, status: 'anulata' } : c));
            alert('Comanda a fost anulată cu succes.');
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la anularea comenzii.');
        }
    }

    const getImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `https://sweetgoapp.onrender.com/${img}`;
    }

    if (loading) return <p className="loading">Se încarcă...</p>

    return (
        <div className="acasa-container">
            <NavbarClient utilizator={utilizator} logout={logout} searchValue="" onSearchChange={() => {}} showSearch={false}/>

            <div className="acasa-continut">
                <div className="istoric-header-top">
                    <div>
                        <h2>Istoric Comenzi</h2>
                        <p>Gestionează și urmărește comenzile tale de la cofetăriile preferate.</p>
                    </div>
                </div>

                <div className="istoric-stats-grid">
                    <div className="istoric-stat-card">
                        <div className="istoric-stat-icon" style={{background: '#fff3eb', color: '#c97c2e'}}><ShoppingCart size={24} /></div>
                        <div className="istoric-stat-info">
                            <span className="istoric-stat-label">Total Comenzi</span>
                            <span className="istoric-stat-value">{totalComenzi}</span>
                        </div>
                    </div>
                    <div className="istoric-stat-card">
                        <div className="istoric-stat-icon" style={{background: '#e8f5e9', color: '#2ecc71'}}><PackageCheck size={24} /></div>
                        <div className="istoric-stat-info">
                            <span className="istoric-stat-label">Livrate</span>
                            <span className="istoric-stat-value">{comenziLivrate}</span>
                        </div>
                    </div>
                    <div className="istoric-stat-card">
                        <div className="istoric-stat-icon" style={{background: '#fff8e1', color: '#f1c40f'}}><Clock size={24} /></div>
                        <div className="istoric-stat-info">
                            <span className="istoric-stat-label">În curs</span>
                            <span className="istoric-stat-value">{comenziInCurs}</span>
                        </div>
                    </div>
                    <div className="istoric-stat-card">
                        <div className="istoric-stat-icon" style={{background: '#fce4ec', color: '#e74c3c'}}><Wallet size={24} /></div>
                        <div className="istoric-stat-info">
                            <span className="istoric-stat-label">Total Cheltuit</span>
                            <span className="istoric-stat-value">{totalCheltuit.toFixed(2)} RON</span>
                        </div>
                    </div>
                </div>

                <div className="istoric-table-card">
                    <div className="istoric-table-header"><h3>Achiziții Recente</h3></div>
                    <div className="istoric-row-header">
                        <div>ID Comandă</div><div>Cofetărie</div><div>Dată</div><div>Sumă Totală</div><div>Status</div><div style={{textAlign: 'right'}}>Acțiuni</div>
                    </div>
                    <div className="istoric-table-body">
                        {comenzi.length === 0 ? (
                            <p className="text-gol" style={{padding: '2rem'}}>Nu ai plasat nicio comandă încă.</p>
                        ) : (
                            comenzi.map(comanda => (
                                <div key={comanda._id} style={{borderBottom: '1px solid #f5eadd'}}>
                                    <div className="istoric-row" onClick={() => toggleExpandare(comanda._id)} style={{cursor: 'pointer'}}>
                                        <div className="ir-col ir-id">{generateIdFals(comanda._id)}</div>
                                        <div className="ir-col ir-nume-cofetarie"><StoreIcon size={16} color="#c97c2e"/> {comanda.cofetarie_id?.numeCofetarie}</div>
                                        <div className="ir-col ir-data">{formatDataScurt(comanda.createdAt)}<small>{formatOra(comanda.createdAt)}</small></div>
                                        <div className="ir-col ir-suma">{(comanda.total * 1.21).toFixed(2)} RON</div>
                                        <div className="ir-col"><span className={`ic-status ${statusLabel[comanda.status]?.cls}`}>{statusLabel[comanda.status]?.text}</span></div>
                                        <div className="ir-col ir-actiuni">
                                            <button className="btn-repeta" onClick={(e) => { e.stopPropagation(); toggleExpandare(comanda._id); }}>Vezi detalii</button>
                                            <button className="btn-vezi" onClick={(e) => { e.stopPropagation(); toggleExpandare(comanda._id); }}><Eye size={16} /></button>
                                        </div>
                                    </div>

                                    {comenziExpandate[comanda._id] && (
                                        <div className="ic-produse" style={{background: '#fdfaf6', padding: '1.5rem 2rem'}}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f5eadd', paddingBottom: '0.5rem'}}>
                                                <h5 style={{color: '#7a5230', margin: 0}}>Detalii Comandă</h5>
                                                {/* <span style={{fontSize: '0.85rem', color: '#c97c2e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                    <Truck size={16}/> {transportLabels[comanda.tip_transport]?.icon} {transportLabels[comanda.tip_transport]?.nume || 'Standard'}
                                                </span> */}
                                            </div>

                                            {/* AFISARE PRODUSE CU NUME */}
                                            {comanda.detalii.map((produs, index) => (
                                                <div key={index} className="ic-produs-rand" style={{borderBottom: '1px dashed #f5eadd'}}>
                                                    <div className="ic-produs-imagine" style={{width: '40px', height: '40px'}}>
                                                        {produs.produs_id?.imagine ? <img src={getImageUrl(produs.produs_id.imagine)} alt={produs.numeProdus} /> : <Cake size={24} color="#c97c2e" />}
                                                    </div>
                                                    <div className="ic-produs-info">
                                                        <div>
                                                            <span className="ic-produs-nume" style={{fontWeight: 'bold'}}>
                                                                {produs.numeProdus || produs.produs_id?.numeProdus || 'Produs delicios'}
                                                            </span>
                                                            {produs.optiune_decor && (
                                                                <div style={{fontSize: '0.75rem', color: '#c97c2e', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px'}}>
                                                                    <Palette size={12}/> Decor: {produs.optiune_decor}
                                                                </div>
                                                            )}
                                                            {produs.observatii && (
                                                                <div style={{fontSize: '0.75rem', color: '#9a7a5a', fontStyle: 'italic'}}>
                                                                    📝 {produs.observatii}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="ic-produs-cantitate">x{produs.cantitate}</span>
                                                        <span className="ic-produs-pret">{(produs.pret_unitar * produs.cantitate).toFixed(2)} RON</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* SUMAR TAXE: TRANSPORT SI TVA */}
                                            <div style={{marginTop: '1rem', padding: '1rem', background: '#fffaf5', borderRadius: '12px', border: '1px solid #f5eadd'}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7a5230', marginBottom: '5px'}}>
                                                    <span>Cost Transport:</span>
                                                    <span style={{fontWeight: 'bold'}}>{(comanda.cost_livrare || 0).toFixed(2)} RON</span>
                                                </div>
                                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#7a5230', marginBottom: '5px'}}>
                                                    <span>TVA (21%):</span>
                                                    <span style={{fontWeight: 'bold'}}>{(comanda.total * 0.21).toFixed(2)} RON</span>
                                                </div>
                                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#3d2c1e', paddingTop: '5px', borderTop: '1px solid #f5eadd', marginTop: '5px', fontWeight: 'bold'}}>
                                                    <span>Total Final:</span>
                                                    <span style={{color: '#c97c2e'}}>{(comanda.total * 1.21).toFixed(2)} RON</span>
                                                </div>
                                            </div>
                                            
                                            <div className="ic-actiuni-comanda" style={{marginTop: '1.5rem'}}>
                                                {comanda.status === 'livrata' && (
                                                    comanda.are_recenzie ? (
                                                        <span style={{color: '#2ecc71', fontSize: '0.95rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                            <Check size={16} /> Ai lăsat deja o recenzie
                                                        </span>
                                                    ) : (
                                                        <button className="btn-secundar btn-nav-icon" onClick={(e) => deschideModalRecenzie(comanda, e)}>
                                                            <Star size={16} /> Lasă o recenzie
                                                        </button>
                                                    )
                                                )}
                                                {comanda.status === 'plasata' && (
                                                    <button className="btn-stergere btn-nav-icon" onClick={(e) => { e.stopPropagation(); handleAnuleazaComanda(comanda._id); }}>
                                                        <X size={16} /> Anulează comanda
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {favorite.length > 0 && (
                    <div style={{marginBottom: '3rem'}}>
                        <h3 className="istoric-fav-header">Comandă Rapidă Favorite</h3>
                        <div className="istoric-fav-grid">
                            {favorite.map(produs => (
                                <div key={produs._id} className="fav-card-modern" onClick={() => navigate(`/cofetarie/${produs.cofetarieId}`)}>
                                    {produs.imagine ? <img src={getImageUrl(produs.imagine)} alt={produs.numeProdus} className="fav-card-img" /> : <div className="fav-card-img" style={{background: '#fdecd8', display:'flex', alignItems:'center', justifyContent:'center'}}><Cake size={60} color="#c97c2e"/></div>}
                                    <div className="fav-card-overlay"></div>
                                    <div className="fav-card-content">
                                        <div className="fav-cofetarie">{produs.cofetarieNume}</div>
                                        <div className="fav-nume">{produs.numeProdus}</div>
                                        <div className="fav-footer">
                                            <span className="fav-pret">{(produs.pret || 0).toFixed(2)} RON</span>
                                            <button className="btn-fav-add" onClick={(e) => { e.stopPropagation(); navigate(`/cofetarie/${produs.cofetarieId}`); }}><ShoppingCart size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                    key={s} size={32} className="star-pointer"
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