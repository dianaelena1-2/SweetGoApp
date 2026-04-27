const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const Cofetarie = require('../models/Cofetarie')
const Recenzie = require('../models/Recenzie')
const Produs = require('../models/Produs')
const Comanda = require('../models/Comanda')
const { Client } = require('@googlemaps/google-maps-services-js')

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
//afisare distante
router.get('/distante', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ mesaj: 'Coordonatele (lat, lng) sunt obligatorii' });
        }

        const cofetarii = await Cofetarie.find({
            status: 'aprobata',
            lat: { $exists: true, $ne: null },
            lng: { $exists: true, $ne: null }
        }).lean();

        if (cofetarii.length === 0) return res.json([]);

        const destinations = cofetarii.map(c => `${c.lat},${c.lng}`);

        const client = new Client({});
        const response = await client.distancematrix({
            params: {
                origins: [`${lat},${lng}`],
                destinations: destinations,
                key: process.env.GOOGLE_MAPS_API_KEY,
                units: 'metric',
            },
        });

        const elements = response.data.rows[0].elements;
        const rezultat = cofetarii.map((cof, i) => ({
            ...cof,
            distanta_text: elements[i]?.distance?.text || null,
            distanta_valoare: elements[i]?.distance?.value || null,
            durata_text: elements[i]?.duration?.text || null,
            durata_valoare: elements[i]?.duration?.value || null,
        }));

        rezultat.sort((a, b) => (a.distanta_valoare || Infinity) - (b.distanta_valoare || Infinity));
        res.json(rezultat);
    } catch (error) {
        console.error('Eroare calcul distanțe:', error);
        res.status(500).json({ mesaj: 'Eroare la calcularea distanțelor' });
    }
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