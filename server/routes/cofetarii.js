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

//afisare recenzii
router.get('/recenzii', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id);
    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' });
    }

    const recenzii = db.prepare(`
        SELECT r.*, u.nume as numeClient, u.email
        FROM recenzii r
        JOIN utilizatori u ON r.client_id = u.id
        WHERE r.cofetarie_id = ?
        ORDER BY r.creat_la DESC
    `).all(cofetarie.id);
    
    const ratingMediu = db.prepare(`
        SELECT AVG(rating) as medie FROM recenzii WHERE cofetarie_id = ?
    `).get(cofetarie.id).medie || 0;

    res.json({ recenzii, ratingMediu, totalRecenzii: recenzii.length });
});

//detalii cofetarie
router.get('/:id', (req, res) => {
    db.actualizeazaDisponibilitateProduse();
    const { id } = req.params;

    try {
        const cofetarie = db.prepare(`
            SELECT *, 
            (SELECT AVG(rating) FROM recenzii WHERE cofetarie_id = ?) as rating_mediu,
            (SELECT COUNT(*) FROM recenzii WHERE cofetarie_id = ?) as numar_recenzii
            FROM cofetarii WHERE id = ?
        `).get(id, id, id);

        if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' });

        const produseRaw = db.prepare('SELECT * FROM produse WHERE cofetarie_id = ?').all(id);

        const produseCuIngrediente = produseRaw.map(p => {
            const ingrediente = db.prepare(`
                SELECT i.id, i.nume 
                FROM ingrediente i
                JOIN compozitieProdus cp ON i.id = cp.ingredient_id
                WHERE cp.produs_id = ?
            `).all(p.id);
            
            return { ...p, ingrediente }; 
        });

        res.json({
            cofetarie,
            produse: produseCuIngrediente 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ mesaj: 'Eroare la server' });
    }
});

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