const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//afisare cofetarii
router.get('/', (req, res) => {
    const cofetarii = db.prepare(`
        SELECT c.id, c.numeCofetarie, c.adresa, c.telefon, c.descriere,
               AVG(r.rating) as rating_mediu, 
               COUNT(r.id) as numar_recenzii
        FROM cofetarii c
        LEFT JOIN recenzii r ON c.id = r.cofetarie_id
        WHERE c.status = 'aprobata'
        GROUP BY c.id
    `).all()
    res.json(cofetarii)
})

//detalii cofetarie
router.get('/:id', (req, res) => {
    const { id } = req.params
    const cofetarie = db.prepare(`
        SELECT c.*, AVG(r.rating) as rating_mediu, COUNT(r.id) as numar_recenzii
        FROM cofetarii c
        LEFT JOIN recenzii r ON c.id = r.cofetarie_id
        WHERE c.id = ? AND c.status = 'aprobata'
        GROUP BY c.id
    `).get(id)

    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    const produse = db.prepare(`
        SELECT * FROM produse WHERE cofetarie_id = ? AND disponibil = 1
    `).all(id)

    res.json({ cofetarie, produse })
})

//adaugare recenzie
router.post('/:id/recenzii', verifyToken, verifyRol('client'), (req, res) => {
    const { id } = req.params
    const { rating, comentariu } = req.body

    const comenziClient = db.prepare(`
        SELECT * FROM comenzi 
        WHERE client_id = ? AND cofetarie_id = ? AND status = 'livrata'
    `).get(req.utilizator.id, id)

    if (!comenziClient) {
        return res.status(403).json({ mesaj: 'Poti da recenzii doar la cofetarii de la care ai comandat' })
    }

    const recenzieExistenta = db.prepare(`
        SELECT * FROM recenzii WHERE client_id = ? AND cofetarie_id = ?
    `).get(req.utilizator.id, id)

    if (recenzieExistenta) {
        return res.status(400).json({ mesaj: 'Ai dat deja recenzie la aceasta cofetarie' })
    }

    db.prepare(`
        INSERT INTO recenzii (client_id, cofetarie_id, rating, comentariu)
        VALUES (?, ?, ?, ?)
    `).run(req.utilizator.id, id, rating, comentariu)

    res.status(201).json({ mesaj: 'Recenzie adaugata cu succes' })
})

module.exports = router