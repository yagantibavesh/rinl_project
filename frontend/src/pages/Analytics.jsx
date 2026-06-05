import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = {
  approved:   "#22C55E",
  pending:    "#EAB308",
  rejected:   "#EF4444",
  inprogress: "#38BDF8",
  escalated:  "#F97316",
};

const DEPT_COLORS = ["#F07E00","#4A6FD4","#22C55E","#EAB308","#E24B4A","#38BDF8","#A855F7","#F43F5E","#10B981","#F59E0B","#6366F1"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forge-850 border border-forge-700 rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="font-display font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-mono">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState(14);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/dashboard?days=${range}`);
        setData(res.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [range]);

  const pieData = data?.byStatus
    ? Object.entries(data.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-xl shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">Analytics</h2>
          <p className="text-sm font-body text-slate-500 mt-0.5">RINL ERP request metrics overview</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                ${range === d
                  ? "bg-molten-500 text-white shadow-molten-sm"
                  : "bg-forge-800 text-slate-500 border border-forge-700 hover:text-slate-300"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests",  value: data?.totalRequests || 0,           color: "text-molten-400",  bg: "bg-molten-500/10",  border: "border-molten-500/20" },
          { label: "Approved",        value: data?.byStatus?.approved || 0,      color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20"  },
          { label: "SLA Breaches",    value: data?.slaBreaches || 0,             color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"    },
          { label: "Avg. Resolution", value: `${data?.avgResolutionHrs || 0}h`,  color: "text-steel-400",   bg: "bg-steel-500/10",   border: "border-steel-500/20"  },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`card p-5 ${border}`}>
            <p className="label">{label}</p>
            <p className={`font-display font-bold text-3xl ${color} mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart — by department */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Requests by Department</h3>
          {data?.byDepartment?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byDepartment} barSize={16}>
                <XAxis dataKey="_id" tick={{ fill: "#475569", fontSize: 9, fontFamily:"DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(240,126,0,0.04)" }} />
                <Bar dataKey="count" name="Requests" radius={[4,4,0,0]}>
                  {data.byDepartment.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-600 py-8 text-center">No data available</p>}
        </div>

        {/* Pie chart — status */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Status Distribution</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name] || DEPT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "DM Sans" }}>{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-600 py-8 text-center">No data available</p>}
        </div>

        {/* Line chart — daily trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Daily Request Trend — Last {range} Days</h3>
          {data?.dailyTrend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid stroke="#162540" strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Requests" stroke="#F07E00" strokeWidth={2} dot={{ fill: "#F07E00", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-600 py-8 text-center">No trend data available</p>}
        </div>
      </div>
    </div>
  );
}