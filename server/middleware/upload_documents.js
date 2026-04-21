const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if(allowedTypes.includes(ext)){
        cb(null, true);
    } else {
        cb(new Error('Se accepta doar fisiere jpg si png', false));
    }
};

const storageImagini= new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderPath = 'sweetgo/documente';
        if (file.fieldname === 'imagine_coperta') {
            folderPath = 'sweetgo/coperte'
        } else if (file.fieldname === 'imagine'){
            folderPath = 'sweetgo/produse'
        }
        return {
            folder: folderPath,
            allowed_formats: ['jpg', 'jpeg', 'png'],
            resource_type: 'image',
            type: 'upload',
        };
    }
});

const upload = multer({
    storage: storageImagini,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }
});

const uploadImaginiProduse = multer({
    storage: storageImagini,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadImaginiCofetarii = multer({
    storage: storageImagini,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = { upload, uploadImaginiProduse, uploadImaginiCofetarii };