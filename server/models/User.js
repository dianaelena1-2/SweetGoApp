const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nume: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    parola: { type: String, required: true },
    adresa_default: String,
    telefon: String,
    rol: { type: String, enum: ['client', 'cofetarie', 'admin'], required: true },
    favorite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cofetarie' }] 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);