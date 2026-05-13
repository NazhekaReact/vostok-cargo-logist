import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { loginRequest, registerRequest } from '../api/auth';

export default function LoginPage({ onAuth, showToast }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isRegister && !name.trim())) {
      showToast('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      const payload = isRegister
        ? { name: name.trim(), email: email.trim().toLowerCase(), password, role: 'LOGISTICIAN' }
        : { email: email.trim().toLowerCase(), password };

      const data = isRegister ? await registerRequest(payload) : await loginRequest(payload);

      if (!data?._id) {
        showToast('Сервер не вернул пользователя');
        return;
      }

      if (data.role !== 'LOGISTICIAN') {
        showToast('Доступ только для логистов');
        return;
      }

      onAuth(data);
      showToast(isRegister ? 'Аккаунт создан' : 'Вход выполнен');
    } catch (err) {
      console.error('AUTH ERROR:', err?.response?.data || err?.message);
      showToast(err?.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Vostok Cargo</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Создайте аккаунт логиста' : 'Панель управления логиста'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <div className="auth-input-wrap">
              <User size={18} />
              <input
                className="input"
                placeholder="Имя"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              className="input"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Подождите...' : isRegister ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? 'Есть аккаунт? ' : 'Нет аккаунта? '}
          <button onClick={() => setMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Войти' : 'Регистрация'}
          </button>
        </div>
      </div>
    </div>
  );
}
