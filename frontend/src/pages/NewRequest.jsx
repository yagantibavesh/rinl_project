import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import api from "../utils/api"; // Uncomment this when your backend is ready!

const DEPARTMENTS = [
  "Blast Furnace", "Steel Melt Shop", "Roll Mill",
  "Raw Material Handling Plant", "HR", "Finance", "Purchase",
  "Safety", "Coke Oven", "Sinter Plant", "Central Maintenance Shop",
];

const REQUEST_TYPES = [
  { value: "purchase", label: "Material Procurement", icon: "🏗️" },
  { value: "leave",    label: "Leave Application",    icon: "📅" },
  { value: "repair",   label: "Equipment Repair",     icon: "🔧" },
  { value: "budget",   label: "Budget Sanction",      icon: "💰" },
  { value: "safety",   label: "Safety Clearance",     icon: "🦺" },
];

const PRIORITIES = [
  { value: "critical", label: "Critical", desc: "SLA: 2 hours",  color: "border-red-500/50 bg-red-500/10 text-red-400" },
  { value: "high",     label: "High",     desc: "SLA: 8 hours",  color: "border-orange-500/50 bg-orange-500/10 text-orange-400" },
  { value: "medium",   label: "Medium",   desc: "SLA: 24 hours", color: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" },
  { value: "low",      label: "Low",      desc: "SLA: 48 hours", color: "border-slate-600 bg-slate-800 text-slate-400" },
];

export default function NewRequest() {
  const { user } = useAuth() || {}; // Added fallback just in case AuthContext isn't ready
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    type: params.get("type") || "",
    title: "",
    description: "",
    priority: "medium",
    department: user?.department || "",
    amount: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleUpdate = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for missing fields
    if (!form.type || !form.title || !form.description || !form.department) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    setError("");

    // Simulate backend response
    setTimeout(() => {
      console.log("Mock data submitted:", form);
      const fakeResponse = {
        requestId: "REQ-" + Math.floor(Math.random() * 10000)
      };
      setSuccess(fakeResponse);
      setLoading(false);
    }, 1000);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-100 mb-2">Request Submitted!</h2>
          <p className="text-sm font-body text-slate-400 mb-1">Your request has been created successfully.</p>
          <p className="font-mono text-xs text-molten-400 bg-molten-500/10 border border-molten-500/20 inline-block px-3 py-1 rounded-full mt-2">
            {success.requestId}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => navigate("/my-requests")} className="btn-primary">
              View My Requests
            </button>
            <button 
              onClick={() => { 
                setSuccess(null); 
                setForm({ type:"", title:"", description:"", priority:"medium", department: user?.department || "", amount:"" }); 
              }}
              className="btn-ghost"
            >
              New Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-in-up">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl text-slate-100">New Request</h2>
        <p className="text-sm font-body text-slate-500 mt-1">Submit a request for departmental approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Request Type */}
        <div className="card p-5">
          <p className="label mb-3">Request Type <span className="text-molten-500">*</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REQUEST_TYPES.map(({ value, label, icon }) => {
              const isActive = form.type === value;
              const activeClass = "border-molten-500 bg-molten-500/10 text-molten-400";
              const inactiveClass = "border-forge-700 bg-forge-800 text-slate-400 hover:border-forge-600 hover:text-slate-300";
              
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleUpdate("type", value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${isActive ? activeClass : inactiveClass}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-display font-medium leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div className="card p-5">
          <p className="label mb-3">Priority Level <span className="text-molten-500">*</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITIES.map(({ value, label, desc, color }) => {
              const isActive = form.priority === value;
              const activeClass = color + " border-2";
              const inactiveClass = "border-forge-700 bg-forge-800 text-slate-500 hover:border-forge-600";

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleUpdate("priority", value)}
                  className={`p-3 rounded-lg border transition-all text-left ${isActive ? activeClass : inactiveClass}`}
                >
                  <p className="text-xs font-display font-bold">{label}</p>
                  <p className="text-[10px] font-body mt-0.5 opacity-80">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Request Title <span className="text-molten-500">*</span></label>
            <input
              value={form.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              placeholder="e.g. Emergency Refractory Bricks for BF-3"
              className="input"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department <span className="text-molten-500">*</span></label>
              <select value={form.department} onChange={(e) => handleUpdate("department", e.target.value)} className="input">
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {["purchase","budget"].includes(form.type) && (
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleUpdate("amount", e.target.value)}
                  placeholder="0.00"
                  className="input font-mono"
                  min="0"
                />
              </div>
            )}
          </div>

          <div>
            <label className="label">Description <span className="text-molten-500">*</span></label>
            <textarea
              value={form.description}
              onChange={(e) => handleUpdate("description", e.target.value)}
              placeholder="Provide full details of your request — reason, specifications, urgency..."
              rows={5}
              className="input resize-none"
              maxLength={1000}
            />
            <p className="text-right text-[10px] text-slate-600 mt-1">{form.description.length}/1000</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-body animate-fade-in">
            {error}
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 