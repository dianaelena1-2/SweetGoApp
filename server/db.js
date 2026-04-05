const Database = require('better-sqlite3')
const db = new Database('sweetGo.db')

db.exec(`
    CREATE TABLE IF NOT EXISTS utilizatori (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nume TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        parola TEXT NOT NULL,
        rol TEXT CHECK(rol IN ('client', 'cofetarie', 'admin')) NOT NULL,
        creat_la DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS cofetarii (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utilizator_id INTEGER UNIQUE NOT NULL,
        numeCofetarie TEXT NOT NULL,
        adresa TEXT,
        telefon TEXT,
        certificat_inregistrare TEXT, 
        certificat_sanitar TEXT,
        imagine_coperta TEXT,
        status TEXT DEFAULT 'in_asteptare',
        FOREIGN KEY (utilizator_id) REFERENCES utilizatori(id)
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS produse (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cofetarie_id INTEGER NOT NULL,
        numeProdus TEXT NOT NULL,
        descriere TEXT,
        pret REAL NOT NULL,
        categorie TEXT,
        stoc INTEGER DEFAULT 0,
        disponibil INTEGER DEFAULT 1,
        imagine TEXT,
        transport_recomandat TEXT DEFAULT 'masina',
        FOREIGN KEY (cofetarie_id) REFERENCES cofetarii(id)
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS ingrediente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nume TEXT UNIQUE NOT NULL
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS compozitieProdus(
        produs_id INTEGER,
        ingredient_id INTEGER,
        PRIMARY KEY (produs_id, ingredient_id),
        FOREIGN KEY (produs_id) REFERENCES produse(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingrediente(id) ON DELETE CASCADE
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS comenzi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        cofetarie_id INTEGER NOT NULL,
        status TEXT DEFAULT 'plasata',
        total REAL NOT NULL,
        adresa_livrare TEXT NOT NULL,
        telefon TEXT,
        observatii TEXT,
        este_cadou BOOLEAN,
        mesaj_cadou TEXT,
        tip_transport TEXT DEFAULT 'masina',
        metoda_plata TEXT DEFAULT 'numerar',
        status_plata TEXT DEFAULT 'in_asteptare',
        creat_la DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES utilizatori(id),
        FOREIGN KEY (cofetarie_id) REFERENCES cofetarii(id)
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS detalii_comanda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comanda_id INTEGER NOT NULL,
        produs_id INTEGER NOT NULL,
        cantitate INTEGER NOT NULL,
        pret_unitar REAL NOT NULL,
        optiune_decor TEXT,
        observatii TEXT,
        FOREIGN KEY (comanda_id) REFERENCES comenzi(id),
        FOREIGN KEY (produs_id) REFERENCES produse(id)
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS recenzii (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comanda_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        cofetarie_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
        comentariu TEXT,
        creat_la DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES utilizatori(id),
        FOREIGN KEY (cofetarie_id) REFERENCES cofetarii(id)
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS optiuni_decor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produs_id INTEGER NOT NULL,
        denumire TEXT NOT NULL,
        FOREIGN KEY (produs_id) REFERENCES produse(id)
    )
`)

module.exports = db