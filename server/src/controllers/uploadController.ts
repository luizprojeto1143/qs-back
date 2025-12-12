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
    // Error handling is done by multer middleware, but if we reach here without a file:
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or file type not allowed' });
    }

    // Cloudinary returns the URL in `path` or `secure_url`
    // multer-storage-cloudinary puts the file info in req.file
    interface CloudinaryFile extends Express.Multer.File {
        path: string;
        secure_url?: string;
    }

    const file = req.file as CloudinaryFile;

    res.json({
        url: file.path || file.secure_url,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
    });
};

// Error handling middleware for Multer
export const handleUploadError = (err: any, req: Request, res: Response, next: Function) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Limit is 10MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
        console.error('Multer/Cloudinary Error:', err);
        return res.status(400).json({ error: `Invalid file type or upload failed: ${err.message || err}` });
    }
    next();
};
