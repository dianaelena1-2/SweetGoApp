const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const cron = require('node-cron')

const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const { router: produseRoutes, verificaDisponibilitate } = require('./routes/produse')
const comenziRoutes = require('./routes/comenzi')
const cofetariiRoutes = require('./routes/cofetarii')
const dashboardRoutes = require('./routes/dashboard')
const ingredienteRoutes = require('./routes/ingrediente')
const clientRoutes = require('./routes/client')

dotenv.config()
const connectDB = require('./db')
connectDB()

const app = express()

app.use(cors({ 
    origin: ['http://localhost:5173', 'https://sweet-go-app.vercel.app'],
    credentials: true 
}))
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
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ingrediente', ingredienteRoutes)
app.use('/api/client', clientRoutes)

app.get('/', (req,res) => {
    res.json({ mesaj: 'Server pornit cu succes!'})
})

cron.schedule('0 0 * * *', async () => {
    //console.log('[CRON] Ora 00:00! Rulez verificarea produselor expirate...');
    try {
        await verificaDisponibilitate();
        //console.log('[CRON] Verificarea s-a încheiat. Produsele expirate au fost ascunse.');
    } catch (eroare) {
        console.error('[CRON] Eroare la ascunderea produselor expirate:', eroare);
    }
}, {
    scheduled: true,
    timezone: "Europe/Bucharest" 
})

app.listen(PORT, () => {
    console.log(`Server ruleaza pe portul ${PORT}`)
})