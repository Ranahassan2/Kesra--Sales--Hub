const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.lead.findFirst();
  if (lead) {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 2);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { createdAt: oldDate }
    });
    console.log("Updated lead:", lead.name, "to date:", oldDate);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
