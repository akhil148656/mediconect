import { Doctor, RiskProfile, AIVerificationResult, AIAlert, PipelineStep, Patient, Claim, AppNotification, UserRole, Provider, EmpanelmentRequest } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK EXTERNAL DATABASES (Read-Only Registries) ---
const EXTERNAL_REGISTRIES = {
  // National Plan and Provider Enumeration System
  NPI_REGISTRY: [
    { npi: '1592837461', name: 'Dr. Sarah Jenning', status: 'ACTIVE', type: 'Doctor', address: '123 Mission St, CA', lastUpdated: '2024-01-10' },
    { npi: '1928374650', name: 'City General Hospital', status: 'ACTIVE', type: 'Hospital', address: '100 Main St, CA', lastUpdated: '2023-11-05' },
    { npi: '9988776655', name: 'Dr. James Wilson', status: 'ACTIVE', type: 'Doctor', address: '777 Hope Ln, TX', lastUpdated: '2023-08-15' }, 
    { npi: '5544332211', name: 'Memorial Sloan', status: 'ACTIVE', type: 'Hospital', address: '5th Ave, NY', lastUpdated: '2024-02-01' }
  ],
  // State Licensing Boards
  STATE_BOARDS: [
    { license: 'MD-CA-49210', name: 'Dr. Sarah Jenning', state: 'CA', status: 'ACTIVE', expiry: '2026-05-20', disciplinaryHistory: false },
    { license: 'HOSP-CA-1111', name: 'City General Hospital', state: 'CA', status: 'ACTIVE', expiry: '2030-01-01', disciplinaryHistory: false },
    { license: 'HOSP-NY-2222', name: 'Memorial Sloan', state: 'NY', status: 'ACTIVE', expiry: '2028-11-15', disciplinaryHistory: false },
    { license: 'FLG-TX-00000', name: 'Dr. James Wilson', state: 'TX', status: 'SUSPENDED', expiry: '2023-12-31', disciplinaryHistory: true } 
  ],
  // Office of Inspector General (OIG) Exclusions
  SANCTIONS_LIST: [
    { name: 'Dr. James Wilson', reason: 'Billing Fraud - Level 2', date: '2024-01-15', source: 'OIG' }
  ],
  // Geospatial Registry (Simulating Google Maps)
  GEO_REGISTRY: {
    '1': { lat: 37.76, lng: -122.42, zone: 'San Francisco' }, // Mission St
    '2': { lat: 40.78, lng: -73.97, zone: 'New York' },       // Manhattan
    '3': { lat: 37.75, lng: -122.48, zone: 'San Francisco' }, // Sunset
    '4': { lat: 29.76, lng: -95.36, zone: 'Houston' }         // Houston
  }
};

// --- APP DATABASE (Persistent Store) ---
const DB_KEY = 'medisure_app_db_v1';

