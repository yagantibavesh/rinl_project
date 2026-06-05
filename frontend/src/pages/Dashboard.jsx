import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardCard from "../components/DashboardCard";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import api from "../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const ICONS = {
  total: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  approved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  queue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forge-850 border border-forge-700 rounded-lg px-3 py-2 shadow-card">
      <p className="text-xs font-display font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: p.color }}>{p.value} requests</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [reqRes, analyticsRes] = await Promise.allSettled([
          api.get("/requests?limit=5"),
          isManager ? api.get("/analytics/dashboard") : Promise.resolve(null),
        ]);
        const requests = reqRes.status === "fulfilled" ? reqRes.value.data?.requests || [] : [];
        setRecent(requests.slice(0, 5));
        if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
          setStats(analyticsRes.value.data);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [isManager]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const DEPT_COLORS = ["#F07E00","#4A6FD4","#22C55E","#EAB308","#E24B4A","#38BDF8","#A855F7","#F43F5E"];

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-forge-850 border border-forge-700 p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-glow-molten opacity-30 pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-display font-semibold text-molten-500 uppercase tracking-widest mb-1">
            {greeting()},
          </p>
          <h2 className="font-display font-bold text-2xl text-slate-100 mb-1">{user?.name || "User"}</h2>
          <p className="text-sm font-body text-slate-400">
            {user?.designation || user?.role} · {user?.department}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            label="Total Requests"
            value={stats?.totalRequests ?? recent.length}
            icon={ICONS.total}
            accent="molten"
          />
          <DashboardCard
            label="Pending"
            value={stats?.byStatus?.pending ?? recent.filter(r => r.status === "pending").length}
            icon={ICONS.pending}
            accent="yellow"
          />
          <DashboardCard
            label="Approved"
            value={stats?.byStatus?.approved ?? recent.filter(r => r.status === "approved").length}
            icon={ICONS.approved}
            accent="green"
          />
          {isManager ? (
            <DashboardCard
              label="In My Queue"
              value={stats?.myQueueCount ?? "—"}
              icon={ICONS.queue}
              accent="steel"
              sub="Awaiting your action"
            />
          ) : (
            <DashboardCard
              label="Rejected"
              value={stats?.byStatus?.rejected ?? recent.filter(r => r.status === "rejected").length}
              icon={ICONS.queue}
              accent="red"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent requests */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-200">Recent Requests</h3>
            <button
              onClick={() => navigate("/my-requests")}
              className="text-xs font-display text-molten-500 hover:text-molten-400 transition-colors"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg shimmer" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-body text-slate-600">No requests yet.</p>
              <button onClick={() => navigate("/new-request")} className="btn-primary mt-3 text-xs px-4 py-2">
                Create first request
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((req) => (
                <div
                  key={req._id}
                  onClick={() => navigate(`/requests/${req._id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-forge-800 hover:bg-forge-700
                             cursor-pointer transition-all duration-200 group border border-transparent
                             hover:border-forge-600"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-500 mb-0.5">{req.requestId}</p>
                    <p className="text-sm font-display font-medium text-slate-200 truncate">{req.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        {isManager && stats?.byDepartment?.length > 0 && (
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-200 mb-4">By Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byDepartment} barSize={14}>
                <XAxis dataKey="_id" tick={{ fill: "#475569", fontSize: 10, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(240,126,0,0.05)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.byDepartment.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick actions for employee */}
        {!isManager && (
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-200 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Purchase / Procurement",  type: "purchase", icon: "🏗️" },
                { label: "Leave Application",        type: "leave",    icon: "📅" },
                { label: "Equipment Repair",         type: "repair",   icon: "🔧" },
                { label: "Budget Sanction",          type: "budget",   icon: "💰" },
                { label: "Safety Clearance",         type: "safety",   icon: "🦺" },
              ].map(({ label, type, icon }) => (
                <button
                  key={type}
                  onClick={() => navigate(`/new-request?type=${type}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-forge-800
                             hover:bg-forge-700 border border-forge-700 hover:border-molten-500/30
                             transition-all text-left group"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-display font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                    {label}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-molten-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}