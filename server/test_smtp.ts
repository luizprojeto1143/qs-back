import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the same directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('Testando conexão com:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '******' : 'NÃO DEFINIDO'
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function verify() {
    try {
        console.log('Tentando conectar...');
        await transporter.verify();
        console.log('✅ SUCESSO! Conexão SMTP estabelecida corretamente.');
    } catch (error) {
        console.error('❌ ERRO: Não foi possível conectar ao servidor SMTP.');
        console.error(error);
    }
}

verify();
