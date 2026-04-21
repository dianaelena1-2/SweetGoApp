const mongoose = require('mongoose');

const produsSchema = new mongoose.Schema({
    cofetarie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cofetarie', required: true },
    numeProdus: { type: String, required: true },
    descriere: String,
    pret: { type: Number, required: true },
    categorie: String,
    stoc: { type: Number, default: 0 },
    disponibil: { type: Boolean, default: true },
    imagine: String,
    data_expirare: Date,
    este_la_oferta: { type: Boolean, default: false },
    transport_recomandat: { type: String, default: 'masina' },
    ingrediente: [String], 
    optiuni_decor: [String] 
}, { timestamps: true });

module.exports = mongoose.model('Produs', produsSchema);