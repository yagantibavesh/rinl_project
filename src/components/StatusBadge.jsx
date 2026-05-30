// Reusable badge for status and priority
export function StatusBadge({ status }) {
  const map = {
    pending:    { label: "Pending",     cls: "badge-pending"    },
    inprogress: { label: "In Progress", cls: "badge-inprogress" },
    approved:   { label: "Approved",    cls: "badge-approved"   },
    rejected:   { label: "Rejected",    cls: "badge-rejected"   },
    escalated:  { label: "Escalated",   cls: "badge-escalated"  },
  };
  const dot = {
    pending:    "bg-yellow-400",
    inprogress: "bg-blue-400",
    approved:   "bg-green-400",
    rejected:   "bg-red-400",
    escalated:  "bg-orange-400",
  };
  const { label, cls } = map[status] || { label: status, cls: "badge-pending" };
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-slate-400"}`} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    critical: { label: "Critical", cls: "badge-critical" },
    high:     { label: "High",     cls: "badge-high"     },
    medium:   { label: "Medium",   cls: "badge-medium"   },
    low:      { label: "Low",      cls: "badge-low"      },
  };
  const { label, cls } = map[priority] || { label: priority, cls: "badge-low" };
  return <span className={`badge ${cls}`}>{label}</span>;
}