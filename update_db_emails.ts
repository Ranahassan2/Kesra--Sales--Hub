import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.email.includes('zawolf.ai')) {
      const newEmail = user.email.replace('zawolf.ai', 'kesra.ai');
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      });
      console.log(`Updated ${user.email} -> ${newEmail}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
