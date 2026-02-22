const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.fieldname === 'certificat_inregistrare'){
            cb(null, 'partner_documents/registration_certificates/')
        }
        else if(file.fieldname === 'certificat_sanitar'){
            cb(null, 'partner_documents/sanitary_certificates/')
        }
    },
    //previne suprascrierea fisierelor, creeaza un nume unic pentru fiecare
    filename: (req, file, cb) => {
        const nume_cofetarie = req.body.numeCofetarie
            ? req.body.numeCofetarie.replace(/\s+/g,'_').toLowerCase()
            : 'cofetarie'
        const uniqueSuffix = Date.now()
        cb(null, `${nume_cofetarie}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if(allowedTypes.includes(ext)){
        cb(null, true)
    } else {
        cb(new Error('Se accepta doar fisiere pdf, jpg si png', false))
    }
}

const upload = multer ({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

const storageImaginiProduse = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'partner_documents/product_images/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now()
        cb(null, `produs-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
})

const uploadImaginiProduse = multer({
    storage: storageImaginiProduse,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = { upload, uploadImaginiProduse }