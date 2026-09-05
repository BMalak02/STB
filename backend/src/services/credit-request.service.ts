import { CreditRequest } from '../models/credit-request.model';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';
import { OcrVerificationService } from './ocr-verification.service';
import { Types } from 'mongoose';

export class CreditRequestService {
  private notificationService = new NotificationService();
  private ocrVerificationService = new OcrVerificationService();

  private async findRequest(userId: string, requestId: string) {
    if (requestId === 'active' || !Types.ObjectId.isValid(requestId)) {
      let request = await CreditRequest.findOne({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });
      if (!request) {
        request = await this.createCreditRequest(userId, {
          type: 'Personnel',
          amount: 15000,
          duration: 36,
        });
      }
      return request;
    }
    const request = await CreditRequest.findOne({ _id: requestId, userId: new Types.ObjectId(userId) });
    if (!request) {
      throw { status: 404, message: 'Credit request not found' };
    }
    return request;
  }

  async createCreditRequest(
    userId: string,
    data: { type: 'Immobilier' | 'Auto' | 'Personnel'; amount: number; duration: number }
  ) {
    const { type, amount, duration } = data;

    const rates = {
      Immobilier: 7.8,
      Auto: 8.2,
      Personnel: 8.5,
    };
    const rate = rates[type] || 8.5;
    const r = rate / 100 / 12;
    const monthlyPayment = Math.round((amount * r) / (1 - Math.pow(1 + r, -duration)));

    const reference = `CR2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const documents = [
      { type: 'cin', name: "Carte d'identité nationale", status: 'required', size: '—', path: '' },
      { type: 'payslip', name: '3 fiches de paie', status: 'required', size: '—', path: '' },
      { type: 'statement', name: 'Relevés bancaires (3 derniers mois)', status: 'required', size: '—', path: '' },
      { type: 'residence', name: 'Justificatif de domicile', status: 'required', size: '—', path: '' },
    ];

    const creditRequest = await CreditRequest.create({
      userId: new Types.ObjectId(userId),
      reference,
      type,
      amount,
      duration,
      interestRate: rate,
      monthlyPayment,
      status: 'pending_documents',
      progress: 20,
      step: 1,
      documents,
      signature: {
        otpCode: '2026',
        isSigned: false,
      },
    });

    await this.notificationService.createNotification(
      userId,
      'info',
      'Simulation enregistrée',
      `Votre simulation de crédit ${type} (#${reference}) a été créée et enregistrée dans la base STB.`
    );

    return creditRequest;
  }

  async getUserCreditRequests(userId: string) {
    return await CreditRequest.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async getActiveCreditRequest(userId: string) {
    const request = await CreditRequest.findOne({
      userId: new Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
    return request;
  }

  async getCreditRequestDetails(userId: string, requestId: string) {
    return await this.findRequest(userId, requestId);
  }

  /**
   * Uploads a document, performs automatic AI OCR verification, and updates status
   */
  async updateDocuments(
    userId: string,
    requestId: string,
    docType: 'cin' | 'payslip' | 'statement' | 'residence' | string,
    size: string,
    path: string,
    userName?: string
  ) {
    const request = await this.findRequest(userId, requestId);

    let currentUserName = userName;
    if (!currentUserName) {
      const user = await User.findById(userId);
      currentUserName = user?.name || '';
    }

    // Normalize docType if cin_recto or cin_verso
    const normalizedType = docType.startsWith('cin') ? 'cin' : docType;

    // Run AI OCR verification for the document
    const ocrData = await this.ocrVerificationService.processAndVerifyDocument(docType, path, currentUserName);

    // Merge ONLY non-empty extracted OCR fields into personalData (DO NOT overwrite existing user-entered fields)
    const newPersonalData = { ...(request.personalData || {}) };
    if (ocrData.extractedFields) {
      Object.entries(ocrData.extractedFields).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== '—' && val !== 0) {
          if (!(newPersonalData as any)[key]) {
            (newPersonalData as any)[key] = val;
          }
        }
      });
    }
    request.personalData = newPersonalData;

    // Update document entry
    let updatedDocName = '';
    let isAccepted = ocrData.isCompliant;

    request.documents = request.documents.map((doc) => {
      if (doc.type === normalizedType) {
        updatedDocName = doc.name;
        return {
          ...doc,
          status: isAccepted ? 'done' : 'required',
          size: isAccepted ? (size || '1.8 Mo') : '—',
          path: isAccepted ? path : '',
          ocrData,
        };
      }
      return doc;
    });

    // Recalculate progress
    const totalDocs = request.documents.length;
    const completedDocs = request.documents.filter((d) => d.status === 'done').length;

    const docProgress = Math.round(20 + (completedDocs / totalDocs) * 30);
    request.progress = docProgress;

    if (!isAccepted) {
      await this.notificationService.createNotification(
        userId,
        'urgent',
        `Document rejeté (OCR)`,
        `Le document ${updatedDocName} est flou ou illisible par l'IA. Aucun numéro CIN/donnée valide détecté. Veuillez reprendre une photo nette.`
      );
      await request.save();
      return request;
    }

    // Send notification for successful OCR verification
    await this.notificationService.createNotification(
      userId,
      'info',
      `Document vérifié par l'IA`,
      `${updatedDocName} validé par OCR (Fiabilité IA: ${ocrData.aiConfidence}%).`
    );

    // If all documents are uploaded & verified, automatically advance to scoring phase
    if (completedDocs === totalDocs) {
      request.status = 'scoring';
      request.progress = 60;
      request.step = 2;

      await request.save();

      await this.notificationService.createNotification(
        userId,
        'info',
        'Vérification IA terminée',
        `Toutes les pièces pour le dossier #${request.reference} ont été validées par l'OCR. Calcul de l'éligibilité en cours.`
      );

      // Auto-trigger score calculation & return scored request
      return await this.evaluateScore(userId, request._id.toString());
    }

    await request.save();
    return request;
  }

