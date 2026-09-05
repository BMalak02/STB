export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
}

export interface IOCRVerificationResult {
  extractedFields: Record<string, any>;
  aiConfidence: number;
  checks: string[];
  verifiedAt?: string;
  isCompliant: boolean;
}

export interface IDocumentItem {
  type: 'cin' | 'payslip' | 'statement' | 'residence';
  name: string;
  status: 'empty' | 'required' | 'pending' | 'done';
  size: string;
  path: string;
  ocrData?: IOCRVerificationResult;
}

export interface IPersonalData {
  cinNumber?: string;
  fullName?: string;
  birthDate?: string;
  issueDate?: string;
  issuePlace?: string;
  netSalary?: number;
  employer?: string;
  jobTitle?: string;
  cnssNumber?: string;
  seniorityYears?: number;
}

export interface ICreditRequest {
  _id: string;
  userId: IUser | any;
  reference: string;
  type: 'Immobilier' | 'Auto' | 'Personnel';
  amount: number;
  duration: number;
  interestRate: number;
  monthlyPayment: number;
  status: 'draft' | 'pending_documents' | 'scoring' | 'pending_approval' | 'pending_signature' | 'approved' | 'rejected';
  progress: number;
  step: number;
  score?: number;
  scoreCriteria?: {
    stability: number;
    dti: number;
  };
  documents: IDocumentItem[];
  personalData?: IPersonalData;
  submittedAt?: string;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
}
