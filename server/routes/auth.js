const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { upload } = require('../middleware/upload_documents')
const User = require('../models/User')
const Cofetarie = require('../models/Cofetarie')
const geocodeAddress = require('../utils/geocode')

// INREGISTRARE
router.post('/register', upload.fields([
    { name: 'certificat_inregistrare', maxCount: 1 },
    { name: 'certificat_sanitar', maxCount: 1 },
    { name: 'imagine_coperta', maxCount: 1 }
]), async (req, res) => {
    try {
        const { nume, email, parola, rol, numeCofetarie, adresa, telefon } = req.body

        if(!nume || !email || !parola || !rol){
            return res.status(400).json({ mesaj: 'Toate campurile sunt obligatorii' })
        }

        let utilizatorExistent = await User.findOne({ email })
        
        if(utilizatorExistent){
            if (utilizatorExistent.rol === 'cofetarie') {
                const cofetarie = await Cofetarie.findOne({ utilizator_id: utilizatorExistent._id })
                
                if (!cofetarie) {
                    await User.findByIdAndDelete(utilizatorExistent._id);
                    utilizatorExistent = null;
                } else if (cofetarie.status === 'in_asteptare') {
                    return res.status(400).json({ mesaj: 'Un cont cu acest email este deja înregistrat și așteaptă aprobarea.' })
                } else if (cofetarie.status === 'aprobata') {
                    return res.status(400).json({ mesaj: 'Există deja un cont de cofetărie aprobat cu acest email.' })
                } else {
                    await Cofetarie.findByIdAndDelete(cofetarie._id);
                    await User.findByIdAndDelete(utilizatorExistent._id);
                    utilizatorExistent = null;
                }
            } else {
                return res.status(400).json({ mesaj: 'Există deja un cont creat cu acest email.' })
            }
        }

        const parolaHash = await bcrypt.hash(parola, 10)

        const newUser = await User.create({
            nume, email, parola: parolaHash, rol
        })

        if(rol === 'cofetarie') {
            if(!req.files || !req.files['certificat_inregistrare'] || !req.files['certificat_sanitar']){
                await User.findByIdAndDelete(newUser._id)
                return res.status(400).json({ mesaj: 'Documentele sunt obligatorii pentru cofetarii' })
            }

            const certifInregistrare = req.files['certificat_inregistrare'][0].path
            const certifSanitar = req.files['certificat_sanitar'][0].path
            const imagineCoperta = req.files['imagine_coperta'] ? req.files['imagine_coperta'][0].path : null
            const coordonate = await geocodeAddress(adresa)
            
            await Cofetarie.create({
                utilizator_id: newUser._id,
                numeCofetarie,
                adresa,
                lat: coordonate ? coordonate.lat : undefined,
                lng: coordonate ? coordonate.lng : undefined,
                telefon,
                certificat_inregistrare: certifInregistrare,
                certificat_sanitar: certifSanitar,
                imagine_coperta: imagineCoperta
            })
        }

        res.status(201).json({ mesaj: 'Cont creat cu succes', id: newUser._id })
    } catch (err) {
        console.error(err)
        res.status(500).json({ mesaj: 'Eroare la inregistrare' })
    }
})

// AUTENTIFICARE
router.post('/login', async (req,res) => {
    try {
        const { email, parola } = req.body

        if (!email || !parola) {
            return res.status(400).json({ mesaj: 'Email si parola sunt obligatorii' })
        }

        const utilizator = await User.findOne({ email })
        if (!utilizator) {
            return res.status(401).json({ mesaj: 'Email sau parola incorecte' })
        }

        const parolaCorecta = await bcrypt.compare(parola, utilizator.parola)
        if (!parolaCorecta) {
            return res.status(401).json({ mesaj: 'Email sau parola incorecte' })
        }
        let numeCofetarie = undefined;

        if (utilizator.rol === 'cofetarie') {
            const cofetarie = await Cofetarie.findOne({ utilizator_id: utilizator._id })
            if (!cofetarie || cofetarie.status !== 'aprobata') {
                return res.status(403).json({ mesaj: 'Contul tău nu a fost încă aprobat de administrator.' })
            }
            numeCofetarie = cofetarie.numeCofetarie;
        }

        const token = jwt.sign(
            { id: utilizator._id, rol: utilizator.rol },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.json({
            token,
            utilizator: {
                id: utilizator._id,
                nume: utilizator.nume,
                email: utilizator.email,
                rol: utilizator.rol,
                ...(numeCofetarie && { numeCofetarie })
            }
        })
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la autentificare' })
    }
})

module.exports = router