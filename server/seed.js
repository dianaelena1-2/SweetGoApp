const db = require('./db')
const bcrypt = require('bcryptjs')

console.log('Se incarca datele initiale...')

// ===== ADMIN =====
const adminExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('admin@sweetgo.com')
if (!adminExistent) {
    const parolaHash = bcrypt.hashSync('admin!123', 10)
    db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Administrator', 'admin@sweetgo.com', parolaHash, 'admin')
    console.log('✓ Admin creat - Email: admin@sweetgo.com | Parola: admin!123')
} else {
    console.log('! Admin exista deja')
}

// ===== CLIENT =====
const clientExistent = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('client@sweetgo.com')
if (!clientExistent) {
    const parolaHash = bcrypt.hashSync('123456', 10)
    db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Maria Ionescu', 'maria.ionescu@gmail.com', parolaHash, 'client')
    console.log('✓ Client creat - Email: maria.ionescu@gmail.com | Parola: 123456')
} else {
    console.log('! Clientul exista deja')
}

// ===== COFETARIE =====
const cofetarieExistenta = db.prepare('SELECT * FROM utilizatori WHERE email = ?').get('cofetarie@sweetgo.com')
if (!cofetarieExistenta) {
    const parolaHash = bcrypt.hashSync('123456', 10)

    const infoUtilizator = db.prepare(`
        INSERT INTO utilizatori (nume, email, parola, rol)
        VALUES (?, ?, ?, ?)
    `).run('Ion Popescu', 'ion.popescu@dulcegarii.com', parolaHash, 'cofetarie')

    const imagineCoperta = 'partner_documents/cover_images/dulcegarii-imagine_coperta.png'

    const infoCofetarie = db.prepare(`
        INSERT INTO cofetarii (utilizator_id, numeCofetarie, adresa, telefon, status, imagine_coperta)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(infoUtilizator.lastInsertRowid, 'Dulcegarii', 'Strada Florilor nr. 10', '0742518654', 'aprobata', imagineCoperta)

    const cofetarieId = infoCofetarie.lastInsertRowid

    // ===== FUNCȚIE AJUTĂTOARE PENTRU INGREDIENTE =====
    const adaugaIngredienteProdus = (produsId, listaIngrediente) => {
        for (const numeIng of listaIngrediente) {
            db.prepare(`INSERT OR IGNORE INTO ingrediente (nume) VALUES (?)`).run(numeIng);
            const ingredient = db.prepare(`SELECT id FROM ingrediente WHERE nume = ?`).get(numeIng);
            if (ingredient) {
                db.prepare(`INSERT OR IGNORE INTO compozitieProdus (produs_id, ingredient_id) VALUES (?, ?)`).run(produsId, ingredient.id);
            }
        }
    }

    // ===== 1. Tort Ciocolată =====
    const imagine1 = 'partner_documents/product_images/tort_ciocolata.png'
    const infoProdus1 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare,imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `).run(cofetarieId, 'Tort Ciocolată', 'Tort cu cremă de ciocolată și fructe de pădure', 120, 'Torturi', 2, 1, 'frigorific', '2026-04-06',imagine1)
    adaugaIngredienteProdus(infoProdus1.lastInsertRowid, ['făină', 'zahăr', 'cacao', 'ouă', 'fructe de pădure', 'mascarpone', 'frișcă naturală'])
    console.log('✓ Produs: Tort Ciocolată (Torturi) - 120 lei, expiră 2026-04-06')

    // ===== 2. Tort cu fructe =====
    const imagine2 = 'partner_documents/product_images/tort_cu_fructe.jpg'
    const infoProdus2 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Tort cu Fructe de Pădure', 'Blat pufos cu cremă de iaurt și fructe proaspete', 95, 'Torturi', 3, 1, 'frigorific', '2026-04-07', imagine2)
    adaugaIngredienteProdus(infoProdus2.lastInsertRowid, ['făină', 'zahăr', 'ouă', 'iaurt', 'fructe de pădure', 'gelatină'])
    console.log('✓ Produs: Tort cu Fructe de Pădure (Torturi) - 95 lei, expiră 2026-04-07')

    // ===== 3. Prăjitură cu ciocolată =====
    const imagine3 = 'partner_documents/product_images/prajitura_ciocolata.jpg'
    const infoProdus3 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Prăjitură cu Ciocolată', 'Prăjitură pufoasă cu cremă de ciocolată neagră', 18, 'Prăjituri', 10, 1, 'masina', '2026-04-08', imagine3)
    adaugaIngredienteProdus(infoProdus3.lastInsertRowid, ['făină', 'zahăr', 'cacao', 'ouă', 'unt', 'ciocolată neagră'])
    console.log('✓ Produs: Prăjitură cu Ciocolată (Prăjituri) - 18 lei, expiră 2026-04-08')

    // ===== 4. Prăjitură cu lămâie =====
    const imagine4 = 'partner_documents/product_images/prajitura_lamaie.jfif'
    const infoProdus4 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Prăjitură cu Lămâie', 'Prăjitură răcoritoare cu aromă de lămâie și glazură', 15, 'Prăjituri', 8, 1, 'bicicleta', '2026-04-09', imagine4)
    adaugaIngredienteProdus(infoProdus4.lastInsertRowid, ['făină', 'zahăr', 'ouă', 'lămâie', 'unt', 'lapte'])
    console.log('✓ Produs: Prăjitură cu Lămâie (Prăjituri) - 15 lei, expiră 2026-04-09')

    // ===== 5. Macarons vanilie =====
    const imagine5 = 'partner_documents/product_images/macarons_vanilie.jpg'
    const infoProdus5 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Macarons Vanilie', 'Set de 6 macarons cu cremă de vanilie', 42, 'Macarons', 5, 1, 'bicicleta', '2026-04-06', imagine5)
    adaugaIngredienteProdus(infoProdus5.lastInsertRowid, ['făină de migdale', 'zahăr', 'albș', 'vanilie', 'colorant'])
    console.log('✓ Produs: Macarons Vanilie (Macarons) - 42 lei, expiră 2026-04-06')

    // ===== 6. Macarons fructe =====
    const imagine6 = 'partner_documents/product_images/macarons_fructe.png'
    const infoProdus6 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Macarons Fructe de Pădure', 'Set de 6 macarons cu cremă de fructe de pădure', 45, 'Macarons', 4, 1, 'bicicleta', '2026-04-07', imagine6)
    adaugaIngredienteProdus(infoProdus6.lastInsertRowid, ['făină de migdale', 'zahăr', 'albș', 'fructe de pădure', 'colorant'])
    console.log('✓ Produs: Macarons Fructe de Pădure (Macarons) - 45 lei, expiră 2026-04-07')

    // ===== 7. Cupcake ciocolată =====
    const imagine7 = 'partner_documents/product_images/cupcake_ciocolata.avif'
    const infoProdus7 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Cupcake cu Ciocolată', 'Cupcake cu blat de ciocolată și topping cremos', 12, 'Cupcakes', 15, 1, 'masina', '2026-04-05', imagine7)
    adaugaIngredienteProdus(infoProdus7.lastInsertRowid, ['făină', 'cacao', 'zahăr', 'ouă', 'unt', 'ciocolată', 'lapte'])
    console.log('✓ Produs: Cupcake cu Ciocolată (Cupcakes) - 12 lei, expiră 2026-04-05')

    // ===== 8. Cupcake vanilie =====
    const imagine8 = 'partner_documents/product_images/cupcake_vanilie.jpg'
    const infoProdus8 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Cupcake cu Vanilie', 'Cupcake cu blat de vanilie și cremă de brânză', 11, 'Cupcakes', 12, 1, 'masina', '2026-04-08', imagine8)
    adaugaIngredienteProdus(infoProdus8.lastInsertRowid, ['făină', 'zahăr', 'ouă', 'vanilie', 'brânză cremă', 'lapte'])
    console.log('✓ Produs: Cupcake cu Vanilie (Cupcakes) - 11 lei, expiră 2026-04-08')

    // ===== 9. Croissant simplu =====
    const imagine9 = 'partner_documents/product_images/croissant_simplu.webp'
    const infoProdus9 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Croissant simplu', 'Croissant clasic, pufos și auriu', 8, 'Croissante', 20, 1, 'bicicleta', '2026-04-07', imagine9)
    adaugaIngredienteProdus(infoProdus9.lastInsertRowid, ['făină', 'unt', 'zahăr', 'drojdie', 'lapte', 'ouă'])
    console.log('✓ Produs: Croissant simplu (Croissante) - 8 lei, expiră 2026-04-07')

    // ===== 10. Croissant ciocolată =====
    const imagine10 = 'partner_documents/product_images/croissant_ciocolata.webp'
    const infoProdus10 = db.prepare(`
        INSERT INTO produse (cofetarie_id, numeProdus, descriere, pret, categorie, stoc, disponibil, transport_recomandat, data_expirare, imagine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cofetarieId, 'Croissant cu ciocolată', 'Croissant umplut cu ciocolată neagră', 10, 'Croissante', 18, 1, 'bicicleta', '2026-04-09', imagine10)
    adaugaIngredienteProdus(infoProdus10.lastInsertRowid, ['făină', 'unt', 'zahăr', 'drojdie', 'ciocolată', 'lapte', 'ouă'])
    console.log('✓ Produs: Croissant cu ciocolată (Croissante) - 10 lei, expiră 2026-04-09')

    // ===== OPȚIUNI DECOR PENTRU TORTURI =====
    const adaugaOptiuniDecor = (produsId, optiuni) => {
        for (const denumire of optiuni) {
            db.prepare(`INSERT INTO optiuni_decor (produs_id, denumire) VALUES (?, ?)`).run(produsId, denumire)
        }
    }

    adaugaOptiuniDecor(infoProdus1.lastInsertRowid, ['Trandafiri cremă', 'Scris manual', 'Fulgi de ciocolată', 'Glazură lucioasă'])
    adaugaOptiuniDecor(infoProdus2.lastInsertRowid, ['Fructe proaspete', 'Jeleu de fructe', 'Flori comestibile'])

    console.log('✓ Opțiuni decor adăugate pentru torturi')
    console.log('✓ Cofetarie creata si aprobata - Email: ion.popescu@dulcegarii.com | Parola: 123456')
    console.log('✓ Total 10 produse adăugate')
} else {
    console.log('! Cofetaria exista deja')
}