const express = require('express');
const router = express.Router();
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
            if (produse.length > 0) {
                const pretMinim = produse[0].pret; 
   
                const celeMaiIeftine = produse.filter(p => p.pret === pretMinim);
              
                const listaProduse = celeMaiIeftine
                    .map(p => `\n- ${p.numeProdus}: ${p.pret} RON`)
                    .join('');
                
                reply = `Cele mai ieftine produse (la prețul de ${pretMinim} RON) sunt:${listaProduse}`;
            } else {
                reply = "Momentan nu am informații despre prețuri.";
            }
        }

        if (reply === "Scuze, nu am înțeles. Întreabă-mă despre produse sau oferte!") {
            const produsGasit = await Produs.findOne({
                $or: [
                    { numeProdus: { $regex: msg, $options: 'i' } },
                    { ingrediente: { $in: [new RegExp(msg, 'i')] } }
                ]
            }).populate('cofetarie_id', 'numeCofetarie');

            if (produsGasit) {
                const numeCofetarie = produsGasit.cofetarie_id 
                    ? produsGasit.cofetarie_id.numeCofetarie 
                    : "o cofetărie parteneră";

                reply = `Am găsit ${produsGasit.numeProdus} la ${numeCofetarie}, la prețul de ${produsGasit.pret} RON. Îl dorești în coș?`;
            }
        }
        res.status(200).json({ reply });

    } catch (error) {
        console.error('Eroare chatbot local:', error);
        res.status(500).json({ reply: 'Eroare internă.' });
    }
});

module.exports = router;