import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentNavbar } from './AgentNavbar';
import { KpiMetrics } from './KpiMetrics';
import { DossiersTable } from './DossiersTable';
import { DossierDetailModal } from './DossierDetailModal';
import { ICreditRequest } from '../../../types';
import { agentApi } from '../../../services/agentApi';

export const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ICreditRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ICreditRequest | null>(null);

  const fetchDossiers = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getAllCreditRequests();
      setRequests(data || []);
    } catch (err: any) {
      console.log('Error fetching dossiers from database API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const userObj = typeof r.userId === 'object' ? r.userId : null;
    const name = (userObj?.name || r.personalData?.fullName || '').toLowerCase();
    const ref = (r.reference || '').toLowerCase();
    const cin = (r.personalData?.cinNumber || '').toLowerCase();
    return name.includes(q) || ref.includes(q) || cin.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AgentNavbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <KpiMetrics requests={requests} />

        <DossiersTable
          requests={filteredRequests}
          onSelectRequest={(req) => setSelectedRequest(req)}
          loading={loading}
        />

        <DossierDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRefresh={fetchDossiers}
        />
      </main>
    </div>
  );
};
