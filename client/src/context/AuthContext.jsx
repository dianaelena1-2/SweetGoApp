import { createContext, useState, useEffect } from 'react'
import api from '../services/api';

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [utilizator, setUtilizator] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    const incarcaCosDinServer = async () => {
        try {
            const res = await api.get('/client/cos');
            if (res.data && res.data.produse !== undefined) {
                localStorage.setItem('cos', JSON.stringify(res.data));
            } else {
                localStorage.setItem('cos', JSON.stringify({ cofetarie_id: null, produse: [] }));
            }
        } catch (err) {
            console.error('Eroare la încărcarea coșului:', err);
            localStorage.setItem('cos', JSON.stringify({ cofetarie_id: null, produse: [] }));
        }
        window.dispatchEvent(new Event('cos-updated'));
        console.log('Coș încărcat de pe server');
    }

    const salveazaCosPeServer = async () => {
        const cos = localStorage.getItem('cos');
        if (cos && utilizator) {
            try {
                await api.put('/client/cos', JSON.parse(cos));
                console.log('Coș salvat pe server');
            } catch (err) {
                console.error('Eroare la salvarea coșului pe server:', err);
            }
        }
    }

    useEffect(() => {
        const init = async () => {
            const tokenSalvat = localStorage.getItem('token')
            const utilizatorSalvat = localStorage.getItem('utilizator')
            if (tokenSalvat && utilizatorSalvat) {
                setToken(tokenSalvat)
                setUtilizator(JSON.parse(utilizatorSalvat))
                api.defaults.headers.common['Authorization'] = `Bearer ${tokenSalvat}`;
                await incarcaCosDinServer()
            }
            setLoading(false)
        }
        init();
    }, [])

    const login = async (token, utilizator) => {
        localStorage.setItem('token', token)
        localStorage.setItem('utilizator', JSON.stringify(utilizator))
        setToken(token)
        setUtilizator(utilizator)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await incarcaCosDinServer();
    }

    const logout = async () => {
        await salveazaCosPeServer();
        localStorage.removeItem('token')
        localStorage.removeItem('utilizator')
        localStorage.removeItem('cos');
        delete api.defaults.headers.common['Authorization'];
        setToken(null)
        setUtilizator(null)
    }

    return (
        <AuthContext.Provider value={{ utilizator, token, login, logout, loading, salveazaCosPeServer }}>
            {children}
        </AuthContext.Provider>
    )
}