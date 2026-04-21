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
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if(allowedTypes.includes(ext)){
        cb(null, true);
    } else {
        cb(new Error('Se accepta doar fisiere pdf, jpg si png', false));
    }
};

const storageDocumente = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderPath = 'sweetgo/documente';
        if (file.fieldname === 'imagine_coperta') {
            folderPath = 'sweetgo/coperte';
        }
        return {
            folder: folderPath,
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            resource_type: 'auto' 
        };
    }
});

const upload = multer({
    storage: storageDocumente,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }
});

const storageImaginiProduse = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sweetgo/produse',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    }
});

const uploadImaginiProduse = multer({
    storage: storageImaginiProduse,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const storageImaginiCofetarii = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sweetgo/coperte',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    }
});

const uploadImaginiCofetarii = multer({
    storage: storageImaginiCofetarii,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { upload, uploadImaginiProduse, uploadImaginiCofetarii };