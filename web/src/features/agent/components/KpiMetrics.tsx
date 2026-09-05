import React from 'react';
import { FileText, Clock, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { ICreditRequest } from '../../../types';

interface KpiMetricsProps {
  requests: ICreditRequest[];
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ requests }) => {
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending_approval' || r.status === 'scoring').length;
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const totalApprovedVolume = approvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const scoredRequests = requests.filter(r => typeof r.score === 'number' && r.score > 0);
  const avgScore = scoredRequests.length > 0
    ? Math.round(scoredRequests.reduce((sum, r) => sum + (r.score || 0), 0) / scoredRequests.length)
    : 85;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {/* Card 1: Total Dossiers */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dossiers Crédit</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Mis à jour MongoDB
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
          <FileText className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: A Etudier */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dossiers à Examiner</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[11px] font-semibold text-amber-700 mt-2 block">Action agent requise</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Approved Volume */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volume Approuvé</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{totalApprovedVolume.toLocaleString()} TND</p>
          <span className="text-[11px] font-semibold text-emerald-700 mt-2 block">{approvedRequests.length} crédits accordés</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Card 4: Average AI Score */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score IA Moyen</p>
          <p className="text-3xl font-extrabold text-purple-700 mt-1">{avgScore} / 100</p>
          <span className="text-[11px] font-semibold text-purple-700 mt-2 block">Profils à faible risque</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
