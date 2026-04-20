const mongoose = require('mongoose');

const notificareSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mesaj: { type: String, required: true },
    tip: { type: String, default: 'info' },
    citita: { type: Boolean, default: false },
    link: String
}, { timestamps: true });

module.exports = mongoose.model('Notificare', notificareSchema);