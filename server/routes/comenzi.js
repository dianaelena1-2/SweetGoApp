const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//plasare comanda
router.post('/', verifyToken, verifyRol('client'), (req,res) => {
    const { cofetarie_id, adresa_livrare, produse } = req.body

    if (!cofetarie_id || !adresa_livrare || !produse || produse.length === 0) {
        return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
    }

    let total = 0
    for (const produs of produse) {
        const produsDb = db.prepare('SELECT * FROM produse WHERE id = ?').get(produs.id)
        if (!produsDb) {
            return res.status(404).json({ mesaj: `Produsul cu id ${produs.id} nu exista` })
        }
        total += produsDb.pret * produs.cantitate
    }

    const comanda = db.prepare(`
        INSERT INTO comenzi (client_id, cofetarie_id, adresa_livrare, total)
        VALUES (?, ?, ?, ?)
    `).run(req.utilizator.id, cofetarie_id, adresa_livrare, total)

    const comandaId = comanda.lastInsertRowid

    for (const produs of produse) {
        const produsDb = db.prepare('SELECT * FROM produse WHERE id = ?').get(produs.id)
        db.prepare(`
            INSERT INTO detalii_comanda (comanda_id, produs_id, cantitate, pret_unitar)
            VALUES (?, ?, ?, ?)
        `).run(comandaId, produs.id, produs.cantitate, produsDb.pret)
    }

    res.status(201).json({ mesaj: 'Comanda plasata cu succes', id: comandaId })
})

//istoric comenzi client
router.get('/istoricul-meu',verifyToken, verifyRol('client'), (req,res) => {
    const comenzi = db.prepare(`
        SELECT c.*, co.numeCofetarie 
        FROM comenzi c
        JOIN cofetarii co ON c.cofetarie_id = co.id
        WHERE c.client_id = ?
        ORDER BY c.creat_la DESC
    `).all(req.utilizator.id)

    res.json(comenzi)
})

//comenzile unei cofetarii
router.get('/cofetarie', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)

    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    const comenzi = db.prepare(`
        SELECT c.*, u.nume as numeClient
        FROM comenzi c
        JOIN utilizatori u ON c.client_id = u.id
        WHERE c.cofetarie_id = ?
        ORDER BY c.creat_la DESC
    `).all(cofetarie.id)

    res.json(comenzi)
})

//actualizare status comanda
router.put('/:id/status', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const { id } = req.params
    const { status } = req.body

    const statusValide = ['confirmata', 'in_preparare', 'in_livrare', 'livrata', 'anulata']
    if (!statusValide.includes(status)) {
        return res.status(400).json({ mesaj: 'Status invalid' })
    }

    db.prepare('UPDATE comenzi SET status = ? WHERE id = ?').run(status, id)
    res.json({ mesaj: 'Status actualizat' })
})

module.exports = router