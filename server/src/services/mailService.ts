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

interface CollaboratorInfo {
    name: string;
    matricula: string;
    area: string;
    shift: string;
}

export const sendInviteEmail = async (to: string, roomUrl: string, collaboratorInfo: CollaboratorInfo) => {
    if (!process.env.SMTP_USER) {
        // console.log(`[MailService] SMTP not configured. Email to ${to} suppressed.`);
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
        // console.log('Invite email sent to:', to);
    } catch (error) {
        console.error('Error sending invite email:', error);
        throw error;
    }
};

export const sendInterpreterRequestStatusEmail = async (to: string[], status: string, requestDetails: any) => {
    if (!process.env.SMTP_USER || to.length === 0) {
        // console.log(`[MailService] SMTP not configured or no recipients. Email suppressed.`);
        return;
    }

    const statusText = status === 'APPROVED' ? 'APROVADA' : status === 'REJECTED' ? 'REJEITADA' : status;
    const color = status === 'APPROVED' ? '#10B981' : '#EF4444';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${color};">Atualização da Solicitação de Intérprete</h2>
            <p>Sua solicitação foi <strong>${statusText}</strong>.</p>
            <br/>
            <h3>Detalhes do Pedido:</h3>
            <ul>
                <li><strong>Data:</strong> ${new Date(requestDetails.date).toLocaleDateString('pt-BR')}</li>
                <li><strong>Horário:</strong> ${requestDetails.startTime}</li>
                <li><strong>Duração:</strong> ${requestDetails.duration} minutos</li>
                <li><strong>Tema:</strong> ${requestDetails.theme}</li>
                <li><strong>Modalidade:</strong> ${requestDetails.modality}</li>
            </ul>
            ${requestDetails.adminNotes ? `<div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; margin-top: 10px;"><p><strong>Observações:</strong> ${requestDetails.adminNotes}</p></div>` : ''}
            ${requestDetails.meetingLink ? `<br/><p><strong>Link da Reunião:</strong> <a href="${requestDetails.meetingLink}" style="color: #2563EB;">${requestDetails.meetingLink}</a></p>` : ''}
            <br/>
            <p style="font-size: 12px; color: #666;">Este é um e-mail automático, por favor não responda.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Central de Libras" <${process.env.SMTP_USER}>`,
            to: to.join(', '),
            subject: `Solicitação de Intérprete - ${statusText}`,
            html,
        });
        // console.log('Status email sent to:', to);
    } catch (error) {
        console.error('Error sending status email:', error);
    }
};
