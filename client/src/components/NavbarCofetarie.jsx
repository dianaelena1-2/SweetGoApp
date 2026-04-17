import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Star, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function NavbarCofetarie() {
    const navigate = useNavigate();
    const { utilizator, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const prenume = utilizator?.nume ? utilizator.nume.split(' ')[0] : '';

    const rutaCurenta = location.pathname;

    return (
        <nav className="navbar">
            <h1 className="navbar-logo" onClick={() => navigate('/cofetarie/dashboard')} style={{ cursor: 'pointer' }}>
                SweetGo 🍰
            </h1>

            <div className="navbar-actiuni">
                {rutaCurenta !== '/cofetarie/dashboard' && (
                    <button className="btn-nav-ghost" onClick={() => navigate('/cofetarie/dashboard')}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                )}
                
                {rutaCurenta !== '/cofetarie/produse' && (
                    <button className="btn-nav-ghost" onClick={() => navigate('/cofetarie/produse')}>
                        <Package size={18} /> Produse
                    </button>
                )}
                
                {rutaCurenta !== '/cofetarie/comenzi' && (
                    <button className="btn-nav-ghost" onClick={() => navigate('/cofetarie/comenzi')}>
                        <ClipboardList size={18} /> Comenzi
                    </button>
                )}

                {/* <button className="btn-nav-ghost" onClick={() => navigate('/cofetarie/recenzii')}>
                    <Star size={18} /> Recenzii
                </button> */}
                
                <div className="nav-separator"></div>
{/* 
                <div className="user-menu-btn" style={{ cursor: 'default' }}>
                    <User size={18} color="#c97c2e" /> Bună, {prenume}!
                </div> */}

                <button className="btn-logout-vendor" onClick={handleLogout}>
                    <LogOut size={16} /> Deconectare
                </button>
            </div>
        </nav>
    );
}

export default NavbarCofetarie;