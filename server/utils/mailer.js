const axios = require('axios');

const trimiteEmail = async (destinatar, subiect, continutHtml) => {
    try {
        const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString('base64');

        const data = {
            Messages: [
                {
                    From: {
                        Email: "contact.sweetgo@gmail.com",
                        Name: "Echipa SweetGo"
                    },
                    To: [
                        {
                            Email: destinatar
                        }
                    ],
                    Subject: subiect,
                    HTMLPart: continutHtml
                }
            ]
        };

        await axios.post('https://api.mailjet.com/v3.1/send', data, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Email trimis cu succes către ${destinatar} (via Mailjet)`);
        return true;
    } catch (error) {
        console.error(`❌ Eroare Mailjet:`, error.response?.data || error.message);
        return false;
    }
};

module.exports = { trimiteEmail };