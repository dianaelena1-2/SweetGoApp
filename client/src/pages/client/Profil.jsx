import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { User, Mail, MapPin, Lock, Heart, Phone } from 'lucide-react';
import api from '../../services/api';
import NavbarClient from '../../components/NavbarClient';

function Profile(){
    const { utilizator, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [profil, setProfil] = useState({ nume: '', email: '', adresa_default: '', telefon: '' });
    const [loading, setLoading] = useState(true);
    const [eroare, setEroare] = useState('');
    const [succes, setSucces] = useState('');

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
            const res = await api.get('/client/favorite');
            setFavorite(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFavorite(false);
        }
    };

    const handleUpdateProfil = async (e) => {
        e.preventDefault();
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
        
            const updatedUser = { ...utilizator, nume: profil.nume, email: profil.email };
            localStorage.setItem('utilizator', JSON.stringify(updatedUser));
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la actualizare.');
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

    const handleToggleFavorite = async (cofetarieId, isFavorite) => {
        try {
            if (isFavorite) {
                await api.delete(`/client/favorite/${cofetarieId}`);
            } else {
                await api.post(`/client/favorite/${cofetarieId}`);
            }
            fetchFavorite();
        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'Eroare la modificarea favorite.');
        }
    };

    if (loading) return <p className="loading">Se încarcă profilul...</p>;

    return (
        <div className="acasa-container">
            <NavbarClient 
                utilizator={utilizator}
                logout={logout}
                searchValue=""
                onSearchChange={() => {}}
                showSearch={false}
            />

            <div className="acasa-continut">
                <h2>Profilul meu</h2>
                {eroare && <div className="eroare">{eroare}</div>}
                {succes && <div className="succes">{succes}</div>}

                <div className="profile-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* Secțiune date personale */}
                    <div className="gp-card" style={{ flex: 2 }}>
                        <h3 className="gp-card-titlu"><User size={20} /> Date personale</h3>
                        <form onSubmit={handleUpdateProfil}>
                            <div className="form-group">
                                <label>Nume</label>
                                <input type="text" value={profil.nume} onChange={e => setProfil({...profil, nume: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={profil.email} onChange={e => setProfil({...profil, email: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label><MapPin size={16} /> Adresă implicită de livrare</label>
                                <input type="text" value={profil.adresa_default || ''} onChange={e => setProfil({...profil, adresa_default: e.target.value})} placeholder="Strada, număr, oraș" />
                                <small className="text-muted">Această adresă va fi precompletată automat la plasarea comenzii.</small>
                            </div>
                            <div className="form-group">
                                <label><Phone size={16} /> Număr de telefon</label>
                                <input 
                                    type="tel" 
                                    value={profil.telefon || ''} 
                                    onChange={e => setProfil({...profil, telefon: e.target.value})} 
                                    placeholder="07xxxxxxxx"
                                />
                                <small className="text-muted">Acest număr va fi precompletat la plasarea comenzii.</small>
                            </div>
                            <button type="submit" className="btn-primar">Salvează modificările</button>
                        </form>
                    </div>

                    {/* Secțiune schimbare parolă */}
                    <div className="gp-card" style={{ flex: 1.5 }}>
                        <h3 className="gp-card-titlu"><Lock size={20} /> Schimbă parola</h3>
                        <form onSubmit={handleSchimbaParola}>
                            <div className="form-group">
                                <label>Parola veche</label>
                                <input type="password" value={parolaVeche} onChange={e => setParolaVeche(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Parola nouă</label>
                                <input type="password" value={parolaNoua} onChange={e => setParolaNoua(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Confirmă parola nouă</label>
                                <input type="password" value={confirmParola} onChange={e => setConfirmParola(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn-primar">Schimbă parola</button>
                        </form>
                    </div>

                    {/* Secțiune favorite */}
                    <div className="gp-card" style={{ flex: 2 }}>
                        <h3 className="gp-card-titlu"><Heart size={20} /> Cofetării favorite</h3>
                        {loadingFavorite ? (
                            <p>Se încarcă...</p>
                        ) : favorite.length === 0 ? (
                            <p className="text-gol">Nu ai încă cofetării favorite. Adaugă din pagina de detalii a cofetăriei.</p>
                        ) : (
                            <div className="favorite-lista">
                                {favorite.map(cof => (
                                    <div key={cof.id} className="favorite-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5d5a8' }}>
                                        <div onClick={() => navigate(`/cofetarie/${cof.id}`)} style={{ cursor: 'pointer', flex: 1 }}>
                                            <strong>{cof.numeCofetarie}</strong>
                                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>{cof.adresa}</p>
                                            <div className="rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} style={{ color: i < Math.round(cof.rating_mediu || 0) ? '#c97c2e' : '#ccc' }}>★</span>
                                                ))}
                                                <span style={{ fontSize: '0.7rem' }}>({cof.rating_mediu ? cof.rating_mediu.toFixed(1) : '0'})</span>
                                            </div>
                                        </div>
                                        <button className="btn-stergere" onClick={() => handleToggleFavorite(cof.id, true)}>Șterge</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;