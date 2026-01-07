import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import stream from 'stream';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage: Memory storage to allow buffer inspection
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadMiddleware = upload.single('file');

// Magic Bytes Helper
const checkMagicBytes = (buffer: Buffer, mimetype: string): boolean => {
    if (!buffer || buffer.length < 4) return false;
    const header = buffer.toString('hex', 0, 4);

    switch (mimetype) {
        case 'image/jpeg':
            return header.startsWith('ffd8ff');
        case 'image/png':
            return header === '89504e47';
        case 'application/pdf':
            return header === '25504446'; // %PDF
        case 'image/gif':
            return header.startsWith('47494638'); // GIF8
        // Add other signatures as needed (MP4, MP3 are complex, accepting by mime for now if magic check fails or complex)
        default:
            // For other types, fallback to mimetype check IF strict mode isn't required for them
            // In a strict environment, we should check all. 
            // For now, allowing others but blocking obvious mismatch if possible.
            return true;
    }
};

export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Validate Magic Bytes
    if (!checkMagicBytes(req.file.buffer, req.file.mimetype)) {
        console.error(`Security Block: File header mismatch for ${req.file.mimetype}`);
        return res.status(400).json({ error: 'File content does not match extension (Spoofing detected)' });
    }

    // 2. Upload to Cloudinary via Stream
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: 'qs-inclusao',
            resource_type: 'auto'
        },
        (error, result) => {
            if (error) {
                return sendError500(res, ERROR_CODES.UPL_CLOUD, error);
            }
            if (!result) {
                return sendError500(res, ERROR_CODES.UPL_UNKNOWN, new Error('No result from upload'));
            }

            res.json({
                url: result.secure_url,
                filename: req.file?.originalname, // Safe navigation
                mimetype: result.format ? `${result.resource_type}/${result.format}` : req.file?.mimetype,
                size: result.bytes
            });
        }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(uploadStream);
};

// Error handling middleware for Multer
export const handleUploadError = (err: any, req: Request, res: Response, next: Function) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Limit is 10MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
        console.error('Multer/Storage Error:', err);
        return res.status(400).json({ error: `Invalid file type or upload failed: ${err.message || err}` });
    }
    next();
};
