import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

function Login() {
    const [email, setEmail] = useState('')
    const [parola, setParola] = useState('')
    const [eroare, setEroare] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setEroare('')

        try {
            const raspuns = await api.post('/auth/login', { email, parola })
            login(raspuns.data.token, raspuns.data.utilizator)

            const rol = raspuns.data.utilizator.rol
            if (rol === 'client') navigate('/')
            else if (rol === 'cofetarie') navigate('/cofetarie/dashboard')
            else if (rol === 'admin') navigate('/admin/dashboard')

        } catch (err) {
            setEroare(err.response?.data?.mesaj || 'A aparut o eroare')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>SweetGo 🍰</h1>
                <h2>Conectează-te</h2>

                {eroare && <div className="eroare">{eroare}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemplu.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Parolă</label>
                        <input
                            type="password"
                            value={parola}
                            onChange={(e) => setParola(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Se conectează...' : 'Conectează-te'}
                    </button>
                </form>

                <p>Nu ai cont? <Link to="/register">Înregistrează-te</Link></p>
            </div>
        </div>
    )
}

export default Login