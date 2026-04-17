const express = require('express')
const router = express.Router()
const db = require('../db')
const { verifyToken, verifyRol } = require('../middleware/auth')
const { uploadImaginiProduse } = require('../middleware/upload_documents')

// toate produsele din cofetărie
router.get('/cofetarie/:id', verifyToken, verifyRol('cofetarie'), (req, res) => {
    db.actualizeazaDisponibilitateProduse()
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)
    if (!cofetarie) {
        return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    }

    const produse = db.prepare('SELECT * FROM produse WHERE cofetarie_id = ?').all(cofetarie.id)
    const produseCuIngrediente = produse.map(p => {
        const ingrediente = db.prepare(`
            SELECT i.id, i.nume
            FROM ingrediente i
            JOIN compozitieProdus cp ON i.id = cp.ingredient_id
            WHERE cp.produs_id = ?
        `).all(p.id)
        return { ...p, ingrediente }
    })
    res.json(produseCuIngrediente)
})

// adaugă produs
router.post('/', verifyToken, verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'), (req, res) => {
    const { numeProdus, descriere, pret, categorie, stoc, transport_recomandat, data_expirare } = req.body
    const imagine = req.file ? req.file.path : null

    const cofetarie = db.prepare(`SELECT id, status FROM cofetarii WHERE utilizator_id = ?`).get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    if (cofetarie.status !== 'aprobata') return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })

    try {
        const insertProdus = db.prepare(`
            INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, imagine, transport_recomandat, data_expirare)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const rezultat = insertProdus.run(cofetarie.id, numeProdus, descriere, pret, categorie, stoc || 0, imagine, transport_recomandat || 'masina', data_expirare)
        const produsId = rezultat.lastInsertRowid
        db.actualizeazaDisponibilitateProduse()
        gestioneazaIngrediente(produsId, req.body.ingredienteAlese, req.body.ingredientNou)
        res.status(201).json({ mesaj: 'Produs adaugat', id: produsId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ mesaj: 'Eroare la adaugarea produsului' })
    }
})

// produse indisponibile
router.get('/indisponibile', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' })

    const produseIndisponibile = db.prepare(`
        SELECT * FROM produse 
        WHERE cofetarie_id = ? AND disponibil = 0
        ORDER BY data_expirare ASC NULLS LAST
    `).all(cofetarie.id)
    res.json(produseIndisponibile)
})

// editează produs
router.put('/:id', verifyToken, verifyRol('cofetarie'), uploadImaginiProduse.single('imagine'), (req, res) => {
    const { id } = req.params
    const { numeProdus, descriere, pret, categorie, disponibil, stoc, transport_recomandat, data_expirare } = req.body
    const imagine = req.file ? req.file.path : db.prepare('SELECT imagine FROM produse WHERE id = ?').get(id)?.imagine

    const cofetarie = db.prepare(`SELECT id, status FROM cofetarii WHERE utilizator_id = ?`).get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    if (cofetarie.status !== 'aprobata') return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })

    try {
        db.prepare(`
            UPDATE produse SET 
                numeProdus = ?, descriere = ?, pret = ?, categorie = ?, 
                disponibil = ?, stoc = ?, imagine = ?, transport_recomandat = ?, data_expirare = ?
            WHERE id = ?
        `).run(numeProdus, descriere, pret, categorie, disponibil, stoc, imagine, transport_recomandat, data_expirare || null, id)

        db.prepare('DELETE FROM compozitieProdus WHERE produs_id = ?').run(id)
        gestioneazaIngrediente(id, req.body.ingredienteAlese, req.body.ingredientNou)
        db.actualizeazaDisponibilitateProduse()
        res.json({ mesaj: 'Produs actualizat' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ mesaj: 'Eroare la actualizarea produsului' })
    }
})

// șterge produs
router.delete('/:id', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const { id } = req.params
    const cofetarie = db.prepare(`SELECT id, status FROM cofetarii WHERE utilizator_id = ?`).get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetaria nu a fost gasita' })
    if (cofetarie.status !== 'aprobata') return res.status(403).json({ mesaj: 'Contul tau nu a fost aprobat inca de administrator' })

    db.prepare('DELETE FROM compozitieProdus WHERE produs_id = ?').run(id)
    db.prepare('DELETE FROM produse WHERE id = ?').run(id)
    res.json({ mesaj: 'Produs sters' })
})

// funcţie ajutătoare pentru ingrediente
function gestioneazaIngrediente(produsId, ingredienteAlese, ingredientNou) {
    db.prepare('DELETE FROM compozitieProdus WHERE produs_id = ?').run(produsId)
    let idsDeInserat = []

    if (ingredienteAlese) {
        let alese
        try {
            alese = typeof ingredienteAlese === 'string' ? JSON.parse(ingredienteAlese) : ingredienteAlese
        } catch (e) {
            alese = []
        }
        if (Array.isArray(alese)) {
            idsDeInserat = alese.map(id => parseInt(id)).filter(id => !isNaN(id))
        }
    }

    if (ingredientNou && typeof ingredientNou === 'string' && ingredientNou.trim() !== '') {
        const numeCurat = ingredientNou.trim().toLowerCase()
        db.prepare('INSERT OR IGNORE INTO ingrediente (nume) VALUES (?)').run(numeCurat)
        const record = db.prepare('SELECT id FROM ingrediente WHERE nume = ?').get(numeCurat)
        if (record && !idsDeInserat.includes(record.id)) {
            idsDeInserat.push(record.id)
        }
    }

    const idsUnice = [...new Set(idsDeInserat)]
    const stmt = db.prepare('INSERT INTO compozitieProdus (produs_id, ingredient_id) VALUES (?, ?)')
    for (const ingId of idsUnice) {
        stmt.run(produsId, ingId)
    }
}

// alerte produse care expiră mâine
router.get('/alerte-expirare', verifyToken, verifyRol('cofetarie'), (req, res) => {
    db.actualizeazaDisponibilitateProduse()
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' })

    const alerte = db.prepare(`
        SELECT id, numeProdus, pret, stoc, data_expirare 
        FROM produse 
        WHERE cofetarie_id = ? 
        AND data_expirare = date('now', 'localtime', '+1 day')
        AND este_la_oferta = 0 
        AND stoc > 0
    `).all(cofetarie.id)
    res.json(alerte)
})

// activare ofertă anti-risipă
router.put('/:id/aplica-oferta', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const produsId = req.params.id
    const oraCurenta = new Date().getHours()
    if (oraCurenta < 20) {
        return res.status(400).json({ mesaj: 'Ofertele anti-risipă pot fi activate doar după ora 20:00!' })
    }

    const result = db.prepare('UPDATE produse SET este_la_oferta = 1 WHERE id = ? AND este_la_oferta = 0').run(produsId)
    if (result.changes === 0) {
        return res.status(404).json({ mesaj: 'Produsul nu există sau are deja ofertă activă.' })
    }

    const produs = db.prepare('SELECT cofetarie_id, numeProdus FROM produse WHERE id = ?').get(produsId)
    const cofetarie = db.prepare('SELECT numeCofetarie FROM cofetarii WHERE id = ?').get(produs.cofetarie_id)
    const clientiFavorite = db.prepare(`SELECT client_id FROM cofetarii_favorite WHERE cofetarie_id = ?`).all(produs.cofetarie_id)

    for (const row of clientiFavorite) {
        const mesaj = `🍰 Ofertă anti-risipă: ${cofetarie.numeCofetarie} a redus produsul "${produs.numeProdus}" cu 40%!`
        db.creeazaNotificare(row.client_id, mesaj, 'oferta', `/cofetarie/${produs.cofetarie_id}`)
    }
    res.json({ mesaj: 'Oferta de 40% a fost aplicată cu succes!' })
})

// produse expirate
router.get('/expirate', verifyToken, verifyRol('cofetarie'), (req, res) => {
    const cofetarie = db.prepare('SELECT id FROM cofetarii WHERE utilizator_id = ?').get(req.utilizator.id)
    if (!cofetarie) return res.status(404).json({ mesaj: 'Cofetăria nu a fost găsită.' })

    const produseExpirate = db.prepare(`
        SELECT * FROM produse 
        WHERE cofetarie_id = ? 
        AND data_expirare IS NOT NULL 
        AND data_expirare <= date('now', 'localtime')
        ORDER BY data_expirare ASC
    `).all(cofetarie.id)
    res.json(produseExpirate)
})

module.exports = router