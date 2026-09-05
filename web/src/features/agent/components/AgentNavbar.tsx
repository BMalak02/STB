import React from 'react';
import { Building2, Search, LogOut, ShieldCheck, User } from 'lucide-react';

interface AgentNavbarProps {
  agentName?: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onLogout: () => void;
}

export const AgentNavbar: React.FC<AgentNavbarProps> = ({
  agentName = 'Agent STB Backoffice',
  searchTerm,
  onSearchChange,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-md shadow-emerald-700/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">STB SmartCredit</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                Portal Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Société Tunisienne de Banque — Espace Décisionnel</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par Référence (#CR2026), Emprunteur, CIN..."
            className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-700">Session Sécurisée Agent</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200" />

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900">{agentName}</p>
              <p className="text-[10px] font-medium text-slate-500">Conseiller Crédit STB</p>
            </div>
            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
