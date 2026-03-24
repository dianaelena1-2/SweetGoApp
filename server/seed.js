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

    const utilizator = db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Ion Popescu', 'ion.popescu@dulcegarii.com', parolaHash, 'cofetarie')

    const cofetarie = db.prepare(`
        INSERT INTO cofetarii (utilizator_id, numeCofetarie, adresa, telefon, status)
        VALUES (?, ?, ?, ?, ?)
    `).run(utilizator.lastInsertRowid, 'Dulcegarii', 'Strada Florilor nr. 10', '0742518654', 'aprobata')

    // ===== PRODUS =====
    db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarie.lastInsertRowid, 'Tort Ciocolată', 'Tort cu cremă de ciocolată și fructe de pădure', 120, 'Torturi', 10, 1, 'Mașină frigorifică')

    console.log('✓ Cofetarie creata si aprobata - Email: ion.popescu@dulcegarii.com | Parola: 123456')
    console.log('✓ Produs creat - Tort Ciocolată | Pret: 120 lei | Stoc: 10 buc')
} else {
    console.log('! Cofetaria exista deja')
}
