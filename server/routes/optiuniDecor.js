const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//optiuni decor pentru un produs
router.get('/produs/:id', (req, res) => {
    const { id } = req.params
    const optiuni = db.prepare('SELECT * FROM optiuni_decor WHERE produs_id = ?').all(id)
    res.json(optiuni)
})

//adauga optiune decor
router.post('/', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const { produs_id, denumire } = req.body

    if (!produs_id || !denumire) {
        return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
    }

    // verifica ca produsul apartine cofetariei
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)
    const produs = db.prepare('SELECT * FROM produse WHERE id = ? AND cofetarie_id = ?').get(produs_id, cofetarie.id)

    if (!produs) {
        return res.status(403).json({ mesaj: 'Produsul nu iti apartine' })
    }

    const rezultat = db.prepare('INSERT INTO optiuni_decor (produs_id, denumire) VALUES (?, ?)').run(produs_id, denumire)
    res.status(201).json({ mesaj: 'Optiune adaugata', id: rezultat.lastInsertRowid })
})

//sterge optiune decor
router.delete('/:id', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const { id } = req.params
    db.prepare('DELETE FROM optiuni_decor WHERE id = ?').run(id)
    res.json({ mesaj: 'Optiune stearsa' })
})

module.exports = router