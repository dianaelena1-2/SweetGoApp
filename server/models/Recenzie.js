const mongoose = require('mongoose');

const recenzieSchema = new mongoose.Schema({
    comanda_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comanda', required: true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cofetarie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cofetarie', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comentariu: String
}, { timestamps: true });

module.exports = mongoose.model('Recenzie', recenzieSchema);