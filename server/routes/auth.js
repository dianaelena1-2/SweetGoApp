const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const upload = require('../middleware/upload_documents')

//INREGISTRARE
router.post('/register', upload.fields([
    { name: 'certificat_inregistrare', maxCount: 1 },
    { name: 'certificat_sanitar', maxCount: 1 }
]), (req, res) => {
    const { nume, email, parola, rol, numeCofetarie, adresa, telefon } = req.body

    if(!nume || !email || !parola || !rol){
        return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
    }

    const utilizatorExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get(email)
    if(utilizatorExistent){
        return res.status(400).json({ mesaj: 'Email-ul este deja folosit'})
    }

    const parolaHash = bcrypt.hashSync(parola, 10)

    const rezultat = db.prepare(
        'INSERT INTO utilizatori (nume, email, parola, rol) VALUES (?, ?, ?, ?)'
    ).run(nume, email, parolaHash, rol)

    const utilizatorId = rezultat.lastInsertRowid

    if(rol === 'cofetarie')
    {
        if(!req.files || !req.files['certificat_inregistrare'] || !req.files['certificat_sanitar']){
            return res.status(400).json({ mesaj: 'Documentele sunt obligatorii pentru cofetarii' })
        }

        const certifInregistrare = req.files['certificat_inregistrare'][0].path
        const certifSanitar = req.files['certificat_sanitar'][0].path

        db.prepare(`
            INSERT INTO cofetarii (utilizator_id, numeCofetarie, adresa, telefon, certificat_inregistrare, certificat_sanitar)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(utilizatorId, numeCofetarie, adresa, telefon, certifInregistrare, certifSanitar)
    }

    res.status(201).json({ mesaj: 'Cont creat cu succes', id: utilizatorId })
})

//AUTENTIFICARE
router.post('/login', (req,res) => {
    const { email, parola } = req.body

    if (!email || !parola) {
        return res.status(400).json({ mesaj: 'Email si parola sunt obligatorii' })
    }

    const utilizator = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get(email)
    if (!utilizator) {
        return res.status(401).json({ mesaj: 'Email sau parola incorecte' })
    }

    const parolaCorecta = bcrypt.compareSync(parola, utilizator.parola)
    if (!parolaCorecta) {
        return res.status(401).json({ mesaj: 'Email sau parola incorecte' })
    }

    const token = jwt.sign(
        { id: utilizator.id, rol: utilizator.rol },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    )

    res.json({
        token,
        utilizator: {
            id: utilizator.id,
            nume: utilizator.nume,
            email: utilizator.email,
            rol: utilizator.rol
        }
    })
})

module.exports = router