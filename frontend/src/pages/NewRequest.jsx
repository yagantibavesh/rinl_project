import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// ── Chain preview labels ─────────────────────────────────────────────
function getChainLabel(type, subType, amount, role) {
  const amt = Number(amount) || 0;
  if (type === "leave") {
    if (role === "employee") return "Employee → Manager";
    if (role === "manager")  return "Manager → HOD → (team notified)";
    if (role === "hod")      return "HOD → Admin → (dept notified)";
    if (role === "admin")    return "Auto-approved with audit record";
  }
  if (type === "repair") {
    if (subType === "planned")   return "Employee → Manager → HOD";
    if (subType === "emergency") return "Employee → Manager → HOD → CMS HOD";
    if (subType === "overhaul")  return "Employee → Manager → HOD → CMS HOD → Admin";
    return "Employee → Manager → HOD";
  }
  if (type === "purchase") {
    if (amt < 10000)   return "Employee → Manager  (below ₹10,000)";
    if (amt <= 100000) return "Employee → Manager → HOD  (₹10k–₹1L)";
    if (amt <= 1000000)return "Employee → Manager → HOD → Finance HOD  (₹1L–₹10L)";
    return               "Employee → Manager → HOD → Finance HOD → Admin  (above ₹10L)";
  }
  if (type === "safety") {
    if (subType === "shutdown") return "Employee → Manager → HOD → Safety HOD → Admin";
    return "Employee → Manager → HOD → Safety HOD";
  }
  if (type === "budget") {
    if (subType === "capital") return "Employee → Manager → HOD → Finance HOD → Admin";
    return "Employee → Manager → HOD → Finance HOD";
  }
  return "—";
}

// ── Leave sub-types ──────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: "annual",       label: "Annual Leave",              icon: "🌴" },
  { value: "medical",      label: "Medical Leave",             icon: "🏥" },
  { value: "casual",       label: "Casual Leave",              icon: "☀️" },
  { value: "compensatory", label: "Compensatory Leave",        icon: "⏰" },
  { value: "maternity",    label: "Maternity / Paternity Leave",icon: "👶" },
  { value: "emergency",    label: "Emergency Leave",           icon: "🚨" },
];

// ── Repair sub-types ─────────────────────────────────────────────────
const REPAIR_SUBTYPES = [
  { value: "planned",   label: "Planned Maintenance",  icon: "📅", desc: "Scheduled upkeep, preventive checks", priority: "low"    },
  { value: "emergency", label: "Emergency Breakdown",  icon: "🚨", desc: "Machine down, production affected",   priority: "critical"},
  { value: "overhaul",  label: "Major Overhaul",       icon: "🔩", desc: "Full system rebuild or replacement",  priority: "high"   },
];

// ── Safety sub-types ─────────────────────────────────────────────────
const SAFETY_SUBTYPES = [
  { value: "hotwork",   label: "Hot Work Permit",      icon: "🔥", desc: "Welding, cutting near gas lines"     },
  { value: "confined",  label: "Confined Space Entry", icon: "🕳️", desc: "Tanks, pits, enclosed vessels"       },
  { value: "shutdown",  label: "Plant Shutdown Permit",icon: "⛔", desc: "Full/partial plant shutdown"          },
  { value: "general",   label: "General Safety",       icon: "🦺", desc: "Other safety clearances"             },
];

// ── Budget sub-types ─────────────────────────────────────────────────
const BUDGET_SUBTYPES = [
  { value: "operational", label: "Operational Budget", icon: "📊", desc: "Day-to-day dept expenses"            },
  { value: "capital",     label: "Capital Expenditure",icon: "🏗️", desc: "Assets, infra, major investments"   },
];

