export default function DashboardCard({ label, value, icon, accent = "molten", trend, sub }) {
  const accents = {
    molten: {
      border:  "border-molten-500/20",
      bg:      "bg-molten-500/10",
      text:    "text-molten-400",
      glow:    "bg-molten-500",
      shadow:  "shadow-molten",
    },
    steel: {
      border:  "border-steel-500/20",
      bg:      "bg-steel-500/10",
      text:    "text-steel-400",
      glow:    "bg-steel-500",
      shadow:  "shadow-steel",
    },
    green: {
      border:  "border-green-500/20",
      bg:      "bg-green-500/10",
      text:    "text-green-400",
      glow:    "bg-green-500",
      shadow:  "",
    },
    red: {
      border:  "border-red-500/20",
      bg:      "bg-red-500/10",
      text:    "text-red-400",
      glow:    "bg-red-500",
      shadow:  "",
    },
    yellow: {
      border:  "border-yellow-500/20",
      bg:      "bg-yellow-500/10",
      text:    "text-yellow-400",
      glow:    "bg-yellow-500",
      shadow:  "",
    },
  };

  const a = accents[accent] || accents.molten;

  return (
    <div className={`stat-card border ${a.border} group cursor-default`}>
      {/* Glow dot top-right */}
      <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${a.glow} opacity-60 animate-pulse-slow`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className={`font-display font-bold text-3xl ${a.text} mt-1 leading-none`}>
            {value ?? "—"}
          </p>
          {sub && <p className="text-xs font-body text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${a.bg} border ${a.border}
                         flex items-center justify-center flex-shrink-0 ${a.text}
                         group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-forge-700 flex items-center gap-2">
          <span className={`text-xs font-mono font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs font-body text-slate-600">vs last week</span>
        </div>
      )}
    </div>
  );
}