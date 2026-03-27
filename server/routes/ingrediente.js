const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

//afisare ingrediente sortate alfabetic
router.get('/', verifyToken, (req, res) => {
    try {
        const ingrediente = db.prepare('SELECT * FROM ingrediente ORDER BY nume ASC').all();
        res.json(ingrediente);
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la server' });
    }
});

router.post('/', verifyToken, (req, res) => {
    const { nume } = req.body;
    if (!nume) return res.status(400).json({ mesaj: 'Numele este obligatoriu' });

    try {
        const numeCurat = nume.trim().toLowerCase();
        // INSERT OR IGNORE ca să nu crape dacă există deja
        db.prepare('INSERT OR IGNORE INTO ingrediente (nume) VALUES (?)').run(numeCurat);
        
        // Luăm ID-ul ca să-l trimitem înapoi la frontend pentru auto-selecție
        const record = db.prepare('SELECT id FROM ingrediente WHERE nume = ?').get(numeCurat);
        
        res.json({ id: record.id, nume: numeCurat });
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la salvarea ingredientului' });
    }
});

module.exports = router;