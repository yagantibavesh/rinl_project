import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

const PAGE_TITLES = {
  "/dashboard":      "Overview",
  "/new-request":    "New Request",
  "/my-requests":    "My Requests",
  "/approval-queue": "Approval Queue",
  "/analytics":      "Analytics",
  "/admin":          "Admin Panel",
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || "RINL ERP";

  return (
    <div className="flex min-h-screen bg-forge-900 bg-grid bg-grid-40">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-64 right-0 h-64 bg-glow-molten opacity-60" />
        <div className="absolute bottom-0 right-0 w-1/2 h-64 bg-glow-steel opacity-40" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <Navbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}