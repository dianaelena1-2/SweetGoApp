const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, verifyRol } = require('../middleware/auth');

router.use(verifyToken, verifyRol('client'));

//date profil
router.get('/profil', (req, res) => {
    const client = db.prepare('SELECT id, nume, email, adresa_default, telefon FROM utilizatori WHERE id = ?').get(req.utilizator.id);
    res.json(client);
});

//actualizare profil
router.put('/profil', (req, res) => {
    const { nume, email, adresa_default, telefon } = req.body;
    const clientId = req.utilizator.id;

    if (email) {
        const existing = db.prepare('SELECT id FROM utilizatori WHERE email = ? AND id != ?').get(email, clientId);
        if (existing) {
            return res.status(400).json({ mesaj: 'Acest email este deja folosit de alt cont.' });
        }
    }

    db.prepare('UPDATE utilizatori SET nume = COALESCE(?, nume), email = COALESCE(?, email), adresa_default = COALESCE(?, adresa_default), telefon = COALESCE(?, telefon) WHERE id = ?')
        .run(nume || null, email || null, adresa_default || null, telefon || null, clientId);
    
    res.json({ mesaj: 'Profil actualizat cu succes.' });
});

//schimbare parola
router.put('/parola', (req, res) => {
    const { parolaVeche, parolaNoua } = req.body;
    const clientId = req.utilizator.id;

    const user = db.prepare('SELECT parola FROM utilizatori WHERE id = ?').get(clientId);
    if (!bcrypt.compareSync(parolaVeche, user.parola)) {
        return res.status(401).json({ mesaj: 'Parola veche este incorectă.' });
    }

    const hashNou = bcrypt.hashSync(parolaNoua, 10);
    db.prepare('UPDATE utilizatori SET parola = ? WHERE id = ?').run(hashNou, clientId);
    res.json({ mesaj: 'Parola a fost schimbată cu succes.' });
});

//lista cofetariilor favorite
router.get('/favorite', (req, res) => {
    const favorite = db.prepare(`
        SELECT c.id, c.numeCofetarie, c.adresa, c.imagine_coperta,
               (SELECT AVG(rating) FROM recenzii WHERE cofetarie_id = c.id) as rating_mediu
        FROM cofetarii_favorite f
        JOIN cofetarii c ON f.cofetarie_id = c.id
        WHERE f.client_id = ? AND c.status = 'aprobata'
        ORDER BY f.creat_la DESC
    `).all(req.utilizator.id);
    res.json(favorite);
});

//adaugare cofetarie la favorite
router.post('/favorite/:cofetarieId', (req, res) => {
    const { cofetarieId } = req.params;
    const clientId = req.utilizator.id;

    const cofetarie = db.prepare(`SELECT id FROM cofetarii WHERE id = ? AND status = 'aprobata'`).get(cofetarieId);
    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetăria nu există sau nu este aprobată.' });
    }

    try {
        db.prepare('INSERT INTO cofetarii_favorite (client_id, cofetarie_id) VALUES (?, ?)').run(clientId, cofetarieId);
        res.json({ mesaj: 'Adăugată la favorite.' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            res.status(400).json({ mesaj: 'Cofetăria este deja în lista de favorite.' });
        } else {
            res.status(500).json({ mesaj: 'Eroare internă.' });
        }
    }
});

//elimina cofetarie de la favorite
router.delete('/favorite/:cofetarieId', (req, res) => {
    const { cofetarieId } = req.params;
    const clientId = req.utilizator.id;
    db.prepare('DELETE FROM cofetarii_favorite WHERE client_id = ? AND cofetarie_id = ?').run(clientId, cofetarieId);
    res.json({ mesaj: 'Eliminată din favorite.' });
});

//notificari
router.get('/notificari', (req, res) => {
    const notificari = db.prepare(`
        SELECT * FROM notificari 
        WHERE client_id = ? 
        ORDER BY data_creare DESC 
        LIMIT 50
    `).all(req.utilizator.id);
    res.json(notificari);
});

//notificare citita
router.put('/notificari/:id/citita', (req, res) => {
    const { id } = req.params;
    db.prepare('UPDATE notificari SET citita = 1 WHERE id = ? AND client_id = ?')
        .run(id, req.utilizator.id);
    res.json({ mesaj: 'Notificare marcată ca citită.' });
});

//numar notificari citite
router.get('/notificari/necitite/count', (req, res) => {
    const count = db.prepare(`
        SELECT COUNT(*) as count FROM notificari 
        WHERE client_id = ? AND citita = 0
    `).get(req.utilizator.id);
    res.json({ count: count.count });
});

module.exports = router;