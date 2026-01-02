
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAvatar() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'luizteste@gmail.com' }
        });

        if (!user) {
            console.log('Usuário não encontrado.');
        } else {
            console.log('Usuário encontrado:', user.name);
            console.log('Avatar URL:', user.avatar);
            console.log('Possui avatar?', !!user.avatar);
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAvatar();
