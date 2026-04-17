import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingCart, Home, LogOut, ClipboardList, UserCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function NavbarClient({ utilizator, logout, searchValue, onSearchChange, showSearch = true }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [cosCount, setCosCount] = useState(0);
    const dropdownRef = useRef(null);

    const updateCosCount = () => {
        const cos = localStorage.getItem('cos');
        if (cos) {
            const cosParsat = JSON.parse(cos);
            const total = cosParsat.produse.reduce((acc, p) => acc + p.cantitate, 0);
            setCosCount(total);
        } else {
            setCosCount(0);
        }
    };

    useEffect(() => {
        updateCosCount();
        window.addEventListener('storage', updateCosCount);
        window.addEventListener('cos-updated', updateCosCount);
        return () => {
            window.removeEventListener('storage', updateCosCount);
            window.removeEventListener('cos-updated', updateCosCount);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isHomePage = location.pathname === '/';
    const prenume = utilizator?.nume ? utilizator.nume.split(' ')[0] : '';
    let searchPlaceholder = "Caută...";
    if (isHomePage) {
        searchPlaceholder = "Caută cofetărie...";
    } else {
        searchPlaceholder = "Caută produs..."; 
    }

    return (
        <nav className="navbar">
            <h1 className="navbar-logo" onClick={() => navigate('/')}>
                SweetGo 🍰
            </h1>

            {showSearch && (
                <div className="navbar-search-container">
                    <input
                        type="text"
                        className="navbar-search-input"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}

            <div className="navbar-actiuni">
                {!isHomePage && (
                    <button className="btn-nav-ghost" onClick={() => navigate('/')} title="Acasă">
                         <Home size={20} />
                    </button>
                )}
                
                <NotificationBell />
                
                <button className="btn-nav-cart" onClick={() => navigate('/cos-cumparaturi')}>
                    🛒 Coș 
                    {cosCount > 0 && <span className="cart-badge">{cosCount}</span>}
                </button>
                
                <div className="user-menu" ref={dropdownRef}>
                    <button className="user-menu-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <User size={18} /> Bună, {prenume}!
                    </button>
                    {dropdownOpen && (
                        <div className="user-dropdown">
                            <button onClick={() => { navigate('/profil'); setDropdownOpen(false); }}>
                                <UserCircle size={16} /> Profilul meu
                            </button>
                            <button onClick={() => { navigate('/comenzile-mele'); setDropdownOpen(false); }}>
                                <ClipboardList size={16} /> Comenzile mele
                            </button>
                            <button onClick={handleLogout} className="btn-dropdown-logout">
                                <LogOut size={16} /> Deconectare
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavbarClient;