import { useState, useContext } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

function Login() {
    const [email, setEmail] = useState('')
    const [parola, setParola] = useState('')
    const [eroare, setEroare] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

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
            if (err.response?.status === 403) {
                setEroare(err.response?.data?.mesaj || 'Contul nu a fost încă aprobat.')
            } else {
                setEroare(err.response?.data?.mesaj || 'A apărut o eroare')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-split-layout">
            {/* Partea stângă - Formular */}
            <div className="auth-form-side">
                <h1 className="auth-logo">SweetGo 🍰</h1>
                
                <div style={{ marginTop: '2rem' }}>
                    <h2 className="auth-welcome">Bine ai venit!</h2>
                    <p className="auth-subtitle">Completează detaliile pentru a intra în contul tău.</p>
                </div>

                <div className="auth-nav-tabs">
                    <Link to="/login" className="auth-nav-tab active">Autentificare</Link>
                    <Link to="/register" className="auth-nav-tab">Înregistrare</Link>
                </div>

                {eroare && <div className="eroare">{eroare}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-group-label">Email</label>
                        <div className="input-icon-wrapper">
                            <input
                                type="email"
                                className="form-group-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nume@exemplu.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-group-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Parolă</span>
                            {/* Un link mic pentru "Ai uitat parola?" cum era in model
                            <Link to="#" style={{ textTransform: 'none', color: '#c97c2e', textDecoration: 'none' }}>Ai uitat parola?</Link> */}
                        </label>
                        <div className="input-icon-wrapper">
                            <input
                                type="password"
                                className="form-group-input"
                                value={parola}
                                onChange={(e) => setParola(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Se conectează...' : 'Intră în cont'}
                    </button>
                </form>
            </div>

            {/* Partea dreaptă - Imagine */}
            <div className="auth-image-side">
                <div className="auth-image-badge">
                </div>
            </div>
        </div>
    )
}

export default Login