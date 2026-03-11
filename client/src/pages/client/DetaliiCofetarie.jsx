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

    // initializam cosul din localStorage
    const [cos, setCos] = useState(() => {
        const cosSalvat = localStorage.getItem('cos')
        return cosSalvat ? JSON.parse(cosSalvat) : { cofetarie_id: null, produse: [] }
    })

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

    // salveaza cosul in localStorage de fiecare data cand se schimba
    useEffect(() => {
        localStorage.setItem('cos', JSON.stringify(cos))
    }, [cos])

    const adaugaInCos = (produs) => {
        // daca cosul are produse din alta cofetarie, avertizam userul
        if (cos.cofetarie_id && cos.cofetarie_id !== id) {
            const confirmare = window.confirm(
                'Ai produse din altă cofetărie în coș. Vrei să golești coșul și să adaugi din această cofetărie?'
            )
            if (!confirmare) return
            // golim cosul si adaugam produsul nou
            setCos({
                cofetarie_id: id,
                produse: [{ ...produs, cantitate: 1 }]
            })
            return
        }

        // verificam daca produsul e deja in cos
        const produseActualizate = [...cos.produse]
        const indexExistent = produseActualizate.findIndex(p => p.id === produs.id)

        if (indexExistent >= 0) {
            // daca exista, crestem cantitatea
            produseActualizate[indexExistent].cantitate += 1
        } else {
            // daca nu exista, il adaugam cu cantitatea 1
            produseActualizate.push({ ...produs, cantitate: 1 })
        }

        setCos({ cofetarie_id: id, produse: produseActualizate })
    }

    const scadeInCos = (produs) => {
        const produseActualizate = [...cos.produse]
        const indexExistent = produseActualizate.findIndex(p => p.id === produs.id)

        if (indexExistent >= 0) {
            if (produseActualizate[indexExistent].cantitate === 1) {
                // daca cantitatea e 1, scoatem produsul din cos
                produseActualizate.splice(indexExistent, 1)
            } else {
                // altfel scadem cantitatea
                produseActualizate[indexExistent].cantitate -= 1
            }
        }

        // daca nu mai sunt produse, resetam si cofetaria din cos
        setCos({
            cofetarie_id: produseActualizate.length > 0 ? id : null,
            produse: produseActualizate
        })
    }

    // returneaza cantitatea unui produs din cos
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
            {/* NAVBAR */}
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
                {/* HEADER COFETARIE */}
                <button className="btn-inapoi" onClick={() => navigate('/')}>← Înapoi</button>

                <div className="cofetarie-detalii-header">
                {/* poza de coperta a cofetariei */}
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

                {/* PRODUSE */}
                <h3 className="sectiune-titlu">Produse disponibile</h3>
                {produse.length === 0 ? (
                    <p className="gol">Această cofetărie nu are produse disponibile momentan.</p>
                ) : (
                    <div className="produse-grid">
                        {produse.map(produs => (
                            <div key={produs.id} className="produs-card">
                                <div className="produs-card-imagine">
                                    {produs.imagine ? (
                                        <img src={`http://localhost:7000/${produs.imagine}`} alt={produs.numeProdus} />
                                    ) : (
                                        <span>🎂</span>
                                    )}
                                </div>
                                <div className="produs-card-info">
                                    <h4>{produs.numeProdus}</h4>
                                    <p className="produs-descriere">{produs.descriere}</p>
                                    <p className="produs-categorie">📌 {produs.categorie}</p>
                                    <div className="produs-footer">
                                        <span className="produs-pret">{produs.pret} lei</span>

                                        {/* butoane plus/minus */}
                                        {cantitateDinCos(produs.id) === 0 ? (
                                            <button
                                                className="btn-adauga-cos"
                                                onClick={() => adaugaInCos(produs)}
                                            >
                                                + Adaugă
                                            </button>
                                        ) : (
                                            <div className="cantitate-control">
                                                <button onClick={() => scadeInCos(produs)}>−</button>
                                                <span>{cantitateDinCos(produs.id)}</span>
                                                <button onClick={() => adaugaInCos(produs)}>+</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DetaliiCofetarie