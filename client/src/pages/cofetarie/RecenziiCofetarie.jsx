import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Star, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import SidebarCofetarie from '../../components/SidebarCofetarie';

function RecenziiCofetarie() {
    const { utilizator } = useContext(AuthContext);
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

    // Funcție pentru a extrage inițialele din numele clientului
    const getInitials = (name) => {
        if (!name) return 'C';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0].toUpperCase();
    };

    const renderStele = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={18} 
                fill={i < rating ? '#f1c40f' : 'none'} 
                color={i < rating ? '#f1c40f' : '#e0e0e0'} 
            />
        ));
    };

    if (loading) return <div className="cd-layout"><p className="loading" style={{width:'100%', marginTop:'5rem'}}>Se încarcă recenziile...</p></div>;

    return (
        <div className="cd-layout">
            <SidebarCofetarie />

            <main className="cd-main">
                <div className="rc-header-titles">
                    <h2>Recenziile mele</h2>
                    <p>Gestionează feedback-ul clienților pentru produsele tale.</p>
                </div>
                
                {eroare && <div className="eroare">{eroare}</div>}

                {/* Carduri Statistici Sus */}
                <div className="rc-stats-grid">
                    <div className="rc-stat-card">
                        <div className="rc-stat-info">
                            <span className="rc-stat-label">Rating mediu</span>
                            <div className="rc-stat-value">
                                {ratingMediu > 0 ? ratingMediu.toFixed(1) : '0.0'} <small>/ 5</small>
                            </div>
                        </div>
                        <div className="rc-stat-icon-red">
                            <Star size={28} fill="currentColor" />
                        </div>
                    </div>

                    <div className="rc-stat-card">
                        <div className="rc-stat-info">
                            <span className="rc-stat-label">Total recenzii</span>
                            <div className="rc-stat-value dark">
                                {totalRecenzii}
                            </div>
                        </div>
                        <div className="rc-stat-icon-gray">
                            <MessageSquare size={28} />
                        </div>
                    </div>
                </div>

                {/* Lista de recenzii */}
                {recenzii.length === 0 ? (
                    <p className="gol" style={{padding: '2rem 0'}}>Nu ai primit încă nicio recenzie.</p>
                ) : (
                    <div className="rc-list">
                        {recenzii.map(recenzie => (
                            <div key={recenzie._id} className="rc-card">
                                <div className="rc-card-header">
                                    
                                    <div className="rc-user-info">
                                        <div className="rc-avatar">
                                            {getInitials(recenzie.client_id?.nume)}
                                        </div>
                                        <div className="rc-user-details">
                                            <h4>{recenzie.client_id?.nume || 'Client Anonim'}</h4>
                                            <p>{formatDate(recenzie.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="rc-stars">
                                        {renderStele(Math.round(recenzie.rating))}
                                    </div>

                                </div>
                                
                                {recenzie.comentariu && (
                                    <p className="rc-text">
                                        "{recenzie.comentariu}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default RecenziiCofetarie;