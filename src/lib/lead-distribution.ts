import { Role, LeadSource } from "@/lib/enums";
import { prisma } from "@/lib/prisma";


interface RawLeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  need?: string;
  storeUrl?: string;
  socialMediaUrl?: string;
}

/**
 * يوزع مجموعة ليدز جديدة بالتساوي (Round-robin) على كل موظفي التيلي سيلز
 * النشطين حاليًا. لو عدد الليدز مش قابل للقسمة بالظبط، الفرق بيتوزع بالتساوي
 * كمان بحيث محدش ياخد أكتر من التاني بأكثر من ليد واحد.
 *
 * مثال: 100 ليد / 5 موظفين = 20 لكل واحد بالظبط.
 * 102 ليد / 5 موظفين = 3 موظفين ياخدوا 21 و2 ياخدوا 20.
 */
export async function distributeLeads(
  rawLeads: RawLeadInput[],
  createdById: string,
  source: LeadSource,
  uploadBatchId?: string
) {
  const teleSalesTeam = await prisma.user.findMany({
    where: { role: Role.TELE_SALES, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (teleSalesTeam.length === 0) {
    throw new Error("لا يوجد موظفين Tele-Sales نشطين لتوزيع الليدز عليهم");
  }

  // منع تكرار نفس رقم الهاتف كليد جديد لو موجود بالفعل في النظام
  const existingPhones = new Set(
    (
      await prisma.lead.findMany({
        where: { phone: { in: rawLeads.map((l) => l.phone) } },
        select: { phone: true },
      })
    ).map((l) => l.phone)
  );

  // ومنع تكرار نفس الرقم أكتر من مرة داخل نفس الملف/الطلب
  const seenInBatch = new Set<string>();
  const duplicatePhones: string[] = [];
  const uniqueLeads = rawLeads.filter((lead) => {
    if (existingPhones.has(lead.phone) || seenInBatch.has(lead.phone)) {
      duplicatePhones.push(lead.phone);
      return false;
    }
    seenInBatch.add(lead.phone);
    return true;
  });

  if (uniqueLeads.length === 0) {
    return { leads: [], distribution: {}, teamSize: teleSalesTeam.length, duplicatePhones };
  }

  const created = await prisma.$transaction(
    uniqueLeads.map((lead, index) => {
      const assignee = teleSalesTeam[index % teleSalesTeam.length];
      return prisma.lead.create({
        data: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          need: lead.need,
          storeUrl: lead.storeUrl,
          socialMediaUrl: lead.socialMediaUrl,
          source,
          createdById,
          assignedToId: assignee.id,
          currentStage: Role.TELE_SALES,
          uploadBatchId,
          activities: {
            create: {
              userId: createdById,
              type: "LEAD_ASSIGNED",
              message: `تم توزيع الليد تلقائيًا على موظف Tele-Sales`,
            },
          },
        },
      });
    })
  );

  // ملخص التوزيع — مفيد للعرض في الداشبورد بعد الرفع مباشرة
  const distribution: Record<string, number> = {};
  created.forEach((lead) => {
    if (lead.assignedToId) {
      distribution[lead.assignedToId] = (distribution[lead.assignedToId] ?? 0) + 1;
    }
  });

  return { leads: created, distribution, teamSize: teleSalesTeam.length, duplicatePhones };
}
