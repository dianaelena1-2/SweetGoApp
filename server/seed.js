const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./db');

// Importăm Modelele
const User = require('./models/User');
const Cofetarie = require('./models/Cofetarie');
const Produs = require('./models/Produs');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();
        console.log('Se incarca datele initiale in MongoDB Atlas...');

        // 1. ===== ADMIN =====
        const adminExistent = await User.findOne({ email: 'admin@sweetgo.com' });
        if (!adminExistent) {
            const parolaHash = await bcrypt.hash('admin!123', 10);
            await User.create({
                nume: 'Administrator',
                email: 'admin@sweetgo.com',
                parola: parolaHash,
                rol: 'admin'
            });
            console.log('✓ Admin creat - Email: admin@sweetgo.com | Parola: admin!123');
        } else {
            console.log('! Admin exista deja');
        }

        // 2. ===== CLIENT =====
        const clientExistent = await User.findOne({ email: 'maria.ionescu@gmail.com' });
        if (!clientExistent) {
            const parolaHash = await bcrypt.hash('123456', 10);
            await User.create({
                nume: 'Maria Ionescu',
                email: 'maria.ionescu@gmail.com',
                parola: parolaHash,
                rol: 'client'
            });
            console.log('✓ Client creat - Email: maria.ionescu@gmail.com');
        }

        // 3. ===== COFETARIE & PRODUSE =====
        const userCofetarieExistent = await User.findOne({ email: 'ion.popescu@dulcegarii.com' });
        
        if (!userCofetarieExistent) {
            const parolaHash = await bcrypt.hash('123456', 10);
            
            // Cream User-ul pentru Cofetarie
            const noulUserCofetarie = await User.create({
                nume: 'Ion Popescu',
                email: 'ion.popescu@dulcegarii.com',
                parola: parolaHash,
                rol: 'cofetarie'
            });

            // Cream profilul de Cofetarie
            const nouaCofetarie = await Cofetarie.create({
                utilizator_id: noulUserCofetarie._id,
                numeCofetarie: 'Dulcegarii',
                adresa: 'Strada Florilor nr. 10',
                telefon: '0742518654',
                status: 'aprobata',
                imagine_coperta: 'partner_documents/cover_images/dulcegarii-imagine_coperta.png'
            });

            const cofetarieId = nouaCofetarie._id;

            // 4. ===== ADAUGARE PRODUSE =====
            const produseDeAdaugat = [
                {
                    numeProdus: 'Tort Ciocolată',
                    descriere: 'Tort cu cremă de ciocolată și fructe de pădure',
                    pret: 120,
                    categorie: 'Torturi',
                    stoc: 2,
                    imagine: 'partner_documents/product_images/tort_ciocolata.png',
                    data_expirare: '2026-04-18',
                    ingrediente: ['făină', 'zahăr', 'cacao', 'ouă', 'fructe de pădure', 'mascarpone', 'frișcă naturală'],
                    optiuni_decor: ['Trandafiri cremă', 'Scris manual', 'Fulgi de ciocolată']
                },
                {
                    numeProdus: 'Tort cu Fructe de Pădure',
                    descriere: 'Blat pufos cu cremă de iaurt și fructe proaspete',
                    pret: 95,
                    categorie: 'Torturi',
                    stoc: 3,
                    imagine: 'partner_documents/product_images/tort_cu_fructe.jpg',
                    data_expirare: '2026-04-18',
                    ingrediente: ['făină', 'zahăr', 'ouă', 'iaurt', 'fructe de pădure', 'gelatină'],
                    optiuni_decor: ['Fructe proaspete', 'Jeleu de fructe', 'Flori comestibile']
                },
                {
                    numeProdus: 'Prăjitură cu Ciocolată',
                    descriere: 'Prăjitură pufoasă cu cremă de ciocolată neagră',
                    pret: 18,
                    categorie: 'Prăjituri',
                    stoc: 10,
                    imagine: 'partner_documents/product_images/prajitura_ciocolata.jpg',
                    data_expirare: '2026-04-20',
                    ingrediente: ['făină', 'zahăr', 'cacao', 'ouă', 'unt', 'ciocolată neagră']
                },
                {
                    numeProdus: 'Macarons Vanilie',
                    descriere: 'Set de 6 macarons cu cremă de vanilie',
                    pret: 42,
                    categorie: 'Macarons',
                    stoc: 5,
                    imagine: 'partner_documents/product_images/macarons_vanilie.jpg',
                    data_expirare: '2026-04-24',
                    ingrediente: ['făină de migdale', 'zahăr', 'albș', 'vanilie', 'colorant']
                }
                // Adauga aici restul produselor urmand aceeasi structura...
            ];

            // Inseram toate produsele atasate cofetariei create
            for (const p of produseDeAdaugat) {
                await Produs.create({ ...p, cofetarie_id: cofetarieId });
                console.log(`✓ Produs creat: ${p.numeProdus}`);
            }

            console.log('✓ Cofetarie si produse create cu succes!');
        } else {
            console.log('! Datele cofetariei exista deja.');
        }

        console.log('=== SEED COMPLET ===');
        process.exit();

    } catch (error) {
        console.error('Eroare la seed:', error);
        process.exit(1);
    }
};

seedData();