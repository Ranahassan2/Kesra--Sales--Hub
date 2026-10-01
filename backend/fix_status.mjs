import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r = await p.lead.updateMany({ where: { status: "TRANSFERRED_TO_SALES" }, data: { status: "NEW" } });
console.log("Updated leads:", r.count);
await p.$disconnect();
