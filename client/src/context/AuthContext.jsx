import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [utilizator, setUtilizator] = useState(null)
    const [token, setToken] = useState(null)

    useEffect(() => {
        const tokenSalvat = localStorage.getItem('token')
        const utilizatorSalvat = localStorage.getItem('utilizator')
        if(tokenSalvat && utilizatorSalvat){
            setToken(tokenSalvat)
            setUtilizator(JSON.parse(utilizatorSalvat))
        }
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

    return (
        <AuthContext.Provider value = {{ utilizator, token, login, logout }} >
            {children}
        </AuthContext.Provider>
    )
}