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
    const [eroare, setEroare] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setEroare('')

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
            }

            await api.post('/auth/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            navigate('/login')

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
                <h2>Creează cont</h2>

                {eroare && <div className="eroare">{eroare}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nume</label>
                        <input
                            type="text"
                            name="nume"
                            value={formData.nume}
                            onChange={handleChange}
                            placeholder="Numele tău"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@exemplu.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Parolă</label>
                        <input
                            type="password"
                            name="parola"
                            value={formData.parola}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tip cont</label>
                        <select name="rol" value={formData.rol} onChange={handleChange}>
                            <option value="client">Client</option>
                            <option value="cofetarie">Cofetărie</option>
                        </select>
                    </div>

                    {formData.rol === 'cofetarie' && (
                        <>
                            <div className="form-group">
                                <label>Nume Cofetărie</label>
                                <input
                                    type="text"
                                    name="numeCofetarie"
                                    value={formData.numeCofetarie}
                                    onChange={handleChange}
                                    placeholder="Numele cofetăriei"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Adresă</label>
                                <input
                                    type="text"
                                    name="adresa"
                                    value={formData.adresa}
                                    onChange={handleChange}
                                    placeholder="Adresa cofetăriei"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="text"
                                    name="telefon"
                                    value={formData.telefon}
                                    onChange={handleChange}
                                    placeholder="07xxxxxxxx"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Certificat de înregistrare</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setCertificatInregistrare(e.target.files[0])}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Certificat sanitar-veterinar</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setCertificatSanitar(e.target.files[0])}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Se creează contul...' : 'Creează cont'}
                    </button>
                </form>

                <p>Ai deja cont? <Link to="/login">Conectează-te</Link></p>
            </div>
        </div>
    )
}

export default Register