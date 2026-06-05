import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import api from "../utils/api";

const STATUSES   = ["all","pending","inprogress","approved","rejected","escalated"];
const PRIORITIES = ["all","critical","high","medium","low"];

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState("all");
  const [priority, setPriority] = useState("all");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (status   !== "all") params.set("status",   status);
        if (priority !== "all") params.set("priority", priority);
        const res = await api.get(`/requests?${params}`);
        setRequests(res.data?.requests || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [status, priority]);

  const filtered = requests.filter(r =>
    !search ||
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.requestId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">My Requests</h2>
          <p className="text-sm font-body text-slate-500 mt-0.5">{filtered.length} requests found</p>
        </div>
        <button onClick={() => navigate("/new-request")} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or ID..."
            className="input pl-9"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold capitalize transition-all
                ${status === s
                  ? "bg-molten-500 text-white shadow-molten-sm"
                  : "bg-forge-800 text-slate-500 hover:text-slate-300 border border-forge-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-forge-800 border border-forge-700 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
            </div>
            <p className="text-sm font-body text-slate-600">No requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-700">
                  {["Request ID","Title","Type","Priority","Status","Department","Date",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-display font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-800">
                {filtered.map((req) => (
                  <tr
                    key={req._id}
                    onClick={() => navigate(`/requests/${req._id}`)}
                    className="hover:bg-forge-800 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-molten-400/80">{req.requestId}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm font-display font-medium text-slate-200 truncate group-hover:text-white transition-colors">{req.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-body text-slate-400 capitalize">{req.type}</span>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-body text-slate-500">{req.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-molten-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
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