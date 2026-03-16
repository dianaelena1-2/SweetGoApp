const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

router.get('/cofetarie', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)

    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    const comenziNoi = db.prepare(`
        SELECT COUNT(*) as total FROM comenzi 
        WHERE cofetarie_id = ? AND status = 'plasata'
    `).get(cofetarie.id).total

    const comenziInCurs = db.prepare(`
        SELECT COUNT(*) as total FROM comenzi 
        WHERE cofetarie_id = ? AND status IN ('confirmata', 'in_preparare', 'in_livrare')
    `).get(cofetarie.id).total

    const totalIncasari = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total FROM comenzi 
        WHERE cofetarie_id = ? AND status = 'livrata'
    `).get(cofetarie.id).total

    const produseActive = db.prepare(`
        SELECT COUNT(*) as total FROM produse 
        WHERE cofetarie_id = ? AND disponibil = 1
    `).get(cofetarie.id).total

    const ultimeleComenzi = db.prepare(`
        SELECT c.*, u.nume as numeClient
        FROM comenzi c
        JOIN utilizatori u ON c.client_id = u.id
        WHERE c.cofetarie_id = ?
        ORDER BY c.creat_la DESC
        LIMIT 5
    `).all(cofetarie.id)

    res.json({ comenziNoi, comenziInCurs, totalIncasari, produseActive, ultimeleComenzi })
})

router.get('/admin', verifyToken, verifyRol('admin'), (req, res) => {
    const totalUtilizatori = db.prepare('SELECT COUNT(*) as total FROM utilizatori WHERE rol != ?').get('admin').total
    const totalCofetarii = db.prepare('SELECT COUNT(*) as total FROM cofetarii WHERE status = ?').get('aprobata').total
    const totalComenzi = db.prepare('SELECT COUNT(*) as total FROM comenzi').get().total
    const totalIncasari = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM comenzi WHERE status = ?').get('livrata').total
    const cofetariiInAsteptare = db.prepare(`
        SELECT c.*, u.nume, u.email
        FROM cofetarii c
        JOIN utilizatori u ON c.utilizator_id = u.id
        WHERE c.status = 'in_asteptare'
        ORDER BY c.id DESC
    `).all()

    res.json({ totalUtilizatori, totalCofetarii, totalComenzi, totalIncasari, cofetariiInAsteptare })
})

module.exports = router