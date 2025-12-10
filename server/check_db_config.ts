import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;

if (url) {
    console.log('DATABASE_URL is set');
    try {
        // Handle different URL formats
        // postgres://user:pass@host:port/db
        const parts = url.split('@');
        if (parts.length > 1) {
            const hostPortDb = parts[1];
            const [hostPort, db] = hostPortDb.split('/');
            const [host, port] = hostPort.split(':');
            console.log(`Host: ${host}`);
            console.log(`Port: ${port}`);
            console.log(`Database: ${db}`);
        } else {
            console.log('DATABASE_URL format not recognized (might be missing credentials or different format)');
        }
    } catch (e) {
        console.error('Error parsing DATABASE_URL', e);
    }
} else {
    console.log('DATABASE_URL is NOT set');
}
