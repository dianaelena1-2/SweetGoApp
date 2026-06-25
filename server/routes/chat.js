const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const Produs = require('../models/Produs');

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        const msg = message.toLowerCase();

        const produse = await Produs.find({ disponibil: true })
                                    .populate('cofetarie_id','numeCofetarie')
                                    .sort({pret: 1})
                                    .limit(10);

        let reply = "Scuze, nu am înțeles. Întreabă-mă despre produse sau oferte!";

        if (msg.includes('ciocolată')) {
            const produseCiocolata = produse.filter(p => p.ingrediente.some(i => i.toLowerCase().includes('ciocolata')));
            reply = produseCiocolata.length > 0 
                ? `Avem următoarele produse cu ciocolată: ${produseCiocolata.map(p => p.numeProdus).join(', ')}`
                : "Momentan nu avem produse cu ciocolată.";
        } 
        else if (msg.includes('ofertă') || msg.includes('risipă')) {
            const oferte = produse.filter(p => p.este_la_oferta);
            reply = oferte.length > 0 
                ? `Avem aceste oferte anti-risipă: ${oferte.map(p => p.numeProdus).join(', ')}`
                : "Momentan nu avem oferte active.";
        }
        else if (msg.includes('salut')) {
            reply = "Salut! Sunt SweetBot. Te pot ajuta cu lista de produse sau oferte!";
        }
        else if (msg.includes('ieftin') || msg.includes('preț')) {
            reply = `Cele mai ieftine produse de azi sunt: ${produse.map(p => p.numeProdus).join(', ')}.`;
        }

        res.status(200).json({ reply });

    } catch (error) {
        console.error('Eroare chatbot local:', error);
        res.status(500).json({ reply: 'Eroare internă.' });
    }
});

module.exports = router;