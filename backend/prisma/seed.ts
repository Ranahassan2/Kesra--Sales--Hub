import { Role } from "../../src/lib/enums";
import { PrismaClient, } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Passw0rd!", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Rana",
      username: "admin",
      email: "admin@kesra.ai",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const headOfSales = await prisma.user.upsert({
    where: { username: "head.sales" },
    update: {},
    create: {
      name: "رئيس المبيعات",
      username: "head.sales",
      email: "head.sales@kesra.ai",
      passwordHash: password,
      role: Role.HEAD_OF_SALES,
    },
  });

  const teleSalesNames = ["أحمد", "سارة", "محمد", "منة", "يوسف"];
  const teleSalesUsers: any[] = [];
  for (let i = 0; i < teleSalesNames.length; i++) {
    const u = await prisma.user.upsert({
      where: { username: `tele${i + 1}` },
      update: {},
      create: {
        name: teleSalesNames[i],
        username: `tele${i + 1}`,
        email: `tele${i + 1}@kesra.ai`,
        passwordHash: password,
        role: Role.TELE_SALES,
      },
    });
    teleSalesUsers.push(u);
  }

  const salesNames = ["كريم", "نور"];
  const salesUsers = [];
  for (let i = 0; i < salesNames.length; i++) {
    const u = await prisma.user.upsert({
      where: { username: `sales${i + 1}` },
      update: {},
      create: {
        name: salesNames[i],
        username: `sales${i + 1}`,
        email: `sales${i + 1}@kesra.ai`,
        passwordHash: password,
        role: Role.SALES,
      },
    });
    salesUsers.push(u);
  }

  // ليدز تجريبية موزعة على موظفي التيلي سيلز
  const sampleLeads = Array.from({ length: 20 }).map((_, i) => ({
    name: `عميل تجريبي ${i + 1}`,
    phone: `010${(10000000 + i).toString().slice(0, 8)}`,
    company: i % 3 === 0 ? "شركة تجريبية" : undefined,
    createdById: admin.id,
    assignedToId: teleSalesUsers[i % teleSalesUsers.length].id,
  }));

  for (const lead of sampleLeads) {
    await prisma.lead.create({ data: lead });
  }

  console.log("✅ تم إنشاء بيانات تجريبية:");
  console.log("   Admin       → username: admin        / password: Passw0rd!");
  console.log("   Head Sales  → username: head.sales    / password: Passw0rd!");
  console.log("   Tele-Sales  → username: tele1..tele5   / password: Passw0rd!");
  console.log("   Sales       → username: sales1, sales2 / password: Passw0rd!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
