import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { User, MapPin, Lock, Heart, LogOut, History, ShieldCheck, Edit2, Trash2, Store } from 'lucide-react';
import api from '../../services/api';
import NavbarClient from '../../components/NavbarClient';

function Profile(){
    const { utilizator, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [profil, setProfil] = useState({ nume: '', email: '', adresa_default: '', telefon: '' });
    const [loading, setLoading] = useState(true);
    const [eroare, setEroare] = useState('');
    const [succes, setSucces] = useState('');

    const [sectiuneActiva, setSectiuneActiva] = useState('informatii');
    const [editareAdresa, setEditareAdresa] = useState(false);

    const [parolaVeche, setParolaVeche] = useState('');
    const [parolaNoua, setParolaNoua] = useState('');
    const [confirmParola, setConfirmParola] = useState('');
    
    const [favorite, setFavorite] = useState([]);
    const [loadingFavorite, setLoadingFavorite] = useState(false);

    useEffect(() => {
        if (utilizator?.rol !== 'client') {
            navigate('/');
            return;
        }
        fetchProfil();
        fetchFavorite();
    }, [utilizator]);

    const fetchProfil = async () => {
        try {
            const res = await api.get('/client/profil');
            setProfil(res.data);
        } catch (err) {
            setEroare('Eroare la încărcarea profilului.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFavorite = async () => {
        setLoadingFavorite(true);
        try {
            const resFav = await api.get('/client/favorite');
            const favoriteIds = resFav.data.map(f => f._id || f);

            // Preluăm cofetăriile publice pentru a avea rating-ul și poza actualizate
            const resCofetarii = await api.get('/cofetarii');
            
            const favoriteReale = resCofetarii.data.filter(cof => favoriteIds.includes(cof._id));
            setFavorite(favoriteReale);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFavorite(false);
        }
    };

    const handleUpdateProfil = async (e) => {
        if(e) e.preventDefault();
        setEroare('');
        setSucces('');
        try {
            await api.put('/client/profil', {
                nume: profil.nume,
                email: profil.email,
                adresa_default: profil.adresa_default,
                telefon: profil.telefon
            });
            setSucces('Profil actualizat cu succes.');
            setEditareAdresa(false);
        
            const updatedUser = { ...utilizator, nume: profil.nume, email: profil.email };
            localStorage.setItem('utilizator', JSON.stringify(updatedUser));
            
            setTimeout(() => setSucces(''), 3000);
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la actualizare.');
        }
    };

    const handleStergereAdresa = async () => {
        if(window.confirm("Ești sigur că vrei să ștergi adresa implicită?")) {
            const profilFaraAdresa = {...profil, adresa_default: ''};
            setProfil(profilFaraAdresa);
            try {
                await api.put('/client/profil', profilFaraAdresa);
                setSucces('Adresa a fost ștearsă.');
                setTimeout(() => setSucces(''), 3000);
            } catch (err) {
                setEroare('Eroare la ștergerea adresei.');
            }
        }
    };

    const handleSchimbaParola = async (e) => {
        e.preventDefault();
        if (parolaNoua !== confirmParola) {
            setEroare('Parola nouă și confirmarea nu coincid.');
            return;
        }
        if (parolaNoua.length < 6) {
            setEroare('Parola nouă trebuie să aibă cel puțin 6 caractere.');
            return;
        }
        try {
            await api.put('/client/parola', { parolaVeche, parolaNoua });
            setSucces('Parola a fost schimbată. Te rugăm să te reconectezi.');
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la schimbarea parolei.');
        }
    };

    const handleStergeFavorite = async (cofetarieId) => {
        try {
            await api.delete(`/client/favorite/${cofetarieId}`);
            fetchFavorite();
        } catch (err) {
            setEroare('Eroare la ștergerea cofetăriei de la favorite.');
        }
    };

    const deruleazaLaSectiune = (idSectiune) => {
        setSectiuneActiva(idSectiune);
        const element = document.getElementById(idSectiune);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const getImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `https://sweetgoapp.onrender.com/${img}`;
    }

    const getInitials = (name) => {
        if (!name) return 'C';
        return name.charAt(0).toUpperCase();
    }

    if (loading) return <p className="loading">Se încarcă profilul...</p>;

    return (
        <div className="profil-page-wrapper">
            <NavbarClient 
                utilizator={utilizator}
                logout={logout}
                searchValue=""
                onSearchChange={() => {}}
                showSearch={false}
            />

            <div className="profil-layout-modern">
                
                {/* --- SIDEBAR STANGA --- */}
                <aside className="profil-sidebar">
                    <div className="profil-user-widget">
                        <div className="profil-avatar-text">
                            {getInitials(profil.nume)}
                        </div>
                        <h3>{profil.nume || 'Client'}</h3>
                        <span>Membru</span>
                    </div>

                    <nav className="profil-nav">
                        <button 
                            className={`profil-nav-item ${sectiuneActiva === 'informatii' ? 'active' : ''}`} 
                            onClick={() => deruleazaLaSectiune('informatii')}
                        >
                            <User size={18}/> Profilul Meu
                        </button>
                        
                        {/* Aici am corectat ruta pe baza fișierului tău App.jsx */}
                        <button 
                            className="profil-nav-item" 
                            onClick={() => navigate('/comenzile-mele')}
                        >
                            <History size={18}/> Istoric comenzi
                        </button>

                        <button 
                            className={`profil-nav-item ${sectiuneActiva === 'adrese' ? 'active' : ''}`} 
                            onClick={() => deruleazaLaSectiune('adrese')}
                        >
                            <MapPin size={18}/> Adresa livrare
                        </button>
                        <button 
                            className={`profil-nav-item ${sectiuneActiva === 'favorite' ? 'active' : ''}`} 
                            onClick={() => deruleazaLaSectiune('favorite')}
                        >
                            <Heart size={18}/> Cofetării favorite
                        </button>
                        <button 
                            className={`profil-nav-item ${sectiuneActiva === 'securitate' ? 'active' : ''}`} 
                            onClick={() => deruleazaLaSectiune('securitate')}
                        >
                            <ShieldCheck size={18}/> Securitate
                        </button>
                    </nav>

                    <button className="profil-btn-logout" onClick={logout}>
                        <LogOut size={18}/> Deconectare
                    </button>
                </aside>

                {/* --- CONTINUT DREAPTA --- */}
                <main className="profil-content-area">
                    
                    {eroare && <div className="eroare">{eroare}</div>}
                    {succes && <div className="succes">{succes}</div>}

                    {/* SECTIUNE INFORMATII PERSONALE */}
                    <section id="informatii" className="profil-sectiune-card">
                        <div className="profil-sectiune-header">
                            <h2 className="profil-sectiune-titlu"><User size={22}/> Informații personale</h2>
                        </div>
                        
                        <form onSubmit={handleUpdateProfil} className="clearfix">
                            <div className="profil-form-grid">
                                <div className="profil-input-group">
                                    <label>Nume Complet</label>
                                    <input type="text" className="profil-input" value={profil.nume} onChange={e => setProfil({...profil, nume: e.target.value})} required />
                                </div>
                                <div className="profil-input-group">
                                    <label>Adresă Email</label>
                                    <input type="email" className="profil-input" value={profil.email} onChange={e => setProfil({...profil, email: e.target.value})} required />
                                </div>
                                <div className="profil-input-group">
                                    <label>Telefon</label>
                                    <input type="tel" className="profil-input" placeholder="Ex: 07xx xxx xxx" value={profil.telefon || ''} onChange={e => setProfil({...profil, telefon: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" className="profil-btn-salvare">Salvează modificările</button>
                        </form>
                    </section>

                    {/* SECTIUNE ADRESE LIVRARE */}
                    <section id="adrese" className="profil-sectiune-card">
                        <div className="profil-sectiune-header">
                            <h2 className="profil-sectiune-titlu"><MapPin size={22}/> Adresa de livrare</h2>
                            {!editareAdresa && (
                                <button className="btn-adauga-noua" onClick={() => setEditareAdresa(true)}>
                                    {profil.adresa_default ? 'Editează' : '+ Adaugă Nouă'}
                                </button>
                            )}
                        </div>
                        
                        <div className="adresa-card-modern">
                            <div className="adresa-icon-bg">
                                <MapPin size={20} />
                            </div>
                            
                            {editareAdresa ? (
                                <div className="adresa-info-text" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                    <input 
                                        type="text" 
                                        className="profil-input" 
                                        placeholder="Introdu adresa ta (Ex: Str. Lalelelor, nr. 4, București)"
                                        value={profil.adresa_default} 
                                        onChange={e => setProfil({...profil, adresa_default: e.target.value})}
                                        autoFocus
                                    />
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <button className="profil-btn-salvare" style={{padding: '0.5rem 1rem', fontSize: '0.85rem', float: 'none'}} onClick={() => handleUpdateProfil()}>Salvează</button>
                                        <button className="btn-secundar" style={{padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '25px', background: '#fffaf5', border: '1px solid #f5d5a8'}} onClick={() => setEditareAdresa(false)}>Anulează</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="adresa-info-text">
                                        <h4>Acasă (Principală)</h4>
                                        <p>{profil.adresa_default || 'Nu ai setat nicio adresă implicită. Adaugă una pentru o comandă rapidă!'}</p>
                                    </div>
                                    <div className="adresa-actiuni">
                                        <Edit2 size={18} onClick={() => setEditareAdresa(true)} />
                                        {profil.adresa_default && (
                                            <Trash2 size={18} onClick={handleStergereAdresa}/>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* SECTIUNE COFETARII FAVORITE */}
                    <section id="favorite" className="profil-sectiune-card">
                        <div className="profil-sectiune-header">
                            <h2 className="profil-sectiune-titlu"><Heart size={22}/> Cofetării favorite</h2>
                        </div>
                        
                        {loadingFavorite ? (
                            <p>Se încarcă...</p>
                        ) : favorite.length === 0 ? (
                            <p className="text-gol" style={{marginTop: 0}}>Nu ai încă cofetării favorite.</p>
                        ) : (
                            <div className="favorite-grid-modern">
                                {favorite.map(cof => {
                                    // Aici am corectat apelând direct câmpul 'imagine_coperta' din modelul tău Cofetarie
                                    const imagineValidă = cof.imagine_coperta;

                                    return (
                                        <div key={cof._id} className="fav-card-nou">
                                            <div className="fav-card-nou-img-container">
                                                {imagineValidă ? (
                                                    <img src={getImageUrl(imagineValidă)} alt={cof.numeCofetarie} className="fav-card-nou-img" />
                                                ) : (
                                                    <div className="fav-card-nou-img" style={{background: '#fdfaf6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                                        <Store size={40} color="#c97c2e"/>
                                                    </div>
                                                )}
                                                <div className="fav-card-nou-overlay"></div>
                                                
                                                <button className="fav-heart-btn" onClick={() => handleStergeFavorite(cof._id)}>
                                                    <Heart size={16} fill="white" />
                                                </button>
                                                
                                                <div className="fav-card-nou-nume">
                                                    <div className="fav-card-nou-logo"><Store size={16} color="#c97c2e"/></div>
                                                    {cof.numeCofetarie}
                                                </div>
                                            </div>
                                            <div className="fav-card-nou-footer">
                                                <div className="fav-card-nou-rating">
                                                    <StarIcon rating={cof.rating_mediu} /> 
                                                    <span>({cof.numar_recenzii || '0'} recenzii)</span>
                                                </div>
                                                <span 
                                                    className="fav-card-nou-link" 
                                                    onClick={() => navigate(`/cofetarie/${cof._id}`)}
                                                    style={{cursor: 'pointer'}}
                                                >
                                                    Vezi meniu
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* SECTIUNE SECURITATE */}
                    <section id="securitate" className="profil-sectiune-card">
                        <div className="profil-sectiune-header">
                            <h2 className="profil-sectiune-titlu"><Lock size={22}/> Securitate</h2>
                        </div>
                        <p className="profil-sectiune-desc">Asigură-te că folosești o parolă puternică pentru a-ți proteja contul.</p>
                        
                        <form onSubmit={handleSchimbaParola} className="clearfix">
                            <div className="profil-input-group" style={{marginBottom: '1.5rem'}}>
                                <label>Parola actuală</label>
                                <input type="password" placeholder="••••••••••••" className="profil-input" value={parolaVeche} onChange={e => setParolaVeche(e.target.value)} required />
                            </div>
                            
                            <div className="profil-form-grid">
                                <div className="profil-input-group">
                                    <label>Parola nouă</label>
                                    <input type="password" placeholder="Min. 6 caractere" className="profil-input" value={parolaNoua} onChange={e => setParolaNoua(e.target.value)} required />
                                </div>
                                <div className="profil-input-group">
                                    <label>Confirmă parola</label>
                                    <input type="password" placeholder="Min. 6 caractere" className="profil-input" value={confirmParola} onChange={e => setConfirmParola(e.target.value)} required />
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: '#9a7a5a', fontSize: '0.9rem', cursor: 'pointer'}}>Ai uitat parola?</span>
                                <button type="submit" className="profil-btn-salvare">Actualizează parola</button>
                            </div>
                        </form>
                    </section>

                </main>
            </div>
        </div>
    );
}

// O componentă mică pentru afișarea stelei în funcție de rating
const StarIcon = ({ rating }) => {
    const r = rating || 0;
    return (
        <span style={{color: r > 0 ? '#f59e0b' : '#d1d5db', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'}}>
            {r > 0 ? r.toFixed(1) : 'Nou'} 
            <svg width="14" height="14" viewBox="0 0 24 24" fill={r > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </span>
    )
}

export default Profile;