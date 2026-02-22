const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')
const { uploadImaginiProduse } = require('../middleware/upload_documents')

//toate produsele din cofetarie
router.get('/cofetarie/:id', (req,res) => {
    const { id } = req.params

    const produse = db.prepare(`
        SELECT * FROM produse WHERE cofetarie_id = ? AND disponibil = 1
    `).all(id)

    res.json(produse)
})

//adauga produs
router.post('/',verifyToken,verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'),(req,res) => {
    const { numeProdus, descriere, pret, categorie } = req.body
    const imagine = req.file ? req.file.path : null

    const cofetarie = db.prepare(`
        SELECT id, status FROM cofetarii WHERE utilizator_id = ?
    `).get(req.utilizator.id)

    if(!cofetarie){
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    if(cofetarie.status !== 'aprobata' && cofetarie.status !== 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })
    }

    if(cofetarie.status === 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost respins de administrator' })
    }

    const rezultat = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, imagine)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(cofetarie.id, numeProdus, descriere, pret, categorie, imagine)

    res.status(201).json({ mesaj: 'Produs adaugat', id: rezultat.lastInsertRowid })
})

//editeaza produs
router.put('/:id', verifyToken, verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'), (req,res) => {
    const { id } = req.params
    const { numeProdus, descriere, pret, categorie, disponibil } = req.body
    const imagine = req.file ? req.file.path : null

    const cofetarie = db.prepare(`
        SELECT id, status FROM cofetarii WHERE utilizator_id = ?
    `).get(req.utilizator.id)

    if(!cofetarie){
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    if(cofetarie.status !== 'aprobata' && cofetarie.status !== 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })
    }

    if(cofetarie.status === 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost respins de administrator' })
    }

     db.prepare(`
        UPDATE produse SET numeProdus = ?, descriere = ?, pret = ?, categorie = ?, disponibil = ?, imagine = ?
        WHERE id = ?
    `).run(numeProdus, descriere, pret, categorie, disponibil, imagine, id)

    res.json({ mesaj: 'Produs actualizat' })
})

//sterge produs
router.delete('/:id', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const { id } = req.params

    const cofetarie = db.prepare(`
        SELECT id, status FROM cofetarii WHERE utilizator_id = ?
    `).get(req.utilizator.id)

    if(!cofetarie){
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    if(cofetarie.status !== 'aprobata' && cofetarie.status !== 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })
    }

    if(cofetarie.status === 'respinsa'){
        return res.status(403).json({ mesaj: 'Contul tau nu a fost respins de administrator' })
    }

    db.prepare('DELETE FROM produse WHERE id = ?').run(id)
    res.json({ mesaj: 'Produs sters' })
})

module.exports = router