const express = require('express');
const router = express.Router();
const { verifyToken, verifyRol } = require('../middleware/auth');
const Comanda = require('../models/Comanda');
const Produs = require('../models/Produs');
const Cofetarie = require('../models/Cofetarie');
const User = require('../models/User');

router.get('/cofetarie', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });

        if (!cofetarie) {
            return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' });
        }

        const comenziNoi = await Comanda.countDocuments({ 
            cofetarie_id: cofetarie._id, 
            status: 'plasata' 
        });

        const comenziInCurs = await Comanda.countDocuments({ 
            cofetarie_id: cofetarie._id, 
            status: { $in: ['confirmata', 'in_preparare', 'in_livrare'] } 
        });

        const incasariAgg = await Comanda.aggregate([
            { $match: { cofetarie_id: cofetarie._id, status: 'livrata' } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const totalIncasari = incasariAgg.length > 0 ? incasariAgg[0].total : 0;

        const produseActive = await Produs.countDocuments({ 
            cofetarie_id: cofetarie._id, 
            disponibil: true 
        });

        const ultimeleComenziRaw = await Comanda.find({ cofetarie_id: cofetarie._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client_id', 'nume')
            .lean(); 

        const ultimeleComenzi = ultimeleComenziRaw.map(comanda => ({
            ...comanda,
            numeClient: comanda.client_id ? comanda.client_id.nume : 'Client Necunoscut'
        }));

        res.json({ numeCofetarie: cofetarie.numeCofetarie, comenziNoi, comenziInCurs, totalIncasari, produseActive, ultimeleComenzi });
    } catch (err) {
        console.error('Eroare dashboard cofetarie:', err);
        res.status(500).json({ mesaj: 'Eroare la incarcarea dashboard-ului' });
    }
});


router.get('/admin', verifyToken, verifyRol('admin'), async (req, res) => {
    try {
        const totalUtilizatori = await User.countDocuments({ rol: { $ne: 'admin' } });

        const totalCofetarii = await Cofetarie.countDocuments({ status: 'aprobata' });
   
        const totalComenzi = await Comanda.countDocuments();

        const incasariAgg = await Comanda.aggregate([
            { $match: { status: 'livrata' } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const totalIncasari = incasariAgg.length > 0 ? incasariAgg[0].total : 0;

        const cofetariiAsteptareRaw = await Cofetarie.find({ status: 'in_asteptare' })
            .sort({ createdAt: -1 })
            .populate('utilizator_id', 'nume email')
            .lean();

        const cofetariiInAsteptare = cofetariiAsteptareRaw.map(c => ({
            ...c,
            nume: c.utilizator_id ? c.utilizator_id.nume : 'N/A',
            email: c.utilizator_id ? c.utilizator_id.email : 'N/A'
        }));

        res.json({ totalUtilizatori, totalCofetarii, totalComenzi, totalIncasari, cofetariiInAsteptare });
    } catch (err) {
        console.error('Eroare dashboard admin:', err);
        res.status(500).json({ mesaj: 'Eroare la incarcarea dashboard-ului' });
    }
});

module.exports = router;