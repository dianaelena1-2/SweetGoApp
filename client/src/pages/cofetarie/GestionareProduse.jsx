import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Cake, Pencil, Trash2, Camera, Plus, Save } from 'lucide-react'
import api from '../../services/api'
import SidebarCofetarie from '../../components/SidebarCofetarie';

const CATEGORII = ['Torturi', 'Prăjituri', 'Macarons', 'Cupcakes', 'Croissante', 'Cozonaci']

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
    const { utilizator } = useContext(AuthContext)
    const navigate = useNavigate()

    const [produse, setProduse] = useState([])
    const [loading, setLoading] = useState(true)
    const [eroare, setEroare] = useState('')
    const [succes, setSucces] = useState('')

    const [formNou, setFormNou] = useState(produsGol)
    const [imagineNoua, setImagineNoua] = useState(null)
    const [previewNou, setPreviewNou] = useState(null)
    const [imagineExistenta, setImagineExistenta] = useState(null) 

    const [editareId, setEditareId] = useState(-1)
    const fileInputRef = useRef(null);

    const [ingredienteSelectate, setIngredienteSelectate] = useState([])
    const [toateIngredientele, setToateIngredientele] = useState([])
    const [numeIngredientNou, setNumeIngredientNou] = useState('')

    const [optiuniDecor, setOptiuniDecor] = useState([])
    const [numeOptiuneNoua, setNumeOptiuneNoua] = useState('')

    const [showExpired, setShowExpired] = useState(false)
    const [showUnavailable, setShowUnavailable] = useState(false)
    const [produseExpirate, setProduseExpirate] = useState([])
    const [produseIndisponibile, setProduseIndisponibile] = useState([])

    useEffect(() => {
        fetchProduse()
        fetchProduseExpirate()
        fetchProduseIndisponibile()
        fetchIngredienteGlobale()
    }, [])

    useEffect(() => {
        if (!imagineNoua) {
            setPreviewNou(null)
            return
        }
        const objectUrl = URL.createObjectURL(imagineNoua)
        setPreviewNou(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [imagineNoua])

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

    const fetchProduseExpirate = async () => {
        try {
            const raspuns = await api.get('/produse/expirate')
            setProduseExpirate(raspuns.data)
        } catch (err) {}
    }

    const fetchProduseIndisponibile = async () => {
        try {
            const raspuns = await api.get('/produse/indisponibile')
            setProduseIndisponibile(raspuns.data)
        } catch (err) {}
    }

    const afiseazaSucces = (mesaj) => {
        setSucces(mesaj)
        setTimeout(() => setSucces(''), 3000)
    }

    const handleAdaugaIngredient = () => {
        const nume = numeIngredientNou.trim()
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

    const toggleIngredientSelectie = (nume) => {
        if (ingredienteSelectate.includes(nume)) {
            setIngredienteSelectate(ingredienteSelectate.filter(ing => ing !== nume));
        } else {
            setIngredienteSelectate([...ingredienteSelectate, nume]);
        }
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

    const resetFormularAdaugare = () => {
        setFormNou(produsGol)
        setImagineNoua(null)
        setImagineExistenta(null)
        setIngredienteSelectate([])
        setOptiuniDecor([])
        setEditareId(-1)
        if(fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSalveazaProdus = async () => {
        setEroare('')
        if (!formNou.numeProdus || !formNou.pret) {
            setEroare('Numele și prețul sunt obligatorii')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        try {
            const data = new FormData()
            data.append('numeProdus', formNou.numeProdus)
            data.append('descriere', formNou.descriere)
            data.append('pret', formNou.pret)
            data.append('categorie', formNou.categorie)
            data.append('stoc', formNou.stoc || 0)
            data.append('disponibil', formNou.disponibil === 1 || formNou.disponibil === '1')
            data.append('transport_recomandat', formNou.transport_recomandat)
            if (formNou.data_expirare) data.append('data_expirare', formNou.data_expirare)
            data.append('ingredienteAlese', JSON.stringify(ingredienteSelectate))
            data.append('optiuni_decor', JSON.stringify(optiuniDecor))
            
            if (imagineNoua) data.append('imagine', imagineNoua)

            if (editareId === -1) {
                await api.post('/produse', data, { headers: { 'Content-Type': 'multipart/form-data' } })
                afiseazaSucces('Produs adăugat cu succes!')
            } else {
                await api.put(`/produse/${editareId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
                afiseazaSucces('Produs actualizat cu succes!')
            }
            
            resetFormularAdaugare()
            fetchProduse()
            fetchProduseExpirate()
            fetchProduseIndisponibile()
            fetchIngredienteGlobale()
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la salvarea produsului')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleIncepeEditare = (produs) => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setEditareId(produs._id)
        setFormNou({
            numeProdus: produs.numeProdus,
            descriere: produs.descriere || '',
            pret: produs.pret,
            categorie: produs.categorie || 'Torturi',
            stoc: produs.stoc || 0,
            disponibil: produs.disponibil ? 1 : 0,
            transport_recomandat: produs.transport_recomandat || 'masina',
            data_expirare: produs.data_expirare ? produs.data_expirare.split('T')[0] : ''
        })
        setImagineNoua(null)
        setImagineExistenta(produs.imagine)
        setIngredienteSelectate(produs.ingrediente || [])
        setOptiuniDecor(produs.optiuni_decor || [])
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

    const getImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `https://sweetgoapp.onrender.com/${img}`;
    }

    const toateOptiunileIngrediente = [...new Set([...toateIngredientele, ...ingredienteSelectate])].sort();

    if (loading) return <div className="cd-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se încarcă inventarul...</p></div>

    return (
        <div className="cd-layout">
            <SidebarCofetarie />

            <main className="cd-main">
                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                <div className="gp-modern-card">
                    <div className="gp-header-flex">
                        <div className="gp-header-titles">
                            <h3>{editareId === -1 ? 'Adaugă produs nou' : 'Editează produsul'}</h3>
                            <p>{editareId === -1 ? 'Introdu detaliile noului produs pentru a-l afișa în catalog.' : 'Modifică detaliile produsului selectat.'}</p>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                            {editareId !== -1 && (
                                <button className="btn-secundar" style={{borderRadius: '12px', padding: '0.7rem 1.4rem'}} onClick={resetFormularAdaugare}>Anulează</button>
                            )}
                            <button className="btn-salveaza-red" onClick={handleSalveazaProdus}>
                                <Save size={18} /> {editareId === -1 ? 'Salvează Produsul' : 'Actualizează Produsul'}
                            </button>
                        </div>
                    </div>

                    <div className="gp-form-split">
                        <div>
                            <label className="gp-label">Imagine produs</label>
                            <input 
                                type="file" 
                                accept=".jpg,.jpeg,.png" 
                                ref={fileInputRef}
                                onChange={(e) => setImagineNoua(e.target.files[0])} 
                                style={{ display: 'none' }} 
                            />
                            <div className="gp-img-upload" onClick={() => fileInputRef.current.click()}>
                                {previewNou ? (
                                    <img src={previewNou} alt="Preview nou" />
                                ) : imagineExistenta ? (
                                    <img src={getImageUrl(imagineExistenta)} alt="Imagine existenta" />
                                ) : (
                                    <>
                                        <Camera size={36} color="#e74c3c" style={{marginBottom: '10px'}} />
                                        <span style={{fontSize: '0.85rem', color: '#9a7a5a'}}>Click pentru a încărca (PNG, JPG)</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                            <div>
                                <label className="gp-label">Nume produs</label>
                                <input type="text" className="gp-input-modern" value={formNou.numeProdus} onChange={(e) => setFormNou({ ...formNou, numeProdus: e.target.value })} placeholder="ex: Tort Entremet cu Zmeură" />
                            </div>

                            <div>
                                <label className="gp-label">Descriere</label>
                                <textarea className="gp-input-modern" rows="3" value={formNou.descriere} onChange={(e) => setFormNou({ ...formNou, descriere: e.target.value })} placeholder="Descrie aromele, texturile și povestea acestui produs..."></textarea>
                            </div>

                            <div className="gp-grid-2col">
                                <div>
                                    <label className="gp-label">Preț (lei)</label>
                                    <input type="number" className="gp-input-modern" value={formNou.pret} onChange={(e) => setFormNou({ ...formNou, pret: e.target.value })} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="gp-label">Stoc (bucăți)</label>
                                    <input 
                                        type="number" 
                                        className="gp-input-modern" 
                                        value={formNou.stoc} 
                                        onChange={(e) => {
                                            const stocNou = e.target.value;
                                            setFormNou({ 
                                                ...formNou, 
                                                stoc: stocNou,
                                                disponibil: parseInt(stocNou) > 0 ? 1 : 0 
                                            })
                                        }} 
                                        placeholder="0" 
                                    />
                                </div>
                                <div>
                                    <label className="gp-label">Dată expirare</label>
                                    <input type="date" className="gp-input-modern" value={formNou.data_expirare} onChange={(e) => setFormNou({ ...formNou, data_expirare: e.target.value })} />
                                </div>
                                <div>
                                    <label className="gp-label">Categorie</label>
                                    <select className="gp-input-modern" value={formNou.categorie} onChange={(e) => setFormNou({ ...formNou, categorie: e.target.value })}>
                                        {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="gp-label">Disponibil</label>
                                    <select className="gp-input-modern" value={formNou.disponibil} onChange={(e) => setFormNou({ ...formNou, disponibil: parseInt(e.target.value) })}>
                                        <option value={1}>Imediat (În stoc)</option>
                                        <option value={0}>Indisponibil temporar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="gp-label">Transport recomandat</label>
                                    <select className="gp-input-modern" value={formNou.transport_recomandat} onChange={(e) => setFormNou({ ...formNou, transport_recomandat: e.target.value })}>
                                        <option value="bicicleta">🚲 Bicicletă / Trotinetă</option>
                                        <option value="masina">🚗 Mașină Standard</option>
                                        <option value="frigorific">❄️ Mașină Frigorifică</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="gp-label">Ingrediente produs (Bifează din listă sau adaugă altele noi)</label>
                                
                                {toateOptiunileIngrediente.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', padding: '10px', background: '#fdfaf6', borderRadius: '12px', border: '1px solid #f5eadd', maxHeight: '140px', overflowY: 'auto' }}>
                                        {toateOptiunileIngrediente.map((ing, idx) => {
                                            const isSelected = ingredienteSelectate.includes(ing);
                                            return (
                                                <span 
                                                    key={idx} 
                                                    className="gp-tag-modern"
                                                    onClick={() => toggleIngredientSelectie(ing)}
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        background: isSelected ? '#fff5f5' : 'white',
                                                        color: isSelected ? '#c0392b' : '#7a5230',
                                                        borderColor: isSelected ? '#fad4cc' : '#e0e0e0',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {ing} {isSelected && <span style={{marginLeft: '4px', fontSize: '1.1rem', lineHeight: '1'}}>✕</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="gp-add-ingredient-wrapper">
                                    <input 
                                        type="text" className="gp-input-modern" 
                                        placeholder="Tastează și apasă + pentru a adăuga ingredient nou..." 
                                        value={numeIngredientNou} onChange={(e) => setNumeIngredientNou(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdaugaIngredient(); } }}
                                    />
                                    <button type="button" className="btn-add-icon" onClick={handleAdaugaIngredient}><Plus size={20}/></button>
                                </div>
                            </div>

                            {formNou.categorie.includes('Tort') && (
                                <div>
                                    <label className="gp-label">Opțiuni decor</label>
                                    {optiuniDecor.length > 0 && (
                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px'}}>
                                            {optiuniDecor.map((opt, idx) => (
                                                <span key={idx} className="gp-tag-modern" style={{background: '#fdfaf6', color: '#7a5230', borderColor: '#f5eadd'}}>
                                                    {opt} <button type="button" onClick={() => stergeOptiune(opt)} style={{color: '#7a5230'}}>✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="gp-add-ingredient-wrapper">
                                        <input 
                                            type="text" className="gp-input-modern" 
                                            placeholder="ex: Mesaj personalizat, Plăcuță aniversară" 
                                            value={numeOptiuneNoua} onChange={(e) => setNumeOptiuneNoua(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adaugaOptiune(); } }}
                                        />
                                        <button type="button" className="btn-add-icon" onClick={adaugaOptiune}><Plus size={20}/></button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                <div className="gp-header-flex" style={{alignItems: 'center', marginBottom: '1.5rem'}}>
                    <div className="gp-header-titles">
                        <h3>Produsele tale</h3>
                        <p>Monitorizează stocurile și actualizează oferta curentă.</p>
                    </div>
                    <div className="gp-tabs-modern">
                        <button className={`gp-tab-btn ${!showExpired && !showUnavailable ? 'activ' : ''}`} onClick={() => { setShowExpired(false); setShowUnavailable(false); }}>
                            Toate ({produse.length})
                        </button>
                        <button className={`gp-tab-btn ${showExpired ? 'activ' : ''}`} onClick={() => { setShowExpired(true); setShowUnavailable(false); }}>
                            Expirate ({produseExpirate.length})
                        </button>
                        <button className={`gp-tab-btn ${showUnavailable ? 'activ' : ''}`} onClick={() => { setShowExpired(false); setShowUnavailable(true); }}>
                            Indisponibile ({produseIndisponibile.length})
                        </button>
                    </div>
                </div>

                <div className="gp-modern-grid">
                    {(showExpired ? produseExpirate : showUnavailable ? produseIndisponibile : produse).map(produs => (
                        <div key={produs._id} className="gp-prod-card">
                            
                            <div className="gp-prod-img-wrapper">
                                {produs.este_la_oferta && <span className="gp-badge-oferta">OFERTĂ -40%</span>}
                                {produs.imagine ? (
                                    <img src={getImageUrl(produs.imagine)} alt={produs.numeProdus} />
                                ) : (
                                    <Cake size={40} color="#c97c2e" />
                                )}
                            </div>

                            <div className="gp-prod-content">
                                <div>
                                    <h4 className="gp-prod-title" title={produs.numeProdus}>{produs.numeProdus}</h4>
                                    <p className="gp-prod-desc">{produs.descriere || 'Fără descriere adăugată.'}</p>
                                    
                                    {produs.ingrediente && produs.ingrediente.length > 0 && (
                                        <div className="gp-prod-tags">
                                            {produs.ingrediente.slice(0, 3).map((ing, i) => (
                                                <span key={i} className="gp-mini-tag">{ing}</span>
                                            ))}
                                            {produs.ingrediente.length > 3 && <span className="gp-mini-tag">+{produs.ingrediente.length - 3}</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="gp-prod-footer">
                                    <div className="gp-prod-price-box">
                                        <span className="gp-price-label">Preț/Stoc</span>
                                        <span className="gp-price-val">
                                            {produs.pret} lei <span>/ {produs.stoc} buc</span>
                                        </span>
                                    </div>
                                    
                                    <span className={`gp-status-badge ${produs.disponibil ? 'disponibil' : 'indisponibil'}`}>
                                        {produs.disponibil ? 'DISPONIBIL' : 'INDISPONIBIL'}
                                    </span>
                                </div>
                            </div>

                            <div className="gp-actions-top">
                                <button className="gp-action-btn edit" onClick={() => handleIncepeEditare(produs)} title="Editează">
                                    <Pencil size={14} />
                                </button>
                                <button className="gp-action-btn delete" onClick={() => handleSterge(produs._id)} title="Șterge">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>

            </main>
        </div>
    )
}

export default GestionareProduse