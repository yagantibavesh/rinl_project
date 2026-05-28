import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const linkClass = ({ isActive }) => 
    `block px-4 py-3 rounded-lg transition-colors mb-2 font-medium ${
      isActive 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="w-64 bg-slate-900 h-screen border-r border-slate-800 flex flex-col p-4 fixed left-0 top-0 text-white">
      {/* Industry Header */}
      <div className="text-xl font-bold px-4 py-3 mt-2 tracking-tight border-b border-slate-800 pb-6 mb-6">
        RINL <span className="text-blue-500">SAWS</span>
        <div className="text-xs text-slate-500 font-normal mt-1">ERP Workflow System</div>
      </div>
      
      {/* Interactive Navigation links */}
      <nav className="flex-1">
        <NavLink to="/" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/raise-request" className={linkClass}>
          Raise Request
        </NavLink>
      </nav>
      
      <div className="mt-auto border-t border-slate-800 pt-4">
        <div className="px-4 py-2 text-xs text-slate-500 font-medium tracking-wider uppercase">Logged in as:</div>
        <div className="px-4 pb-4 text-sm font-medium text-slate-300">Employee Mode</div>
      </div>
    </div>
  );
}