const INITIAL_DB_STATE = {
  providers: [
    { id: '1', name: 'Dr. Sarah Jenning', type: 'Doctor', risk: 'LOW', underSurveillance: false, license: 'MD-CA-49210', address: '123 Mission St, CA' },
    { id: '2', name: 'City General Hospital', type: 'Hospital', risk: 'LOW', underSurveillance: true, license: 'HOSP-CA-1111', address: '100 Main St, CA' },
    { id: '3', name: 'Dr. James Wilson', type: 'Doctor', risk: 'HIGH', underSurveillance: true, license: 'FLG-TX-00000', address: '777 Hope Ln, TX' },
    { id: '4', name: 'Memorial Sloan', type: 'Hospital', risk: 'MEDIUM', underSurveillance: false, license: 'HOSP-NY-2222', address: '5th Ave, NY' },
  ] as Provider[],
  empanelmentRequests: [
    { id: 'REQ-001', name: 'Dr. Emily Stone', type: 'Doctor', date: '2024-03-15', status: 'Pending', specialization: 'Dermatology' },
    { id: 'REQ-002', name: 'Westside Community Clinic', type: 'Hospital', date: '2024-03-14', status: 'Pending', specialization: 'General Care' },
    { id: 'REQ-003', name: 'Dr. Alan Grant', type: 'Doctor', date: '2024-03-12', status: 'Reviewing', specialization: 'Paleontology' },
  ] as EmpanelmentRequest[],
  patients: [
    { id: 'P-101', name: 'James Potter', age: 45, gender: 'Male', condition: 'Hypertension', lastVisit: '2024-03-10', status: 'Outpatient', insuranceProvider: 'BlueCross' },
    { id: 'P-102', name: 'Lily Evans', age: 42, gender: 'Female', condition: 'Migraine', lastVisit: '2024-03-12', status: 'Outpatient', insuranceProvider: 'Aetna' },
    { id: 'P-103', name: 'Sirius Black', age: 46, gender: 'Male', condition: 'Post-Op Recovery', lastVisit: '2024-03-08', status: 'Admitted', insuranceProvider: 'Cigna' },
    { id: 'P-104', name: 'Remus Lupin', age: 45, gender: 'Male', condition: 'Chronic Fatigue', lastVisit: '2024-03-01', status: 'Outpatient', insuranceProvider: 'BlueCross' },
    { id: 'P-105', name: 'Nymphadora Tonks', age: 35, gender: 'Female', condition: 'Flu', lastVisit: '2024-03-14', status: 'Discharged', insuranceProvider: 'Aetna' },
  ] as Patient[],
  claims: [
    { id: 'CLM-8832', patientName: 'James Potter', insuranceProvider: 'BlueCross BlueShield', amountClaimed: 1500.00, amountApproved: 1450.00, serviceDate: '2024-03-05', submittedDate: '2024-03-06', receivedDate: '2024-03-12', status: 'Approved' },
    { id: 'CLM-8833', patientName: 'Lily Evans', insuranceProvider: 'Aetna', amountClaimed: 350.00, amountApproved: 350.00, serviceDate: '2024-03-08', submittedDate: '2024-03-09', receivedDate: '2024-03-11', status: 'Approved' },
    { id: 'CLM-8834', patientName: 'Sirius Black', insuranceProvider: 'Cigna', amountClaimed: 12000.00, amountApproved: 0, serviceDate: '2024-03-01', submittedDate: '2024-03-02', receivedDate: undefined, status: 'Pending' },
    { id: 'CLM-8835', patientName: 'Remus Lupin', insuranceProvider: 'BlueCross BlueShield', amountClaimed: 200.00, amountApproved: 0, serviceDate: '2024-02-28', submittedDate: '2024-02-29', receivedDate: '2024-03-05', status: 'Rejected' },
    { id: 'CLM-8836', patientName: 'Peter Pettigrew', insuranceProvider: 'Aetna', amountClaimed: 850.00, amountApproved: undefined, serviceDate: '2024-03-10', submittedDate: '2024-03-11', receivedDate: undefined, status: 'More Info Needed' },
  ] as Claim[],
  publicDoctors: [
    { id: '1', name: 'Dr. Sarah Jenning', specialization: 'Cardiologist', hospital: 'City General Hospital', location: { state: 'CA', city: 'San Francisco', town: 'Mission', address: '123 Mission St' }, rating: 4.9, reviewCount: 120, isVerified: true, imageUrl: 'https://picsum.photos/200/200?random=1', treatments: ['Angioplasty', 'Heart Bypass', 'ECG'], contact: '(555) 123-4567', licenseNumber: 'MD-CA-49210' },
    { id: '2', name: 'Dr. Mark Sloan', specialization: 'Orthopedic', hospital: 'Memorial Sloan', location: { state: 'NY', city: 'New York', town: 'Manhattan', address: '5th Ave, Suite 10' }, rating: 4.7, reviewCount: 85, isVerified: true, imageUrl: 'https://picsum.photos/200/200?random=2', treatments: ['Knee Replacement', 'Fracture Repair'], contact: '(555) 987-6543', licenseNumber: 'MD-NY-99212' },
    { id: '3', name: 'Dr. Emily Chen', specialization: 'Pediatrician', hospital: 'Sunrise Childrens', location: { state: 'CA', city: 'San Francisco', town: 'Sunset', address: '450 Sunset Blvd' }, rating: 4.8, reviewCount: 200, isVerified: true, imageUrl: 'https://picsum.photos/200/200?random=3', treatments: ['Vaccination', 'General Checkup', 'Flu Treatment'], contact: '(555) 321-7654', licenseNumber: 'MD-CA-11234' },
    { id: '4', name: 'Dr. James Wilson', specialization: 'Oncologist', hospital: 'Hope Cancer Center', location: { state: 'TX', city: 'Houston', town: 'Medical Center', address: '777 Hope Ln' }, rating: 4.5, reviewCount: 50, isVerified: false, imageUrl: 'https://picsum.photos/200/200?random=4', treatments: ['Chemotherapy', 'Radiation'], contact: '(555) 444-5555', licenseNumber: 'FLG-TX-00000' }
  ] as Doctor[]
};

class MockBackendService {
  private db: typeof INITIAL_DB_STATE;

