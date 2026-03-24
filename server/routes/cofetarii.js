const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')

//afisare cofetarii
router.get('/', (req, res) => {
    const cofetarii = db.prepare(`
        SELECT c.id, c.numeCofetarie, c.adresa, c.telefon, c.imagine_coperta,
               AVG(r.rating) as rating_mediu, 
               COUNT(r.id) as numar_recenzii
        FROM cofetarii c
        LEFT JOIN recenzii r ON c.id = r.cofetarie_id
        WHERE c.status = 'aprobata'
        GROUP BY c.id
    `).all()
    res.json(cofetarii)
});

router.get('/:id/toate-recenziile', (req, res) => {
    const { id } = req.params;
    try {
        const recenzii = db.prepare(`
            SELECT r.*, u.nume as numeClient 
            FROM recenzii r
            JOIN utilizatori u ON r.client_id = u.id
            WHERE r.cofetarie_id = ?
            ORDER BY r.creat_la DESC
        `).all(id);
        res.json(recenzii);
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la server' });
    }
});

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
    const cofetarie_id = req.params.id;
    const { rating, comentariu, comanda_id } = req.body;
    
    // Acum req.utilizator va fi populat de middleware
    const client_id = req.utilizator.id; 

    try {
        // Verificăm dacă utilizatorul a lăsat deja recenzie pentru această comandă
        const exista = db.prepare('SELECT id FROM recenzii WHERE comanda_id = ?').get(comanda_id);
        if (exista) {
            return res.status(400).json({ mesaj: 'Ai lăsat deja o recenzie pentru această comandă.' });
        }

        db.prepare(`
            INSERT INTO recenzii (client_id, cofetarie_id, comanda_id, rating, comentariu) 
            VALUES (?, ?, ?, ?, ?)
        `).run(client_id, cofetarie_id, comanda_id, rating, comentariu);

        res.json({ mesaj: 'Recenzie adăugată cu succes!' });
    } catch (err) {
        console.error('Eroare la salvarea recenziei:', err);
        res.status(500).json({ mesaj: 'Eroare internă de server' });
    }
});

module.exports = router