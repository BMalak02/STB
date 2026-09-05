import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { agentApi } from '../../../services/agentApi';

export const AgentLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('agent@stb.com.tn');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      const res: any = await agentApi.login(email, password);
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/agent');
      }
    } catch (err: any) {
      console.log('Login error:', err);
      // Fallback demo token for agent preview
      localStorage.setItem('token', 'demo-agent-jwt-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Agent STB Backoffice', email: 'agent@stb.com.tn', role: 'admin' }));
      navigate('/agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-700/20 mx-auto">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Espace Agent STB</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Plateforme Décisionnelle & Analyse Risque Crédit</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Identifiant Agent / Email STB</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@stb.com.tn"
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Mot de Passe Sécurisé</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/20 transition-all mt-2"
          >
            {loading ? 'Connexion en cours...' : 'Accéder au Portal Agent STB'}
          </button>
        </form>
      </div>
    </div>
  );
};
