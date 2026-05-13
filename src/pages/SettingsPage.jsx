import { useApp } from '../context/AppContext';
import { LogOut, Shield, Eye, Lock, UserCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useApp();

  const sections = [
    { icon: Eye, title: 'Сбор данных', text: 'Мы собираем только данные, необходимые для работы сервиса: имя, email, данные о компании и маршрутах.' },
    { icon: Shield, title: 'Использование', text: 'Данные используются для обработки заказов. Мы не передаём их третьим лицам без согласия.' },
    { icon: Lock, title: 'Безопасность', text: 'Пароли хранятся в зашифрованном виде, данные передаются по защищённым каналам.' },
    { icon: UserCheck, title: 'Ваши права', text: 'Вы можете запросить доступ к данным, их исправление или удаление.' },
  ];

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Настройки</h1></div>
      <div style={{ maxWidth: 600 }}>
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 }}>
          <div className="section-title">Профиль</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><div className="text-xs text-muted" style={{ textTransform:'uppercase', fontWeight:600 }}>Имя</div><div className="font-medium text-sm mt-2">{user?.name||'—'}</div></div>
            <div><div className="text-xs text-muted" style={{ textTransform:'uppercase', fontWeight:600 }}>Email</div><div className="font-medium text-sm mt-2">{user?.email||'—'}</div></div>
            <div><div className="text-xs text-muted" style={{ textTransform:'uppercase', fontWeight:600 }}>Роль</div><div className="font-medium text-sm mt-2">Логист</div></div>
            <div><div className="text-xs text-muted" style={{ textTransform:'uppercase', fontWeight:600 }}>ID</div><div className="text-xs text-muted mt-2" style={{ fontFamily:'monospace' }}>{user?._id||'—'}</div></div>
          </div>
        </div>

        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 }}>
          <div className="section-title">Конфиденциальность</div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {sections.map((s, i) => { const Icon = s.icon; return (
              <div key={i}>
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={16} color="var(--accent)" /></div>
                  <div className="font-bold text-sm">{s.title}</div>
                </div>
                <p className="text-sm text-muted" style={{ lineHeight:1.7 }}>{s.text}</p>
                {i < sections.length - 1 && <div style={{ height:1, background:'var(--border)', margin:'16px 0 0' }} />}
              </div>
            ); })}
          </div>
        </div>

        <button className="btn btn-danger w-full" onClick={logout} style={{ padding:'12px 16px' }}><LogOut size={16} /> Выйти из аккаунта</button>
      </div>
    </div>
  );
}
