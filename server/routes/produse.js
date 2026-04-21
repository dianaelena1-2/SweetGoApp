const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const { uploadImaginiProduse } = require('../middleware/upload_documents')
const Produs = require('../models/Produs')
const Cofetarie = require('../models/Cofetarie')
const User = require('../models/User')
const Notificare = require('../models/Notificare')

const verificaDisponibilitate = async () => {
    const azi = new Date();
    // Produse expirate
    await Produs.updateMany(
        { data_expirare: { $lte: azi } },
        { disponibil: false, este_la_oferta: false, stoc: 0 }
    );
    // Produse fara stoc
    await Produs.updateMany(
        { stoc: { $lte: 0 } },
        { disponibil: false, este_la_oferta: false }
    );
};

const parseArrayFromBody = (value) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
    } catch {
        return [value];
    }
};

// toate produsele din cofetărie
router.get('/cofetarie/:id', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        await verificaDisponibilitate();
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' });

        const produse = await Produs.find({ cofetarie_id: cofetarie._id });
        res.json(produse);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

// adaugă produs
router.post('/', verifyToken, verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'), async (req, res) => {
    try {
        const { numeProdus, descriere, pret, categorie, stoc, transport_recomandat, data_expirare } = req.body;
        const imagine = req.file ? req.file.path : null;

        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        if (!cofetarie || cofetarie.status !== 'aprobata') {
            return res.status(403).json({ mesaj: 'Contul tau nu este aprobat sau nu exista' });
        }

        let listaIngrediente = parseArrayFromBody(req.body.ingredienteAlese);
        if (req.body.ingredientNou) listaIngrediente.push(req.body.ingredientNou);

        const produsNou = await Produs.create({
            cofetarie_id: cofetarie._id,
            numeProdus, descriere, pret, categorie, 
            stoc: stoc || 0, imagine, 
            transport_recomandat: transport_recomandat || 'masina', 
            data_expirare,
            ingrediente: [...new Set(listaIngrediente)] 
        });

        res.status(201).json({ mesaj: 'Produs adaugat', id: produsNou._id });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare la adaugarea produsului' }); }
});

// produse indisponibile
router.get('/indisponibile', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        const produse = await Produs.find({ cofetarie_id: cofetarie._id, disponibil: false }).sort({ data_expirare: 1 });
        res.json(produse);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

// editează produs
router.put('/:id', verifyToken, verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'), async (req, res) => {
    try {
        const { numeProdus, descriere, pret, categorie, disponibil, stoc, transport_recomandat, data_expirare } = req.body;
        
        const produsExistent = await Produs.findById(req.params.id);
        const imagine = req.file ? req.file.path : produsExistent.imagine;

        let listaIngrediente = parseArrayFromBody(req.body.ingredienteAlese);
        if (req.body.ingredientNou) listaIngrediente.push(req.body.ingredientNou);

        await Produs.findByIdAndUpdate(req.params.id, {
            numeProdus, descriere, pret, categorie, disponibil, stoc, imagine, transport_recomandat, data_expirare,
            ingrediente: [...new Set(listaIngrediente)]
        });

        await verificaDisponibilitate();
        res.json({ mesaj: 'Produs actualizat' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

// șterge produs
router.delete('/:id', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        await Produs.findByIdAndDelete(req.params.id);
        res.json({ mesaj: 'Produs sters' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

// alerte produse care expiră mâine
router.get('/alerte-expirare', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        await verificaDisponibilitate();
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        
        const maine = new Date();
        maine.setDate(maine.getDate() + 1);
        maine.setHours(23, 59, 59, 999); 

        const alerte = await Produs.find({
            cofetarie_id: cofetarie._id,
            data_expirare: { $lte: maine, $gt: new Date() },
            este_la_oferta: false,
            stoc: { $gt: 0 }
        }).select('numeProdus pret stoc data_expirare');

        res.json(alerte);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

// activare ofertă anti-risipă
router.put('/:id/aplica-oferta', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const oraCurenta = new Date().getHours();
        if (oraCurenta < 20) {
            return res.status(400).json({ mesaj: 'Ofertele anti-risipă pot fi activate doar după ora 20:00!' });
        }

        const produs = await Produs.findOneAndUpdate(
            { _id: req.params.id, este_la_oferta: false },
            { este_la_oferta: true },
            { new: true }
        ).populate('cofetarie_id');

        if (!produs) return res.status(404).json({ mesaj: 'Produsul nu există sau are deja ofertă activă.' });

        // Notificam utilizatorii care au cofetaria la favorite
        const users = await User.find({ favorite: produs.cofetarie_id._id });
        const notificari = users.map(u => ({
            client_id: u._id,
            mesaj: `🍰 Ofertă anti-risipă: ${produs.cofetarie_id.numeCofetarie} a redus produsul "${produs.numeProdus}" cu 40%!`,
            tip: 'oferta',
            link: `/cofetarie/${produs.cofetarie_id._id}`
        }));

        if (notificari.length > 0) await Notificare.insertMany(notificari);

        res.json({ mesaj: 'Oferta de 40% a fost aplicată cu succes!' });
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

router.get('/expirate', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const cofetarie = await Cofetarie.findOne({ utilizator_id: req.utilizator.id });
        const expirate = await Produs.find({
            cofetarie_id: cofetarie._id,
            data_expirare: { $lte: new Date() }
        }).sort({ data_expirare: 1 });
        res.json(expirate);
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }); }
});

module.exports = router;