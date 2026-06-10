import { LayoutDashboard, Route, Truck, Settings, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Обзор' },
  { id: 'orders', icon: Route, label: 'Маршруты' },
  { id: 'fleet', icon: Truck, label: 'Автопарк' },
  { id: 'settings', icon: Settings, label: 'Настройки' },
];

export default function Sidebar({ currentPage, onNavigate }) {
  const { user } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><Package size={18} /></div>
        <h1>Vostok Cargo</h1>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{(user?.name || 'L')[0].toUpperCase()}</div>
        <div style={{ overflow:'hidden' }}>
          <div className="sidebar-user-name">{user?.name || 'Логист'}</div>
          <div className="sidebar-user-email">{user?.email || ''}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={currentPage === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)}>
              <Icon size={18} /> {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
