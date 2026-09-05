import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export interface IOCRVerificationResult {
  extractedFields: Record<string, string | number>;
  aiConfidence: number;
  checks: string[];
  verifiedAt: Date;
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

export interface ISignatureDetails {
  otpCode: string;
  otpSentAt?: Date;
  isSigned: boolean;
  signedAt?: Date;
  pathDrawing?: string;
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

export interface ICreditRequest extends Document {
  userId: Types.ObjectId;
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
  signature: ISignatureDetails;
  submittedAt?: Date;
  decisionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'info' | 'success' | 'urgent';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

