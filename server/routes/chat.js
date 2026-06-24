const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Produs = require('../models/Produs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ mesaj: 'Te rog să trimiți un mesaj.' });
        }

        const produseDisponibile = await Produs.find({ disponibil: true })
            .populate('cofetarie_id', 'numeCofetarie')
            .limit(40);

        let meniuText = 'Momentan nu avem produse disponibile în platformă.';
        
        if (produseDisponibile.length > 0) {
            meniuText = produseDisponibile.map(p => {
                const numeCofetarie = p.cofetarie_id ? p.cofetarie_id.numeCofetarie : 'Cofetărie';
                const ingrediente = p.ingrediente && p.ingrediente.length > 0 ? p.ingrediente.join(', ') : 'Nespecificat';
                
                const pretFinal = p.este_la_oferta ? (p.pret * 0.6).toFixed(2) : p.pret.toFixed(2);
                const alertaOferta = p.este_la_oferta ? ' [Ofertă Anti-Risipă -40%]' : '';

                return `- ${p.numeProdus} de la ${numeCofetarie} | Preț: ${pretFinal} RON ${alertaOferta} | Ingrediente: ${ingrediente} | Categorie: ${p.categorie}`;
            }).join('\n');
        }

        //Setez comportamentul botului
        const systemInstruction = `
            Ești asistentul virtual al platformei de livrări prăjituri "SweetGo".
            Numele tău este SweetBot. Rolul tău este să ajuți clienții să aleagă prăjituri și să le oferi detalii.

            Reguli stricte:
            1. NU inventa produse, cofetării sau prețuri. Oferă informații DOAR din "Lista Produselor" de mai jos.
            2. Dacă un utilizator întreabă ceva ce nu se află în listă, spune-i politicos că momentan nu avem acel produs.
            3. Răspunde pe scurt, politicos și folosește emoji-uri potrivite.

            --- LISTA PRODUSELOR DISPONIBILE ACUM ---
            ${meniuText}
            ------------------------------------------
            `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();

        res.status(200).json({ reply: responseText });

    } catch (error) {
        console.error('[CHAT API] Eroare:', error);
        res.status(500).json({ mesaj: 'Eroare la procesarea mesajului.' });
    }
});

module.exports = router;