const mongoose = require('mongoose');

const cosSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    continut: { type: String, required: true } // Poti pastra formatul JSON string sau sa-l faci array
}, { timestamps: true });

module.exports = mongoose.model('Cos', cosSchema);