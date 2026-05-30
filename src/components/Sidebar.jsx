import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RINL_LOGO = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#F07E00" fillOpacity="0.15" />
    <path d="M6 24L11 8H14L16 16L18 8H21L26 24H23L20.5 16L18.5 24H13.5L11.5 16L9 24H6Z"
          fill="#F07E00" />
    <path d="M16 4L18 8H14L16 4Z" fill="#FFB84D" />
  </svg>
);

const NAV_ITEMS = [
  {
    label: "Overview",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    to: "/dashboard",
    roles: ["employee", "manager", "hod", "admin"],
  },
  {
    label: "New Request",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
      </svg>
    ),
    to: "/new-request",
    roles: ["employee", "manager", "hod", "admin"],
  },
  {
    label: "My Requests",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    ),
    to: "/my-requests",
    roles: ["employee", "manager", "hod", "admin"],
  },
  {
    label: "Approval Queue",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    to: "/approval-queue",
    roles: ["manager", "hod", "admin"],
  },
  {
    label: "Analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    to: "/analytics",
    roles: ["manager", "hod", "admin"],
  },
  {
    label: "Admin Panel",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    to: "/admin",
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visible = NAV_ITEMS.filter(item => item.roles.includes(user?.role || "employee"));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-forge-950 border-r border-forge-700 animate-slide-in-left flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-forge-700">
        <div className="flex items-center gap-3">
          {RINL_LOGO}
          <div>
            <p className="font-display font-bold text-sm text-slate-100 leading-tight">RINL ERP</p>
            <p className="font-body text-xs text-slate-500 leading-tight">Approval System</p>
          </div>
        </div>
        <div className="mt-4 glow-line" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Dept info strip */}
      {user?.department && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-forge-800 border border-forge-700">
          <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest mb-0.5">Department</p>
          <p className="text-xs font-body text-molten-400 font-medium truncate">{user.department}</p>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-forge-700 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-forge-800 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-molten-500/20 border border-molten-500/30
                          flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-xs text-molten-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-slate-200 truncate">{user?.name || "User"}</p>
            <p className="text-[10px] font-body text-slate-500 capitalize truncate">{user?.role || "employee"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
