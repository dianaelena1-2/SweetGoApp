const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const Produs = require('../models/Produs');

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

        // ----- Folosim axios direct (fără SDK) -----
        const fullPrompt = systemInstruction + "\n\nÎntrebarea utilizatorului: " + message;

        let attempts = 0;
        const maxAttempts = 5;
        let response = null;
        let lastError = null;

        while (attempts < maxAttempts) {
            try {
                response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{ parts: [{ text: fullPrompt }] }]
                    }
                );
                break;
            } catch (error) {
                attempts++;
                lastError = error;
                
                if (error.response?.status === 429 && attempts < maxAttempts) {
                    const delay = Math.pow(2, attempts) * 1000; 
                    console.log(`🔄 Retry ${attempts}/${maxAttempts} după ${delay}ms (429 Too Many Requests)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }

        if (!response) {
            throw lastError || new Error('Nu s-a primit răspuns după multiple încercări');
        }

        const responseText = response.data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply: responseText });

    } catch (error) {
        console.error('[CHAT API] Eroare:', error);
        res.status(500).json({ mesaj: 'Eroare la procesarea mesajului.' });
    }
});

module.exports = router;