  constructor() {
    // Attempt to load from localStorage
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        this.db = JSON.parse(stored);
        // Merge with initial state structure in case of schema updates
        this.db = { ...INITIAL_DB_STATE, ...this.db }; 
      } catch (e) {
        console.error("Failed to parse DB, resetting", e);
        this.db = INITIAL_DB_STATE;
      }
    } else {
      this.db = INITIAL_DB_STATE;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.db));
  }

  private async simulateLatency(ms = 600) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- PUBLIC API METHODS ---

  async getProviders(): Promise<Provider[]> {
    await this.simulateLatency();
    return [...this.db.providers];
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | null> {
    await this.simulateLatency(300);
    const index = this.db.providers.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.db.providers[index] = { ...this.db.providers[index], ...updates };
    this.persist();
    return this.db.providers[index];
  }

  async getEmpanelmentRequests(): Promise<EmpanelmentRequest[]> {
    await this.simulateLatency();
    return [...this.db.empanelmentRequests];
  }

  async updateEmpanelmentRequest(id: string, updates: Partial<EmpanelmentRequest>): Promise<EmpanelmentRequest | null> {
    await this.simulateLatency(300);
    const index = this.db.empanelmentRequests.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    this.db.empanelmentRequests[index] = { ...this.db.empanelmentRequests[index], ...updates };
    this.persist();
    return this.db.empanelmentRequests[index];
  }

  async getPatients(): Promise<Patient[]> {
    await this.simulateLatency();
    return [...this.db.patients];
  }

  async getClaims(): Promise<Claim[]> {
    await this.simulateLatency();
    return [...this.db.claims];
  }

  async getPublicDoctors(userLocation?: { lat: number, lng: number }): Promise<Doctor[]> {
    await this.simulateLatency(400);
    let docs = [...this.db.publicDoctors];

    if (userLocation) {
       docs = docs.map(doc => {
          // Use External Registry for Geocoding (Mock)
          const geo = EXTERNAL_REGISTRIES.GEO_REGISTRY[doc.id as keyof typeof EXTERNAL_REGISTRIES.GEO_REGISTRY];
          if (geo) {
            const dist = this.getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, geo.lat, geo.lng);
            return { ...doc, distance: dist };
          }
          return { ...doc, distance: 99999 };
       }).sort((a: any, b: any) => a.distance - b.distance);
    }
    return docs;
  }

  // Helper
  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Singleton Instance
export const backend = new MockBackendService();

// --- EXPORTED FUNCTIONS (MAPPED TO BACKEND) ---

export const fetchDoctors = async (userLocation?: { lat: number, lng: number }): Promise<Doctor[]> => {
  return backend.getPublicDoctors(userLocation);
};

export const fetchPatients = async (): Promise<Patient[]> => {
  return backend.getPatients();
};

export const fetchClaims = async (): Promise<Claim[]> => {
  return backend.getClaims();
};

export const fetchProviders = async (): Promise<Provider[]> => {
  return backend.getProviders();
};

export const updateProvider = async (id: string, updates: Partial<Provider>): Promise<Provider | null> => {
  return backend.updateProvider(id, updates);
};

export const fetchEmpanelmentRequests = async (): Promise<EmpanelmentRequest[]> => {
  return backend.getEmpanelmentRequests();
};

export const updateEmpanelmentRequest = async (id: string, updates: Partial<EmpanelmentRequest>): Promise<EmpanelmentRequest | null> => {
  return backend.updateEmpanelmentRequest(id, updates);
};

// --- AGENTIC AI & OTHER SERVICES ---

