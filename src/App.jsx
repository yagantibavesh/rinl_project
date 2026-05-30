import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout         from "./components/Layout";

// Pages
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import NewRequest     from "./pages/NewRequest";
import MyRequests     from "./pages/MyRequests";
import ApprovalQueue  from "./pages/ApprovalQueue";
import RequestDetail  from "./pages/RequestDetail";
import Analytics      from "./pages/Analytics";

// Placeholder pages (add later)
const Admin = () => (
  <div className="card p-10 text-center animate-fade-in">
    <p className="font-display font-bold text-xl text-slate-300 mb-2">Admin Panel</p>
    <p className="text-sm text-slate-600 font-body">User management and workflow configuration coming soon.</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — all authenticated users */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/new-request"    element={<NewRequest />} />
            <Route path="/my-requests"    element={<MyRequests />} />
            <Route path="/requests/:id"   element={<RequestDetail />} />

            {/* Manager + HOD + Admin only */}
            <Route path="/approval-queue" element={
              <ProtectedRoute roles={["manager","hod","admin"]}>
                <ApprovalQueue />
              </ProtectedRoute>
            } />
            <Route path="/analytics"      element={
              <ProtectedRoute roles={["manager","hod","admin"]}>
                <Analytics />
              </ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin"          element={
              <ProtectedRoute roles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}