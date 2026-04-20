const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//verifica cofetariile in asteptare
router.get('/cofetarii/in-asteptare',verifyToken, verifyRol('admin'), (req,res) => {
    const cofetarii = db.prepare(`
        SELECT c.*, u.nume, u.email
        FROM cofetarii c
        JOIN utilizatori u ON c.utilizator_id = u.id
        WHERE c.status = 'in_asteptare'
    `).all()

    res.json(cofetarii)
})

//aprobare cofetarie
router.put('/cofetarii/:id/aprobare',verifyToken, verifyRol('admin'), (req,res) => {
    const { id } = req.params

    db.prepare(`
        UPDATE cofetarii SET status = 'aprobata' WHERE id = ?
    `).run(id)

    res.json({ mesaj: 'Cofetaria a fost aprobata' })
})

//respingere cofetarie
router.put('/cofetarii/:id/respingere',verifyToken,verifyRol('admin'),(req,res) => {
    const { id } = req.params

    db.prepare(`
        UPDATE cofetarii SET status = 'respinsa' WHERE id = ?
    `).run(id)

    res.json({ mesaj: 'Cofetaria a fost respinsa' })
})

//afisare utilizatori
router.get('/utilizatori',verifyToken,verifyRol('admin'),(req,res) => {
    const utilizatori = db.prepare(`
        SELECT id, nume, email, rol, creat_la FROM utilizatori
    `).all()

    res.json(utilizatori)
})

//stergere utilizator
router.delete('/utilizatori/:id', verifyToken, verifyRol('admin'), (req, res) => {
    const { id } = req.params;
    
    const user = db.prepare('SELECT id, rol FROM utilizatori WHERE id = ?').get(id);
    if (!user) {
        return res.status(404).json({ mesaj: 'Utilizatorul nu a fost găsit.' });
    }
    if (user.rol === 'admin') {
        return res.status(403).json({ mesaj: 'Nu poți șterge un administrator.' });
    }
    
    try {
        if (user.rol === 'cofetarie') {
            db.prepare('DELETE FROM cofetarii WHERE utilizator_id = ?').run(id);
        }
        db.prepare('DELETE FROM utilizatori WHERE id = ?').run(id);
        
        res.json({ mesaj: 'Utilizator șters cu succes.' });
    } catch (err) {
        console.error('Eroare la ștergerea utilizatorului:', err);
        res.status(500).json({ mesaj: 'Eroare internă la ștergere.' });
    }
});

module.exports = router