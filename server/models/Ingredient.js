const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    nume: { type: String, required: true, unique: true, lowercase: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);