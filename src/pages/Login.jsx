import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]     = useState({ employeeId: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    
    // Simulate a 1-second network request to fake the backend
    setTimeout(() => {
      // Check if they used the demo password
      if (form.password === "Test@1234") {
        
        // Create a fake user profile based on the ID they used
        const fakeUser = { 
          id: form.employeeId,
          name: form.employeeId.includes("MGR") ? "Demo Manager" : "Demo Employee", 
          role: form.employeeId.includes("MGR") ? "Manager" : "Employee" 
        };
        
        // Log them in with a fake token and go to the dashboard
        login("fake-jwt-token-123", fakeUser);
        navigate("/dashboard");
        
      } else {
        // If the password is wrong, show the error
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-forge-950 flex bg-grid bg-grid-40 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-glow-molten opacity-40" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-glow-steel opacity-30" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-molten-500/15 border border-molten-500/30
                          flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M6 24L11 8H14L16 16L18 8H21L26 24H23L20.5 16L18.5 24H13.5L11.5 16L9 24H6Z" fill="#F07E00"/>
              <path d="M16 4L18 8H14L16 4Z" fill="#FFB84D"/>
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-base text-slate-100">RINL ERP</p>
            <p className="font-body text-xs text-slate-500">Approval Workflow System</p>
          </div>
        </div>

        {/* Centre copy */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-molten-500/10 border border-molten-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-molten-500 animate-pulse-slow" />
            <span className="text-xs font-display font-semibold text-molten-400 uppercase tracking-widest">
              Navratna PSU
            </span>
          </div>
          <h2 className="font-display font-bold text-4xl text-slate-100 leading-tight mb-4">
            Rashtriya Ispat<br />
            Nigam Limited
          </h2>
          <p className="font-body text-base text-slate-400 leading-relaxed max-w-sm">
            Visakhapatnam Steel Plant — India's largest shore-based integrated steel plant.
            Streamline your departmental approvals digitally.
          </p>

          {/* Stats strip */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { v: "7.3M", l: "MTPA Capacity" },
              { v: "20K+", l: "Employees" },
              { v: "30+",  l: "Departments"  },
            ].map(({ v, l }) => (
              <div key={l} className="p-3 rounded-xl bg-forge-900/60 border border-forge-700">
                <p className="font-display font-bold text-xl text-molten-400">{v}</p>
                <p className="text-xs font-body text-slate-500 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-body text-slate-700">
          © {new Date().getFullYear()} RINL Visakhapatnam Steel Plant. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-molten-500/15 border border-molten-500/30
                            flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M6 24L11 8H14L16 16L18 8H21L26 24H23L20.5 16L18.5 24H13.5L11.5 16L9 24H6Z" fill="#F07E00"/>
              </svg>
            </div>
            <p className="font-display font-bold text-lg text-slate-100">RINL ERP</p>
          </div>

          <div className="card p-8 shadow-card-hover">
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-slate-100 mb-1">Welcome back</h1>
              <p className="font-body text-sm text-slate-500">Sign in with your RINL employee credentials</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30
                              flex items-start gap-2 animate-fade-in">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs font-body text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Employee ID</label>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. RINL-BF-2024-001"
                  className="input font-mono"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-forge-700">
              <p className="text-xs font-body text-slate-600 text-center mb-3">Demo credentials</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Employee", id: "RINL-EMP-001", pw: "Test@1234" },
                  { label: "Manager",  id: "RINL-MGR-001", pw: "Test@1234" },
                ].map(({ label, id, pw }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ employeeId: id, password: pw })}
                    className="text-left p-2.5 rounded-lg bg-forge-800 border border-forge-700
                               hover:border-molten-500/40 transition-all group"
                  >
                    <p className="text-[10px] font-display font-semibold text-molten-400 group-hover:text-molten-300 uppercase tracking-wider">{label}</p>
                    <p className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">{id}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}