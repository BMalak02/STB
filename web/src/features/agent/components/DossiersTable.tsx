import React, { useState } from 'react';
import { Eye, ShieldCheck, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ICreditRequest } from '../../../types';

interface DossiersTableProps {
  requests: ICreditRequest[];
  onSelectRequest: (request: ICreditRequest) => void;
  loading: boolean;
}

export const DossiersTable: React.FC<DossiersTableProps> = ({
  requests,
  onSelectRequest,
  loading,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return r.status === 'pending_approval' || r.status === 'scoring';
    if (statusFilter === 'approved') return r.status === 'approved';
    if (statusFilter === 'rejected') return r.status === 'rejected';
    if (statusFilter === 'documents') return r.status === 'pending_documents';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Refusé
          </span>
        );
      case 'pending_documents':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" /> Complément requis
          </span>
        );
      case 'pending_approval':
      case 'scoring':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> À examiner
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-300">
            En cours
          </span>
        );
    }
  };

  const getScoreBadge = (score?: number) => {
    const val = score || 85;
    if (val >= 80) {
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> {val} / 100
        </span>
      );
    } else if (val >= 60) {
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-amber-700">
          <AlertCircle className="w-4 h-4 text-amber-700" /> {val} / 100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-extrabold text-rose-700">
        <XCircle className="w-4 h-4 text-rose-700" /> {val} / 100
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              statusFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Tous les dossiers ({requests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            À examiner ({requests.filter(r => r.status === 'pending_approval' || r.status === 'scoring').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              statusFilter === 'approved'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Approuvés ({requests.filter(r => r.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('documents')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              statusFilter === 'documents'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Complément requis ({requests.filter(r => r.status === 'pending_documents').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Refusés ({requests.filter(r => r.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Chargement des dossiers depuis la base de données STB...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="text-base font-bold text-slate-800">Aucun dossier trouvé</p>
          <p className="text-xs mt-1">Aucune demande de crédit ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b-2 border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-xl">Référence</th>
                <th className="py-3.5 px-4">Emprunteur</th>
                <th className="py-3.5 px-4">Type de Crédit</th>
                <th className="py-3.5 px-4">Montant & Mensualité</th>
                <th className="py-3.5 px-4">Score IA STB</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRequests.map((req) => {
                const userObj = typeof req.userId === 'object' ? req.userId : null;
                const ocrCin = req.documents?.find(d => d.type === 'cin')?.ocrData?.extractedFields?.cinNumber;
                const applicantName = req.personalData?.fullName || userObj?.name || 'Client STB';
                const applicantPhone = userObj?.phone || '+216 98 123 456';
                const cinNum = req.personalData?.cinNumber || ocrCin || 'En cours d\'analyse';

                return (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors group">
                    {/* Reference */}
                    <td className="py-4 px-4 font-mono font-bold text-emerald-800">
                      #{req.reference}
                      <span className="block text-[11px] font-sans font-medium text-slate-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>

                    {/* Applicant */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-xs text-emerald-800">
                          {applicantName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{applicantName}</p>
                          <p className="text-xs text-slate-500 font-medium">CIN: {cinNum} • {applicantPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                        Crédit {req.type}
                      </span>
                    </td>

                    {/* Amount & Monthly */}
                    <td className="py-4 px-4">
                      <p className="font-extrabold text-slate-900">{req.amount?.toLocaleString()} TND</p>
                      <p className="text-xs font-semibold text-emerald-700">{req.monthlyPayment?.toLocaleString()} TND / mois ({req.duration} mois)</p>
                    </td>

                    {/* Score IA */}
                    <td className="py-4 px-4">{getScoreBadge(req.score)}</td>

                    {/* Statut */}
                    <td className="py-4 px-4">{getStatusBadge(req.status)}</td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm shadow-emerald-700/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspecter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
