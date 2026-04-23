const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const Cofetarie = require('../models/Cofetarie')
const Recenzie = require('../models/Recenzie')
const Produs = require('../models/Produs')
const Comanda = require('../models/Comanda')

// afisare cofetarii publice (cu calcul rating)
router.get('/', async (req, res) => {
    try {
        const cofetarii = await Cofetarie.find({ status: 'aprobata' }).lean();
        
        // Calculam media recenziilor pentru fiecare (in MongoDB e mai eficient sa facem asta cu Aggregation, dar o facem asa pentru inceput ca sa fie codul usor de inteles)
        for(let cof of cofetarii) {
            const recenzii = await Recenzie.find({ cofetarie_id: cof._id });
            cof.numar_recenzii = recenzii.length;
            cof.rating_mediu = recenzii.length > 0 ? (recenzii.reduce((acc, curr) => acc + curr.rating, 0) / recenzii.length) : null;
        }

        res.json(cofetarii);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare la server' }); }
});

// afisare recenzii pentru o cofetarie (public)
router.get('/:id/toate-recenziile', async (req, res) => {
    try {
        const recenzii = await Recenzie.find({ cofetarie_id: req.params.id })
            .populate('client_id', 'nume')
            .sort({ createdAt: -1 });
        res.json(recenzii);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare la server' }); }
});

// afisare recenzii pentru dashboard-ul cofetariei
router.get('/recenzii', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' });

        const recenzii = await Recenzie.find({ cofetarie_id: cofetarie._id })
            .populate('client_id', 'nume email')
            .sort({ createdAt: -1 });

        const ratingMediu = recenzii.length > 0 ? (recenzii.reduce((acc, curr) => acc + curr.rating, 0) / recenzii.length) : 0;

        res.json({ recenzii, ratingMediu, totalRecenzii: recenzii.length });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare la server' }); }
});

// detalii cofetarie si produsele ei
router.get('/:id', async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findById(req.params.id).lean();
        if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' });

        const recenzii = await Recenzie.find({ cofetarie_id: cofetarie._id });
        cofetarie.numar_recenzii = recenzii.length;
        cofetarie.rating_mediu = recenzii.length > 0 ? (recenzii.reduce((a, c) => a + c.rating, 0) / recenzii.length) : null;

        const produse = await Produs.find({ cofetarie_id: cofetarie._id, disponibil: true });

        res.json({ cofetarie, produse });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare la server' }); }
});

// adaugare recenzie client
router.post('/:id/recenzii', verifyToken, verifyRol('client'), async (req, res) => {
    try {
        const { rating, comentariu, comanda_id } = req.body;
        
        const exista = await Recenzie.findOne({ comanda_id });
        if (exista) return res.status(400).json({ mesaj: 'Ai lăsat deja o recenzie pentru această comandă.' });

        await Recenzie.create({
            client_id: req.utilizator.id,
            cofetarie_id: req.params.id,
            comanda_id, rating, comentariu
        });

        await Comanda.findByIdAndUpdate(comanda_id, { are_recenzie: true });

        res.json({ mesaj: 'Recenzie adăugată cu succes!' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare internă de server' }); }
});

module.exports = router;