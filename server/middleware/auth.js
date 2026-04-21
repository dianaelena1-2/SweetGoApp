const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ mesaj: 'Acces refuzat, token lipsa' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.utilizator = decoded
        next()
    } catch (err) {
        return res.status(403).json({ mesaj: 'Token invalid sau expirat' })
    }
}

const verifyRol = (...roluri) => {
    return (req, res, next) => {
        if (!roluri.includes(req.utilizator.rol)) {
            return res.status(403).json({ mesaj: 'Nu ai permisiunea necesara' })
        }
        next()
    }
}

module.exports = { verifyToken, verifyRol }