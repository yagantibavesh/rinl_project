import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import api from "../utils/api";

// Active = requests still in motion (show in ALL tab)
// Closed = approved or rejected (separate tabs)
const TABS = [
  { key: "active",    label: "Active",   statuses: ["pending","inprogress","escalated"], icon: "⏳" },
  { key: "approved",  label: "Approved", statuses: ["approved"],                          icon: "✅" },
  { key: "rejected",  label: "Rejected", statuses: ["rejected"],                          icon: "❌" },
  { key: "all",       label: "All",      statuses: [],                                    icon: "📋" },
];

export default function MyRequests() {
  const navigate = useNavigate();
  const [tab,      setTab]      = useState("active");
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [counts,   setCounts]   = useState({ active:0, approved:0, rejected:0, all:0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/requests?limit=200");
        const all = res.data?.requests || [];

        // Calculate counts per tab
        setCounts({
          active:   all.filter(r => ["pending","inprogress","escalated"].includes(r.status)).length,
          approved: all.filter(r => r.status === "approved").length,
          rejected: all.filter(r => r.status === "rejected").length,
          all:      all.length,
        });

        setRequests(all);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Filter by tab
  const currentTab = TABS.find(t => t.key === tab);
  const filtered = requests
    .filter(r => currentTab.statuses.length === 0 || currentTab.statuses.includes(r.status))
    .filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.requestId?.toLowerCase().includes(search.toLowerCase()));

  const typeIcon = { purchase:"🏗️", leave:"📅", repair:"🔧", budget:"💰", safety:"🦺" };
  const subTypeLabel = { planned:"Planned", emergency:"Emergency", overhaul:"Overhaul", hotwork:"Hot Work", confined:"Confined Space", shutdown:"Shutdown", operational:"Operational", capital:"Capital", annual:"Annual", medical:"Medical", casual:"Casual", compensatory:"Compensatory", maternity:"Maternity", "" :"" };

  return (
    <div className="space-y-4 animate-slide-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">My Requests</h2>
          <p className="text-sm font-body text-slate-500 mt-0.5">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => navigate("/new-request")} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-forge-700">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display font-medium transition-all relative
              ${tab === t.key
                ? "text-molten-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-molten-500 after:rounded-t"
                : "text-slate-500 hover:text-slate-300"}`}>
            <span>{t.icon}</span>
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ml-0.5
                ${tab === t.key ? "bg-molten-500/20 text-molten-400" : "bg-forge-700 text-slate-500"}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}

        {/* Search */}
        <div className="relative ml-auto mb-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="input pl-8 py-1.5 text-xs w-44"/>
        </div>
      </div>

      {/* Tab description */}
      {tab === "active" && (
        <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-body">
          Showing requests currently in progress — pending, awaiting approval, or escalated.
        </div>
      )}
      {tab === "approved" && (
        <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-body">
          Showing fully approved requests.
        </div>
      )}
      {tab === "rejected" && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-body">
          Showing rejected requests. You can resubmit with corrections by creating a new request.
        </div>
      )}

      {/* Content */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-lg shimmer"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">{currentTab.icon}</div>
            <p className="text-sm font-body text-slate-600">
              {tab === "active"   ? "No active requests. All caught up!" :
               tab === "approved" ? "No approved requests yet." :
               tab === "rejected" ? "No rejected requests." :
               "No requests found."}
            </p>
            {tab === "active" && (
              <button onClick={() => navigate("/new-request")} className="btn-primary mt-4 mx-auto">
                Create a Request
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-700">
                  {["Request ID","Request","Type","Priority","Status","Submitted",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-display font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-800">
                {filtered.map(req => (
                  <tr key={req._id} onClick={() => navigate(`/requests/${req._id}`)}
                    className="hover:bg-forge-800 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-molten-400/80">{req.requestId}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm font-display font-medium text-slate-200 truncate group-hover:text-white transition-colors">{req.title}</p>
                      {req.subType && (
                        <p className="text-[10px] text-slate-600 font-body mt-0.5">{subTypeLabel[req.subType] || req.subType}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-body capitalize">
                        <span>{typeIcon[req.type]}</span>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={req.priority}/></td>
                    <td className="px-4 py-3"><StatusBadge status={req.status}/></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-molten-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}