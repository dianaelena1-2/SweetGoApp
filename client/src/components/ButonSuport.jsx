import { useState, useContext } from 'react';
import { MessageCircle, X, Mail, Phone } from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; 
import { useLocation } from 'react-router-dom';

function ButonSuport() {
    const [deschis, setDeschis] = useState(false);
    const { utilizator } = useContext(AuthContext); 
    const location = useLocation(); 

    if (utilizator && utilizator.rol === 'client' && (location.pathname === '/' || location.pathname === '/acasa')) {
        return null;
    }

    return (
        <div className="suport-fab-wrapper">
            {deschis && (
                <div className="suport-popup">
                    <h4>
                        Suport SweetGo
                        <X 
                            size={18} 
                            style={{cursor: 'pointer', color: '#9a7a5a'}} 
                            onClick={() => setDeschis(false)} 
                        />
                    </h4>
                    <p style={{fontSize: '0.85rem', color: '#9a7a5a', marginBottom: '1.2rem', marginTop: '-10px'}}>
                        Ai nevoie de ajutor? Echipa noastră este aici pentru tine!
                    </p>
                    
                    <div className="suport-item">
                        <div className="suport-icon-bg"><Phone size={18} /></div>
                        <div>
                            <strong>Telefon</strong><br/>
                            <a style={{color: '#c97c2e', textDecoration: 'none'}}>0700 123 456</a>
                        </div>
                    </div>
                    
                    <div className="suport-item">
                        <div className="suport-icon-bg"><Mail size={18} /></div>
                        <div>
                            <strong>Email</strong><br/>
                            <a style={{color: '#c97c2e', textDecoration: 'none'}}>contact.sweetgo@gmail.com</a>
                        </div>
                    </div>
                </div>
            )}
            
            <button className="suport-fab-btn" onClick={() => setDeschis(!deschis)}>
                {deschis ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}

export default ButonSuport;