// ── Priority config ──────────────────────────────────────────────────
const PRIORITIES = [
  { value: "critical", label: "Critical", sla: "2 hrs",  cls: "border-red-500    bg-red-500/10    text-red-400"    },
  { value: "high",     label: "High",     sla: "8 hrs",  cls: "border-orange-500 bg-orange-500/10 text-orange-400" },
  { value: "medium",   label: "Medium",   sla: "24 hrs", cls: "border-yellow-500 bg-yellow-500/10 text-yellow-400" },
  { value: "low",      label: "Low",      sla: "48 hrs", cls: "border-slate-600  bg-slate-800     text-slate-400"  },
];

// ── Main request types ───────────────────────────────────────────────
const REQUEST_TYPES = [
  { value: "leave",    label: "Leave",         icon: "📅", desc: "Annual, medical, casual"     },
  { value: "repair",   label: "Repair",        icon: "🔧", desc: "Breakdown, maintenance"      },
  { value: "purchase", label: "Purchase",      icon: "🏗️", desc: "Materials, spare parts"     },
  { value: "safety",   label: "Safety Permit", icon: "🦺", desc: "Hot work, confined space"    },
  { value: "budget",   label: "Budget",        icon: "💰", desc: "Operational, capital"        },
];

export default function NewRequest() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const [step, setStep]     = useState(1); // 1=type, 2=subtype, 3=details
  const [form, setForm]     = useState({
    type:        params.get("type") || "",
    subType:     "",
    leaveType:   "",
    title:       "",
    description: "",
    priority:    "medium",
    amount:      "",
    fromDate:    "",
    toDate:      "",
    equipmentId: "",
    location:    "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(null);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };

  // Auto-calculate leave days
  const leaveDays = form.fromDate && form.toDate
    ? Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1
    : 0;

  // Auto-build title
  const autoTitle = () => {
    if (form.type === "leave" && form.leaveType && form.fromDate && form.toDate) {
      const lt = LEAVE_TYPES.find(l => l.value === form.leaveType);
      return `${lt?.label || "Leave"} — ${leaveDays} day${leaveDays !== 1 ? "s" : ""} (${form.fromDate} to ${form.toDate})`;
    }
    if (form.type === "repair" && form.subType) {
      const st = REPAIR_SUBTYPES.find(s => s.value === form.subType);
      return form.equipmentId ? `${st?.label} — ${form.equipmentId}` : st?.label || "";
    }
    return form.title;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalTitle = autoTitle() || form.title;

    if (!finalTitle.trim())        return setError("Title is required.");
    if (!form.description.trim())  return setError("Description is required.");
    if (form.type === "leave") {
      if (!form.leaveType)         return setError("Select leave type.");
      if (!form.fromDate || !form.toDate) return setError("Select leave dates.");
      if (leaveDays < 1)           return setError("End date must be after start date.");
    }
    if (["purchase","budget"].includes(form.type) && !form.amount) {
      return setError("Amount is required.");
    }

    setLoading(true);
    try {
      let description = form.description;
      if (form.type === "repair" && form.equipmentId) {
        description = `Equipment ID: ${form.equipmentId}\nLocation: ${form.location}\n\n${form.description}`;
      }
      if (form.type === "leave") {
        description = `Leave Type: ${LEAVE_TYPES.find(l=>l.value===form.leaveType)?.label}\nFrom: ${form.fromDate}\nTo: ${form.toDate}\nDays: ${leaveDays}\n\n${form.description}`;
      }

      const res = await api.post("/requests", {
        type:        form.type,
        subType:     form.subType || form.leaveType || "",
        title:       finalTitle,
        description,
        priority:    form.priority,
        amount:      form.amount || 0,
      });
      setSuccess(res.data?.request);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-8 animate-fade-in">
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-100 mb-1">Request Submitted!</h2>
          <p className="text-sm text-slate-400 font-body mb-3">Your request is in the approval queue.</p>
          <span className="font-mono text-xs text-molten-400 bg-molten-500/10 border border-molten-500/20 inline-block px-3 py-1.5 rounded-full">
            {success.requestId}
          </span>
          <div className="mt-4 p-3 rounded-lg bg-forge-800 border border-forge-700 text-left">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-display font-semibold">Approval Chain</p>
            <p className="text-xs font-mono text-molten-400">
              {getChainLabel(form.type, form.subType || form.leaveType, form.amount, user?.role)}
            </p>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate("/my-requests")} className="btn-primary">View My Requests</button>
            <button onClick={() => { setSuccess(null); setStep(1); setForm({ type:"", subType:"", leaveType:"", title:"", description:"", priority:"medium", amount:"", fromDate:"", toDate:"", equipmentId:"", location:"" }); }}
              className="btn-ghost">New Request</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-in-up">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100">New Request</h2>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            Submitting for: <span className="text-molten-400 font-medium">{user?.department}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forge-800 border border-forge-700">
          <div className="w-6 h-6 rounded-full bg-molten-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-molten-400">{user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}</span>
          </div>
          <div>
            <p className="text-xs font-display font-medium text-slate-200 leading-tight">{user?.name}</p>
            <p className="text-[10px] font-mono text-slate-500 leading-tight capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-5">
        {["Request Type","Details","Submit"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-display font-bold flex-shrink-0 transition-all
              ${step > i+1 ? "bg-green-500 text-white" : step === i+1 ? "bg-molten-500 text-white" : "bg-forge-700 text-slate-500"}`}>
              {step > i+1 ? "✓" : i+1}
            </div>
            <span className={`text-xs font-display font-medium ${step === i+1 ? "text-slate-200" : "text-slate-600"}`}>{s}</span>
            {i < 2 && <div className={`flex-1 h-px ${step > i+1 ? "bg-green-500/40" : "bg-forge-700"}`}/>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── STEP 1: Request Type ──────────────────────────────────── */}
        {step === 1 && (
          <div className="card p-5">
            <p className="label mb-3">What type of request? <span className="text-molten-500">*</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {REQUEST_TYPES.map(({ value, label, icon, desc }) => (
                <button key={value} type="button"
                  onClick={() => { set("type", value); set("subType",""); set("leaveType",""); setStep(2); }}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border transition-all text-left
                    ${form.type === value
                      ? "border-molten-500 bg-molten-500/10"
                      : "border-forge-700 bg-forge-800 hover:border-molten-500/40 hover:bg-forge-700"}`}>
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-sm font-display font-semibold ${form.type === value ? "text-molten-400" : "text-slate-200"}`}>{label}</span>
                  <span className="text-[11px] text-slate-500 font-body leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Sub-type selection ─────────────────────────────── */}
        {step === 2 && form.type && (
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <p className="label mb-0">
                {form.type === "leave"    ? "What kind of leave?" :
                 form.type === "repair"   ? "What kind of repair?" :
                 form.type === "safety"   ? "What type of permit?" :
                 form.type === "budget"   ? "What type of budget?" :
                 "Priority & Amount"}
              </p>
            </div>

            {/* LEAVE sub-types */}
            {form.type === "leave" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEAVE_TYPES.map(({ value, label, icon }) => (
                  <button key={value} type="button"
                    onClick={() => { set("leaveType", value); setStep(3); }}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left
                      ${form.leaveType === value
                        ? "border-molten-500 bg-molten-500/10 text-molten-400"
                        : "border-forge-700 bg-forge-800 text-slate-300 hover:border-forge-600"}`}>
                    <span className="text-base">{icon}</span>
                    <span className="text-xs font-display font-medium leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* REPAIR sub-types */}
            {form.type === "repair" && (
              <div className="space-y-2">
                {REPAIR_SUBTYPES.map(({ value, label, icon, desc, priority }) => (
                  <button key={value} type="button"
                    onClick={() => { set("subType", value); set("priority", priority); setStep(3); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                      ${form.subType === value
                        ? "border-molten-500 bg-molten-500/10"
                        : "border-forge-700 bg-forge-800 hover:border-forge-600"}`}>
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-display font-semibold ${form.subType === value ? "text-molten-400" : "text-slate-200"}`}>{label}</p>
                      <p className="text-xs text-slate-500 font-body mt-0.5">{desc}</p>
                    </div>
                    <span className={`text-[10px] font-display font-bold px-2 py-1 rounded-full
                      ${priority === "critical" ? "bg-red-500/15 text-red-400" :
                        priority === "high"     ? "bg-orange-500/15 text-orange-400" :
                        "bg-slate-700 text-slate-400"}`}>
                      {priority}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* SAFETY sub-types */}
            {form.type === "safety" && (
              <div className="space-y-2">
                {SAFETY_SUBTYPES.map(({ value, label, icon, desc }) => (
                  <button key={value} type="button"
                    onClick={() => { set("subType", value); set("priority", value === "shutdown" ? "critical" : "high"); setStep(3); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left
                      ${form.subType === value
                        ? "border-molten-500 bg-molten-500/10"
                        : "border-forge-700 bg-forge-800 hover:border-forge-600"}`}>
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className={`text-sm font-display font-semibold ${form.subType === value ? "text-molten-400" : "text-slate-200"}`}>{label}</p>
                      <p className="text-xs text-slate-500 font-body">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* BUDGET sub-types */}
            {form.type === "budget" && (
              <div className="space-y-2">
                {BUDGET_SUBTYPES.map(({ value, label, icon, desc }) => (
                  <button key={value} type="button"
                    onClick={() => { set("subType", value); setStep(3); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left
                      ${form.subType === value
                        ? "border-molten-500 bg-molten-500/10"
                        : "border-forge-700 bg-forge-800 hover:border-forge-600"}`}>
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className={`text-sm font-display font-semibold ${form.subType === value ? "text-molten-400" : "text-slate-200"}`}>{label}</p>
                      <p className="text-xs text-slate-500 font-body">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* PURCHASE goes straight to step 3 */}
            {form.type === "purchase" && (
              <div className="text-center py-4">
                <button type="button" onClick={() => setStep(3)} className="btn-primary mx-auto">
                  Continue to Details →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Details ───────────────────────────────────────── */}
        {step === 3 && (
          <>
            {/* Approval chain preview */}
            <div className="px-4 py-3 rounded-xl bg-forge-800 border border-molten-500/20 flex items-center gap-3">
              <svg className="w-4 h-4 text-molten-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-display font-semibold">Approval Chain</p>
                <p className="text-xs font-mono text-molten-400 mt-0.5">
                  {getChainLabel(form.type, form.subType || form.leaveType, form.amount, user?.role)}
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-[10px] text-slate-600 hover:text-molten-400 transition-colors">
                change type
              </button>
            </div>

            <div className="card p-5 space-y-4">

              {/* LEAVE: date pickers */}
              {form.type === "leave" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">From Date <span className="text-molten-500">*</span></label>
                    <input type="date" value={form.fromDate} onChange={e => set("fromDate", e.target.value)}
                      className="input" min={new Date().toISOString().split("T")[0]}/>
                  </div>
                  <div>
                    <label className="label">To Date <span className="text-molten-500">*</span></label>
                    <input type="date" value={form.toDate} onChange={e => set("toDate", e.target.value)}
                      className="input" min={form.fromDate || new Date().toISOString().split("T")[0]}/>
                  </div>
                  {leaveDays > 0 && (
                    <div className="col-span-2 px-3 py-2 rounded-lg bg-forge-900 border border-forge-700">
                      <p className="text-xs font-mono text-molten-400">{leaveDays} day{leaveDays !== 1 ? "s" : ""} of leave</p>
                    </div>
                  )}
                </div>
              )}

              {/* REPAIR: equipment details */}
              {form.type === "repair" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Equipment / Machine ID</label>
                    <input value={form.equipmentId} onChange={e => set("equipmentId", e.target.value)}
                      placeholder="e.g. BF-HYD-PRESS-02" className="input font-mono"/>
                  </div>
                  <div>
                    <label className="label">Location / Section</label>
                    <input value={form.location} onChange={e => set("location", e.target.value)}
                      placeholder="e.g. Bay 2, SMS" className="input"/>
                  </div>
                </div>
              )}

              {/* Title — auto for leave/repair, manual for rest */}
              {(form.type !== "leave") && (
                <div>
                  <label className="label">
                    Title <span className="text-molten-500">*</span>
                    {form.type === "repair" && form.equipmentId &&
                      <span className="text-[10px] text-slate-600 ml-2 normal-case font-body font-normal">auto-generated if equipment ID filled</span>
                    }
                  </label>
                  <input value={form.title} onChange={e => set("title", e.target.value)}
                    placeholder={
                      form.type === "purchase" ? "e.g. Refractory Bricks for BF-3 Tap Hole" :
                      form.type === "repair"   ? "e.g. Hydraulic Press Breakdown — Bay 2" :
                      form.type === "safety"   ? "e.g. Hot Work Permit — BF-2 Gas Line" :
                      form.type === "budget"   ? "e.g. Q4 Safety Training Budget" :
                      "Enter request title"
                    }
                    className="input" maxLength={120}/>
                </div>
              )}

              {/* Amount for purchase and budget */}
              {["purchase","budget"].includes(form.type) && (
                <div>
                  <label className="label">
                    Amount ₹ <span className="text-molten-500">*</span>
                    {form.type === "purchase" && form.amount && (
                      <span className="text-[10px] text-molten-400 ml-2 normal-case font-mono font-normal">
                        → {getChainLabel("purchase","",form.amount,user?.role).split("(")[0].trim()}
                      </span>
                    )}
                  </label>
                  <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)}
                    placeholder="0" className="input font-mono" min="0"/>
                </div>
              )}

              {/* Priority — auto-set for repair/safety, manual for rest */}
              {!["repair","safety"].includes(form.type) || form.type === "purchase" ? (
                <div>
                  <label className="label">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map(({ value, label, sla, cls }) => (
                      <button key={value} type="button" onClick={() => set("priority", value)}
                        className={`p-2.5 rounded-lg border transition-all text-center
                          ${form.priority === value ? `${cls} border-2` : "border-forge-700 bg-forge-800 text-slate-500 hover:border-forge-600"}`}>
                        <p className="text-xs font-display font-bold">{label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{sla}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg bg-forge-900 border border-forge-700">
                  <p className="text-[10px] text-slate-500">Priority auto-set based on request type: <span className="text-molten-400 font-mono">{form.priority}</span></p>
                </div>
              )}

              {/* Department — locked */}
              <div>
                <label className="label">Department</label>
                <div className="input flex items-center gap-2 opacity-70 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span className="text-slate-300 text-sm">{user?.department}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">from your profile</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">
                  Description <span className="text-molten-500">*</span>
                </label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={5} className="input resize-none" maxLength={1000}
                  placeholder={
                    form.type === "leave"    ? "Reason for leave. Mention handover plan if applicable..." :
                    form.type === "repair"   ? "Describe the problem — what failed, impact on production, urgency..." :
                    form.type === "purchase" ? "Specify material, quantity, vendor (if known), why needed now..." :
                    form.type === "safety"   ? "Describe the work, hazards involved, safety precautions taken..." :
                    form.type === "budget"   ? "Purpose of budget, breakdown of expenses, expected benefit..." :
                    "Provide complete details..."
                  }/>
                <p className="text-right text-[10px] text-slate-600 mt-1">{form.description.length}/1000</p>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex gap-2 items-start animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 pb-6">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost">← Back</button>
              <button type="submit" disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                {loading
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Submitting...</>
                  : <>Submit Request <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}