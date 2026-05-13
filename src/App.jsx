import { useState, useCallback } from 'react';
import AppContext from './context/AppContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import FleetPage from './pages/FleetPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vostok_logist_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
  }, []);

  const handleAuth = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('vostok_logist_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vostok_logist_user');
    setCurrentPage('dashboard');
  }, []);

  const contextValue = { user, showToast, logout };

  if (!user) {
    return (
      <>
        <LoginPage onAuth={handleAuth} showToast={showToast} />
        <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'orders': return <OrdersPage />;
      case 'fleet': return <FleetPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  // Dashboard has its own 3-column layout, other pages use simple wrapper
  const needsWrapper = currentPage !== 'dashboard';

  return (
    <AppContext.Provider value={contextValue}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      {needsWrapper ? (
        <div className="page-wrap">
          {renderPage()}
        </div>
      ) : (
        renderPage()
      )}
      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </AppContext.Provider>
  );
}
