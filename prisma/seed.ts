import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const hashedPassword = await bcrypt.hash('AdminP@ss123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nidhiflow.io' },
    update: {},
    create: {
      email: 'admin@nidhiflow.io',
      name: 'System Administrator',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Seeded Admin User: ${admin.email}`);

  const sampleUserPassword = await bcrypt.hash('UserP@ss123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'murali@nidhiflow.io' },
    update: {},
    create: {
      email: 'murali@nidhiflow.io',
      name: 'Murali',
      password: sampleUserPassword,
      role: Role.USER,
    },
  });

  console.log(`✅ Seeded Standard User: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
