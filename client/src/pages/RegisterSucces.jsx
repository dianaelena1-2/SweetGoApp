import { Link } from 'react-router-dom'

function RegisterSuccess() {
    return (
        <div className="register-success-container">
            <div className="register-success-card">
                <h1>SweetGo 🍰</h1>
                <div className="register-success-icon">🎉</div>
                <h2>Îți mulțumim pentru înscriere!</h2>
                <p>Înregistrarea ta a fost trimisă cu succes.</p>
                <p className="text-muted">
                    Documentele tale sunt în curs de verificare. Imediat ce contul este aprobat, vei primi un email de confirmare.
                </p>
                <p className="italic">Revenim către tine în curând.</p>
                <Link to="/login" className="btn-primar btn-link">
                    Mergi la autentificare
                </Link>
            </div>
        </div>
    )
}

export default RegisterSuccess