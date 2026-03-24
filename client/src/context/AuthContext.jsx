import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

//aici se verifica daca utilizatorul este conectat sau nu
export const AuthProvider = ({ children }) => {
    const [utilizator, setUtilizator] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const tokenSalvat = localStorage.getItem('token')
        const utilizatorSalvat = localStorage.getItem('utilizator')
        if(tokenSalvat && utilizatorSalvat){
            setToken(tokenSalvat)
            setUtilizator(JSON.parse(utilizatorSalvat))
        }
        setLoading(false)
    }, [])

    const login = (token, utilizator) => {
        localStorage.setItem('token',token)
        localStorage.setItem('utilizator',JSON.stringify(utilizator))
        setToken(token)
        setUtilizator(utilizator)
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('utilizator')
        setToken(null)
        setUtilizator(null)
    }

    //punem la dispozitia aplicatiei-copil toate functiile si datele de mai sus
    return (
        <AuthContext.Provider value = {{ utilizator, token, login, logout, loading }} >
            {children}
        </AuthContext.Provider>
    )
}