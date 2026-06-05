import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import api from "../utils/api";

const PRIORITY_ORDER = { critical: 1, high: 2, medium: 3, low: 4 };

export default function ApprovalQueue() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null); // requestId being acted on
  const [comment,  setComment]  = useState("");
  const [modal,    setModal]    = useState(null); // { req, action }

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/requests?queue=mine");
      const sorted = (res.data?.requests || []).sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
      setRequests(sorted);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async () => {
    if (!modal) return;
    if (modal.action === "reject" && !comment.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setActing(modal.req._id);
    try {
      await api.put(`/requests/${modal.req._id}/action`, {
        action: modal.action,
        comment,
      });
      setModal(null);
      setComment("");
      load(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const priorityColor = {
    critical: "bg-red-500",
    high:     "bg-orange-500",
    medium:   "bg-yellow-500",
    low:      "bg-slate-500",
  };

  return (
    <div className="space-y-5 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">Approval Queue</h2>
          <p className="text-sm font-body text-slate-500 mt-0.5">
            {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting your action
          </p>
        </div>
        <button onClick={load} className="btn-ghost">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30
                          flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-slate-300 mb-1">All caught up!</h3>
          <p className="text-sm font-body text-slate-600">No pending approvals in your queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const slaMs    = req.slaDeadline ? new Date(req.slaDeadline) - Date.now() : null;
            const slaHrs   = slaMs ? Math.max(0, Math.round(slaMs / 3600000)) : null;
            const slaBreached = slaMs !== null && slaMs <= 0;

            return (
              <div key={req._id} className={`card p-5 transition-all ${slaBreached ? "border-red-500/40" : ""}`}>
                <div className="flex items-start gap-4">
                  {/* Priority bar */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${priorityColor[req.priority] || "bg-slate-700"}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-molten-400/70">{req.requestId}</span>
                      <PriorityBadge priority={req.priority} />
                      <StatusBadge   status={req.status} />
                      {slaBreached && (
                        <span className="badge badge-rejected text-[10px]">SLA Breached</span>
                      )}
                      {!slaBreached && slaHrs !== null && slaHrs <= 4 && (
                        <span className="badge badge-escalated text-[10px]">{slaHrs}h remaining</span>
                      )}
                    </div>

                    <h3 className="font-display font-semibold text-base text-slate-100 mb-0.5">{req.title}</h3>
                    <p className="text-xs font-body text-slate-500 line-clamp-2 mb-3">{req.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>
                        {req.requestedBy?.name || "Employee"}
                      </span>
                      <span>{req.department}</span>
                      <span className="capitalize">{req.type}</span>
                      {req.amount > 0 && <span className="text-molten-400 font-mono">₹{Number(req.amount).toLocaleString("en-IN")}</span>}
                      <span className="font-mono">{new Date(req.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/requests/${req._id}`)}
                      className="btn-ghost px-3 py-2 text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setModal({ req, action: "approve" })}
                      className="px-3 py-2 rounded-lg bg-green-500/15 border border-green-500/30
                                 text-green-400 text-xs font-display font-semibold
                                 hover:bg-green-500/25 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setModal({ req, action: "reject" })}
                      className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30
                                 text-red-400 text-xs font-display font-semibold
                                 hover:bg-red-500/25 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 shadow-card-hover animate-fade-in">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-1 capitalize">
              {modal.action} Request
            </h3>
            <p className="text-xs font-body text-slate-500 mb-4 font-mono">{modal.req.requestId}</p>

            <div className="p-3 rounded-lg bg-forge-800 border border-forge-700 mb-4">
              <p className="text-sm font-display font-medium text-slate-200">{modal.req.title}</p>
            </div>

            <div>
              <label className="label">
                {modal.action === "reject" ? "Reason for rejection *" : "Comment (optional)"}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={modal.action === "reject" ? "Provide a clear reason..." : "Add any remarks..."}
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setModal(null); setComment(""); }} className="btn-ghost flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={!!acting}
                className={`flex-1 justify-center flex items-center gap-2 px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-all disabled:opacity-60
                  ${modal.action === "approve"
                    ? "bg-green-500 hover:bg-green-400 text-white"
                    : "bg-red-500 hover:bg-red-400 text-white"
                  }`}
              >
                {acting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  modal.action === "approve" ? "Confirm Approve" : "Confirm Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}