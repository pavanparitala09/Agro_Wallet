import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { BillsPage } from './pages/BillsPage.jsx';
import { PendingPage } from './pages/PendingPage.jsx';
import { EditPage } from './pages/EditPage.jsx';
import { api, setAuthFailureCallback } from './lib/api.js';
import { Layout } from './components/Layout.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthFailureCallback(() => setUser(null));
  }, []);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore
    }
    setUser(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage onAuth={setUser} initialMode="login" />} />
        <Route path="/register" element={<AuthPage onAuth={setUser} initialMode="register" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/edit" element={<EditPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

