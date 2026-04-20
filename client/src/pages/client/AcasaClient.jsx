import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, ShoppingCart, MapPin, Star, MessageSquare, X, Calendar } from 'lucide-react'
import NotificationBell from '../../components/NotificationBell';
import NavbarClient from '../../components/NavbarClient';

function AcasaClient(){
    const [cofetarii, setCofetarii] = useState([])
    const [cautare, setCautare] = useState('')
    const [loading, setLoading] = useState(true)
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [modalRecenzii, setModalRecenzii] = useState(null)
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

    const cofetariiFiltrate = cofetarii.filter(c => 
        c.numeCofetarie.toLowerCase().includes(cautare.toLowerCase())
    );

    const deschideRecenzii = async (e, cofetarie) => {
        e.stopPropagation();
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
           <NavbarClient 
                utilizator={utilizator}
                logout={logout}
                searchValue={cautare}
                onSearchChange={setCautare}
                showSearch={true}
            />

            <div className="acasa-continut">
                <h2>Cofetării disponibile</h2>

                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : cofetariiFiltrate.length > 0 ? (
                    <div className="cofetarii-grid">
                        {cofetariiFiltrate.map(cofetarie => (
                            <div key={cofetarie.id} className="cofetarie-card" onClick={() => navigate(`/cofetarie/${cofetarie.id}`)}>
                                <div className="cofetarie-card-imagine">
                                    {cofetarie.imagine_coperta ? (
                                        <img src={`https://sweetgoapp.onrender.com//${cofetarie.imagine_coperta}`} alt={cofetarie.numeCofetarie} />
                                    ) : (
                                        <Cake size={48} color="#c97c2e" strokeWidth={1.5} />
                                    )}
                                </div>
                                <div className="cofetarie-card-info">
                                    <h3>{cofetarie.numeCofetarie}</h3>
                                    <p className="adresa">
                                        <MapPin size={16} /> {cofetarie.adresa}
                                    </p>
                                    <div className="rating">
                                        <span className="stele">
                                            {renderStele(cofetarie.rating_mediu)}
                                        </span>
                                        <span 
                                            className="numar-recenzii numar-recenzii-link" 
                                            onClick={(e) => deschideRecenzii(e, cofetarie)}
                                        >
                                            {cofetarie.numar_recenzii > 0 ? `(${cofetarie.numar_recenzii} recenzii)` : '(fără recenzii)'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cautare-fara-rezultat">
                        <p>Nu am găsit nicio cofetărie cu numele "<strong>{cautare}</strong>".</p>
                    </div>
                )}
            </div>

            {/* MODAL VIZUALIZARE RECENZII */}
            {modalRecenzii && (
                <div className="modal-overlay" onClick={() => setModalRecenzii(null)}>
                    <div className="modal-continut modal-recenzii" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-inchide" onClick={() => setModalRecenzii(null)}><X size={20} /></button>
                        <h3 className="modal-titlu">
                            <MessageSquare size={24} color="#c97c2e" /> Recenzii {modalRecenzii.nume}
                        </h3>

                        <div className="modal-scroll-container">
                            {loadingRecenzii ? (
                                <p className="text-centrat">Se încarcă recenziile...</p>
                            ) : modalRecenzii.lista.length === 0 ? (
                                <p className="text-gol">Nu există încă recenzii scrise.</p>
                            ) : (
                                modalRecenzii.lista.map(r => (
                                    <div key={r.id} className="recenzie-item">
                                        <div className="recenzie-header">
                                            <strong className="recenzie-autor">{r.numeClient}</strong>
                                            <div className="recenzie-stele">{renderStele(r.rating, 12)}</div>
                                        </div>
                                        <p className="recenzie-comentariu">"{r.comentariu || 'Fără comentariu'}"</p>
                                        <small className="recenzie-data">
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