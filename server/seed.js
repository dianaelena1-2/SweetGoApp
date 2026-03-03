const db = require('./db')
const bcrypt = require('bcryptjs')

const parolaHash = bcrypt.hashSync('admin!123', 10)

const adminExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('admin@sweetgo.com')

if (adminExistent) {
    console.log('Adminul exista deja!')
} else {
    db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Administrator', 'admin@sweetgo.com', parolaHash, 'admin')
    console.log('Admin creat cu succes!')
    console.log('Email: admin@sweetgo.com')
    console.log('Parola: admin!123')
}