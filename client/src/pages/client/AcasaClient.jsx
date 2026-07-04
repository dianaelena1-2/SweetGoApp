import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import { Cake, MapPin, Star, MessageSquare, X, Calendar, Search, ChevronDown, SlidersHorizontal, Map as MapIcon } from 'lucide-react'
import NavbarClient from '../../components/NavbarClient';
import ChatWidget from '../../components/ChatWidget';

function AcasaClient(){
    const [cofetarii, setCofetarii] = useState([])
    const [cautare, setCautare] = useState('')
    const [loading, setLoading] = useState(true)
    const [filtruDistanta, setFiltruDistanta] = useState('toate');
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
        fetchCofetarii();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const raspuns = await api.get('/cofetarii/distante', {
                            params: { lat: position.coords.latitude, lng: position.coords.longitude }
                        });
                        setCofetarii(raspuns.data);
                    } catch (err) {
                        console.error('Eroare la calcularea distanțelor', err);
                    }
                },
                (err) => {
                    console.log('Utilizatorul nu a permis locația. Afișăm lista standard.');
                }
            );
        }
    }, [])

    const cofetariiFiltrate = cofetarii.filter(c => {
        const respectaNumele = c.numeCofetarie.toLowerCase().includes(cautare.toLowerCase());

        let respectaDistanta = true;
        
        if (filtruDistanta !== 'toate') {
            if (!c.distanta_valoare) {
                respectaDistanta = false;
            } else {
                const distantaKm = c.distanta_valoare / 1000; 
                
                if (filtruDistanta === '<5' && distantaKm >= 5) {
                    respectaDistanta = false;
                } else if (filtruDistanta === '5-10' && (distantaKm < 5 || distantaKm > 10)) {
                    respectaDistanta = false;
                } else if (filtruDistanta === '>10' && distantaKm <= 10) {
                    respectaDistanta = false;
                }
            }
        }
        
        return respectaNumele && respectaDistanta;
    });

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
                showSearch={true} 
            />

            <div className="acasa-continut">

                <div className="acasa-hero">
                    <h2>Alege cofetăria dorită</h2>
                    <p>Găsește cele mai bune dulciuri din zona ta</p>

                    <div className="acasa-filtre-bar">
                        <div className="filtre-butoane">
                            <span style={{ color: '#9a7a5a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapIcon size={16} /> Distanță:
                            </span>
                            <button 
                                className={`filtru-pill ${filtruDistanta === 'toate' ? 'activ' : ''}`}
                                onClick={() => setFiltruDistanta('toate')}
                            >
                                Toate
                            </button>
                            <button 
                                className={`filtru-pill ${filtruDistanta === '<5' ? 'activ' : ''}`}
                                onClick={() => setFiltruDistanta('<5')}
                            >
                                &lt; 5 km
                            </button>
                            <button 
                                className={`filtru-pill ${filtruDistanta === '5-10' ? 'activ' : ''}`}
                                onClick={() => setFiltruDistanta('5-10')}
                            >
                                5 - 10 km
                            </button>
                            <button 
                                className={`filtru-pill ${filtruDistanta === '>10' ? 'activ' : ''}`}
                                onClick={() => setFiltruDistanta('>10')}
                            >
                                &gt; 10 km
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : cofetariiFiltrate.length > 0 ? (
                    <div className="cofetarii-grid">
                        {cofetariiFiltrate.map(cofetarie => (
                            <div key={cofetarie._id} className="cofetarie-card" onClick={() => navigate(`/cofetarie/${cofetarie._id}`)}>
                                
                                <div className="cofetarie-card-imagine">
                                    <span 
                                        className="badge-rating-poza" 
                                        onClick={(e) => deschideRecenzii(e, cofetarie)}
                                        title="Vezi recenziile"
                                    >
                                        <Star size={14} fill="#f5a623" color="#f5a623" />
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, marginBottom: '15px' }}>
                                        <div className="cofetarie-locatie" style={{ marginBottom: 0 }}>
                                            <MapPin size={16} color="#c97c2e" /> 
                                            <span>{cofetarie.adresa}</span> 
                                        </div>
                                        
                                        {cofetarie.distanta_text && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#666', paddingLeft: '2px' }}>
                                                🚗 <span>{cofetarie.distanta_text} • aprox. {cofetarie.durata_text}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button className="btn-vezi-meniu">Vezi Meniu</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cautare-fara-rezultat">
                        <p>
                            {cautare && filtruDistanta !== 'toate' 
                                ? <>Nu am găsit nicio cofetărie cu numele "<strong>{cautare}</strong>" la distanța selectată.</>
                                : cautare 
                                    ? <>Nu am găsit nicio cofetărie cu numele "<strong>{cautare}</strong>".</>
                                    : <>Nu am găsit nicio cofetărie la distanța selectată.</>
                            }
                        </p>
                    </div>
                )}
            </div>

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
            <ChatWidget />
        </div>
    )
}
export default AcasaClient