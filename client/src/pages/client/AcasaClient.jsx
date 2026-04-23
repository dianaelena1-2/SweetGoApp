import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, MapPin, Star, MessageSquare, X, Calendar, Search, ChevronDown, SlidersHorizontal } from 'lucide-react'
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
        setModalRecenzii({ _id: cofetarie._id, nume: cofetarie.numeCofetarie, lista: [] });
        
        try {
            const raspuns = await api.get(`/cofetarii/${cofetarie._id}/toate-recenziile`);
            setModalRecenzii(prev => ({ ...prev, lista: raspuns.data }));
        } catch (err) {
            console.error("Eroare la incarcarea recenziilor");
        } finally {
            setLoadingRecenzii(false);
        }
    };

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
                showSearch={true} /* Ascundem search-ul din navbar, il avem mai mare in pagina acum */
            />

            <div className="acasa-continut">
                
                {/* === NOUL HEADER & BARĂ DE FILTRARE (Asemanator cu designul trimis) === */}
                <div className="acasa-hero">
                    <h2>Alege Cofetăria Dorită</h2>
                    <p>Găsește cele mai bune prăjituri și torturi din zona ta</p>

                    <div className="acasa-filtre-bar">
                        {/* <div className="search-wrapper-mare">
                            <Search size={20} color="#9a7a5a" />
                            <input 
                                type="text" 
                                placeholder="Caută cofetărie după nume..." 
                                value={cautare}
                                onChange={(e) => setCautare(e.target.value)}
                            />
                        </div> */}
                        
                        {/* <div className="filtre-butoane">
                            <button className="filtru-pill">Locație <ChevronDown size={16} /></button>
                            <button className="filtru-pill activ">Rating 4.5+ <X size={14} /></button>
                            <button className="filtru-pill">Deschis acum <ChevronDown size={16} /></button>
                            <button className="filtru-pill">Sortare <SlidersHorizontal size={14} /></button>
                        </div> */}
                    </div>
                </div>

                {/* === GRID-UL DE COFETĂRII === */}
                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : cofetariiFiltrate.length > 0 ? (
                    <div className="cofetarii-grid">
                        {cofetariiFiltrate.map(cofetarie => (
                            <div key={cofetarie._id} className="cofetarie-card" onClick={() => navigate(`/cofetarie/${cofetarie._id}`)}>
                                
                                <div className="cofetarie-card-imagine">
                                    {/* BADGE STATUS */}
                                    <span className="badge-status-poza">Deschis</span>
                                    
                                    {/* BADGE RATING */}
                                    <span 
                                        className="badge-rating-poza" 
                                        onClick={(e) => deschideRecenzii(e, cofetarie)}
                                        title="Vezi recenziile"
                                    >
                                        <Star size={14} fill="#f5a623" color="#f5a623" />
                                        {cofetarie.rating_mediu ? cofetarie.rating_mediu.toFixed(1) : 'Nou'}
                                    </span>

                                    {cofetarie.imagine_coperta ? (
                                        <img 
                                            src={cofetarie.imagine_coperta && cofetarie.imagine_coperta.startsWith('http') 
                                                ? cofetarie.imagine_coperta 
                                                : `https://sweetgoapp.onrender.com/${cofetarie.imagine_coperta}`} 
                                            alt={cofetarie.numeCofetarie}
                                        />
                                    ) : (
                                        <Cake size={48} color="#c97c2e" strokeWidth={1.5} />
                                    )}
                                </div>

                                <div className="cofetarie-card-info">
                                    <h3>{cofetarie.numeCofetarie}</h3>
                                    
                                    {/* Un text simulat de categorii cum e in model */}
                                    <p className="cofetarie-categorii-text">
                                        Prăjituri, Torturi, Specialități
                                    </p>

                                    <div className="cofetarie-locatie">
                                        <MapPin size={16} color="#c97c2e" /> 
                                        <span>{cofetarie.adresa}</span> 
                                    </div>
                                    
                                    <button className="btn-vezi-meniu">Vezi Meniu</button>
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
                                    <div key={r._id} className="recenzie-item">
                                        <div className="recenzie-header">
                                            <strong className="recenzie-autor">{r.client_id?.nume || 'Anonim'}</strong>
                                            <div className="recenzie-stele">{renderStele(r.rating, 12)}</div>
                                        </div>
                                        <p className="recenzie-comentariu">"{r.comentariu || 'Fără comentariu'}"</p>
                                        <small className="recenzie-data">
                                            <Calendar size={12} /> {new Date(r.createdAt).toLocaleDateString('ro-RO')}
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