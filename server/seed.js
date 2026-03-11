const db = require('./db')
const bcrypt = require('bcryptjs')

console.log('Se incarca datele initiale...')

// ===== ADMIN =====
const adminExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('admin@sweetgo.com')
if (!adminExistent) {
    const parolaHash = bcrypt.hashSync('admin!123', 10)
    db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Administrator', 'admin@sweetgo.com', parolaHash, 'admin')
    console.log('✓ Admin creat - Email: admin@sweetgo.com | Parola: admin!123')
} else {
    console.log('! Admin exista deja')
}

// ===== CLIENT =====
const clientExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('client@sweetgo.com')
if (!clientExistent) {
    const parolaHash = bcrypt.hashSync('123456', 10)
    db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Maria Ionescu', 'maria.ionescu@gmail.com', parolaHash, 'client')
    console.log('✓ Client creat - Email: maria.ionescu@gmail.com | Parola: 123456')
} else {
    console.log('! Clientul exista deja')
}

// ===== COFETARIE =====
const cofetarieExistenta = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('cofetarie@sweetgo.com')
if (!cofetarieExistenta) {
    const parolaHash = bcrypt.hashSync('123456', 10)

    // cream utilizatorul pentru cofetarie
    const utilizator = db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Ion Popescu', 'ion.popescu@dulcegarii.com', parolaHash, 'cofetarie')

    // cream cofetaria si o aprobam direct
    db.prepare(`
        INSERT INTO cofetarii (utilizator_id, numeCofetarie, adresa, telefon, status)
        VALUES (?, ?, ?, ?, ?)
    `).run(utilizator.lastInsertRowid, 'Dulcegarii', 'Strada Florilor nr. 10', '0742518654', 'aprobata')

    console.log('✓ Cofetarie creata si aprobata - Email: ion.popescu@dulcegarii.com | Parola: 123456')
} else {
    console.log('! Cofetaria exista deja')
}
