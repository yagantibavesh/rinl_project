import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import ApprovalTimeline from "../components/ApprovalTimeline";
import api from "../utils/api";

export default function RequestDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [req,     setReq]     = useState(null);
  const [audit,   setAudit]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [comment, setComment] = useState("");
  const [action,  setAction]  = useState(""); // "approve" | "reject"
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, auditRes] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/audit`),
      ]);
      setReq(reqRes.data?.request || reqRes.data);
      setAudit(auditRes.data?.auditLogs || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const isCurrentApprover =
    req?.currentApprover?._id === user?._id ||
    req?.currentApprover === user?._id;

  const canAct = isCurrentApprover && req?.status === "inprogress";

  const handleAction = async () => {
    if (!action) return;
    if (action === "reject" && !comment.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setActing(true);
    setError("");
    try {
      await api.put(`/requests/${id}/action`, { action, comment });
      setAction("");
      setComment("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
        <div className="h-64 rounded-xl shimmer" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="card py-16 text-center">
        <p className="text-slate-500 font-body">Request not found.</p>
        <button onClick={() => navigate(-1)} className="btn-ghost mt-4 mx-auto">← Go back</button>
      </div>
    );
  }

  const progress = req.approvalChain?.length > 0
    ? Math.round((req.currentStep / req.approvalChain.length) * 100)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost px-3 py-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs text-molten-400">{req.requestId}</span>
            <PriorityBadge priority={req.priority} />
            <StatusBadge   status={req.status} />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-100">{req.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — request info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Details card */}
          <div className="card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Request Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { l: "Type",       v: req.type,       cap: true  },
                { l: "Department", v: req.department              },
                { l: "Submitted",  v: new Date(req.createdAt).toLocaleString("en-IN") },
                { l: "SLA Deadline", v: req.slaDeadline ? new Date(req.slaDeadline).toLocaleString("en-IN") : "—" },
                { l: "Requested By", v: req.requestedBy?.name || "—" },
                ...(req.amount ? [{ l: "Amount", v: `₹${Number(req.amount).toLocaleString("en-IN")}` }] : []),
              ].map(({ l, v, cap }) => (
                <div key={l}>
                  <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest mb-0.5">{l}</p>
                  <p className={`text-sm font-body text-slate-300 ${cap ? "capitalize" : ""}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-forge-700">
              <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm font-body text-slate-400 leading-relaxed">{req.description}</p>
            </div>

            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-forge-700">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest">
                  Approval Progress
                </p>
                <p className="text-xs font-mono text-slate-500">
                  Step {req.currentStep}/{req.approvalChain?.length || 0}
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-forge-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-molten-500 transition-all duration-700"
                  style={{ width: `${req.status === "approved" ? 100 : progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Approver action panel */}
          {canAct && (
            <div className="card p-5 border-molten-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-molten-500 animate-pulse-slow" />
                <h3 className="font-display font-semibold text-sm text-molten-400">Action Required — You are the current approver</h3>
              </div>

              <div className="mb-4">
                <label className="label">Add Comment</label>
                <textarea
                  value={comment}
                  onChange={e => { setComment(e.target.value); setError(""); }}
                  placeholder="Add remarks or reason for your decision..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-body mb-3">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setAction("approve"); handleAction(); }}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             bg-green-500/15 border border-green-500/30 text-green-400
                             hover:bg-green-500/25 font-display font-semibold text-sm
                             transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  {acting && action === "approve" ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => { setAction("reject"); handleAction(); }}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             bg-red-500/15 border border-red-500/30 text-red-400
                             hover:bg-red-500/25 font-display font-semibold text-sm
                             transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  {acting && action === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — approval timeline */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-300 mb-5">Approval Chain</h3>
            <ApprovalTimeline
              chain={req.approvalChain || []}
              currentStep={req.currentStep || 0}
              auditLogs={audit}
            />
          </div>

          {/* Audit log */}
          {audit.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Activity Log</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {audit.map((log) => (
                  <div key={log._id} className="flex gap-3 text-xs">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-forge-700 flex items-center justify-center mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-400">
                        <span className="font-semibold text-slate-300 capitalize">{log.action}</span>
                        {log.performedBy?.name && ` by ${log.performedBy.name}`}
                      </p>
                      {log.comment && <p className="text-slate-600 italic mt-0.5">"{log.comment}"</p>}
                      <p className="font-mono text-slate-700 mt-0.5">{new Date(log.timestamp).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}