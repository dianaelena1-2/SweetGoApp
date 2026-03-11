import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../services/api'

function AcasaClient(){
    const [cofetarii, setCofetarii] = useState([])
    const [cautare, setCautare] = useState('')
    const [loading, setLoading] = useState(true)
    const { utilizator, logout } = useContext(AuthContext)
    const navigate = useNavigate()

    //face cererea catre server
    useEffect(() => {
        const fetchCofetarii = async () => {
            try {
                const raspuns = await api.get('/cofetarii')
                setCofetarii(raspuns.data)
            } catch(err){
                console.error('Eroare la incarcarea cofetariilor',err)
            } finally {
                setLoading(false)
            }
        }
        fetchCofetarii()
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    //filtrare cofetarii dupa textul din bara de cautare
    const cofetariiFiltrate = cofetarii.filter(c => 
        c.numeCofetarie.toLowerCase().includes(cautare.toLowerCase())
    )

    //transformare rating numeric in stelute
    const renderStele = (rating) => {
        if(!rating) return '☆☆☆☆☆'
        const stele = Math.round(rating)
        return '★'.repeat(stele) + '☆'.repeat(5 - stele)
    }

    return (
        <div className="acasa-container">
            {/* NAVBAR - bara de navigare fixa sus */}
            <nav className="navbar">
                <h1 className="navbar-logo">SweetGo 🍰</h1>

                {/* bara de cautare */}
                <div className="navbar-search">
                    <input
                        type="text"
                        placeholder="Caută cofetărie..."
                        value={cautare}
                        onChange={(e) => setCautare(e.target.value)}
                    />
                </div>

                {/* butoane de navigare din dreapta navbar-ului */}
                <div className="navbar-actiuni">
                    <span>Bună, {utilizator?.nume}!</span>
                    <button onClick={() => navigate('/comenzile-mele')}>Comenzile mele</button>
                    <button onClick={() => navigate('/cos')}>🛒 Coș</button>
                    <button onClick={handleLogout} className="btn-logout">Deconectare</button>
                </div>
            </nav>

            {/* CONTINUT PRINCIPAL */}
            <div className="acasa-continut">
                <h2>Cofetării disponibile</h2>

                {/* afisam mesaj de incarcare, mesaj gol sau grid-ul de cofetarii */}
                {loading ? (
                    <p className="loading">Se încarcă...</p>
                ) : cofetariiFiltrate.length === 0 ? (
                    <p className="gol">Nu s-au găsit cofetării.</p>
                ) : (
                    <div className="cofetarii-grid">
                        {/* parcurgem lista de cofetarii si cream un card pentru fiecare */}
                        {cofetariiFiltrate.map(cofetarie => (
                            <div
                                key={cofetarie.id}
                                className="cofetarie-card"
                                // la click navigam la pagina de detalii a cofetariei
                                onClick={() => navigate(`/cofetarie/${cofetarie.id}`)}
                            >
                                {/* imaginea cofetariei - deocamdata emoji, ulterior imagine reala */}
                                <div className="cofetarie-card-imagine">
                                    {cofetarie.imagine_coperta ? (
                                        <img src={`http://localhost:7000/${cofetarie.imagine_coperta}`} alt={cofetarie.numeCofetarie} />
                                    ) : (
                                        <span>🍰</span>
                                    )}
                                </div>

                                {/* informatiile cofetariei */}
                                <div className="cofetarie-card-info">
                                    <h3>{cofetarie.numeCofetarie}</h3>
                                    <p className="adresa">📍 {cofetarie.adresa}</p>

                                    {/* rating-ul calculat din recenziile clientilor */}
                                    <div className="rating">
                                        <span className="stele">{renderStele(cofetarie.rating_mediu)}</span>
                                        <span className="numar-recenzii">
                                            {cofetarie.numar_recenzii > 0
                                                ? `(${cofetarie.numar_recenzii} recenzii)`
                                                : '(fără recenzii)'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
export default AcasaClient