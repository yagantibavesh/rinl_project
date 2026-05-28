import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Quick Mock Pages to ensure the router links operate cleanly
const Dashboard = () => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Main Work Dashboard</h1>
    <p className="text-slate-500 mt-1">Welcome to the steel plant automation workspace tracking grid.</p>
  </div>
);

const RaiseRequest = () => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Raise New Clearance Request</h1>
    <p className="text-slate-500 mt-1">The industrial parameter submission form will build here next.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        
        {/* Render our persistent navigation sidebar */}
        <Sidebar />
        
        {/* Content canvas offsets 64 units horizontally to sit clean next to sidebar */}
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/raise-request" element={<RaiseRequest />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}