export const runAgenticPipeline = async (provider: { name: string; license: string; type: string; address: string }): Promise<AIVerificationResult> => {
  console.log(`[ORCHESTRATOR] Starting pipeline for: ${provider.name}...`);
  try {
    const npiRecord = EXTERNAL_REGISTRIES.NPI_REGISTRY.find(r => r.name === provider.name);
    const boardRecord = EXTERNAL_REGISTRIES.STATE_BOARDS.find(r => r.license === provider.license);
    const sanctionRecord = EXTERNAL_REGISTRIES.SANCTIONS_LIST.find(r => r.name === provider.name);

    let contextData = "";
    if (sanctionRecord) {
      contextData = `CRITICAL ALERT: Agent 1 found provider in OIG Sanctions List. Reason: "${sanctionRecord.reason}". Agent 2 must FAIL verification immediately.`;
    } else if (!boardRecord) {
      contextData = `ERROR: Agent 1 could not find License "${provider.license}" in State Board Registry. Agent 2 must mark as UNVERIFIED/PENDING.`;
    } else if (boardRecord.status !== 'ACTIVE') {
      contextData = `WARNING: State Board License status is "${boardRecord.status}" (Expired: ${boardRecord.expiry}). Agent 2 must FLAG this provider.`;
    } else if (boardRecord.disciplinaryHistory) {
      contextData = `RISK: Provider has active disciplinary history. Agent 2 should flag for manual review.`;
    } else {
      contextData = `SUCCESS: Agent 1 found valid NPI (${npiRecord?.npi}) and Active State License (${boardRecord.license}). Data matches perfectly. Agent 2 should PASS verification.`;
    }

    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as the "HealthGuard Agentic Orchestrator". Generate a JSON execution log for verifying provider: "${provider.name}".
      Context: ${contextData}
      
      JSON Structure:
      {
        "verified": boolean,
        "confidenceScore": number (0-100),
        "reason": "string",
        "pipelineTrace": [ { "id": "string", "agentName": "string", "role": "string", "status": "completed"|"failed", "logs": ["string"] } ]
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const result = JSON.parse(response.text || '{}');
    
    return {
      verified: result.verified,
      status: result.verified ? 'VERIFIED' : 'FLAGGED',
      confidenceScore: result.confidenceScore || 50,
      reason: result.reason || contextData,
      sourcesChecked: ["NPI Registry", "State Board Database", "OIG Exclusion List"],
      timestamp: new Date().toISOString(),
      pipelineTrace: result.pipelineTrace || []
    };
  } catch (error) {
    console.error("Agentic Pipeline Failed:", error);
    return { verified: false, status: 'PENDING', confidenceScore: 0, reason: "Pipeline Error", sourcesChecked: [], timestamp: new Date().toISOString(), pipelineTrace: [] };
  }
};

export const fetchVerificationHistory = async (providerId: string): Promise<AIVerificationResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const now = Date.now();
  const day = 86400000;
  const isProblematic = providerId === '3' || providerId === 'FLG-TX-00000'; 
  return [
    {
      verified: !isProblematic,
      status: isProblematic ? 'FLAGGED' : 'VERIFIED',
      confidenceScore: isProblematic ? 45 : 99,
      reason: isProblematic ? "Anomaly detected: License status SUSPENDED." : "Routine automated compliance check passed.",
      sourcesChecked: ["Agent 1 (Scraper)", "Agent 2 (RAG)"],
      timestamp: new Date(now - day * 2).toISOString(),
      pipelineTrace: [
        { id: '1', agentName: 'Orchestrator', role: 'Init', status: 'completed', logs: ['Audit Triggered'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '2', agentName: 'Agent 1', role: 'Data Acquisition', status: 'completed', logs: ['Querying NPI Registry', 'Checking State Board'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '3', agentName: 'Agent 2', role: 'Validation', status: isProblematic ? 'failed' : 'completed', logs: isProblematic ? ['CRITICAL: License Suspended'] : ['Data Verified'], timestamp: new Date(now - day * 2).toISOString() }
      ]
    }
  ];
};

export const fetchAvailableInsurers = async () => {
    return [
        { id: 'ins-1', name: 'Humana', tier: 'Standard' },
        { id: 'ins-2', name: 'Kaiser Permanente', tier: 'Preferred' },
        { id: 'ins-3', name: 'Anthem', tier: 'Standard' }
    ];
};

export const fetchAppNotifications = async (role: UserRole): Promise<AppNotification[]> => {
  // Using backend for persistent notifications would be ideal, but for now we simulate role-based logic
  await new Promise(resolve => setTimeout(resolve, 500));
  if (role === UserRole.INSURANCE) {
    return [
      { id: 'n1', category: 'flag', type: 'error', title: 'License Suspension Detected', message: 'Dr. James Wilson has been flagged by the Agentic Monitor.', timestamp: '2 mins ago', read: false },
      { id: 'n2', category: 'flag', type: 'warning', title: 'Unusual Claim Volume', message: 'Memorial Sloan Hospital reported 200% spike in claims.', timestamp: '1 hour ago', read: false },
      { id: 'n3', category: 'notification', type: 'info', title: 'New Empanelment Request', message: 'Westside Community Clinic requested to join the network.', timestamp: '3 hours ago', read: false },
    ];
  } else if (role === UserRole.PROVIDER) {
    return [
      { id: 'n1', category: 'notification', type: 'success', title: 'Claim Approved', message: 'Claim #CLM-8832 for James Potter has been approved.', timestamp: '10 mins ago', read: false },
    ];
  }
  return [];
};

export const runPeriodicComplianceCheck = async (): Promise<AIAlert[]> => {
  return [{ id: 'alert-1', severity: 'HIGH', message: 'License Suspension Detected', date: new Date().toISOString(), providerName: 'Dr. James Wilson' }];
};

export const verifyEntity = async (entityId: string, type: 'Doctor' | 'Hospital'): Promise<boolean> => { return true; };
export const getRiskProfile = async (entityId: string): Promise<RiskProfile> => {
  return { id: entityId, entityName: "Sample Provider", type: 'Doctor', riskLevel: 'LOW', lastAudit: new Date().toISOString().split('T')[0], flaggedIncidents: 0 };
};
export const sendMessage = async (recipientId: string, message: string): Promise<boolean> => { return true; };
