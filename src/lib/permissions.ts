import { Role } from "@/lib/enums";


/**
 * كل الصلاحيات في مكان واحد — أي تعديل على قواعد الوصول يبدأ من هنا.
 * Single source of truth for role-based access control.
 */
export const PERMISSIONS = {
  // من يقدر يرفع/يضيف ليدز جديدة ويوزعها
  UPLOAD_LEADS: [Role.ADMIN, Role.HEAD_OF_SALES] as Role[],
  ADD_LEAD_MANUALLY: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],

  // مين يشوف كل الليدز (Admin/Head) مقابل ليدزه بس (Tele-Sales/Sales)
  VIEW_ALL_LEADS: [Role.ADMIN, Role.HEAD_OF_SALES] as Role[],
  VIEW_OWN_LEADS: [Role.TELE_SALES, Role.SALES] as Role[],

  // متابعة أداء الموظفين والتقارير
  VIEW_TEAM_PERFORMANCE: [Role.ADMIN, Role.HEAD_OF_SALES] as Role[],
  VIEW_FULL_ACTIVITY_LOG: [Role.ADMIN, Role.HEAD_OF_SALES] as Role[],

  // إدارة المستخدمين (إنشاء حسابات، تعطيل، تغيير الأدوار)
  MANAGE_USERS: [Role.ADMIN] as Role[],

  // تحديث حالة الليد ومتابعتها — بيتعمل من مالك الليد الحالي أو الإدارة
  UPDATE_LEAD_STATUS: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],
  CREATE_FOLLOWUP: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],

  // تحديد Meeting وتحويل العميل لـ Sales — بيتعمل من Tele-Sales (أو الإدارة نيابة عنه)
  SCHEDULE_MEETING: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],
  TRANSFER_TO_SALES: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES] as Role[],

  // تسجيل نتيجة الميتينج — Sales بشكل أساسي، وكمان Tele-Sales لو الليد لسه معاه
  RECORD_MEETING_RESULT: [Role.ADMIN, Role.HEAD_OF_SALES, Role.SALES, Role.TELE_SALES] as Role[],

  // تعديل بيانات العميل (اسم/هاتف/إيميل/شركة/احتياج/ملاحظات)
  EDIT_LEAD_DETAILS: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],

  // حذف ليد نهائيًا من النظام
  DELETE_LEAD: [Role.ADMIN] as Role[],

  // تحديد متابعة كمكتملة
  COMPLETE_FOLLOWUP: [Role.ADMIN, Role.HEAD_OF_SALES, Role.TELE_SALES, Role.SALES] as Role[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function can(role: Role, permission: PermissionKey): boolean {
  return (PERMISSIONS[permission] as Role[]).includes(role);
}

/** الصفحة الافتراضية بعد تسجيل الدخول، حسب الدور */
export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case Role.ADMIN:
    case Role.HEAD_OF_SALES:
      return "/admin";
    case Role.TELE_SALES:
      return "/tele-sales";
    case Role.SALES:
      return "/sales";
    default:
      return "/login";
  }
}

/** هل الدور ده من نوع "إدارة" برؤية كاملة على النظام */
export function isManagementRole(role: Role): boolean {
  return role === Role.ADMIN || role === Role.HEAD_OF_SALES;
}
