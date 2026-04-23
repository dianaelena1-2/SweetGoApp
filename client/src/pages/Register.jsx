import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function Register() {
    const [formData, setFormData] = useState({
        nume: '',
        email: '',
        parola: '',
        rol: 'client', 
        numeCofetarie: '',
        adresa: '',
        telefon: ''
    })
    const [certificatInregistrare, setCertificatInregistrare] = useState(null)
    const [certificatSanitar, setCertificatSanitar] = useState(null)
    const [imagineCoperta, setImagineCoperta] = useState(null)
    const [eroare, setEroare] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // Funcție pentru a schimba rolul din butoanele toggle
    const handleRoleChange = (role) => {
        setFormData({ ...formData, rol: role })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setEroare('')
        if (formData.rol === 'cofetarie') {
            if (!certificatInregistrare || !certificatSanitar) {
                setEroare('Documentele sunt obligatorii pentru cofetării')
                return
            }
        }
        setLoading(true)

        try {
            const data = new FormData()
            data.append('nume', formData.nume)
            data.append('email', formData.email)
            data.append('parola', formData.parola)
            data.append('rol', formData.rol)

            if (formData.rol === 'cofetarie') {
                data.append('numeCofetarie', formData.numeCofetarie)
                data.append('adresa', formData.adresa)
                data.append('telefon', formData.telefon)
                data.append('certificat_inregistrare', certificatInregistrare)
                data.append('certificat_sanitar', certificatSanitar)
                if (imagineCoperta) {
                    data.append('imagine_coperta', imagineCoperta)
                }
            }

            await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (formData.rol === 'cofetarie') {
                navigate('/register-success')
            } else {
                navigate('/login')
            }

        } catch (err) {
            console.log('EROARE:', err)
            setEroare(err.response?.data?.mesaj || 'A apărut o eroare')
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
                    <h2 className="auth-welcome">Creează cont!</h2>
                    <p className="auth-subtitle">Alătură-te comunității și bucură-te de dulciuri.</p>
                </div>

                <div className="auth-nav-tabs">
                    <Link to="/login" className="auth-nav-tab">Autentificare</Link>
                    <Link to="/register" className="auth-nav-tab active">Înregistrare</Link>
                </div>

                {/* Toggle Butoane pentru Roluri */}
                <div className="role-toggle-container">
                    <button 
                        type="button" 
                        className={`role-toggle-btn ${formData.rol === 'client' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('client')}
                    >
                        Cumpărător
                    </button>
                    <button 
                        type="button" 
                        className={`role-toggle-btn ${formData.rol === 'cofetarie' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('cofetarie')}
                    >
                        Cofetărie
                    </button>
                </div>

                {eroare && <div className="eroare">{eroare}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Câmp Nume Complet */}
                    <div className="form-group">
                        <label className="form-group-label">Nume Complet</label>
                        <div className="input-icon-wrapper">
                            <input
                                type="text"
                                name="nume"
                                className="form-group-input"
                                value={formData.nume}
                                onChange={handleChange}
                                placeholder="Popescu Ion"
                                required
                            />
                        </div>
                    </div>

                    {/* Câmp Email */}
                    <div className="form-group">
                        <label className="form-group-label">Email</label>
                        <div className="input-icon-wrapper">
                            <input
                                type="email"
                                name="email"
                                className="form-group-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="nume@exemplu.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Câmp Parolă */}
                    <div className="form-group">
                        <label className="form-group-label">Parolă</label>
                        <div className="input-icon-wrapper">
                            <input
                                type="password"
                                name="parola"
                                className="form-group-input"
                                value={formData.parola}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Secțiune extra pentru Cofetărie */}
                    {formData.rol === 'cofetarie' && (
                        <div style={{ padding: '1rem', background: '#fffaf5', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #f5eadd' }}>
                            <h4 style={{ color: '#c97c2e', marginBottom: '1rem', fontSize: '0.9rem' }}>Detalii Cofetărie</h4>
                            
                            <div className="form-group">
                                <label className="form-group-label">Nume Cofetărie</label>
                                <div className="input-icon-wrapper">
                                    <input type="text" name="numeCofetarie" className="form-group-input" value={formData.numeCofetarie} onChange={handleChange} placeholder="Numele cofetăriei" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-group-label">Adresă</label>
                                <div className="input-icon-wrapper">
                                    <input type="text" name="adresa" className="form-group-input" value={formData.adresa} onChange={handleChange} placeholder="Adresa cofetăriei" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-group-label">Telefon</label>
                                <div className="input-icon-wrapper">
                                    <input type="text" name="telefon" className="form-group-input" value={formData.telefon} onChange={handleChange} placeholder="07xxxxxxxx" required />
                                </div>
                            </div>

                            <div className="form-group pt-margin">
                                <label className="form-group-label">Certificat de înregistrare</label>
                                <input type="file" className="file-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCertificatInregistrare(e.target.files[0])} />
                            </div>

                            <div className="form-group pt-margin">
                                <label className="form-group-label">Certificat sanitar</label>
                                <input type="file" className="file-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCertificatSanitar(e.target.files[0])} />
                            </div>

                            <div className="form-group pt-margin">
                                <label className="form-group-label">Poză copertă cofetărie (opțional)</label>
                                <input type="file" className="file-input" accept=".jpg,.jpeg,.png" onChange={(e) => setImagineCoperta(e.target.files[0])} />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Se creează contul...' : 'Creează cont'}
                    </button>
                </form>
            </div>

            {/* Partea dreaptă */}
            <div className="auth-image-side">
                <div className="auth-image-badge">
                </div>
            </div>
        </div>
    )
}

export default Register