const mongoose = require('mongoose');

const comandaSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cofetarie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cofetarie', required: true },
    status: { type: String, default: 'plasata' },
    total: { type: Number, required: true },
    cost_livrare: { type: Number, default: 0 },
    adresa_livrare: { type: String, required: true },
    telefon: String,
    observatii: String,
    este_cadou: { type: Boolean, default: false },
    mesaj_cadou: String,
    tip_transport: { type: String, default: 'masina' },
    metoda_plata: { type: String, default: 'numerar' },
    status_plata: { type: String, default: 'in_asteptare' },
    are_recenzie: { type: Boolean, default: false },
    detalii: [{ 
        produs_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Produs' },
        cantitate: Number,
        pret_unitar: Number,
        optiune_decor: String,
        observatii: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Comanda', comandaSchema);