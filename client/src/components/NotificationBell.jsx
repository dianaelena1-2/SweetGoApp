import { useState, useEffect, useRef } from 'react';
import { Bell, X, Circle } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function NotificationBell(){
    const [notificari, setNotificari] = useState([]);
    const [necititeCount, setNecititeCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotificari = async () => {
        try {
            const res = await api.get('/client/notificari');
            setNotificari(res.data);
        } catch (err) {
            console.error('Eroare la încărcarea notificărilor', err);
        }
    };

    const fetchCount = async () => {
        try {
            const res = await api.get('/client/notificari/necitite/count');
            setNecititeCount(res.data.count);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotificari();
        fetchCount();
        const interval = setInterval(fetchCount, 20000); 
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
            setNotificari(prev => prev.map(n => n.id === id ? { ...n, citita: 1 } : n));
            setNecititeCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.citita) handleMarkAsRead(notif.id);
        if (notif.link) navigate(notif.link);
        setOpen(false);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'Z');
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
                        Notificări
                    </div>
                    {notificari.length === 0 ? (
                        <div className="notification-empty">
                            Nu ai notificări.
                        </div>
                    ) : (
                        notificari.map(notif => (
                            <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`notification-item ${notif.citita ? 'notification-item-read' : 'notification-item-unread'}`}
                            >
                                <div className="notification-content">
                                    <div className="notification-message">
                                        <p>{notif.mesaj}</p>
                                        <small className="notification-date">{formatDate(notif.data_creare)}</small>
                                    </div>
                                    {!notif.citita && (
                                        <Circle size={10} fill="#c97c2e" color="#c97c2e" className="notification-unread-dot" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;