import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import ApprovalTimeline from "../components/ApprovalTimeline";
import api from "../utils/api";

export default function RequestDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [req,     setReq]     = useState(null);
  const [audit,   setAudit]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Approval action state
  const [acting,  setActing]  = useState(false);
  const [comment, setComment] = useState("");
  const [actErr,  setActErr]  = useState("");

  // Cancel modal state
  const [showCancel,   setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelErr,    setCancelErr]    = useState("");

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded shimmer"/>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="h-24 rounded-xl shimmer"/>)}</div>
        <div className="h-64 rounded-xl shimmer"/>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="card py-16 text-center">
        <p className="text-slate-500 font-body">Request not found or was cancelled.</p>
        <button onClick={() => navigate(-1)} className="btn-ghost mt-4 mx-auto">← Go back</button>
      </div>
    );
  }

  const isCurrentApprover =
    req.currentApprover?._id === user?._id ||
    req.currentApprover === user?._id;
  const canAct    = isCurrentApprover && ["inprogress","escalated"].includes(req.status);
  const isClosed  = ["approved","rejected"].includes(req.status);
  const isOwner   = (req.requestedBy?._id || req.requestedBy) === user?._id;
  const isAdmin   = ["admin","hod","manager"].includes(user?.role);

  // Who can cancel:
  // Employee: own request + step 0 only + not closed
  // Manager/HOD/Admin: any non-closed request
  const canCancel = !isClosed && (
    isAdmin ||
    (isOwner && req.currentStep === 0)
  );

  const progress = req.approvalChain?.length > 0
    ? Math.round((req.currentStep / req.approvalChain.length) * 100)
    : 0;

  const typeIcon = { purchase:"🏗️", leave:"📅", repair:"🔧", budget:"💰", safety:"🦺" };

  // ── Approve / Reject ────────────────────────────────────────────────
  const handleAction = async (action) => {
    if (action === "reject" && !comment.trim()) {
      setActErr("Reason is required for rejection."); return;
    }
    setActing(true); setActErr("");
    try {
      await api.put(`/requests/${id}/action`, { action, comment });
      setComment("");
      load();
    } catch (err) {
      setActErr(err.response?.data?.message || "Action failed.");
    } finally { setActing(false); }
  };

  // ── Cancel ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true); setCancelErr("");
    try {
      await api.delete(`/requests/${id}/cancel`, { data: { reason: cancelReason } });
      navigate("/my-requests");
    } catch (err) {
      setCancelErr(err.response?.data?.message || "Cancel failed.");
    } finally { setCancelling(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost px-3 py-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs text-molten-400">{req.requestId}</span>
            <span className="text-base">{typeIcon[req.type]}</span>
            <PriorityBadge priority={req.priority}/>
            <StatusBadge   status={req.status}/>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-100">{req.title}</h2>
          {req.subType && (
            <p className="text-xs text-slate-500 font-body mt-0.5 capitalize">{req.subType} · {req.type}</p>
          )}
        </div>

        {/* Cancel button — top right */}
        {canCancel && (
          <button onClick={() => setShowCancel(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30
                       text-red-400 text-xs font-display font-semibold hover:bg-red-500/20 transition-all flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Cancel Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — request info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Details card */}
          <div className="card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Request Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { l:"Type",        v: req.type,        cap:true },
                { l:"Department",  v: req.department              },
                { l:"Submitted",   v: new Date(req.createdAt).toLocaleString("en-IN") },
                { l:"SLA Deadline",v: req.slaDeadline ? new Date(req.slaDeadline).toLocaleString("en-IN") : "—" },
                { l:"Requested By",v: req.requestedBy?.name || "—" },
                ...(req.amount > 0 ? [{ l:"Amount", v:`₹${Number(req.amount).toLocaleString("en-IN")}` }] : []),
              ].map(({ l, v, cap }) => (
                <div key={l}>
                  <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest mb-0.5">{l}</p>
                  <p className={`text-sm font-body text-slate-300 ${cap?"capitalize":""}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-forge-700">
              <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm font-body text-slate-400 leading-relaxed whitespace-pre-line">{req.description}</p>
            </div>

            {/* Progress bar */}
            {!isClosed && (
              <div className="mt-4 pt-4 border-t border-forge-700">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-display font-semibold text-slate-600 uppercase tracking-widest">Approval Progress</p>
                  <p className="text-xs font-mono text-slate-500">Step {req.currentStep}/{req.approvalChain?.length || 0}</p>
                </div>
                <div className="h-1.5 rounded-full bg-forge-700 overflow-hidden">
                  <div className="h-full rounded-full bg-molten-500 transition-all duration-700"
                    style={{ width:`${req.status==="approved"?100:progress}%` }}/>
                </div>
              </div>
            )}
          </div>

          {/* Approver action panel */}
          {canAct && (
            <div className="card p-5 border-molten-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-molten-500 animate-pulse-slow"/>
                <h3 className="font-display font-semibold text-sm text-molten-400">Action Required — You are the current approver</h3>
              </div>
              <div className="mb-4">
                <label className="label">Comment</label>
                <textarea value={comment} onChange={e=>{setComment(e.target.value);setActErr("");}}
                  placeholder="Add remarks or reason for your decision..." rows={3} className="input resize-none"/>
              </div>
              {actErr && <p className="text-xs text-red-400 mb-3">{actErr}</p>}
              <div className="flex gap-3">
                <button onClick={() => handleAction("approve")} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             bg-green-500/15 border border-green-500/30 text-green-400
                             hover:bg-green-500/25 font-display font-semibold text-sm transition-all disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  {acting ? "Processing..." : "Approve"}
                </button>
                <button onClick={() => handleAction("reject")} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             bg-red-500/15 border border-red-500/30 text-red-400
                             hover:bg-red-500/25 font-display font-semibold text-sm transition-all disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  {acting ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          )}

          {/* Closed status banner */}
          {isClosed && (
            <div className={`card p-4 flex items-center gap-3 ${req.status==="approved"?"border-green-500/30":"border-red-500/30"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${req.status==="approved"?"bg-green-500/15":"bg-red-500/15"}`}>
                {req.status==="approved"
                  ? <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  : <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>}
              </div>
              <div>
                <p className={`text-sm font-display font-semibold ${req.status==="approved"?"text-green-400":"text-red-400"}`}>
                  Request {req.status === "approved" ? "Fully Approved" : "Rejected"}
                </p>
                <p className="text-xs text-slate-500 font-body">
                  {new Date(req.updatedAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — timeline + audit */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-300 mb-5">Approval Chain</h3>
            <ApprovalTimeline
              chain={req.approvalChain || []}
              currentStep={req.currentStep || 0}
              auditLogs={audit}
              status={req.status}
            />
          </div>

          {audit.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Activity Log</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {audit.map((log) => (
                  <div key={log._id} className="flex gap-3 text-xs">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                      ${log.action==="approved"?"bg-green-500/20":log.action==="rejected"?"bg-red-500/20":log.action==="escalated"?"bg-orange-500/20":"bg-forge-700"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full
                        ${log.action==="approved"?"bg-green-400":log.action==="rejected"?"bg-red-400":log.action==="escalated"?"bg-orange-400":"bg-slate-500"}`}/>
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

      {/* ── Cancel Confirmation Modal ───────────────────────────────── */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 shadow-card-hover animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-100">Cancel Request</h3>
                <p className="text-xs text-slate-500 font-body">This action cannot be undone.</p>
              </div>
            </div>

            {/* Request info */}
            <div className="p-3 rounded-lg bg-forge-800 border border-forge-700 mb-4">
              <p className="text-xs font-mono text-molten-400 mb-0.5">{req.requestId}</p>
              <p className="text-sm font-display font-medium text-slate-200">{req.title}</p>
            </div>

            {/* Warning for employee when step > 0 — should not reach here but safety net */}
            {isOwner && !isAdmin && req.currentStep === 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <p className="text-xs text-yellow-400 font-body">
                  ⚠️ Your request has not been reviewed yet. Cancelling will delete it permanently.
                </p>
              </div>
            )}

            {isAdmin && !isOwner && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <p className="text-xs text-red-400 font-body">
                  You are cancelling someone else's request. The requester will be notified.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="label">Reason for cancellation</label>
              <textarea value={cancelReason} onChange={e=>{setCancelReason(e.target.value);setCancelErr("");}}
                placeholder="e.g. Wrong details filled / Request submitted by mistake / Issue resolved..."
                rows={3} className="input resize-none"/>
            </div>

            {cancelErr && (
              <p className="text-xs text-red-400 font-body mb-3 px-1">{cancelErr}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowCancel(false); setCancelReason(""); setCancelErr(""); }}
                className="btn-ghost flex-1 justify-center">
                Keep Request
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                           bg-red-500 hover:bg-red-400 text-white font-display font-semibold text-sm
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {cancelling
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Cancelling...</>
                  : "Yes, Cancel Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}