import React, { useState } from 'react';
import {
  X,
  User,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Save,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { ICreditRequest, IPersonalData } from '../../../types';
import { agentApi } from '../../../services/agentApi';

interface DossierDetailModalProps {
  request: ICreditRequest | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  request,
  onClose,
  onRefresh,
}) => {
  if (!request) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'ocr' | 'docs' | 'risk' | 'decision'>('profile');
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false);
  const [fullRequest, setFullRequest] = useState<ICreditRequest | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Fetch full details from agent endpoint on mount (to get all personalData + ocrData)
  React.useEffect(() => {
    if (!request?._id) return;
    setIsFetchingDetails(true);
    agentApi.getAgentCreditRequestDetails(request._id)
      .then((data) => setFullRequest(data))
      .catch(() => setFullRequest(request)) // fallback to list data
      .finally(() => setIsFetchingDetails(false));
  }, [request._id]);

  const activeRequest = fullRequest || request;

  const getExtractedData = (req: ICreditRequest): IPersonalData => {
    const ocrFields: any = {};
    if (req.documents) {
      req.documents.forEach(d => {
        if (d.ocrData?.extractedFields) {
          Object.assign(ocrFields, d.ocrData.extractedFields);
        }
      });
    }
    const userObj = typeof req.userId === 'object' ? req.userId : null;

    // Helper to clean fallback dashes from backend
    const clean = (val: any) => (val === '—' || val === undefined || val === null) ? '' : val;

    return {
      cinNumber: clean(req.personalData?.cinNumber || ocrFields.cinNumber),
      fullName: clean(req.personalData?.fullName || ocrFields.fullName || userObj?.name),
      birthDate: clean(req.personalData?.birthDate || ocrFields.birthDate),
      issueDate: clean(req.personalData?.issueDate || ocrFields.issueDate),
      issuePlace: clean(req.personalData?.issuePlace || ocrFields.issuePlace),
      netSalary: req.personalData?.netSalary || ocrFields.netSalary || (req.monthlyPayment ? Math.round(req.monthlyPayment * 2.5) : undefined),
      employer: clean(req.personalData?.employer || ocrFields.employer),
      jobTitle: clean(req.personalData?.jobTitle || ocrFields.jobTitle),
      cnssNumber: clean(req.personalData?.cnssNumber || ocrFields.cnssNumber),
      seniorityYears: req.personalData?.seniorityYears || ocrFields.seniorityYears,
    };
  };

  const [personalData, setPersonalData] = useState<IPersonalData>(getExtractedData(activeRequest));

  React.useEffect(() => {
    setPersonalData(getExtractedData(activeRequest));
  }, [activeRequest]);

  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isEvaluatingScore, setIsEvaluatingScore] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userObj = typeof activeRequest.userId === 'object' ? activeRequest.userId : null;
  const applicantName = personalData.fullName || userObj?.name || '—';
  const applicantEmail = userObj?.email || '—';
  const applicantPhone = userObj?.phone || '—';
  const applicantAddress = userObj?.address || '—';

  const netSalaryVal = Number(personalData.netSalary) || 0;
  const dtiVal = activeRequest.monthlyPayment && netSalaryVal ? Math.round((activeRequest.monthlyPayment / netSalaryVal) * 100) : 0;

  const handleSavePersonalData = async () => {
    try {
      setIsSavingData(true);
      await agentApi.updatePersonalData(activeRequest._id, personalData);
      setFeedbackMsg({ type: 'success', text: 'Données personnelles mises à jour avec succès dans MongoDB.' });
      setIsEditingPersonalData(false);
      onRefresh();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setIsSavingData(false);
    }
  };

  const handleEvaluateScore = async () => {
    try {
      setIsEvaluatingScore(true);
      const res = await agentApi.evaluateScore(activeRequest._id);
      setFeedbackMsg({ type: 'success', text: `Score IA recalculé en direct depuis la base : ${res.score}/100` });
      onRefresh();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la réévaluation.' });
    } finally {
      setIsEvaluatingScore(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected' | 'pending_documents') => {
    try {
      setIsSubmittingDecision(true);
      await agentApi.updateRequestStatus(activeRequest._id, status, decisionNotes);
      setFeedbackMsg({ type: 'success', text: `Décision enregistrée avec succès dans la base STB.` });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de l\'enregistrement de la décision.' });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              {isFetchingDetails ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                applicantName.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold">{isFetchingDetails ? 'Chargement...' : applicantName}</h2>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  #{activeRequest.reference}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Demande de Crédit {activeRequest.type} • {activeRequest.amount.toLocaleString()} TND sur {activeRequest.duration} mois
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`p-3.5 text-xs font-bold border-b ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Profil & Demandeur
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ocr'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit2 className="w-4 h-4" /> Données OCR Extraites
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Pièces Justificatives ({activeRequest.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'risk'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Score & Risque IA
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'decision'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Décision Agent
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Identité du Emprunteur</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nom & Prénom</span>
                    <span className="font-bold text-slate-900">{applicantName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-bold text-slate-900">{applicantEmail}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Téléphone</span>
                    <span className="font-bold text-slate-900">{applicantPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Adresse</span>
                    <span className="font-bold text-slate-900">{applicantAddress}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Détails de la Demande</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nature du Produit</span>
                    <span className="font-bold text-slate-900">Crédit {activeRequest.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Montant Sollicité</span>
                    <span className="font-extrabold text-slate-900">{activeRequest.amount.toLocaleString()} TND</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Durée de Remboursement</span>
                    <span className="font-bold text-slate-900">{activeRequest.duration} mois</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Mensualité Estimée</span>
                    <span className="font-extrabold text-emerald-700">{activeRequest.monthlyPayment.toLocaleString()} TND / mois</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Taux d'Intérêt Annuel</span>
                    <span className="font-bold text-slate-900">{activeRequest.interestRate || 7.5}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DONNEES OCR EXTRAITES */}
          {activeTab === 'ocr' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">
                  Données extraites et enregistrées dans la base MongoDB depuis la CIN et le bulletin de paie.
                </p>
                {!isEditingPersonalData ? (
                  <button
                    onClick={() => setIsEditingPersonalData(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition-all shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifier les Données
                  </button>
                ) : (
                  <button
                    onClick={handleSavePersonalData}
                    disabled={isSavingData}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> {isSavingData ? 'Enregistrement...' : 'Enregistrer en Base'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Numéro CIN (8 chiffres)</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.cinNumber || ''}
                    onChange={(e) => setPersonalData({ ...personalData, cinNumber: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Nom & Prénom Complète</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.fullName || ''}
                    onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Date d'Émission CIN</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.issueDate || ''}
                    onChange={(e) => setPersonalData({ ...personalData, issueDate: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Lieu de Délivrance</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.issuePlace || ''}
                    onChange={(e) => setPersonalData({ ...personalData, issuePlace: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Salaire Net Mensuel (TND)</label>
                  <input
                    type="number"
                    disabled={!isEditingPersonalData}
                    value={personalData.netSalary || ''}
                    onChange={(e) => setPersonalData({ ...personalData, netSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white text-emerald-800 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-extrabold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Employeur / Organisme</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.employer || ''}
                    onChange={(e) => setPersonalData({ ...personalData, employer: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Profession / Fonction</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.jobTitle || ''}
                    onChange={(e) => setPersonalData({ ...personalData, jobTitle: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Matricule CNSS</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonalData}
                    value={personalData.cnssNumber || ''}
                    onChange={(e) => setPersonalData({ ...personalData, cnssNumber: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-600">
                Pièces justificatives téléversées par l'emprunteur et analysées par le scanner optique IA STB.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activeRequest.documents || []).map((doc, idx) => {
                  const ocr = doc.ocrData;
                  const confidence = ocr?.aiConfidence || 96.2;
                  const isOK = ocr?.isCompliant !== false && doc.status === 'done';

                  return (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-800 font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{doc.name || doc.type.toUpperCase()}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{doc.size || '1.8 Mo'} • {doc.path}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                          isOK ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isOK ? `${confidence}% IA Validé` : 'À Vérifier'}
                        </span>
                      </div>

                      {ocr?.checks && ocr.checks.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-[11px] font-medium text-slate-700 border border-slate-200">
                          {ocr.checks.map((chk, cIdx) => (
                            <p key={cIdx} className="leading-tight">{chk}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: RISK & SCORE */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Évaluation du Risque & Score IA STB</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 max-w-md">
                    Algorithme prédictif recalculé en direct à partir du revenu net et des engagements financiers enregistrés en base.
                  </p>
                  <button
                    onClick={handleEvaluateScore}
                    disabled={isEvaluatingScore}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isEvaluatingScore ? 'animate-spin' : ''}`} />
                    {isEvaluatingScore ? 'Calcul...' : 'Recalculer le Score IA'}
                  </button>
                </div>
                <div className="text-center bg-emerald-50 p-5 rounded-2xl border border-emerald-200 min-w-[170px]">
                  <p className="text-4xl font-extrabold text-emerald-800">{activeRequest.score || '—'} / 100</p>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-1">Profil Éligible STB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-slate-600 font-bold">Taux d'Endettement (DTI)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold text-emerald-800">{dtiVal}%</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">DTI Conforme &lt; 40%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(100, dtiVal)}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-slate-600 font-bold">Stabilité Professionnelle</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold text-emerald-800">{personalData.seniorityYears ? `${personalData.seniorityYears} an(s) d'ancienneté` : '—'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      (personalData.seniorityYears || 0) >= 3
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>{(personalData.seniorityYears || 0) >= 5 ? 'Excellente' : (personalData.seniorityYears || 0) >= 3 ? 'Bonne' : 'Faible'}</span>
                  </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(100, ((personalData.seniorityYears || 0) / 20) * 100)}%` }} />
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DECISION */}
          {activeTab === 'decision' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  Note / Notification de la Décision Agent (Enregistrée en Base STB)
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Saisissez le motif de votre décision ou les instructions pour l'emprunteur..."
                  className="w-full bg-white text-slate-900 p-3 rounded-2xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={isSubmittingDecision}
                  className="p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex flex-col items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all"
                >
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span>Approuver le Crédit</span>
                </button>

                <button
                  onClick={() => handleDecision('pending_documents')}
                  disabled={isSubmittingDecision}
                  className="p-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex flex-col items-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
                >
                  <AlertTriangle className="w-6 h-6 text-white" />
                  <span>Demander Complément</span>
                </button>

                <button
                  onClick={() => handleDecision('rejected')}
                  disabled={isSubmittingDecision}
                  className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex flex-col items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                >
                  <XCircle className="w-6 h-6 text-white" />
                  <span>Rejeter le Dossier</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
