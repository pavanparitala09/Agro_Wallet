import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bills', label: 'Add Bills' },
  { to: '/pending', label: 'Pending' },
  { to: '/edit', label: 'Edit Entries' }
];

export function Layout({ user, onLogout, children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col bg-slate-900 text-slate-100 shadow-xl md:flex">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">
            Rural <span className="text-primary-400">Ledger</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Smart bill &amp; interest tracker
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ' +
                  (active
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-slate-200 hover:bg-slate-800')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="mb-2 font-medium">{user?.name}</div>
          <button
            onClick={onLogout}
            className="w-full rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile + main) */}
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow md:hidden">
          <div>
            <h1 className="text-base font-semibold">
              Rural <span className="text-primary-500">Ledger</span>
            </h1>
            <p className="text-xs text-slate-500">Hi, {user?.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-50"
          >
            Logout
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto bg-white px-3 py-2 text-xs shadow md:hidden">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  'whitespace-nowrap rounded-full px-3 py-1 font-medium ' +
                  (active
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-slate-700')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-3 py-3 md:px-6 md:py-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

