const express = require('express')
const router = express.Router()
const { verifyToken, verifyRol } = require('../middleware/auth')
const User = require('../models/User')
const Cofetarie = require('../models/Cofetarie')
const Produs = require('../models/Produs')
const Comanda = require('../models/Comanda')

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
        await Cofetarie.findByIdAndUpdate(req.params.id, { status: 'aprobata' })
        res.json({ mesaj: 'Cofetaria a fost aprobata' })
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

// respingere cofetarie
router.put('/cofetarii/:id/respingere', verifyToken, verifyRol('admin'), async (req,res) => {
    try {
        await Cofetarie.findByIdAndUpdate(req.params.id, { status: 'respinsa' })
        res.json({ mesaj: 'Cofetaria a fost respinsa' })
    } catch (err) { res.status(500).json({ mesaj: 'Eroare' }) }
})

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