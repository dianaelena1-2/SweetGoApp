import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'

const CATEGORII = ['Torturi', 'Prăjituri', 'Macarons', 'Cupcakes', 'Croissante']

const produsGol = {
    numeProdus: '',
    descriere: '',
    pret: '',
    stoc: '',
    categorie: 'Torturi',
    disponibil: 1
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

    useEffect(() => {
        fetchProduse()
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
            if (imagineNoua) data.append('imagine', imagineNoua)

            await api.post('/produse', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setFormNou(produsGol)
            setImagineNoua(null)
            afiseazaSucces('Produs adăugat cu succes!')
            fetchProduse()
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la adăugarea produsului')
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
            disponibil: produs.disponibil
        })
        setImagineEditare(null)
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
            if (imagineEditare) data.append('imagine', imagineEditare)

            await api.put(`/produse/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setEditareId(-1)
            afiseazaSucces('Produs actualizat cu succes!')
            fetchProduse()
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
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la ștergerea produsului')
        }
    }

    return (
        <div className="acasa-container">
            {/* NAVBAR */}
            <nav className="navbar">
                <h1 className="navbar-logo" onClick={() => navigate('/cofetarie/dashboard')} style={{ cursor: 'pointer' }}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-actiuni">
                    <span>{utilizator?.nume}</span>
                    <button onClick={() => navigate('/cofetarie/dashboard')}>Dashboard</button>
                    <button onClick={() => navigate('/cofetarie/comenzi')}>Comenzi</button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Gestionare Produse</h2>

                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                {/* FORMULAR ADAUGARE PRODUS NOU */}
                <div className="gp-card">
                    <h3 className="gp-card-titlu">➕ Adaugă produs nou</h3>
                    <div className="gp-form">
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
                        </div>
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

                {/* LISTA PRODUSE */}
                <h3 className="sectiune-titlu">Produsele tale ({produse.length})</h3>

                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : produse.length === 0 ? (
                    <p className="gol">Nu ai adăugat niciun produs încă.</p>
                ) : (
                    <div className="gp-lista">
                        {produse.map(produs => (
                            <div key={produs.id} className="gp-produs-card">
                                {editareId === produs.id ? (
                                    /* MOD EDITARE */
                                    <div className="gp-editare">
                                        <div className="gp-produs-imagine">
                                            {produs.imagine ? (
                                                <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                            ) : <span>🎂</span>}
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
                                            </div>
                                            <div className="form-group">
                                                <label>Imagine nouă (opțional)</label>
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={(e) => setImagineEditare(e.target.files[0])}
                                                />
                                            </div>
                                            <div className="gp-butoane-editare">
                                                <button className="btn-primar" onClick={() => handleSalveazaEditare(produs.id)}>
                                                    Salvează
                                                </button>
                                                <button className="btn-secundar" onClick={() => setEditareId(-1)}>
                                                    Anulează
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* MOD VIZUALIZARE */
                                    <div className="gp-produs-vizualizare">
                                        <div className="gp-produs-imagine">
                                            {produs.imagine ? (
                                                <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                            ) : <span>🎂</span>}
                                        </div>
                                        <div className="gp-produs-info">
                                            <h4>{produs.numeProdus}</h4>
                                            <p className="produs-descriere">{produs.descriere}</p>
                                            <div className="gp-produs-meta">
                                                <span className="produs-pret">{produs.pret} lei</span>
                                                <span className="produs-categorie">📌 {produs.categorie}</span>
                                                <span className={produs.disponibil ? 'badge-disponibil' : 'badge-indisponibil'}>
                                                    {produs.disponibil ? '✓ Disponibil' : '✗ Indisponibil'}
                                                </span>
                                                <span>📦 {produs.stoc} buc</span>
                                            </div>
                                        </div>
                                        <div className="gp-produs-actiuni">
                                            <button className="btn-editare" onClick={() => handleIncepeEditare(produs)}>
                                                ✏️ Editează
                                            </button>
                                            <button className="btn-stergere" onClick={() => handleSterge(produs.id)}>
                                                🗑️ Șterge
                                            </button>
                                        </div>
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

export default GestionareProduse