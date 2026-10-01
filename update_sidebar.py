import re

with open('src/components/DashboardShell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

sidebar_old = '''        <nav className="space-y-2 mt-4 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                pathname === link.href 
                  ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>'''

sidebar_new = '''        <nav className="space-y-2 mt-4 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                pathname === link.href 
                  ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              href="/whatsapp"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                pathname === '/whatsapp' 
                  ? 'bg-green-600/20 text-green-400 font-bold border border-green-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className="text-xl">💬</span>
              ربط واتساب
            </Link>
          </div>
        </nav>'''
content = content.replace(sidebar_old, sidebar_new)

with open('src/components/DashboardShell.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
