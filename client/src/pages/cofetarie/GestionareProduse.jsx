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

    const [optiuniDecor, setOptiuniDecor] = useState({})
    const [optiuneNoua, setOptiuneNoua] = useState({})

    const [listaGlobalaIngrediente, setListaGlobalaIngrediente] = useState([])
    const [ingredienteAlese, setIngredienteAlese] = useState([])
    const [numeIngredientNou, setNumeIngredientNou] = useState('')

    const [alerteExpirare, setAlerteExpirare] = useState([])
    const [esteDupaOra20, setEsteDupaOra20] = useState(false)

    const [showExpired, setShowExpired] = useState(false)
    const [showUnavailable, setShowUnavailable] = useState(false)
    const [produseExpirate, setProduseExpirate] = useState([])
    const [loadingExpired, setLoadingExpired] = useState(false)
    const [produseIndisponibile, setProduseIndisponibile] = useState([])
    const [loadingIndisponibile, setLoadingIndisponibile] = useState(false)

    useEffect(() => {
        fetchProduse()
        fetchIngrediente()
        fetchAlerte()
        fetchProduseExpirate()
        fetchProduseIndisponibile()
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

    const fetchIngrediente = async () => {
        try{
            const raspuns = await api.get('/ingrediente')
            setListaGlobalaIngrediente(raspuns.data)
        } catch(err){
            console.error('Eroare la incarcarea listei de ingrediente', err)
        }
    }

    const fetchOptiuni = async (produsId) => {
        try {
            const raspuns = await api.get(`/optiuni-decor/produs/${produsId}`)
            setOptiuniDecor(prev => ({ ...prev, [produsId]: raspuns.data }))
        } catch (err) {
            console.error('Eroare la incarcarea optiunilor', err)
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

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const afiseazaSucces = (mesaj) => {
        setSucces(mesaj)
        setTimeout(() => setSucces(''), 3000)
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
            data.append('ingredienteAlese', JSON.stringify(ingredienteAlese))
            data.append('ingredientNou', numeIngredientNou)
            
            if (imagineNoua) data.append('imagine', imagineNoua)
            await api.post('/produse', data, { headers: { 'Content-Type': 'multipart/form-data' } })

            setFormNou(produsGol)
            setImagineNoua(null)
            setIngredienteAlese([])
            setNumeIngredientNou('')

            afiseazaSucces('Produs adăugat cu succes!')
            fetchProduse()
            fetchIngrediente()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la adăugarea produsului')
        }
    }

    const handleAdaugaIngredient = async () => {
        const nume = numeIngredientNou.trim().toLowerCase();
        if (!nume) return;

        try{
            const res = await api.post('/ingrediente', { nume });
            await fetchIngrediente();
            const ingredientAdaugat = res.data.id; 
            if (!ingredienteAlese.includes(ingredientAdaugat)) {
                setIngredienteAlese([...ingredienteAlese, ingredientAdaugat]);
            }
            setNumeIngredientNou('');
            afiseazaSucces(`Ingredientul "${nume}" a fost adăugat!`);
        } catch(err){
            setEroare(err.response?.data?.mesaj || "Eroare la adăugarea ingredientului");
        }
    }

    const handleIncepeEditare = (produs) => {
        setEditareId(produs.id)
        setFormEditare({
            numeProdus: produs.numeProdus,
            descriere: produs.descriere || '',
            pret: produs.pret,
            categorie: produs.categorie,
            stoc: produs.stoc || 0,
            disponibil: produs.disponibil,
            transport_recomandat: produs.transport_recomandat || 'masina',
            data_expirare: produs.data_expirare || ''
        })
        setImagineEditare(null)
        setIngredienteAlese(produs.ingrediente ? produs.ingrediente.map(i => i.id) : [])
        setNumeIngredientNou('')

        if (produs.categorie === 'Torturi') {
            fetchOptiuni(produs.id)
        }
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
            data.append('disponibil', formEditare.disponibil)
            data.append('stoc', formEditare.stoc || 0)
            data.append('transport_recomandat', formEditare.transport_recomandat)
            if (formEditare.data_expirare) {
                data.append('data_expirare', formEditare.data_expirare)
            }
            data.append('ingredienteAlese', JSON.stringify(ingredienteAlese))
            data.append('ingredientNou', numeIngredientNou)

            if (imagineEditare) data.append('imagine', imagineEditare)
            await api.put(`/produse/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            
            setEditareId(-1)
            setIngredienteAlese([])
            setNumeIngredientNou('')

            afiseazaSucces('Produs actualizat cu succes!')
            fetchProduse()
            fetchProduseExpirate()
            fetchProduseIndisponibile()
            fetchIngrediente()
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

    const handleAdaugaOptiune = async (produsId) => {
        const denumire = optiuneNoua[produsId]?.trim()
        if (!denumire) return
        try {
            await api.post('/optiuni-decor', { produs_id: produsId, denumire })
            setOptiuneNoua(prev => ({ ...prev, [produsId]: '' }))
            fetchOptiuni(produsId)
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la adaugarea optiunii')
        }
    }

    const handleStergeOptiune = async (optiuneId, produsId) => {
        try {
            await api.delete(`/optiuni-decor/${optiuneId}`)
            fetchOptiuni(produsId)
        } catch (err) {
            setEroare('Eroare la stergerea optiunii')
        }
    }

    const renderOptiuniDecor = (produs) => (
        <div className="gp-optiuni-decor">
            <h5>🎨 Opțiuni decor</h5>
            {!optiuniDecor[produs.id] ? (
                <button
                    className="btn-secundar"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                    onClick={() => fetchOptiuni(produs.id)}
                >
                    Vezi opțiuni
                </button>
            ) : (
                <>
                    {optiuniDecor[produs.id].length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#9a7a5a' }}>Nicio opțiune adăugată</p>
                    ) : (
                        <ul className="gp-optiuni-lista">
                            {optiuniDecor[produs.id].map(opt => (
                                <li key={opt.id}>
                                    <span>{opt.denumire}</span>
                                    <button onClick={() => handleStergeOptiune(opt.id, produs.id)}>✕</button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="gp-optiune-adauga">
                        <input
                            type="text"
                            placeholder="ex: Trandafiri roz"
                            value={optiuneNoua[produs.id] || ''}
                            onChange={(e) => setOptiuneNoua(prev => ({ ...prev, [produs.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdaugaOptiune(produs.id)}
                        />
                        <button
                            className="btn-primar"
                            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleAdaugaOptiune(produs.id)}
                        >
                            + Adaugă
                        </button>
                    </div>
                </>
            )}
        </div>
    )

    const renderSectiuneIngrediente = () => (
        <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px'}}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a5230' }}>
                <ListChecks size={18} /> Ingrediente produs
            </label>

            <div className="ingrediente-selector-container">
                {listaGlobalaIngrediente.map(ing => (
                    <div 
                        key={ing.id} 
                        className={`ing-tag ${ingredienteAlese.includes(ing.id) ? 'activ' : ''}`}
                        onClick={() => {
                            if (ingredienteAlese.includes(ing.id)) {
                                setIngredienteAlese(ingredienteAlese.filter(id => id !== ing.id))
                            } else {
                                setIngredienteAlese([...ingredienteAlese, ing.id])
                            }
                        }}
                    >
                        {ing.nume}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Ingredient nou? (ex: Sirop de agave)" 
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
                <div className="container-buton-centrat">
                    <button 
                        type="button" 
                        className="btn-ingredient-nou" 
                        onClick={handleAdaugaIngredient}
                    >
                        ➕ Adaugă în listă
                    </button>
                </div>
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

                {/* FORMULAR ADAUGARE PRODUS NOU */}
                <div className="gp-card">
                    <h3 className="gp-card-titlu">➕ Adaugă produs nou</h3>
                    <div className="gp-form">
                        {/* ... păstrează același formular ca în original ... */}
                        <div className="form-group">
                            <label>Nume produs</label>
                            <input
                                type="text"
                                value={formNou.numeProdus}
                                onChange={(e) => setFormNou({ ...formNou, numeProdus: e.target.value })}
                                placeholder="ex: Tort Ciocolată"
                            />
                        </div>
                        <div className="form-group">
                            <label>Descriere</label>
                            <input
                                type="text"
                                value={formNou.descriere}
                                onChange={(e) => setFormNou({ ...formNou, descriere: e.target.value })}
                                placeholder="ex: Tort cu cremă de ciocolată și fructe de pădure"
                            />
                        </div>
                        <div className="gp-form-row">
                            <div className="form-group">
                                <label>Preț (lei)</label>
                                <input
                                    type="number"
                                    value={formNou.pret}
                                    onChange={(e) => setFormNou({ ...formNou, pret: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Stoc (bucăți)</label>
                                <input
                                    type="number"
                                    value={formNou.stoc}
                                    onChange={(e) => setFormNou({ ...formNou, stoc: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Dată expirare</label>
                                <input
                                    type="date"
                                    value={formNou.data_expirare}
                                    onChange={(e) => setFormNou({ ...formNou, data_expirare: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Categorie</label>
                                <select
                                    value={formNou.categorie}
                                    onChange={(e) => setFormNou({ ...formNou, categorie: e.target.value })}
                                >
                                    {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Disponibil</label>
                                <select
                                    value={formNou.disponibil}
                                    onChange={(e) => setFormNou({ ...formNou, disponibil: parseInt(e.target.value) })}
                                >
                                    <option value={1}>Da</option>
                                    <option value={0}>Nu</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Transport recomandat</label>
                                <select
                                    value={formNou.transport_recomandat}
                                    onChange={(e) => setFormNou({ ...formNou, transport_recomandat: e.target.value })}
                                >
                                    <option value="bicicleta">🚲 Bicicletă / Trotinetă</option>
                                    <option value="masina">🚗 Mașină Standard</option>
                                    <option value="frigorific">❄️ Mașină Frigorifică</option>
                                </select>
                            </div>
                        </div>

                        {renderSectiuneIngrediente()}

                        <div className="form-group">
                            <label>Imagine produs (opțional)</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => setImagineNoua(e.target.files[0])}
                            />
                        </div>
                        <button className="btn-primar" onClick={handleAdauga}>
                            Adaugă produs
                        </button>
                    </div>
                </div>

                {alerteExpirare.length > 0 && (
                    <div className="alerta-expirare-container">
                        <h3 className="alerta-expirare-header">
                            <AlertTriangle size={24} /> Atenție! Produse care expiră mâine
                        </h3>
                        <p className="alerta-expirare-text">
                            Aceste produse vor expira mâine. Dorești să le aplici o reducere de 40% pentru a preveni risipa?
                        </p>
                        {!esteDupaOra20 && (
                            <p style={{ color: '#d32f2f', fontSize: '0.85rem' }}>
                                ⏳ Ofertele pot fi aplicate doar după ora 20:00.
                            </p>
                        )}
                        
                        <div className="alerta-expirare-lista">
                            {alerteExpirare.map(produs => (
                                <div key={produs.id} className="alerta-expirare-item">
                                    <div className="alerta-expirare-detalii">
                                        <strong>{produs.numeProdus}</strong> (Stoc: {produs.stoc} buc)
                                        <span className="alerta-expirare-preturi">
                                            Preț normal: {produs.pret} lei → Preț redus: {(produs.pret * 0.6).toFixed(2)} lei
                                        </span>
                                    </div>
                                    <button 
                                        className="btn-aplica-oferta" 
                                        style={{ 
                                            backgroundColor: esteDupaOra20 ? '#4CAF50' : '#e0e0e0', 
                                            cursor: esteDupaOra20 ? 'pointer' : 'not-allowed',
                                            color: esteDupaOra20 ? 'white' : '#9e9e9e'
                                        }}
                                        disabled={!esteDupaOra20}
                                        onClick={async () => {
                                            if (!esteDupaOra20) return;
                                            try {
                                                await api.put(`/produse/${produs.id}/aplica-oferta`);
                                                fetchAlerte(); 
                                                fetchProduse(); 
                                                setSucces('Oferta de 40% a fost aplicată cu succes!');
                                                setTimeout(() => setSucces(''), 3000);
                                            } catch (err) {
                                                setEroare(err.response?.data?.mesaj || 'Eroare la aplicarea ofertei');
                                                setTimeout(() => setEroare(''), 3000);
                                            }
                                        }}
                                    >
                                        {esteDupaOra20 ? 'Aplică ofertă -40%' : '⏳ Așteaptă ora 20:00'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* LISTA PRODUSE */}
                <div className="produse-header-actions">
                    <h3 className="sectiune-titlu" style={{ margin: 0 }}>
                        {showExpired ? '📅 Produse expirate' : showUnavailable ? '🚫 Produse indisponibile' : `📦 Produsele tale (${produse.length})`}
                    </h3>
                    <div className="produse-buttons">
                        <button 
                            className={!showExpired && !showUnavailable ? 'btn-primar' : 'btn-secundar'}
                            onClick={() => { setShowExpired(false); setShowUnavailable(false); }}
                        >
                            Toate produsele ({produse.length})
                        </button>
                        <button 
                            className={showExpired ? 'btn-primar' : 'btn-secundar'}
                            onClick={() => { setShowExpired(true); setShowUnavailable(false); }}
                        >
                            ⚠️ Expirate ({produseExpirate.length})
                        </button>
                        <button 
                            className={showUnavailable ? 'btn-primar' : 'btn-secundar'}
                            onClick={() => { setShowExpired(false); setShowUnavailable(true); }}
                        >
                            🚫 Indisponibile ({produseIndisponibile.length})
                        </button>
                    </div>
                </div>

                {showExpired ? (
                    loadingExpired ? (
                        <p className="loading">Se încarcă produsele expirate...</p>
                    ) : produseExpirate.length === 0 ? (
                        <p className="gol">Nu ai produse expirate.</p>
                    ) : (
                        <div className="gp-lista">
                            {produseExpirate.map(produs => (
                                <div key={produs.id} className="gp-produs-card produs-expirat-card">
                                    {editareId === produs.id ? (
                                        /* MOD EDITARE - la fel ca în original */
                                        <div className="gp-editare">
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? (
                                                    <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} />
                                                ) : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-form gp-form-editare">
                                                <div className="form-group">
                                                    <label>Nume produs</label>
                                                    <input
                                                        type="text"
                                                        value={formEditare.numeProdus}
                                                        onChange={(e) => setFormEditare({ ...formEditare, numeProdus: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Descriere</label>
                                                    <input
                                                        type="text"
                                                        value={formEditare.descriere}
                                                        onChange={(e) => setFormEditare({ ...formEditare, descriere: e.target.value })}
                                                    />
                                                </div>
                                                <div className="gp-form-row">
                                                    <div className="form-group">
                                                        <label>Preț (lei)</label>
                                                        <input
                                                            type="number"
                                                            value={formEditare.pret}
                                                            onChange={(e) => setFormEditare({ ...formEditare, pret: e.target.value })}
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Stoc (bucăți)</label>
                                                        <input
                                                            type="number"
                                                            value={formEditare.stoc}
                                                            onChange={(e) => setFormEditare({ ...formEditare, stoc: e.target.value })}
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Dată expirare</label>
                                                        <input
                                                            type="date"
                                                            value={formEditare.data_expirare}
                                                            onChange={(e) => setFormEditare({ ...formEditare, data_expirare: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Categorie</label>
                                                        <select
                                                            value={formEditare.categorie}
                                                            onChange={(e) => setFormEditare({ ...formEditare, categorie: e.target.value })}
                                                        >
                                                            {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Disponibil</label>
                                                        <select
                                                            value={formEditare.disponibil}
                                                            onChange={(e) => setFormEditare({ ...formEditare, disponibil: parseInt(e.target.value) })}
                                                        >
                                                            <option value={1}>Da</option>
                                                            <option value={0}>Nu</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Transport recomandat</label>
                                                        <select
                                                            value={formEditare.transport_recomandat}
                                                            onChange={(e) => setFormEditare({ ...formEditare, transport_recomandat: e.target.value })}
                                                        >
                                                            <option value="bicicleta">🚲 Bicicletă / Trotinetă</option>
                                                            <option value="masina">🚗 Mașină Standard</option>
                                                            <option value="frigorific">❄️ Mașină Frigorifică</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {renderSectiuneIngrediente()}
                                                <div className="form-group">
                                                    <label>Imagine nouă (opțional)</label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        onChange={(e) => setImagineEditare(e.target.files[0])}
                                                    />
                                                </div>
                                                {formEditare.categorie === 'Torturi' && renderOptiuniDecor(produs)}
                                                <div className="gp-butoane-editare">
                                                    <button className="btn-primar" onClick={() => handleSalveazaEditare(produs.id)}>Salvează</button>
                                                    <button className="btn-secundar" onClick={() => setEditareId(-1)}>Anulează</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="gp-produs-vizualizare" style={{ flexWrap: 'wrap' }}>
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? (
                                                    <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} />
                                                ) : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-produs-info">
                                                <h4>{produs.numeProdus}</h4>
                                                <p className="produs-descriere">{produs.descriere}</p>
                                                <div className="gp-produs-meta">
                                                    <span className="produs-pret">{produs.pret} lei</span>
                                                    <span className="produs-categorie"><Tag size={14} /> {produs.categorie}</span>
                                                    <span className="badge-indisponibil"><X size={14} /> EXPIRAT</span>
                                                    <span><Package size={14} /> {produs.stoc} buc</span>
                                                    {produs.data_expirare && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d32f2f' }}>
                                                            <Calendar size={14} /> Expiră: {produs.data_expirare}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="gp-produs-actiuni">
                                                <button className="btn-editare" onClick={() => handleIncepeEditare(produs)}><Pencil size={16} /> Editează</button>
                                                <button className="btn-stergere" onClick={() => handleSterge(produs.id)}><Trash2 size={16} /> Șterge</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : showUnavailable ? (
                    loadingIndisponibile ? (
                        <p className="loading">Se încarcă produsele indisponibile...</p>
                    ) : produseIndisponibile.length === 0 ? (
                        <p className="gol">Nu ai produse indisponibile.</p>
                    ) : (
                        <div className="gp-lista">
                            {produseIndisponibile.map(produs => (
                                <div key={produs.id} className="gp-produs-card">
                                    {editareId === produs.id ? (
                                        /* Același mod editare ca mai sus */
                                        <div className="gp-editare">
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} /> : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-form gp-form-editare">
                                                <div className="form-group">
                                                    <label>Nume produs</label>
                                                    <input type="text" value={formEditare.numeProdus} onChange={(e) => setFormEditare({ ...formEditare, numeProdus: e.target.value })} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Descriere</label>
                                                    <input type="text" value={formEditare.descriere} onChange={(e) => setFormEditare({ ...formEditare, descriere: e.target.value })} />
                                                </div>
                                                <div className="gp-form-row">
                                                    <div className="form-group"><label>Preț (lei)</label><input type="number" value={formEditare.pret} onChange={(e) => setFormEditare({ ...formEditare, pret: e.target.value })} min="0" /></div>
                                                    <div className="form-group"><label>Stoc (bucăți)</label><input type="number" value={formEditare.stoc} onChange={(e) => setFormEditare({ ...formEditare, stoc: e.target.value })} min="0" /></div>
                                                    <div className="form-group"><label>Dată expirare</label><input type="date" value={formEditare.data_expirare} onChange={(e) => setFormEditare({ ...formEditare, data_expirare: e.target.value })} /></div>
                                                    <div className="form-group"><label>Categorie</label><select value={formEditare.categorie} onChange={(e) => setFormEditare({ ...formEditare, categorie: e.target.value })}>{CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                                    <div className="form-group"><label>Disponibil</label><select value={formEditare.disponibil} onChange={(e) => setFormEditare({ ...formEditare, disponibil: parseInt(e.target.value) })}><option value={1}>Da</option><option value={0}>Nu</option></select></div>
                                                    <div className="form-group"><label>Transport recomandat</label><select value={formEditare.transport_recomandat} onChange={(e) => setFormEditare({ ...formEditare, transport_recomandat: e.target.value })}><option value="bicicleta">🚲 Bicicletă / Trotinetă</option><option value="masina">🚗 Mașină Standard</option><option value="frigorific">❄️ Mașină Frigorifică</option></select></div>
                                                </div>
                                                {renderSectiuneIngrediente()}
                                                <div className="form-group"><label>Imagine nouă (opțional)</label><input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImagineEditare(e.target.files[0])} /></div>
                                                {formEditare.categorie === 'Torturi' && renderOptiuniDecor(produs)}
                                                <div className="gp-butoane-editare"><button className="btn-primar" onClick={() => handleSalveazaEditare(produs.id)}>Salvează</button><button className="btn-secundar" onClick={() => setEditareId(-1)}>Anulează</button></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="gp-produs-vizualizare" style={{ flexWrap: 'wrap' }}>
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} /> : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-produs-info">
                                                <h4>{produs.numeProdus}</h4>
                                                <p className="produs-descriere">{produs.descriere}</p>
                                                <div className="gp-produs-meta">
                                                    <span className="produs-pret">{produs.pret} lei</span>
                                                    <span className="produs-categorie"><Tag size={14} /> {produs.categorie}</span>
                                                    <span className="badge-indisponibil"><X size={14} /> INDISPONIBIL</span>
                                                    <span><Package size={14} /> {produs.stoc} buc</span>
                                                    {produs.data_expirare && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d32f2f' }}>
                                                            <Calendar size={14} /> Expiră: {produs.data_expirare}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="gp-produs-actiuni">
                                                <button className="btn-editare" onClick={() => handleIncepeEditare(produs)}><Pencil size={16} /> Editează</button>
                                                <button className="btn-stergere" onClick={() => handleSterge(produs.id)}><Trash2 size={16} /> Șterge</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    loading ? (
                        <p className="loading">Se încarcă...</p>
                    ) : produse.length === 0 ? (
                        <p className="gol">Nu ai adăugat niciun produs încă.</p>
                    ) : (
                        <div className="gp-lista">
                            {produse.map(produs => (
                                <div key={produs.id} className="gp-produs-card">
                                    {editareId === produs.id ? (
                                        /* MOD EDITARE - la fel ca în original */
                                        <div className="gp-editare">
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} /> : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-form gp-form-editare">
                                                {/* form editare identic cu cel de mai sus */}
                                                <div className="form-group"><label>Nume produs</label><input type="text" value={formEditare.numeProdus} onChange={(e) => setFormEditare({ ...formEditare, numeProdus: e.target.value })} /></div>
                                                <div className="form-group"><label>Descriere</label><input type="text" value={formEditare.descriere} onChange={(e) => setFormEditare({ ...formEditare, descriere: e.target.value })} /></div>
                                                <div className="gp-form-row">
                                                    <div className="form-group"><label>Preț (lei)</label><input type="number" value={formEditare.pret} onChange={(e) => setFormEditare({ ...formEditare, pret: e.target.value })} min="0" /></div>
                                                    <div className="form-group"><label>Stoc (bucăți)</label><input type="number" value={formEditare.stoc} onChange={(e) => setFormEditare({ ...formEditare, stoc: e.target.value })} min="0" /></div>
                                                    <div className="form-group"><label>Dată expirare</label><input type="date" value={formEditare.data_expirare} onChange={(e) => setFormEditare({ ...formEditare, data_expirare: e.target.value })} /></div>
                                                    <div className="form-group"><label>Categorie</label><select value={formEditare.categorie} onChange={(e) => setFormEditare({ ...formEditare, categorie: e.target.value })}>{CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                                    <div className="form-group"><label>Disponibil</label><select value={formEditare.disponibil} onChange={(e) => setFormEditare({ ...formEditare, disponibil: parseInt(e.target.value) })}><option value={1}>Da</option><option value={0}>Nu</option></select></div>
                                                    <div className="form-group"><label>Transport recomandat</label><select value={formEditare.transport_recomandat} onChange={(e) => setFormEditare({ ...formEditare, transport_recomandat: e.target.value })}><option value="bicicleta">🚲 Bicicletă / Trotinetă</option><option value="masina">🚗 Mașină Standard</option><option value="frigorific">❄️ Mașină Frigorifică</option></select></div>
                                                </div>
                                                {renderSectiuneIngrediente()}
                                                <div className="form-group"><label>Imagine nouă (opțional)</label><input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImagineEditare(e.target.files[0])} /></div>
                                                {formEditare.categorie === 'Torturi' && renderOptiuniDecor(produs)}
                                                <div className="gp-butoane-editare"><button className="btn-primar" onClick={() => handleSalveazaEditare(produs.id)}>Salvează</button><button className="btn-secundar" onClick={() => setEditareId(-1)}>Anulează</button></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="gp-produs-vizualizare" style={{ flexWrap: 'wrap' }}>
                                            <div className="gp-produs-imagine">
                                                {produs.imagine ? <img src={`https://sweetgoapp.onrender.com/${produs.imagine}`} alt={produs.numeProdus} /> : <Cake size={48} color="#c97c2e" strokeWidth={1.5} />}
                                            </div>
                                            <div className="gp-produs-info">
                                                <h4>{produs.numeProdus}</h4>
                                                <p className="produs-descriere">{produs.descriere}</p>
                                                {produs.ingrediente && produs.ingrediente.length > 0 && (
                                                    <div style={{ margin: '8px 0', fontSize: '0.85rem', color: '#7a5230' }}>
                                                        <strong>Ingrediente:</strong> {produs.ingrediente.map(i => i.nume).join(', ')}
                                                    </div>
                                                )}
                                                <div className="gp-produs-meta">
                                                    <span className="produs-pret">{produs.pret} lei</span>
                                                    <span className="produs-categorie"><Tag size={14} /> {produs.categorie}</span>
                                                    <span className={produs.disponibil ? 'badge-disponibil' : 'badge-indisponibil'}>
                                                        {produs.disponibil ? <><Check size={14} /> Disponibil</> : <><X size={14} /> Indisponibil</>}
                                                    </span>
                                                    <span><Package size={14} /> {produs.stoc} buc</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {produs.transport_recomandat === 'bicicleta' && <><Bike size={14} /> Bicicletă</>}
                                                        {produs.transport_recomandat === 'masina' && <><Car size={14} /> Mașină</>}
                                                        {produs.transport_recomandat === 'frigorific' && <><Snowflake size={14} /> Frigorific</>}
                                                    </span>
                                                    {produs.data_expirare && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d32f2f' }}>
                                                            <Calendar size={14} /> Expiră: {produs.data_expirare}
                                                        </span>
                                                    )}
                                                    {produs.este_la_oferta === 1 && (
                                                        <span className="badge-oferta" style={{margin: '0'}}>La Ofertă (-40%)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="gp-produs-actiuni">
                                                <button className="btn-editare" onClick={() => handleIncepeEditare(produs)}><Pencil size={16} /> Editează</button>
                                                <button className="btn-stergere" onClick={() => handleSterge(produs.id)}><Trash2 size={16} /> Șterge</button>
                                            </div>
                                            {produs.categorie === 'Torturi' && renderOptiuniDecor(produs)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export default GestionareProduse