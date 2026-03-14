const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const produseRoutes = require('./routes/produse')
const comenziRoutes = require('./routes/comenzi')
const cofetariiRoutes = require('./routes/cofetarii')
const optiuniDecorRoutes = require('./routes/optiuniDecor')

dotenv.config()
const db = require('./db')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const path = require('path')
app.use('/partner_documents', express.static(path.join(__dirname, 'partner_documents')))

const PORT = process.env.PORT || 7000

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/produse',produseRoutes)
app.use('/api/comenzi', comenziRoutes)
app.use('/api/cofetarii', cofetariiRoutes)
app.use('/api/optiuni-decor', optiuniDecorRoutes)

app.get('/', (req,res) => {
    res.json({ mesaj: 'Server pornit cu succes!'})
})

app.listen(PORT, () => {
    console.log(`Server ruleaza pe portul ${PORT}`)
})