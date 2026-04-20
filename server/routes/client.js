const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { verifyToken, verifyRol } = require('../middleware/auth');
const User = require('../models/User');
const Cofetarie = require('../models/Cofetarie');
const Notificare = require('../models/Notificare');
const Cos = require('../models/Cos');

router.use(verifyToken, verifyRol('client'));

// date profil
router.get('/profil', async (req, res) => {
    try {
        const client = await User.findById(req.utilizator.id).select('-parola');
        res.json(client);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// actualizare profil
router.put('/profil', async (req, res) => {
    try {
        const { nume, email, adresa_default, telefon } = req.body;
        
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: req.utilizator.id } });
            if (existing) return res.status(400).json({ mesaj: 'Acest email este deja folosit.' });
        }

        await User.findByIdAndUpdate(req.utilizator.id, { nume, email, adresa_default, telefon }, { new: true, omitUndefined: true });
        res.json({ mesaj: 'Profil actualizat cu succes.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// schimbare parola
router.put('/parola', async (req, res) => {
    try {
        const { parolaVeche, parolaNoua } = req.body;
        const user = await User.findById(req.utilizator.id);

        const eCorecta = await bcrypt.compare(parolaVeche, user.parola);
        if (!eCorecta) return res.status(401).json({ mesaj: 'Parola veche este incorectă.' });

        user.parola = await bcrypt.hash(parolaNoua, 10);
        await user.save();
        res.json({ mesaj: 'Parola a fost schimbată cu succes.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// lista cofetariilor favorite
router.get('/favorite', async (req, res) => {
    try {
        // Aducem profilul si populam array-ul de favorite cu datele cofetariilor
        const user = await User.findById(req.utilizator.id).populate({
            path: 'favorite',
            match: { status: 'aprobata' }
        });
        res.json(user.favorite);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// adaugare cofetarie la favorite
router.post('/favorite/:cofetarieId', async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ _id: req.params.cofetarieId, status: 'aprobata' });
        if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetăria nu există sau nu este aprobată.' });

        // $addToSet adauga doar daca nu exista deja (evitam duplicatele magic)
        await User.findByIdAndUpdate(req.utilizator.id, { $addToSet: { favorite: cofetarie._id } });
        res.json({ mesaj: 'Adăugată la favorite.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare internă.' }) }
});

// elimina cofetarie de la favorite
router.delete('/favorite/:cofetarieId', async (req, res) => {
    try {
        // $pull scoate din array
        await User.findByIdAndUpdate(req.utilizator.id, { $pull: { favorite: req.params.cofetarieId } });
        res.json({ mesaj: 'Eliminată din favorite.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare internă.' }) }
});

// notificari
router.get('/notificari', async (req, res) => {
    try {
        const notificari = await Notificare.find({ client_id: req.utilizator.id })
                                           .sort({ createdAt: -1 })
                                           .limit(50);
        res.json(notificari);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// notificare citita
router.put('/notificari/:id/citita', async (req, res) => {
    try {
        await Notificare.findOneAndUpdate(
            { _id: req.params.id, client_id: req.utilizator.id }, 
            { citita: true }
        );
        res.json({ mesaj: 'Notificare marcată ca citită.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

router.get('/notificari/necitite/count', async (req, res) => {
    try {
        const count = await Notificare.countDocuments({ client_id: req.utilizator.id, citita: false });
        res.json({ count });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

// cos
router.get('/cos', async (req, res) => {
    try {
        const cos = await Cos.findOne({ client_id: req.utilizator.id });
        if (cos && cos.continut) {
            res.json(JSON.parse(cos.continut));
        } else {
            res.json({ cofetarie_id: null, produse: [] });
        }
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

router.put('/cos', async (req, res) => {
    try {
        // upsert: true -> daca exista ii face update, daca nu, il creeaza!
        await Cos.findOneAndUpdate(
            { client_id: req.utilizator.id }, 
            { continut: JSON.stringify(req.body) },
            { upsert: true, new: true }
        );
        res.json({ mesaj: 'Coș salvat cu succes.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

router.delete('/cos', async (req, res) => {
    try {
        await Cos.findOneAndDelete({ client_id: req.utilizator.id });
        res.json({ mesaj: 'Coș șters cu succes.' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
});

module.exports = router;