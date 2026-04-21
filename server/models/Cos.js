const mongoose = require('mongoose');

const cosSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    continut: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Cos', cosSchema);