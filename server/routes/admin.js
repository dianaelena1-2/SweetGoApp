const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const User = require('../models/User')
const Cofetarie = require('../models/Cofetarie')
const Produs = require('../models/Produs')
const Comanda = require('../models/Comanda')
const { trimiteEmail } = require('../utils/mailer');

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
            
            trimiteEmail(utilizator.email, 'Update cerere înregistrare SweetGo', continutEmail);

            await User.findByIdAndDelete(utilizator._id);
        }
        
        await Cofetarie.findByIdAndDelete(cofetarie._id);

        res.json({ mesaj: 'Cofetăria a fost respinsă și toate datele asociate au fost șterse.' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ mesaj: 'Eroare la respingerea cofetariei' });
    }
});

router.get('/utilizatori', verifyToken, verifyRol('admin'), async (req,res) => {
    try {   
        const utilizatori = await User.find().select('-parola')
        res.json(utilizatori)
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

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
});

router.get('/dashboard-statistici', verifyToken, verifyRol('admin'), async (req, res) => {
    try {
        const dataStart30Zile = new Date();
        dataStart30Zile.setDate(dataStart30Zile.getDate() - 30);

        const dataStart14Zile = new Date();
        dataStart14Zile.setDate(dataStart14Zile.getDate() - 14);

        const cresterePlatformaRaw = await User.aggregate([
            { 
                $match: { 
                    rol: { $in: ['client', 'cofetarie'] },
                    createdAt: { $gte: dataStart30Zile }
                } 
            },
            {
                $group: {
                    _id: {
                        data: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Bucharest" } },
                        rol: "$rol"
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { "_id.data": 1 } }
        ]);

        const crestereMap = {};
        cresterePlatformaRaw.forEach(item => {
            const data = item._id.data;
            if (!crestereMap[data]) crestereMap[data] = { data, clientiNovi: 0, cofetariiNoi: 0 };
            
            if (item._id.rol === 'client') crestereMap[data].clientiNovi = item.total;
            if (item._id.rol === 'cofetarie') crestereMap[data].cofetariiNoi = item.total;
        });
        const cresterePlatforma = Object.values(crestereMap).sort((a, b) => a.data.localeCompare(b.data));

        const rataSuccesRaw = await Comanda.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: dataStart14Zile }
                } 
            },
            {
                $group: {
                    _id: {
                        data: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Bucharest" } },
                        statusSimplificat: {
                            $cond: [{ $eq: ["$status", "anulata"] }, "anulate", "livrate"] 
                        }
                    },
                    total: { $sum: 1 }
                }
            }
        ]);

        const rataSuccesMap = {};
        rataSuccesRaw.forEach(item => {
            const data = item._id.data;
            if (!rataSuccesMap[data]) rataSuccesMap[data] = { data, livrate: 0, anulate: 0 };
            rataSuccesMap[data][item._id.statusSimplificat] = item.total;
        });
        const rataSuccesComenzi = Object.values(rataSuccesMap).sort((a, b) => a.data.localeCompare(b.data));

        const topCofetarii = await Comanda.aggregate([
            { $match: { status: { $ne: 'anulata' } } },
            { 
                $group: {
                    _id: "$cofetarie_id",
                    totalVenit: { $sum: "$total" },
                    totalComenzi: { $sum: 1 }
                }
            },
            { $sort: { totalVenit: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: Cofetarie.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "detalii_cofetarie"
                }
            },
            { $unwind: "$detalii_cofetarie" },
            {
                $project: {
                    _id: 0, 
                    nume: "$detalii_cofetarie.numeCofetarie",
                    totalVenit: 1,
                    totalComenzi: 1
                }
            }
        ]);

        const antiRisipa = await Comanda.aggregate([
            { $match: { status: { $ne: 'anulata' } } },
            { $unwind: "$detalii" },
            { 
                $lookup: { 
                    from: Produs.collection.name, 
                    localField: 'detalii.produs_id',
                    foreignField: '_id',
                    as: 'produs_info'
                }
            },
            { $unwind: "$produs_info" },
            { 
                $match: { 
                    $expr: { $lt: ["$detalii.pret_unitar", "$produs_info.pret"] } 
                } 
            },
            { 
                $group: {
                    _id: null,
                    total_salvate: { $sum: "$detalii.cantitate" }
                }
            }
        ]);
        const produseSalvateGlobal = antiRisipa.length > 0 ? antiRisipa[0].total_salvate : 0;

        res.json({
            cresterePlatforma,
            rataSuccesComenzi,
            topCofetarii,
            produseSalvateGlobal
        });

    } catch (err) {
        console.error("Eroare generare statistici admin:", err);
        res.status(500).json({ mesaj: 'Eroare la generarea statisticilor' });
    }
});

module.exports = router