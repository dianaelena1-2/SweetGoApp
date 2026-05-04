import { useState, useEffect, useRef } from 'react';
import { Bell, Circle, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function NotificationBell(){
    const [notificari, setNotificari] = useState([]);
    const [necititeCount, setNecititeCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchDateNotificari = async () => {
        try {
            const resList = await api.get('/client/notificari');
            setNotificari(resList.data);
            
            const resCount = await api.get('/client/notificari/necitite/count');
            setNecititeCount(resCount.data.count);
        } catch (err) {
            console.error('Eroare la încărcarea notificărilor', err);
        }
    };

    useEffect(() => {
        fetchDateNotificari(); 
        const interval = setInterval(fetchDateNotificari, 10000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/client/notificari/${id}/citita`);
            setNotificari(prev => prev.map(n => n._id === id ? { ...n, citita: true } : n));
            setNecititeCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        if (necititeCount === 0) return;

        try {
            await api.put('/client/notificari/citite-toate');
            setNotificari(prev => prev.map(n => ({ ...n, citita: true })));
            setNecititeCount(0);
        } catch (err) {
            console.error('Eroare la marcarea tuturor ca citite:', err);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.citita) handleMarkAsRead(notif._id);
        if (notif.link) navigate(notif.link);
        setOpen(false);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr); 
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'acum câteva secunde';
        if (diffMins < 60) return `acum ${diffMins} min`;
        if (diffMins < 1440) return `acum ${Math.floor(diffMins / 60)} ore`;
        return date.toLocaleDateString('ro-RO');
    };

    return(
        <div className="notification-bell" ref={dropdownRef}>
            <button 
                className="btn-notification" 
                onClick={() => setOpen(!open)}
            >
                <Bell size={20} color="#7a5230" />
                {necititeCount > 0 && (
                    <span className="notification-badge">
                        {necititeCount > 9 ? '9+' : necititeCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <span>Notificări</span>
                        
                        {necititeCount > 0 && (
                            <button 
                                className="btn-mark-read"
                                onClick={handleMarkAllAsRead}
                                title="Marchează toate ca citite"
                            >
                                <CheckCheck size={16} /> Marchează toate ca citite
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notificari.length === 0 ? (
                            <div className="notification-empty">
                                Nu ai notificări.
                            </div>
                        ) : (
                            notificari.map(notif => (
                                <div 
                                    key={notif._id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`notification-item ${notif.citita ? 'notification-item-read' : 'notification-item-unread'}`}
                                >
                                    <div className="notification-content">
                                        <div className="notification-message">
                                            <p>{notif.mesaj}</p>
                                            <small className="notification-date">{formatDate(notif.createdAt)}</small>
                                        </div>
                                        {!notif.citita && (
                                            <Circle size={10} fill="#c97c2e" color="#c97c2e" className="notification-unread-dot" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;