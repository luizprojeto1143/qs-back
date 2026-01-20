import { Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import stream from 'stream';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// Configure storage: Memory storage to allow buffer inspection
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadMiddleware = upload.single('file');

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'video/mp4',
    'video/mpeg'
];

// Magic Bytes Helper
const checkMagicBytes = (buffer: Buffer, mimetype: string): boolean => {
    if (!buffer || buffer.length < 4) return false;
    const header = buffer.toString('hex', 0, 4);

    // Verify magic bytes for common critical types
    switch (mimetype) {
        case 'image/jpeg':
            return header.startsWith('ffd8ff');
        case 'image/png':
            return header === '89504e47';
        case 'application/pdf':
            return header === '25504446'; // %PDF
        case 'image/gif':
            return header.startsWith('47494638'); // GIF8
        case 'video/mp4':
            // Common MP4 signatures (ftyp)
            // Simple check: starts with specific bytes or contains ftyp at offset 4
            return true; // Simplified for MP4 due to complexity, relying on mime check + extension
        default:
            // For other allowed types, strict magic byte check might be too complex for this snippet.
            // We rely on the AllowList + Mime checks.
            return true;
    }
};

export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // 0. Validate MIME Type Allowlist
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'File type not allowed.' });
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
