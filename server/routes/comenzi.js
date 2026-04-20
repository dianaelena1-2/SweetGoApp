const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const Comanda = require('../models/Comanda')
const Produs = require('../models/Produs')
const Cofetarie = require('../models/Cofetarie')

// plasare comandă
router.post('/', verifyToken, verifyRol('client'), async (req, res) => {
    try {
        const { cofetarie_id, adresa_livrare, telefon, observatii, produse, este_cadou, mesaj_cadou, tip_transport, metoda_plata, status_plata, cost_livrare } = req.body

        if (!cofetarie_id || !adresa_livrare || !telefon || !produse || produse.length === 0) {
            return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
        }

        let total = 0
        let detaliiComanda = []

        // Verificam stocurile si calculam totalul
        for (const p of produse) {
            const produsDb = await Produs.findById(p.id);
            if (!produsDb) return res.status(404).json({ mesaj: `Produs invalid` });
            if (produsDb.stoc < p.cantitate) return res.status(400).json({ mesaj: `Stoc insuficient pentru ${produsDb.numeProdus}` });
            
            const pretFinal = produsDb.este_la_oferta ? (produsDb.pret * 0.6) : produsDb.pret;
            total += pretFinal * p.cantitate;

            detaliiComanda.push({
                produs_id: produsDb._id,
                numeProdus: produsDb.numeProdus,
                cantitate: p.cantitate,
                pret_unitar: pretFinal,
                optiune_decor: p.optiune_decor,
                observatii: p.observatii
            });
        }

        const totalComanda = total + (cost_livrare || 0);

        const comandaNoua = await Comanda.create({
            client_id: req.utilizator.id,
            cofetarie_id, adresa_livrare, telefon, observatii, 
            total: totalComanda, cost_livrare, este_cadou, mesaj_cadou, 
            tip_transport, metoda_plata, status_plata,
            detalii: detaliiComanda // Detaliile intra direct in documentul comenzii!
        });

        // Scadem stocurile
        for (const p of produse) {
            await Produs.findByIdAndUpdate(p.id, { $inc: { stoc: -p.cantitate } });
        }

        res.status(201).json({ mesaj: 'Comanda plasata cu succes', id: comandaNoua._id });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare interna la plasarea comenzii' }); }
})

// istoric comenzi client
router.get('/istoricul-meu', verifyToken, verifyRol('client'), async (req, res) => {
    try {
        const comenzi = await Comanda.find({ client_id: req.utilizator.id })
            .populate('cofetarie_id', 'numeCofetarie')
            .populate('detalii.produs_id', 'imagine numeProdus')
            .sort({ createdAt: -1 });
        res.json(comenzi);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
})

// comenzile unei cofetării
router.get('/cofetarie', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        const comenzi = await Comanda.find({ cofetarie_id: cofetarie._id })
            .populate('client_id', 'nume')
            .populate('detalii.produs_id', 'imagine numeProdus')
            .sort({ createdAt: -1 });
        res.json(comenzi);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
})

// actualizare status comandă
router.put('/:id/status', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const statusValide = ['confirmata', 'in_preparare', 'in_livrare', 'livrata', 'anulata'];
        if (!statusValide.includes(req.body.status)) return res.status(400).json({ mesaj: 'Status invalid' });

        await Comanda.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ mesaj: 'Status actualizat' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
})

// anulare comandă client
router.put('/:id/anulare-client', verifyToken, verifyRol('client'), async (req, res) => {
    try {
        const comanda = await Comanda.findOne({ _id: req.params.id, client_id: req.utilizator.id });
        if (!comanda) return res.status(404).json({ mesaj: 'Comanda nu a fost găsită.' });
        if (comanda.status !== 'plasata') return res.status(400).json({ mesaj: 'Comanda nu mai poate fi anulată.' });

        // Punem la loc stocurile
        for (const detaliu of comanda.detalii) {
            await Produs.findByIdAndUpdate(detaliu.produs_id, { $inc: { stoc: detaliu.cantitate } });
        }

        comanda.status = 'anulata';
        await comanda.save();

        res.json({ mesaj: 'Comanda a fost anulată.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
})

module.exports = router;