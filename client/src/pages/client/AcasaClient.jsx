import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, ShoppingCart, MapPin, Star, MessageSquare, X, Calendar } from 'lucide-react'

function AcasaClient(){
    const [cofetarii, setCofetarii] = useState([])
    const [cautare, setCautare] = useState('')
    const [loading, setLoading] = useState(true)
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    // State pentru vizualizare recenzii
    const [modalRecenzii, setModalRecenzii] = useState(null) // { id, nume, listaRecenzii }
    const [loadingRecenzii, setLoadingRecenzii] = useState(false)

    useEffect(() => {
        const fetchCofetarii = async () => {
            try {
                const raspuns = await api.get('/cofetarii')
                setCofetarii(raspuns.data)
            } catch(err){
                console.error('Eroare la incarcarea cofetariilor',err)
            } finally {
                setLoading(false)
            }
        }
        fetchCofetarii()
    }, [])

    const deschideRecenzii = async (e, cofetarie) => {
        e.stopPropagation(); // Previne navigarea catre pagina cofetariei
        setLoadingRecenzii(true);
        setModalRecenzii({ id: cofetarie.id, nume: cofetarie.numeCofetarie, lista: [] });
        
        try {
            const raspuns = await api.get(`/cofetarii/${cofetarie.id}/toate-recenziile`);
            setModalRecenzii(prev => ({ ...prev, lista: raspuns.data }));
        } catch (err) {
            console.error("Eroare la incarcarea recenziilor");
        } finally {
            setLoadingRecenzii(false);
        }
    };

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const renderStele = (rating, size = 14) => {
        const stele = rating ? Math.round(rating) : 0
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={size} 
                fill={i < stele ? "#c97c2e" : "transparent"} 
                color={i < stele ? "#c97c2e" : "#ccc"} 
            />
        ))
    }

    return (
        <div className="acasa-container">
            <nav className="navbar">
                <h1 className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    SweetGo 🍰
                </h1>
                <div className="navbar-search">
                    <input
                        type="text"
                        placeholder="Caută cofetărie..."
                        value={cautare}
                        onChange={(e) => setCautare(e.target.value)}
                    />
                </div>
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/comenzile-mele')}>Comenzile mele</button>
                    <button onClick={() => navigate('/cos-cumparaturi')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🛒 Coș
                    </button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            <div className="acasa-continut">
                <h2>Cofetării disponibile</h2>

                <div className="cofetarii-grid">
                    {cofetarii.filter(c => c.numeCofetarie.toLowerCase().includes(cautare.toLowerCase())).map(cofetarie => (
                        <div key={cofetarie.id} className="cofetarie-card" onClick={() => navigate(`/cofetarie/${cofetarie.id}`)}>
                            <div className="cofetarie-card-imagine">
                                {cofetarie.imagine_coperta ? (
                                    <img src={`http://localhost:7000/${cofetarie.imagine_coperta}`} alt={cofetarie.numeCofetarie} />
                                ) : (
                                    <Cake size={48} color="#c97c2e" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="cofetarie-card-info">
                                <h3>{cofetarie.numeCofetarie}</h3>
                                <p className="adresa" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={16} /> {cofetarie.adresa}
                                </p>
                                <div className="rating">
                                    <span className="stele" style={{ display: 'flex', gap: '2px' }}>
                                        {renderStele(cofetarie.rating_mediu)}
                                    </span>
                                    {/* Click aici deschide modalul */}
                                    <span 
                                        className="numar-recenzii" 
                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={(e) => deschideRecenzii(e, cofetarie)}
                                    >
                                        {cofetarie.numar_recenzii > 0 ? `(${cofetarie.numar_recenzii} recenzii)` : '(fără recenzii)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL VIZUALIZARE RECENZII */}
            {modalRecenzii && (
                <div className="modal-overlay" onClick={() => setModalRecenzii(null)}>
                    <div className="modal-continut" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="modal-inchide" onClick={() => setModalRecenzii(null)}><X size={20} /></button>
                        <h3 className="modal-titlu" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                            <MessageSquare size={24} color="#c97c2e" /> Recenzii {modalRecenzii.nume}
                        </h3>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
                            {loadingRecenzii ? (
                                <p style={{ textAlign: 'center' }}>Se încarcă recenziile...</p>
                            ) : modalRecenzii.lista.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#9a7a5a' }}>Nu există încă recenzii scrise.</p>
                            ) : (
                                modalRecenzii.lista.map(r => (
                                    <div key={r.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <strong style={{ color: '#3d2c1e' }}>{r.numeClient}</strong>
                                            <div style={{ display: 'flex' }}>{renderStele(r.rating, 12)}</div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#7a5230' }}>"{r.comentariu || 'Fără comentariu'}"</p>
                                        <small style={{ color: '#9a7a5a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                                            <Calendar size={12} /> {new Date(r.creat_la + 'Z').toLocaleDateString('ro-RO')}
                                        </small>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default AcasaClient