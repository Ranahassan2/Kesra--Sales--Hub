import re

with open('src/app/api/users/[id]/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace auth check
auth_old = '''  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "MANAGE_USERS")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }'''

auth_new = '''  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }
  
  const isSelf = session.user.id === params.id;
  if (!isSelf && !can(session.user.role, "MANAGE_USERS")) {
    return NextResponse.json({ error: "غير مصرح لك بتعديل بيانات غيرك" }, { status: 403 });
  }'''
content = content.replace(auth_old, auth_new)

# Replace self check to prevent non-admins from changing roles
self_check_old = '''  // منع الأدمن من تعطيل نفسه أو تنزيل دوره بالغلط لحد ما يفقد صلاحيته
  if (user.id === session.user.id) {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    if (parsed.data.isActive === false || (parsed.data.role && parsed.data.role !== Role.ADMIN)) {
      return NextResponse.json(
        { error: "لا يمكنك تعطيل حسابك أو تغيير دورك بنفسك" },
        { status: 400 }
      );
    }
    return applyUpdate(user.id, parsed.data);
  }'''

self_check_new = '''  if (isSelf) {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    
    // Prevent self role/status change unless ADMIN doing it to themselves safely
    if (parsed.data.isActive === false) {
      return NextResponse.json({ error: "لا يمكنك تعطيل حسابك بنفسك" }, { status: 400 });
    }
    if (parsed.data.role && parsed.data.role !== user.role && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "لا يمكنك تغيير دورك الوظيفي" }, { status: 400 });
    }
    
    return applyUpdate(user.id, parsed.data);
  }'''
content = content.replace(self_check_old, self_check_new)

with open('src/app/api/users/[id]/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
