const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const trimiteEmail = async (destinatar, subiect, continutHtml) => {
    try {
        const mailOptions = {
            from: `"Echipa SweetGo" <${process.env.EMAIL_USER}>`,
            to: destinatar,
            subject: subiect,
            html: continutHtml
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email trimis către ${destinatar}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Eroare la trimiterea emailului către ${destinatar}:`, error);
        return false;
    }
};

module.exports = { trimiteEmail };