  /**
   * Updates user personal data (CIN details & Payslip details) directly
   */
  async updatePersonalData(userId: string, requestId: string, data: any) {
    const request = await this.findRequest(userId, requestId);

    request.personalData = {
      ...(request.personalData || {}),
      ...data,
    };

    // If netSalary is updated, update payslip document ocrData if present
    if (data.netSalary) {
      const payslipDoc = request.documents.find((d) => d.type === 'payslip');
      if (payslipDoc && payslipDoc.ocrData) {
        payslipDoc.ocrData.extractedFields = {
          ...payslipDoc.ocrData.extractedFields,
          netSalary: data.netSalary,
          netSalaryFormatted: `${Number(data.netSalary).toLocaleString()} TND`,
        };
      }
    }

    await request.save();

    await this.notificationService.createNotification(
      userId,
      'info',
      'Données personnelles mises à jour',
      `Vos informations personnelles et financières ont été enregistrées avec succès.`
    );

    return request;
  }

  /**
   * Calculates AI score using extracted OCR criteria (e.g. salary, DTI ratio, stability)
   */
  async evaluateScore(userId: string, requestId: string) {
    const request = await this.findRequest(userId, requestId);

    // Extract net salary from personalData or payslip OCR if available, else default to 2850 TND
    const payslipDoc = request.documents.find((d) => d.type === 'payslip');
    const netSalary =
      request.personalData?.netSalary ||
      (payslipDoc?.ocrData?.extractedFields?.netSalary as number) ||
      2850;

    // Calculate DTI (Debt-to-Income ratio): monthlyPayment / netSalary * 100
    const dtiRatio = Math.round((request.monthlyPayment / (typeof netSalary === 'number' ? netSalary : 2850)) * 100);
    const stabilityScore = 90;

    // AI score formula: higher stability, lower DTI => higher score
    const score = Math.min(99, Math.max(50, Math.round(100 - dtiRatio * 0.7 + stabilityScore * 0.2)));

    request.score = score;
    request.scoreCriteria = {
      stability: stabilityScore,
      dti: dtiRatio || 38,
    };

    request.status = 'pending_approval';
    request.progress = 75;
    request.step = 3;
    request.decisionDate = new Date();

    await request.save();

    await this.notificationService.createNotification(
      userId,
      'success',
      "Éligibilité validée par l'IA",
      `L'analyse automatique du dossier #${request.reference} donne un score de ${score}/100 (Taux d'endettement: ${dtiRatio}%). Prêt pour signature.`
    );

    return request;
  }

  async sendOtp(userId: string, requestId: string) {
    const request = await this.findRequest(userId, requestId);

    request.signature.otpCode = '2026';
    request.signature.otpSentAt = new Date();
    request.status = 'pending_signature';
    request.progress = 85;
    request.step = 4;

    await request.save();
    return { message: 'OTP sent to registered phone number', otpCode: '2026' };
  }

  async signContract(userId: string, requestId: string, otpCode: string, pathDrawing: string) {
    const request = await this.findRequest(userId, requestId);

    if (otpCode !== request.signature.otpCode) {
      throw { status: 400, message: 'Invalid OTP code' };
    }

    request.signature.isSigned = true;
    request.signature.signedAt = new Date();
    request.signature.pathDrawing = pathDrawing;
    request.status = 'approved';
    request.progress = 100;
    request.step = 5;
    request.submittedAt = request.submittedAt || new Date();

    await request.save();

    await this.notificationService.createNotification(
      userId,
      'success',
      'Contrat signé avec succès !',
      `Votre crédit de ${request.amount.toLocaleString()} TND (#${request.reference}) a été validé et signé électroniquement.`
    );

    return request;
  }

