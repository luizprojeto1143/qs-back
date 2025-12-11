import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'qs-inclusao', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'mp4', 'mp3', 'wav'],
        resource_type: 'auto', // Auto-detect type (image, video, raw)
    } as any // Cast to any because types might be slightly mismatched
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Cloudinary returns the URL in `path` or `secure_url`
    // multer-storage-cloudinary puts the file info in req.file
    const file = req.file as any;

    res.json({
        url: file.path || file.secure_url,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
    });
};
