import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, PlusCircle, Tag, Check, X, Package, Pencil, Trash2, Palette, Bike, Car, Snowflake, ListChecks, AlertTriangle, Calendar } from 'lucide-react'
import api from '../../services/api'
import NavbarCofetarie from '../../components/NavbarCofetarie';

const CATEGORII = ['Torturi', 'Prăjituri', 'Macarons', 'Cupcakes', 'Croissante']

const produsGol = {
    numeProdus: '',
    descriere: '',
    pret: '',
    stoc: '',
    categorie: 'Torturi',
    disponibil: 1,
    transport_recomandat: 'masina',
    data_expirare: ''
}

function GestionareProduse() {
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [produse, setProduse] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [formNou, setFormNou] = useState(produsGol)
    const [imagineNoua, setImagineNoua] = useState(null)

    const [editareId, setEditareId] = useState(-1)
    const [formEditare, setFormEditare] = useState(produsGol)
    const [imagineEditare, setImagineEditare] = useState(null)

    const [ingredienteSelectate, setIngredienteSelectate] = useState([])
    const [toateIngredientele, setToateIngredientele] = useState([])
    const [numeIngredientNou, setNumeIngredientNou] = useState('')

    const [optiuniDecor, setOptiuniDecor] = useState([])
    const [numeOptiuneNoua, setNumeOptiuneNoua] = useState('')

    const [alerteExpirare, setAlerteExpirare] = useState([])
    const [esteDupaOra20, setEsteDupaOra20] = useState(false)

    const [fileInputKey, setFileInputKey] = useState(Date.now());

    const [showExpired, setShowExpired] = useState(false)
    const [showUnavailable, setShowUnavailable] = useState(false)
    const [produseExpirate, setProduseExpirate] = useState([])
    const [loadingExpired, setLoadingExpired] = useState(false)
    const [produseIndisponibile, setProduseIndisponibile] = useState([])
    const [loadingIndisponibile, setLoadingIndisponibile] = useState(false)

    useEffect(() => {
        fetchProduse()
        fetchAlerte()
        fetchProduseExpirate()
        fetchProduseIndisponibile()
        fetchIngredienteGlobale()
    }, [])

    useEffect(() => {
        const checkOra = () => {
            const now = new Date()
            setEsteDupaOra20(now.getHours() >= 20)
        }
        checkOra()
        const interval = setInterval(checkOra, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (editareId === -1) {
            setIngredienteSelectate([])
            setOptiuniDecor([])
            setFormNou(produsGol)
            setImagineNoua(null)
        }
    }, [editareId])

    const fetchIngredienteGlobale = async () => {
        try {
            const res = await api.get('/ingrediente');
            const ingrediente = res.data.map(ing => ing.nume);
            setToateIngredientele(ingrediente);
        } catch (err) {
            console.error('Eroare la încărcarea ingredientelor globale', err);
        }
    }

    const fetchProduse = async () => {
        try {
            const raspuns = await api.get(`/produse/cofetarie/${utilizator.id}`)
            setProduse(raspuns.data)
        } catch (err) {
            setEroare('Eroare la încărcarea produselor')
        } finally {
            setLoading(false)
        }
    }

    const fetchAlerte = async () => {
        try {
            const raspuns = await api.get('/produse/alerte-expirare');
            setAlerteExpirare(raspuns.data);
        } catch (err) { console.error(err); }
    }

    const fetchProduseExpirate = async () => {
        setLoadingExpired(true);
        try {
            const raspuns = await api.get('/produse/expirate');
            setProduseExpirate(raspuns.data);
        } catch (err) {
            setEroare('Eroare la încărcarea produselor expirate');
        } finally {
            setLoadingExpired(false);
        }
    }

    const fetchProduseIndisponibile = async () => {
        setLoadingIndisponibile(true);
        try {
            const raspuns = await api.get('/produse/indisponibile');
            setProduseIndisponibile(raspuns.data);
        } catch (err) {
            setEroare('Eroare la încărcarea produselor indisponibile');
        } finally {
            setLoadingIndisponibile(false);
        }
    }

    const afiseazaSucces = (mesaj) => {
        setSucces(mesaj)
        setTimeout(() => setSucces(''), 3000)
    }

    const handleAdaugaIngredient = () => {
        const nume = numeIngredientNou.trim().toLowerCase()
        if (nume) {
            if (!ingredienteSelectate.includes(nume)) {
                setIngredienteSelectate([...ingredienteSelectate, nume])
            }
            if (!toateIngredientele.includes(nume)) {
                setToateIngredientele(prev => [...prev, nume].sort())
            }
        }
        setNumeIngredientNou('')
    }

    const adaugaOptiune = () => {
        const nume = numeOptiuneNoua.trim()
        if (nume && !optiuniDecor.includes(nume)) {
            setOptiuniDecor([...optiuniDecor, nume])
        }
        setNumeOptiuneNoua('')
    }

    const stergeOptiune = (nume) => {
        setOptiuniDecor(optiuniDecor.filter(opt => opt !== nume))
    }

    const aplicaOferta = async (produsId) => {
        try {
            await api.put(`/produse/${produsId}/aplica-oferta`);
            afiseazaSucces('Ofertă aplicată cu succes!');
            fetchAlerte();
            fetchProduse();
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la aplicarea ofertei');
        }
    }

    const resetFormularAdaugare = () => {
        setFormNou(produsGol);
        setImagineNoua(null);
        setIngredienteSelectate([]);
        setOptiuniDecor([]);
        setNumeIngredientNou('');
        setNumeOptiuneNoua('');
        setFileInputKey(Date.now());
    }

    const handleAdauga = async () => {
        setEroare('')
        if (!formNou.numeProdus || !formNou.pret) {
            setEroare('Numele și prețul sunt obligatorii')
            return
        }
        try {
            const data = new FormData()
            data.append('numeProdus', formNou.numeProdus)
            data.append('descriere', formNou.descriere)
            data.append('pret', formNou.pret)
            data.append('categorie', formNou.categorie)
            data.append('stoc', formNou.stoc || 0)
            data.append('disponibil', formNou.disponibil)
            data.append('transport_recomandat', formNou.transport_recomandat)
            if (formNou.data_expirare) {
                data.append('data_expirare', formNou.data_expirare)
            }
            data.append('ingredienteAlese', JSON.stringify(ingredienteSelectate))
            data.append('optiuni_decor', JSON.stringify(optiuniDecor));
            
            if (imagineNoua) data.append('imagine', imagineNoua)
            await api.post('/produse', data, { headers: { 'Content-Type': 'multipart/form-data' } })
            resetFormularAdaugare()
            afiseazaSucces('Produs adăugat cu succes!')
            fetchProduse()
            fetchIngredienteGlobale()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la adăugarea produsului')
        }
    }

    const handleIncepeEditare = (produs) => {
        setEditareId(produs._id)
        setFormEditare({
            numeProdus: produs.numeProdus,
            descriere: produs.descriere || '',
            pret: produs.pret,
            categorie: produs.categorie,
            stoc: produs.stoc || 0,
            disponibil: produs.disponibil ? 1 : 0,
            transport_recomandat: produs.transport_recomandat || 'masina',
            data_expirare: produs.data_expirare ? produs.data_expirare.split('T')[0] : ''
        })
        setImagineEditare(null)
        setIngredienteSelectate(produs.ingrediente || [])
        setOptiuniDecor(produs.optiuni_decor || [])
        setNumeIngredientNou('')
    }

    const handleSalveazaEditare = async (id) => {
        setEroare('')
        if (!formEditare.numeProdus || !formEditare.pret) {
            setEroare('Numele și prețul sunt obligatorii')
            return
        }
        try {
            const data = new FormData()
            data.append('numeProdus', formEditare.numeProdus)
            data.append('descriere', formEditare.descriere)
            data.append('pret', formEditare.pret)
            data.append('categorie', formEditare.categorie)
            data.append('disponibil', formEditare.disponibil === 1 || formEditare.disponibil === '1')
            data.append('stoc', formEditare.stoc || 0)
            data.append('transport_recomandat', formEditare.transport_recomandat)
            if (formEditare.data_expirare) {
                data.append('data_expirare', formEditare.data_expirare)
            }
            data.append('ingredienteAlese', JSON.stringify(ingredienteSelectate))
            data.append('optiuni_decor', JSON.stringify(optiuniDecor));

            if (imagineEditare) data.append('imagine', imagineEditare)
            await api.put(`/produse/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            
            setEditareId(-1)
            setIngredienteSelectate([])
            setOptiuniDecor([])
            afiseazaSucces('Produs actualizat cu succes!')
            fetchProduse()
            fetchProduseExpirate()
            fetchProduseIndisponibile()
            fetchIngredienteGlobale()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la actualizarea produsului')
        }
    }

    const handleSterge = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest produs?')) return
        try {
            await api.delete(`/produse/${id}`)
            afiseazaSucces('Produs șters cu succes!')
            fetchProduse()
            fetchProduseExpirate()
            fetchProduseIndisponibile()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la ștergerea produsului')
        }
    }

     const renderSectiuneIngrediente = () => {
        const toateOptiunile = [...new Set([...toateIngredientele, ...ingredienteSelectate])].sort();

        return (
            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px'}}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a5230' }}>
                    <ListChecks size={18} /> Ingrediente produs
                </label>

                {toateOptiunile.length > 0 && (
                    <div className="ingrediente-selector-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {toateOptiunile.map((ing, idx) => {
                            const isSelected = ingredienteSelectate.includes(ing);
                            return (
                                <div 
                                    key={idx} 
                                    className={`ing-tag ${isSelected ? 'activ' : ''}`}
                                    onClick={() => {
                                        if (isSelected) {
                                            setIngredienteSelectate(ingredienteSelectate.filter(i => i !== ing));
                                        } else {
                                            setIngredienteSelectate([...ingredienteSelectate, ing]);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {ing}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Adaugă ingredient nou" 
                        value={numeIngredientNou}
                        onChange={(e) => setNumeIngredientNou(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); 
                                handleAdaugaIngredient();
                            }
                        }}
                        style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-ingredient-nou" onClick={handleAdaugaIngredient}>
                        ➕ Adaugă
                    </button>
                </div>
            </div>
        );
    }

    const renderSectiuneOptiuni = () => (
        <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px'}}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a5230' }}>
                <Palette size={18} /> Opțiuni decor (disponibile pentru clienți)
            </label>

            {optiuniDecor.length > 0 && (
                <div className="ingrediente-selector-container">
                    {optiuniDecor.map((opt, idx) => (
                        <div 
                            key={idx} 
                            className="ing-tag activ"
                            onClick={() => stergeOptiune(opt)}
                        >
                            {opt} ✕
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Adaugă opțiune (ex: Scris personalizat)" 
                    value={numeOptiuneNoua}
                    onChange={(e) => setNumeOptiuneNoua(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); 
                            adaugaOptiune();
                        }
                    }}
                    style={{ flex: 1 }}
                />
                <button type="button" className="btn-ingredient-nou" onClick={adaugaOptiune}>
                    ➕ Adaugă
                </button>
            </div>
        </div>
    )

    return (
        <div className="acasa-container">
            <NavbarCofetarie />

            <div className="acasa-continut">
                <h2>Gestionare Produse</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                <div className="gp-card">
                    <h3 className="gp-card-titlu">➕ Adaugă produs nou</h3>
                    <div className="gp-form">
                        <div className="form-group">
                            <label>Nume produs</label>
                            <input type="text" value={formNou.numeProdus} onChange={(e) => setFormNou({ ...formNou, numeProdus: e.target.value })} placeholder="ex: Tort Ciocolată" />
                        </div>
                        <div className="form-group">
                            <label>Descriere (inclusiv opțiuni de decor dacă există)</label>
                            <input type="text" value={formNou.descriere} onChange={(e) => setFormNou({ ...formNou, descriere: e.target.value })} placeholder="ex: Tort cu fructe. Decor: Trandafiri" />
                        </div>
                        <div className="gp-form-row">
                            <div className="form-group"><label>Preț (lei)</label><input type="number" value={formNou.pret} onChange={(e) => setFormNou({ ...formNou, pret: e.target.value })} min="0" /></div>
                            <div className="form-group"><label>Stoc (bucăți)</label><input type="number" value={formNou.stoc} onChange={(e) => setFormNou({ ...formNou, stoc: e.target.value })} min="0" /></div>
                            <div className="form-group"><label>Dată expirare</label><input type="date" value={formNou.data_expirare} onChange={(e) => setFormNou({ ...formNou, data_expirare: e.target.value })} /></div>
                            <div className="form-group">
                                <label>Categorie</label>
                                <select value={formNou.categorie} onChange={(e) => setFormNou({ ...formNou, categorie: e.target.value })}>
                                    {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Disponibil</label>
                                <select value={formNou.disponibil} onChange={(e) => setFormNou({ ...formNou, disponibil: parseInt(e.target.value) })}>
                                    <option value={1}>Da</option>
                                    <option value={0}>Nu</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Transport recomandat</label>
                                <select value={formNou.transport_recomandat} onChange={(e) => setFormNou({ ...formNou, transport_recomandat: e.target.value })}>
                                    <option value="bicicleta">🚲 Bicicletă / Trotinetă</option>
                                    <option value="masina">🚗 Mașină Standard</option>
                                    <option value="frigorific">❄️ Mașină Frigorifică</option>
                                </select>
                            </div>
                        </div>

                        {renderSectiuneIngrediente()}
                        {formNou.categorie === 'Torturi' && renderSectiuneOptiuni()}

                        <div className="form-group">
                            <label>Imagine produs (opțional)</label>
                            <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImagineNoua(e.target.files[0])} key={fileInputKey} />
                        </div>
                        <button className="btn-primar" onClick={handleAdauga}>Adaugă produs</button>
                    </div>
                </div>

                {alerteExpirare.length > 0 && (
                    <div className="alerta-expirare-container">
                        <h3 className="alerta-expirare-header"><AlertTriangle size={24} /> Atenție! Produse care expiră mâine</h3>
                        <div className="alerta-expirare-lista">
                            {alerteExpirare.map(produs => (
                                <div key={produs._id} className="alerta-expirare-item">
                                    <div className="alerta-expirare-detalii">
                                        <strong>{produs.numeProdus}</strong> (Stoc: {produs.stoc} buc)
                                    </div>
                                    <button 
                                        className="btn-aplica-oferta" 
                                        style={{ backgroundColor: esteDupaOra20 ? '#4CAF50' : '#e0e0e0' }}
                                        disabled={!esteDupaOra20}
                                        onClick={() => aplicaOferta(produs._id)}
                                    >
                                        {esteDupaOra20 ? 'Aplică ofertă' : '⏳ Așteaptă ora 20:00'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="produse-header-actions">
                    <h3 className="sectiune-titlu" style={{ margin: 0 }}>
                        {showExpired ? '📅 Produse expirate' : showUnavailable ? '🚫 Produse indisponibile' : `📦 Produsele tale (${produse.length})`}
                    </h3>
                    <div className="produse-buttons">
                        <button className={!showExpired && !showUnavailable ? 'btn-primar' : 'btn-secundar'} onClick={() => { setShowExpired(false); setShowUnavailable(false); }}>Toate ({produse.length})</button>
                        <button className={showExpired ? 'btn-primar' : 'btn-secundar'} onClick={() => { setShowExpired(true); setShowUnavailable(false); }}>⚠️ Expirate ({produseExpirate.length})</button>
                        <button className={showUnavailable ? 'btn-primar' : 'btn-secundar'} onClick={() => { setShowExpired(false); setShowUnavailable(true); }}>🚫 Indisponibile ({produseIndisponibile.length})</button>
                    </div>
                </div>

                <div className="gp-lista">
                    {(showExpired ? produseExpirate : showUnavailable ? produseIndisponibile : produse).map(produs => (
                        <div key={produs._id} className="gp-produs-card">
                            {editareId === produs._id ? (
                                <div className="gp-editare">
                                    <div className="gp-form gp-form-editare">
                                        <div className="form-group"><label>Nume</label><input type="text" value={formEditare.numeProdus} onChange={(e) => setFormEditare({ ...formEditare, numeProdus: e.target.value })} /></div>
                                        <div className="form-group"><label>Descriere</label><input type="text" value={formEditare.descriere} onChange={(e) => setFormEditare({ ...formEditare, descriere: e.target.value })} /></div>
                                        <div className="gp-form-row">
                                            <div className="form-group"><label>Preț</label><input type="number" value={formEditare.pret} onChange={(e) => setFormEditare({ ...formEditare, pret: e.target.value })} /></div>
                                            <div className="form-group"><label>Stoc</label><input type="number" value={formEditare.stoc} onChange={(e) => setFormEditare({ ...formEditare, stoc: e.target.value })} /></div>
                                            <div className="form-group"><label>Dată expirare</label><input type="date" value={formEditare.data_expirare} onChange={(e) => setFormEditare({ ...formEditare, data_expirare: e.target.value })} /></div>
                                        </div>
                                        {renderSectiuneIngrediente()}
                                        {formEditare.categorie === 'Torturi' && renderSectiuneOptiuni()}
                                        <div className="gp-butoane-editare">
                                            <button className="btn-primar" onClick={() => handleSalveazaEditare(produs._id)}>Salvează</button>
                                            <button className="btn-secundar" onClick={() => { setEditareId(-1); resetFormularAdaugare()}}>Anulează</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="gp-produs-vizualizare" style={{ flexWrap: 'wrap' }}>
                                    <div className="gp-produs-imagine">
                                        {produs.imagine ? 
                                            <img 
                                                src={produs.imagine && produs.imagine.startsWith('http') 
                                                    ? produs.imagine 
                                                    : `https://sweetgoapp.onrender.com/${produs.imagine}`} 
                                                alt={produs.numeProdus} 
                                            /> : <Cake size={48} color="#c97c2e" />}
                                    </div>
                                    <div className="gp-produs-info">
                                        <h4>{produs.numeProdus}</h4>
                                        <p className="produs-descriere">{produs.descriere}</p>
                                        {produs.ingrediente && produs.ingrediente.length > 0 && (
                                            <div style={{ margin: '8px 0', fontSize: '0.85rem', color: '#7a5230' }}>
                                                <strong>Ingrediente:</strong> {produs.ingrediente.join(', ')}
                                            </div>
                                        )}
                                        <div className="gp-produs-meta">
                                            <span className="produs-pret">{produs.pret} lei</span>
                                            <span><Package size={14} /> {produs.stoc} buc</span>
                                        </div>
                                        {produs.este_la_oferta && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <span className="badge-oferta">🔥 OFERTĂ -40%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="gp-produs-actiuni">
                                        <button className="btn-editare" onClick={() => handleIncepeEditare(produs)}><Pencil size={16} /> Editează</button>
                                        <button className="btn-stergere" onClick={() => handleSterge(produs._id)}><Trash2 size={16} /> Șterge</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default GestionareProduse