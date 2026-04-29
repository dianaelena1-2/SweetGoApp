const axios = require('axios');

const trimiteEmail = async (destinatar, subiect, continutHtml) => {
    try {
        // Configurăm structura cerută de Brevo
        const dateCatreBrevo = {
            sender: {
                name: "Echipa SweetGo",
                email: process.env.EMAIL_USER // Aceasta trebuie să fie adresa verificată în Brevo
            },
            to: [
                { email: destinatar }
            ],
            subject: subiect,
            htmlContent: continutHtml
        };

        // Adăugăm cheia ta de securitate
        const config = {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        };

        // Trimitem cererea către serverele lor (prin HTTPS, nu poate fi blocată)
        await axios.post('https://api.brevo.com/v3/smtp/email', dateCatreBrevo, config);
        
        console.log(`✅ Email trimis cu succes către ${destinatar} via Brevo!`);
        return true;

    } catch (error) {
        // Afișăm eroarea exactă dacă ceva merge prost
        console.error(`❌ Eroare Brevo către ${destinatar}:`, error.response?.data || error.message);
        return false;
    }
};

module.exports = { trimiteEmail };