import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendInviteEmail = async (to: string, roomUrl: string, collaboratorInfo: any) => {
    if (!process.env.SMTP_USER) {
        console.log('---------------------------------------------------');
        console.log('⚠️ SMTP not configured. Email would be sent to:', to);
        // console.log('Room URL:', roomUrl); // Removed for security
        // console.log('Collaborator:', collaboratorInfo); // Removed for security
        console.log('---------------------------------------------------');
        return;
    }

    const infoHtml = `
        <h2>Convite para Atendimento em Libras</h2>
        <p>Você foi convidado para participar de um atendimento em andamento.</p>
        <br/>
        <h3>Dados do Colaborador:</h3>
        <ul>
            <li><strong>Nome:</strong> ${collaboratorInfo.name}</li>
            <li><strong>Matrícula:</strong> ${collaboratorInfo.matricula}</li>
            <li><strong>Área:</strong> ${collaboratorInfo.area}</li>
            <li><strong>Turno:</strong> ${collaboratorInfo.shift}</li>
        </ul>
        <br/>
        <a href="${roomUrl}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Entrar na Chamada
        </a>
        <br/><br/>
        <p>Ou acesse pelo link: ${roomUrl}</p>
    `;

    try {
        await transporter.sendMail({
            from: `"Central de Libras" <${process.env.SMTP_USER}>`,
            to,
            subject: `Convite para Atendimento - ${collaboratorInfo.name}`,
            html: infoHtml,
        });
        console.log('Invite email sent to:', to);
    } catch (error) {
        console.error('Error sending invite email:', error);
        throw error;
    }
};
