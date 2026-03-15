const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//plasare comanda
router.post('/', verifyToken, verifyRol('client'), (req,res) => {
    const { cofetarie_id, adresa_livrare, telefon, observatii, produse } = req.body

    if (!cofetarie_id || !adresa_livrare || !telefon || !produse || produse.length === 0) {
        return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
    }

    let total = 0
    for (const produs of produse) {
        const produsDb = db.prepare('SELECT * FROM produse WHERE id = ?').get(produs.id)
        if (!produsDb) {
            return res.status(404).json({ mesaj: `Produsul cu id ${produs.id} nu exista` })
        }
        if (produsDb.stoc < produs.cantitate) {
            return res.status(400).json({ mesaj: `Stoc insuficient pentru ${produsDb.numeProdus}` })
        }
        total += produsDb.pret * produs.cantitate
    }

    const comanda = db.prepare(`
        INSERT INTO comenzi (client_id, cofetarie_id, adresa_livrare, telefon, observatii, total)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.utilizator.id, cofetarie_id, adresa_livrare, telefon, observatii || '', total)

    const comandaId = comanda.lastInsertRowid

    for (const produs of produse) {
        const produsDb = db.prepare('SELECT * FROM produse WHERE id = ?').get(produs.id)
        db.prepare(`
            INSERT INTO detalii_comanda (comanda_id, produs_id, cantitate, pret_unitar, optiune_decor, observatii)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(comandaId, produs.id, produs.cantitate, produsDb.pret, produs.optiune_decor || null, produs.observatii || null)
        // scade stocul
        db.prepare('UPDATE produse SET stoc = stoc - ? WHERE id = ?').run(produs.cantitate, produs.id)
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

    const comenziCuProduse = comenzi.map(comanda => {
        const produse = db.prepare(`
            SELECT dc.cantitate, dc.pret_unitar, dc.optiune_decor, dc.observatii, p.numeProdus, p.imagine
            FROM detalii_comanda dc
            JOIN produse p ON dc.produs_id = p.id
            WHERE dc.comanda_id = ?
        `).all(comanda.id)
        return { ...comanda, produse }
    })

    res.json(comenziCuProduse)
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

    const comenziCuProduse = comenzi.map(comanda => {
        const produse = db.prepare(`
            SELECT dc.cantitate, dc.pret_unitar, dc.optiune_decor, dc.observatii, p.numeProdus, p.imagine
            FROM detalii_comanda dc
            JOIN produse p ON dc.produs_id = p.id
            WHERE dc.comanda_id = ?
        `).all(comanda.id)
        return { ...comanda, produse }
    })

    res.json(comenziCuProduse)
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