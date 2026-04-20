const mongoose = require('mongoose');

const cofetarieSchema = new mongoose.Schema({
    utilizator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    numeCofetarie: { type: String, required: true },
    adresa: String,
    telefon: String,
    certificat_inregistrare: String,
    certificat_sanitar: String,
    imagine_coperta: String,
    status: { type: String, default: 'in_asteptare', enum: ['in_asteptare', 'aprobata', 'respinsa'] }
}, { timestamps: true });

module.exports = mongoose.model('Cofetarie', cofetarieSchema);