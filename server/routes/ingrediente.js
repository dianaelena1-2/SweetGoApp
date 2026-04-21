const express = require('express');
const router = express.Router();
const { verifyToken, verifyRol } = require('../middleware/auth');
const Ingredient = require('../models/Ingredient');

router.get('/', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const ingrediente = await Ingredient.find().sort({ nume: 1 });
        res.json(ingrediente);
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la obținerea ingredientelor' });
    }
});

router.post('/', verifyToken, verifyRol('cofetarie'), async (req, res) => {
    try {
        const { nume } = req.body;
        if (!nume) return res.status(400).json({ mesaj: 'Numele ingredientului este obligatoriu' });

        const numeNormalizat = nume.trim().toLowerCase();
        const ingredient = await Ingredient.findOneAndUpdate(
            { nume: numeNormalizat },
            { nume: numeNormalizat },
            { upsert: true, new: true }
        );
        res.status(201).json(ingredient);
    } catch (err) {
        res.status(500).json({ mesaj: 'Eroare la adăugarea ingredientului' });
    }
});

module.exports = router;