  async cancelCreditRequest(userId: string, requestId: string) {
    const request = await this.findRequest(userId, requestId);
    request.status = 'rejected';
    await request.save();
    return { message: 'Credit request cancelled successfully', request };
  }

  /**
   * Bank Agent: Get a single credit request by ID with all fields populated (no userId restriction)
   */
  async getAgentCreditRequestDetails(requestId: string) {
    const request = await CreditRequest.findById(requestId)
      .populate('userId', 'name email avatar phone address');
    if (!request) {
      throw { status: 404, message: 'Credit request not found' };
    }
    return request;
  }

  /**
   * Bank Agent: Retrieve all credit request dossiers with populated user profiles
   */
  async getAllCreditRequestsForAgent() {
    let requests = await CreditRequest.find()
      .populate('userId', 'name email avatar phone address')
      .sort({ createdAt: -1 });

    if (!requests || requests.length === 0) {
      await this.seedSampleCreditRequests();
      requests = await CreditRequest.find()
        .populate('userId', 'name email avatar phone address')
        .sort({ createdAt: -1 });
    }

    return requests;
  }

  private async seedSampleCreditRequests() {
    try {
      let user = await User.findOne({ role: 'user' });
      if (!user) {
        user = await User.create({
          name: 'Client STB',
          email: 'client@stb.com.tn',
          password: 'Password123!',
          phone: '+216 71 148 000',
          address: 'Avenue Habib Bourguiba, Tunis',
          role: 'user',
          isVerified: true,
        });
      }

      const sampleDossiers = [
        {
          userId: user._id,
          reference: 'CR2026-8942',
          type: 'Immobilier',
          amount: 180000,
          duration: 240,
          interestRate: 7.5,
          monthlyPayment: 1448,
          status: 'pending_approval',
          progress: 80,
          step: 4,
          score: 88,
          scoreCriteria: { stability: 92, dti: 84 },
          personalData: {
            cinNumber: '13513495',
            fullName: 'Malak Ben Arbia',
            birthDate: '20/02/2002',
            issueDate: '18/05/2022',
            issuePlace: 'Tataouine',
            netSalary: 3200,
            employer: 'Société STB Tech',
            jobTitle: 'Ingénieur en Informatique',
            cnssNumber: '12849502-84',
            seniorityYears: 5,
          },
          documents: [
            { type: 'cin', name: 'Carte Nationale d\'Identité (Recto & Verso)', status: 'done', size: '1.8 Mo', path: '/uploads/cin_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 97.4, checks: ['✅ Numéro CIN validé (08942157)', '✅ Emise à Tunis le 18/05/2022'] } },
            { type: 'payslip', name: 'Dernier Bulletin de Paie', status: 'done', size: '1.2 Mo', path: '/uploads/paie_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 96.8, checks: ['✅ Salaire net mensuel: 3 200 TND >= 800 TND', '✅ Employeur certifié'] } },
            { type: 'statement', name: 'Relevé Bancaire 3 Mois', status: 'done', size: '2.4 Mo', path: '/uploads/releve_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 95.1, checks: ['✅ Solde moyen mensuel suffisant', '✅ Aucun incident de paiement'] } },
            { type: 'residence', name: 'Justificatif de Domicile', status: 'done', size: '0.9 Mo', path: '/uploads/domicile_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 94.0, checks: ['✅ Facture STEG/SONEDE conforme'] } },
          ],
        },
        {
          userId: user._id,
          reference: 'CR2026-9104',
          type: 'Auto',
          amount: 45000,
          duration: 60,
          interestRate: 8.2,
          monthlyPayment: 916,
          status: 'scoring',
          progress: 60,
          step: 3,
          score: 76,
          scoreCriteria: { stability: 78, dti: 74 },
          personalData: {
            cinNumber: '09124850',
            fullName: 'Amine Mansouri',
            birthDate: '02/11/1988',
            issueDate: '10/01/2021',
            issuePlace: 'Sousse',
            netSalary: 2450,
            employer: 'Poulina Group Holding',
            jobTitle: 'Chef de Projet Marketing',
            cnssNumber: '94821045-12',
            seniorityYears: 3,
          },
          documents: [
            { type: 'cin', name: 'Carte Nationale d\'Identité', status: 'done', size: '1.5 Mo', path: '/uploads/cin_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 95.0, checks: ['✅ CIN conforme (09124850)'] } },
            { type: 'payslip', name: 'Bulletin de Paie Récents', status: 'done', size: '1.1 Mo', path: '/uploads/paie_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 94.2, checks: ['✅ Salaire net mensuel: 2 450 TND'] } },
          ],
        },
        {
          userId: user._id,
          reference: 'CR2026-4432',
          type: 'Personnel',
          amount: 20000,
          duration: 36,
          interestRate: 9.0,
          monthlyPayment: 636,
          status: 'approved',
          progress: 100,
          step: 5,
          score: 94,
          scoreCriteria: { stability: 96, dti: 92 },
          personalData: {
            cinNumber: '05481029',
            fullName: 'Salma Khemir',
            birthDate: '24/06/1985',
            issueDate: '05/09/2019',
            issuePlace: 'Sfax',
            netSalary: 4100,
            employer: 'Ministère de l\'Éducation',
            jobTitle: 'Professeur d\'Enseignement Supérieur',
            cnssNumber: '74120938-90',
            seniorityYears: 12,
          },
          documents: [
            { type: 'cin', name: 'Carte Nationale d\'Identité', status: 'done', size: '1.6 Mo', path: '/uploads/cin_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 98.9, checks: ['✅ CIN conforme'] } },
            { type: 'payslip', name: 'Fiche de Paie', status: 'done', size: '1.3 Mo', path: '/uploads/paie_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 99.1, checks: ['✅ Fonctionnaire Titulaire'] } },
          ],
        },
        {
          userId: user._id,
          reference: 'CR2026-5510',
          type: 'Immobilier',
          amount: 220000,
          duration: 300,
          interestRate: 7.8,
          monthlyPayment: 1670,
          status: 'pending_documents',
          progress: 35,
          step: 2,
          score: 64,
          scoreCriteria: { stability: 60, dti: 68 },
          personalData: {
            cinNumber: '07419523',
            fullName: 'Youssef Trabelsi',
            birthDate: '12/03/1993',
            issueDate: '15/04/2023',
            issuePlace: 'Bizerte',
            netSalary: 2100,
            employer: 'Société Privée Bizerte',
            jobTitle: 'Technicien Supérieur',
            cnssNumber: '32019485-44',
            seniorityYears: 1,
          },
          documents: [
            { type: 'cin', name: 'Carte Nationale d\'Identité', status: 'done', size: '1.4 Mo', path: '/uploads/cin_sample.pdf', ocrData: { isCompliant: true, aiConfidence: 92.1, checks: ['✅ CIN lue par OCR'] } },
            { type: 'payslip', name: 'Dernier Bulletin de Paie', status: 'required', size: '—', path: '' },
          ],
        },
      ];

      await CreditRequest.insertMany(sampleDossiers);
      console.log('Seeded sample credit requests for bank agent portal successfully.');
    } catch (err) {
      console.error('Error seeding credit requests:', err);
    }
  }

  /**
   * Bank Agent: Update decision status and notify applicant
   */
  async updateCreditRequestStatusByAgent(requestId: string, status: string, decisionNotes?: string) {
    const request = await CreditRequest.findById(requestId).populate('userId', 'name email avatar phone');
    if (!request) {
      throw { status: 404, message: 'Credit request not found' };
    }

    request.status = status as any;
    if (status === 'approved') {
      request.progress = 100;
      request.step = 5;
      request.decisionDate = new Date();
    } else if (status === 'rejected') {
      request.decisionDate = new Date();
    } else if (status === 'pending_documents') {
      request.step = 1;
      request.progress = 35;
    }

    await request.save();

    const userIdString = (request.userId as any)?._id ? (request.userId as any)._id.toString() : request.userId.toString();

    const statusMessages: Record<string, { title: string; body: string; type: 'info' | 'success' | 'urgent' }> = {
      approved: {
        title: 'Décision STB : Crédit Approuvé ! 🎉',
        body: decisionNotes || `Votre demande de crédit #${request.reference} a été officiellement approuvée par la STB.`,
        type: 'success',
      },
      rejected: {
        title: 'Décision STB : Dossier non retenu',
        body: decisionNotes || `Votre demande de crédit #${request.reference} a été refusée suite à l'étude de risque.`,
        type: 'urgent',
      },
      pending_documents: {
        title: 'Complément de dossier requis',
        body: decisionNotes || `L'agent de banque sollicite la mise à jour de vos pièces pour le dossier #${request.reference}.`,
        type: 'urgent',
      },
    };

    const notifInfo = statusMessages[status] || {
      title: 'Mise à jour du dossier STB',
      body: decisionNotes || `Le statut de votre dossier #${request.reference} a été mis à jour par l'agent de banque.`,
      type: 'info',
    };

    await this.notificationService.createNotification(
      userIdString,
      notifInfo.type,
      notifInfo.title,
      notifInfo.body
    );

    return request;
  }
}
