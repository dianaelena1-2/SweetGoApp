const express = require('express');
const router = express.Router();
const Produs = require('../models/Produs');

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeazaText(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function creazaPatternDiacritice(text) {
    const harta = {
        'a': '[aăâ]',
        'i': '[iî]',
        's': '[sș]',
        't': '[tț]'
    };
    return text.split('').map(ch => harta[ch.toLowerCase()] || ch).join('');
}

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ reply: 'Te rog trimite un mesaj valid.' });
        }

        const msg = normalizeazaText(message.toLowerCase());

        let reply = "Scuze, nu am înțeles. Întreabă-mă despre produse sau oferte!";

        if (msg.includes('ciocolata')) {
            const produseCiocolata = await Produs.find({
                disponibil: true,
                ingrediente: { $regex: 'ciocolata', $options: 'i' }
            })
                .populate('cofetarie_id', 'numeCofetarie')
                .sort({ pret: 1 })
                .limit(20);

            if (produseCiocolata.length > 0) {
                const listaCiocolata = produseCiocolata.map(p => {
                    const numeCofetarie = p.cofetarie_id ? p.cofetarie_id.numeCofetarie : "o cofetărie parteneră";
                    return `${p.numeProdus} (de la cofetăria ${numeCofetarie})`;
                }).join(', ');

                reply = `Avem următoarele produse cu ciocolată: ${listaCiocolata}.`;
            } else {
                reply = "Momentan nu avem produse cu ciocolată.";
            }
        }
        else if (msg.includes('oferta') || msg.includes('risipa')) {
            const oferte = await Produs.find({
                disponibil: true,
                este_la_oferta: true
            })
                .populate('cofetarie_id', 'numeCofetarie')
                .sort({ pret: 1 })
                .limit(20);

            reply = oferte.length > 0
                ? `Avem aceste oferte anti-risipă: ${oferte.map(p => p.numeProdus).join(', ')}`
                : "Momentan nu avem oferte active.";
        }
        else if (msg.includes('salut')) {
            reply = "Salut! Sunt SweetBot. Te pot ajuta cu lista de produse sau oferte!";
        }
        else if (msg.includes('ieftin') || msg.includes('pret')) {
            const produse = await Produs.find({ disponibil: true })
                .populate('cofetarie_id', 'numeCofetarie')
                .sort({ pret: 1 })
                .limit(20);

            if (produse.length > 0) {
                const pretMinim = produse[0].pret;
                const celeMaiIeftine = produse.filter(p => p.pret === pretMinim);

                const listaProduse = celeMaiIeftine
                    .map(p => {
                        const numeCofetarie = p.cofetarie_id ? p.cofetarie_id.numeCofetarie : "o cofetărie parteneră";
                        return `\n- ${p.numeProdus} (de la cofetăria ${numeCofetarie}): ${p.pret} RON`;
                    })
                    .join('');

                reply = `Cele mai ieftine produse (la prețul de ${pretMinim} RON) sunt:${listaProduse}`;
            } else {
                reply = "Momentan nu am informații despre prețuri.";
            }
        }

        if (reply === "Scuze, nu am înțeles. Întreabă-mă despre produse sau oferte!") {
            const cuvinteInterzise = [
                'vreau', 'ceva', 'cu', 'as', 'avea', 'intreb', 'despre',
                'un', 'o', 'sa', 'pentru', 'care', 'mai', 'daca', 'buna',
                'ziua', 'salut', 'te', 'rog', 'mi', 'da', 'ai', 'are',
                'este', 'sunt', 'si', 'sau', 'la', 'de', 'din', 'in',
                'pe', 'nu', 'ma', 'imi', 'aş', 'as', 'dori', 'doresc'
            ];

            const cuvinteMesaj = msg.split(/\s+/).filter(Boolean);
            const cuvantCheie = cuvinteMesaj.find(w => w.length >= 3 && !cuvinteInterzise.includes(w));

            if (cuvantCheie) {
                const cuvantSigur = escapeRegex(cuvantCheie);
                const patternCuDiacritice = creazaPatternDiacritice(cuvantSigur);

                const produsGasit = await Produs.findOne({
                    disponibil: true,
                    $or: [
                        { numeProdus: { $regex: patternCuDiacritice, $options: 'i' } },
                        { ingrediente: { $regex: patternCuDiacritice, $options: 'i' } }
                    ]
                }).populate('cofetarie_id', 'numeCofetarie');

                if (produsGasit) {
                    const numeCofetarie = produsGasit.cofetarie_id ? produsGasit.cofetarie_id.numeCofetarie : "o cofetărie parteneră";
                    reply = `Am găsit ceva cu ${cuvantCheie}: ${produsGasit.numeProdus} la ${numeCofetarie}, la ${produsGasit.pret} RON.`;
                }
            }
        }

        res.status(200).json({ reply });

    } catch (error) {
        console.error('Eroare chatbot local:', error);
        res.status(500).json({ reply: 'Eroare internă.' });
    }
});

module.exports = router;