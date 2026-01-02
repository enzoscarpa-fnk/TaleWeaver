import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    const email = process.argv[2] || 'admin@taleweaver.com';
    const password = process.argv[3] || 'admin123';

    console.log(`Création de l'utilisateur admin avec l'email: ${email}`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('❌ Un utilisateur avec cet email existe déjà');
        await prisma.$disconnect();
        process.exit(1);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: Role.ADMIN,
        },
    });

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Rôle: ${admin.role}`);
    console.log('');
    console.log('Vous pouvez maintenant vous connecter avec ces identifiants.');

    await prisma.$disconnect();
}

createAdmin().catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
});


