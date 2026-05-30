import { StatusBadge } from "./StatusBadge";

export default function ApprovalTimeline({ chain = [], currentStep = 0, auditLogs = [] }) {
  // Build timeline from chain + audit logs
  const steps = chain.map((approver, idx) => {
    const log = auditLogs.find(l =>
      l.step === idx || (l.performedBy?._id || l.performedBy) === (approver?._id || approver)
    );
    let status = "waiting";
    if (idx < currentStep)  status = log?.action === "rejected" ? "rejected" : "approved";
    if (idx === currentStep) status = "current";
    return { approver, status, log, idx };
  });

  const statusIcon = {
    approved: (
      <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500
                      flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    rejected: (
      <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500
                      flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    ),
    current: (
      <div className="w-8 h-8 rounded-full bg-molten-500/20 border-2 border-molten-500
                      flex items-center justify-center flex-shrink-0 animate-pulse-slow">
        <div className="w-2.5 h-2.5 rounded-full bg-molten-500" />
      </div>
    ),
    waiting: (
      <div className="w-8 h-8 rounded-full bg-forge-700 border-2 border-forge-600
                      flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-slate-600" />
      </div>
    ),
  };

  if (steps.length === 0) {
    return (
      <div className="py-8 text-center text-slate-600 text-sm font-body">
        No approval chain defined.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map(({ approver, status, log, idx }) => (
        <div key={idx} className="flex gap-4">
          {/* Icon + line */}
          <div className="flex flex-col items-center">
            {statusIcon[status]}
            {idx < steps.length - 1 && (
              <div className={`w-px flex-1 min-h-6 mt-1 ${
                status === "approved" ? "bg-green-500/40" :
                status === "rejected" ? "bg-red-500/40"  :
                "bg-forge-700"
              }`} />
            )}
          </div>

          {/* Content */}
          <div className={`pb-5 flex-1 ${idx === steps.length - 1 ? "pb-0" : ""}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-display font-semibold text-sm text-slate-200">
                {approver?.name || `Approver ${idx + 1}`}
              </p>
              <p className="text-xs font-body text-slate-500">
                {approver?.designation || approver?.role || ""}
              </p>
              {status === "current" && (
                <span className="badge badge-inprogress text-[10px]">Awaiting action</span>
              )}
            </div>
            {log && (
              <div className="mt-1.5 pl-3 border-l-2 border-forge-700">
                <p className="text-xs font-body text-slate-400 capitalize">{log.action}</p>
                {log.comment && (
                  <p className="text-xs font-body text-slate-500 mt-0.5 italic">"{log.comment}"</p>
                )}
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                  {new Date(log.timestamp).toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}