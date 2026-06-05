import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Navbar({ title = "Dashboard" }) {
  const { user } = useAuth();
  const [notifs, setNotifs]   = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [loading, setLoading]  = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifs(res.data?.notifications || []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const typeColor = {
    approval:   "text-green-400",
    rejection:  "text-red-400",
    escalation: "text-orange-400",
    info:       "text-blue-400",
  };

  return (
    <header className="h-14 border-b border-forge-700 bg-forge-900/80 backdrop-blur-sm
                       flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Title */}
      <div className="flex-1">
        <h1 className="font-display font-semibold text-base text-slate-100">{title}</h1>
        <p className="font-body text-xs text-slate-500">
          {new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </p>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-forge-700" />

      {/* Employee ID */}
      <div className="hidden md:block">
        <p className="text-xs font-mono text-slate-500 font-medium">{user?.employeeId || "—"}</p>
      </div>

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={() => setShowDrop(!showDrop)}
          className="relative w-9 h-9 rounded-lg bg-forge-800 border border-forge-700
                     hover:border-molten-500/50 flex items-center justify-center
                     text-slate-400 hover:text-molten-400 transition-all duration-200"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-molten-500
                             text-white text-[9px] font-display font-bold
                             flex items-center justify-center animate-glow-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showDrop && (
          <div className="absolute right-0 top-12 w-80 card shadow-card-hover z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-forge-700 flex items-center justify-between">
              <p className="font-display font-semibold text-sm text-slate-200">Notifications</p>
              {unread > 0 && (
                <span className="badge badge-pending text-[10px]">{unread} new</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-forge-700">
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs font-body text-slate-600">No notifications</p>
                </div>
              ) : notifs.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-forge-800 transition-colors
                              ${!n.isRead ? "border-l-2 border-molten-500" : ""}`}
                >
                  <p className={`text-xs font-body leading-relaxed ${
                    n.isRead ? "text-slate-500" : "text-slate-300"
                  }`}>{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDrop && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDrop(false)} />
      )}
    </header>
  );
}