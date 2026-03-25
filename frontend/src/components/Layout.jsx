import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bills", label: "Add Bills" },
  { to: "/pending", label: "Pending" },
  { to: "/edit", label: "Edit Entries" },
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
                  "flex items-center rounded-lg px-3 py-2 text-sm font-regular transition border-l-4 " +
                  (active
                    ? "bg-slate-800 text-white border-l-primary-500 shadow-md"
                    : "text-slate-300 border-l-transparent hover:bg-slate-800 hover:text-slate-100")
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
        <header className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 shadow-md md:hidden">
          <div>
            <h1 className="text-base font-bold text-white">
              Rural <span className="text-primary-400">Ledger</span>
            </h1>
            <p className="text-xs text-slate-300">Hi, {user?.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="cursor-pointer rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Logout
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto bg-slate-50 px-3 py-2 text-xs shadow-md md:hidden sticky top-0 z-10 border-b-2 border-slate-300">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "whitespace-nowrap rounded-full px-4 py-2.5 font-semibold cursor-pointer transition-colors border " +
                  (active
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-900 border-slate-300 hover:bg-slate-100 hover:border-slate-400")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 bg-slate-50 md:bg-slate-100">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
