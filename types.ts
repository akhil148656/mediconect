export enum UserRole {
  PUBLIC = 'PUBLIC',
  INSURANCE = 'INSURANCE',
  PROVIDER = 'PROVIDER'
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  location: {
    state: string;
    city: string;
    town: string;
    address: string;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  imageUrl: string;
  treatments: string[];
  contact: string;
  licenseNumber?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: 'Doctor' | 'Hospital';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  underSurveillance: boolean;
  license: string;
  address: string;
}

export interface EmpanelmentRequest {
  id: string;
  name: string;
  type: 'Doctor' | 'Hospital';
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reviewing';
  specialization: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: string;
  lastVisit: string;
  status: 'Admitted' | 'Discharged' | 'Outpatient';
  insuranceProvider: string;
}

export interface Claim {
  id: string;
  patientName: string;
  insuranceProvider: string;
  amountClaimed: number;
  amountApproved?: number;
  submittedDate: string;
  receivedDate?: string; // null if pending
  status: 'Approved' | 'Pending' | 'Rejected' | 'More Info Needed';
  serviceDate: string;
}

export interface RiskProfile {
  id: string;
  entityName: string;
  type: 'Doctor' | 'Hospital';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastAudit: string;
  flaggedIncidents: number;
}

export interface PipelineStep {
  id: string;
  agentName: string;
  role: string; // e.g. "Data Acquisition", "Validation"
  status: 'pending' | 'processing' | 'completed' | 'failed';
  logs: string[];
  timestamp: string;
}

export interface AIVerificationResult {
  verified: boolean;
  status: 'VERIFIED' | 'FLAGGED' | 'PENDING';
  confidenceScore: number;
  reason: string;
  pipelineTrace: PipelineStep[]; // New field for the visualizer
  sourcesChecked: string[];
  timestamp: string;
}

export interface AIAlert {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  date: string;
  providerName: string;
}

export interface AppNotification {
  id: string;
  category: 'notification' | 'flag'; // 'flag' is for alerts/warnings
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

export interface AnalyticsData {
  name: string;
  value: number;
}