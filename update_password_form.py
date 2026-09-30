import re

with open('src/components/ChangePasswordForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_old = '''  const [busy, setBusy] = useState(false);'''
state_new = '''  const [busy, setBusy] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const EyeIcon = ({ show }: { show: boolean }) => (
    show ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )
  );'''
content = content.replace(state_old, state_new)

inputs_old = '''      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الحالية</label>
        <input
          type="password"
          required
          className="input-field"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          className="input-field"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">تأكيد كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          className="input-field"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>'''

inputs_new = '''      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الحالية</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            required
            className="input-field w-full pr-10"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" dir="ltr">
            <EyeIcon show={showCurrent} />
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الجديدة</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            required
            minLength={6}
            className="input-field w-full pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" dir="ltr">
            <EyeIcon show={showNew} />
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">تأكيد كلمة المرور الجديدة</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            required
            minLength={6}
            className="input-field w-full pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" dir="ltr">
            <EyeIcon show={showConfirm} />
          </button>
        </div>
      </div>'''
content = content.replace(inputs_old, inputs_new)

with open('src/components/ChangePasswordForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
