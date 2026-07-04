import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Package, Star, LogOut, BarChart3 } from 'lucide-react';
import ButonSuport from './ButonSuport';

function SidebarCofetarie() {
    const { utilizator, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const esteActiv = (cale) => location.pathname === cale;

    return (
        <>
            <aside className="cd-sidebar">
                <div className="cd-logo">SweetGo 🍰</div>
                <div className="cd-sub-logo">{utilizator?.numeCofetarie || 'Laboratorul tău virtual'}</div>

                <nav className="cd-nav">
                    <button 
                        className={`cd-nav-item ${esteActiv('/cofetarie/dashboard') ? 'active' : ''}`} 
                        onClick={() => navigate('/cofetarie/dashboard')}
                    >
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button 
                        className={`cd-nav-item ${esteActiv('/cofetarie/comenzi') ? 'active' : ''}`} 
                        onClick={() => navigate('/cofetarie/comenzi')}
                    >
                        <ShoppingBag size={20}/> Comenzi
                    </button>
                    <button 
                        className={`cd-nav-item ${esteActiv('/cofetarie/produse') ? 'active' : ''}`} 
                        onClick={() => navigate('/cofetarie/produse')}
                    >
                        <Package size={20}/> Inventar produse
                    </button>
                    <button 
                        className={`cd-nav-item ${esteActiv('/cofetarie/recenzii') ? 'active' : ''}`} 
                        onClick={() => navigate('/cofetarie/recenzii')}
                    >
                        <Star size={20}/> Recenzii clienți
                    </button>
                    <button 
                        className={`cd-nav-item ${esteActiv('/cofetarie/statistici-cofetarie') ? 'active' : ''}`} 
                        onClick={() => navigate('/cofetarie/statistici-cofetarie')}
                    >
                        <BarChart3 size={20}/> Statistici
                    </button>
                </nav>

                <button className="cd-btn-logout" onClick={handleLogout}>
                    <LogOut size={20}/> Deconectează-te
                </button>
            </aside>
            <ButonSuport />
        </>
    );
}

export default SidebarCofetarie;