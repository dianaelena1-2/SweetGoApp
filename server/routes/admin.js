const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const User = require('../models/User')
const Cofetarie = require('../models/Cofetarie')
const Produs = require('../models/Produs')
const Comanda = require('../models/Comanda')
const { trimiteEmail } = require('../utils/mailer');

// verifica cofetariile in asteptare
router.get('/cofetarii/in-asteptare', verifyToken, verifyRol('admin'), async (req,res) => {
    try {
        const cofetarii = await Cofetarie.find({ status: 'in_asteptare' }).populate('utilizator_id', 'nume email')
        
        const response = cofetarii.map(c => ({
            ...c._doc,
            nume: c.utilizator_id.nume,
            email: c.utilizator_id.email
        }))
        res.json(response)
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

// aprobare cofetarie
router.put('/cofetarii/:id/aprobare', verifyToken, verifyRol('admin'), async (req,res) => {
    try {
        const cofetarie = await Cofetarie.findByIdAndUpdate(req.params.id, { status: 'aprobata' }, { new: true })
      
        if (cofetarie) {
            const utilizator = await User.findById(cofetarie.utilizator_id);
            if (utilizator) {
                const continutEmail = `
                    <h2>Vești bune, ${utilizator.nume}! 🎉</h2>
                    <p>Contul pentru cofetăria ta, <strong>${cofetarie.numeCofetarie}</strong>, a fost <strong>aprobat oficial</strong>!</p>
                    <p>Acum te poți autentifica în contul tău de partener pentru a adăuga produse și a începe să primești comenzi.</p>
                    <p><a href="https://sweetgoapp.onrender.com/login">Apasă aici pentru a te loga în cont</a></p>
                    <br>
                    <p>Spor la vânzări,</p>
                    <p><strong>Echipa SweetGo</strong></p>
                `;
                trimiteEmail(utilizator.email, 'Contul tău SweetGo a fost aprobat! 🎉', continutEmail);
            }
        }

        res.json({ mesaj: 'Cofetaria a fost aprobata' })
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

// respingere cofetarie
router.put('/cofetarii/:id/respingere', verifyToken, verifyRol('admin'), async (req,res) => {
    try {
        const cofetarie = await Cofetarie.findById(req.params.id);
        if (!cofetarie) {
            return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' });
        }

        const utilizator = await User.findById(cofetarie.utilizator_id);

        if (utilizator) {
            const continutEmail = `
                <h2>Salut, ${utilizator.nume}!</h2>
                <p>Îți mulțumim pentru interesul acordat platformei <strong>SweetGo</strong>.</p>
                <p>În urma analizei documentelor trimise pentru cofetăria <strong>${cofetarie.numeCofetarie}</strong>, te informăm că cererea ta de înregistrare <strong>nu a putut fi aprobată</strong> în acest moment.</p>
                <p>Cele mai frecvente motive pentru respingere sunt documentele neclare sau datele incomplete. Te invităm să încerci o nouă înregistrare asigurându-te că toate informațiile sunt corecte.</p>
                <br>
                <p>Toate cele bune,</p>
                <p><strong>Echipa SweetGo</strong></p>
            `;
            
            await trimiteEmail(utilizator.email, 'Update cerere înregistrare SweetGo', continutEmail);

            await Cofetarie.findByIdAndDelete(cofetarie._id);
            await User.findByIdAndDelete(utilizator._id);
        }

        res.json({ mesaj: 'Cofetăria a fost respinsă și toate datele asociate au fost șterse.' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ mesaj: 'Eroare la respingerea cofetariei' });
    }
});

// afisare utilizatori
router.get('/utilizatori', verifyToken, verifyRol('admin'), async (req,res) => {
    try {   
        const utilizatori = await User.find().select('-parola')
        res.json(utilizatori)
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

// stergere utilizator
router.delete('/utilizatori/:id', verifyToken, verifyRol('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ mesaj: 'Utilizatorul nu a fost găsit.' })
        if (user.rol === 'admin') return res.status(403).json({ mesaj: 'Nu poți șterge un administrator.' })
        
        if (user.rol === 'cofetarie') {
            const cofetarie = await Cofetarie.findOne({ utilizator_id: user._id })
            if(cofetarie){
                await Produs.deleteMany({ cofetarie_id: cofetarie._id })
                await Comanda.deleteMany({ cofetarie_id: cofetarie._id })
                await Cofetarie.findByIdAndDelete(cofetarie._id)
            }
            
        }

        if (user.rol === 'client') {
            await Comanda.deleteMany({ client_id: user._id })
        }

        await User.findByIdAndDelete(user._id)
        
        res.json({ mesaj: 'Utilizator șters cu succes.' })
    } catch (err) { res.status(500).json({ mesaj: 'Eroare internă la ștergere.' }) }
})

module.exports = router