import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Star, User, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import NavbarCofetarie from '../../components/NavbarCofetarie';

function RecenziiCofetarie() {
    const { utilizator, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [recenzii, setRecenzii] = useState([]);
    const [ratingMediu, setRatingMediu] = useState(0);
    const [totalRecenzii, setTotalRecenzii] = useState(0);
    const [loading, setLoading] = useState(true);
    const [eroare, setEroare] = useState('');

    useEffect(() => {
        const fetchRecenzii = async () => {
            try {
                const res = await api.get('/cofetarii/recenzii');
                setRecenzii(res.data.recenzii);
                setRatingMediu(res.data.ratingMediu);
                setTotalRecenzii(res.data.totalRecenzii);
            } catch (err) {
                setEroare('Eroare la încărcarea recenziilor.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecenzii();
    }, []);

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ro-RO', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    };

    const renderStele = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill={i < rating ? '#c97c2e' : 'none'} color={i < rating ? '#c97c2e' : '#ccc'} />
        ));
    };

    if (loading) return <p className="loading">Se încarcă...</p>;

    return (
        <div className="acasa-container">
            <NavbarCofetarie />

            <div className="acasa-continut">
                <h2>Recenziile mele</h2>
                {eroare && <div className="eroare">{eroare}</div>}

                <div className="db-stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="db-stat-card" style={{ borderLeft: '4px solid #c97c2e' }}>
                        <div className="db-stat-icon"><Star size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{ratingMediu.toFixed(1)} / 5</p>
                            <p className="db-stat-label">Rating mediu</p>
                        </div>
                    </div>
                    <div className="db-stat-card" style={{ borderLeft: '4px solid #3498db' }}>
                        <div className="db-stat-icon"><MessageSquare size={32} /></div>
                        <div className="db-stat-info">
                            <p className="db-stat-numar">{totalRecenzii}</p>
                            <p className="db-stat-label">Total recenzii</p>
                        </div>
                    </div>
                </div>

                {recenzii.length === 0 ? (
                    <p className="gol">Nu ai primit încă nicio recenzie.</p>
                ) : (
                    <div className="ic-lista">
                        {recenzii.map(recenzie => (
                            <div key={recenzie._id} className="ic-comanda-card">
                                <div className="ic-comanda-header" style={{ cursor: 'default' }}>
                                    <div className="ic-comanda-info">
                                        <h4><User size={16} /> {recenzie.client_id?.nume}</h4>
                                        <p className="ic-data"><Calendar size={14} /> {formatDate(recenzie.createdAt)}</p>
                                    </div>
                                    <div className="ic-comanda-dreapta">
                                        <div className="rating" style={{ gap: '4px' }}>
                                            {renderStele(Math.round(recenzie.rating))}
                                            <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>({recenzie.rating})</span>
                                        </div>
                                    </div>
                                </div>
                                {recenzie.comentariu && (
                                    <div className="ic-produse" style={{ paddingTop: '0' }}>
                                        <div className="ic-observatii-generale" style={{ background: '#fffaf5' }}>
                                            <p>💬 {recenzie.comentariu}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecenziiCofetarie;