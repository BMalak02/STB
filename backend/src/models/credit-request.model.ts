import { Schema, model } from 'mongoose';
import { ICreditRequest } from '../types';

const documentItemSchema = new Schema({
  type: { type: String, required: true, enum: ['cin', 'payslip', 'statement', 'residence'] },
  name: { type: String, required: true },
  status: { type: String, required: true, enum: ['empty', 'required', 'pending', 'done'], default: 'required' },
  size: { type: String, default: '' },
  path: { type: String, default: '' },
  ocrData: {
    extractedFields: { type: Schema.Types.Mixed },
    aiConfidence: { type: Number },
    checks: [{ type: String }],
    verifiedAt: { type: Date },
    isCompliant: { type: Boolean },
  },
}, { _id: false });

const signatureDetailsSchema = new Schema({
  otpCode: { type: String, required: true, default: '2026' },
  otpSentAt: { type: Date },
  isSigned: { type: Boolean, required: true, default: false },
  signedAt: { type: Date },
  pathDrawing: { type: String, default: '' },
}, { _id: false });

const personalDataSchema = new Schema({
  cinNumber: { type: String, default: '' },
  fullName: { type: String, default: '' },
  birthDate: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  issuePlace: { type: String, default: '' },
  netSalary: { type: Number, default: 0 },
  employer: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  cnssNumber: { type: String, default: '' },
  seniorityYears: { type: Number, default: 0 },
}, { _id: false });

const creditRequestSchema = new Schema<ICreditRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reference: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['Immobilier', 'Auto', 'Personnel'] },
    amount: { type: Number, required: true },
    duration: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'pending_documents', 'scoring', 'pending_approval', 'pending_signature', 'approved', 'rejected'],
      default: 'draft'
    },
    progress: { type: Number, required: true, default: 0 },
    step: { type: Number, required: true, default: 0 },
    score: { type: Number },
    scoreCriteria: {
      stability: { type: Number },
      dti: { type: Number }
    },
    documents: { type: [documentItemSchema], default: [] },
    personalData: { type: personalDataSchema, default: () => ({}) },
    signature: { type: signatureDetailsSchema, default: () => ({}) },
    submittedAt: { type: Date },
    decisionDate: { type: Date }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const CreditRequest = model<ICreditRequest>('CreditRequest', creditRequestSchema);
