import { LayoutDashboard, Route, Truck, Settings, Package, TrendingUp, Bell, ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
            <a key={item.id} className={currentPage === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)}>
              <Icon size={18} /> {item.label}
            </a>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-widget-green">
          <div className="sidebar-widget-top">
            <span className="widget-badge">Today <ArrowUp size={10} strokeWidth={3} /></span>
          </div>
          <div className="sidebar-widget-content">
            <div className="widget-stats">
              <div className="widget-value">1 332</div>
              <div className="widget-sub">+ 678 km</div>
            </div>
            <img src="/assets/images/sidebar_truck.png" alt="Truck" className="widget-img" />
          </div>
          <div className="widget-dots">
            <span className="dot active"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        </div>

        <div className="sidebar-alert">
          <div className="alert-icon">🔥</div>
          <div className="alert-text">
            <div className="alert-title">A new shipment available</div>
            <a href="#" className="alert-link">Details →</a>
          </div>
        </div>
      </div>
    </aside>
  );
}
