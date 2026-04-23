import { Link } from 'react-router-dom'

function RegisterSuccess() {
    return (
        <div className="auth-split-layout">
            {/* Partea stângă - Mesajul de succes */}
            <div className="auth-form-side">
                <h1 className="auth-logo">SweetGo 🍰</h1>
                
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 className="auth-welcome">Îți mulțumim pentru înscriere!</h2>
                    
                    <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                        <p style={{ color: '#3d2c1e', fontWeight: '500', marginBottom: '1rem' }}>
                            Înregistrarea ta a fost trimisă cu succes.
                        </p>
                        <p className="auth-subtitle" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Documentele tale sunt în curs de verificare. Imediat ce contul este aprobat, vei primi un email de confirmare.
                        </p>
                        <p style={{ fontStyle: 'italic', color: '#c97c2e', marginTop: '1rem', fontWeight: '600' }}>
                            Revenim către tine în curând.
                        </p>
                    </div>

                    <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', display: 'block' }}>
                        Mergi la autentificare
                    </Link>
                </div>
            </div>

            {/* Partea dreaptă*/}
            <div className="auth-image-side">
                <div className="auth-image-badge">
                </div>
            </div>
        </div>
    )
}

export default RegisterSuccess