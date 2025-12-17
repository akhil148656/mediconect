import { Doctor, RiskProfile, AIVerificationResult, AIAlert, PipelineStep, Patient, Claim } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK EXTERNAL DATABASES (SIMULATION) ---
// These act as the "Ground Truth" for the Agentic AI to query against.

const MOCK_DATABASE = {
  // National Plan and Provider Enumeration System
  NPI_REGISTRY: [
    { npi: '1592837461', name: 'Dr. Sarah Jenning', status: 'ACTIVE', type: 'Doctor', address: '123 Mission St, CA', lastUpdated: '2024-01-10' },
    { npi: '1928374650', name: 'City General Hospital', status: 'ACTIVE', type: 'Hospital', address: '100 Main St, CA', lastUpdated: '2023-11-05' },
    { npi: '9988776655', name: 'Dr. James Wilson', status: 'ACTIVE', type: 'Doctor', address: '777 Hope Ln, TX', lastUpdated: '2023-08-15' }, // Valid NPI, but check boards
    { npi: '5544332211', name: 'Memorial Sloan', status: 'ACTIVE', type: 'Hospital', address: '5th Ave, NY', lastUpdated: '2024-02-01' }
  ],

  // State Licensing Boards
  STATE_BOARDS: [
    { license: 'MD-CA-49210', name: 'Dr. Sarah Jenning', state: 'CA', status: 'ACTIVE', expiry: '2026-05-20', disciplinaryHistory: false },
    { license: 'HOSP-CA-1111', name: 'City General Hospital', state: 'CA', status: 'ACTIVE', expiry: '2030-01-01', disciplinaryHistory: false },
    { license: 'HOSP-NY-2222', name: 'Memorial Sloan', state: 'NY', status: 'ACTIVE', expiry: '2028-11-15', disciplinaryHistory: false },
    // FLAGGED PROVIDER: Suspended License
    { license: 'FLG-TX-00000', name: 'Dr. James Wilson', state: 'TX', status: 'SUSPENDED', expiry: '2023-12-31', disciplinaryHistory: true } 
  ],

  // Office of Inspector General (OIG) Exclusions
  SANCTIONS_LIST: [
    { name: 'Dr. James Wilson', reason: 'Billing Fraud - Level 2', date: '2024-01-15', source: 'OIG' }
  ],

  // Geospatial Registry (Simulating Google Maps / Location DB)
  GEO_REGISTRY: {
    '1': { lat: 37.76, lng: -122.42, zone: 'San Francisco' }, // Mission St
    '2': { lat: 40.78, lng: -73.97, zone: 'New York' },       // Manhattan
    '3': { lat: 37.75, lng: -122.48, zone: 'San Francisco' }, // Sunset
    '4': { lat: 29.76, lng: -95.36, zone: 'Houston' }         // Houston
  }
};

/**
 * ORCHESTRATOR: Agentic Pipeline Runner
 * Logic:
 * 1. Orchestrator receives request.
 * 2. Agent 1 queries MOCK_DATABASE (simulating Scraper/API).
 * 3. Agent 2 compares results.
 * 4. LLM generates the realistic logs based on this context.
 */
export const runAgenticPipeline = async (provider: { name: string; license: string; type: string; address: string }): Promise<AIVerificationResult> => {
  console.log(`[ORCHESTRATOR] Starting pipeline for: ${provider.name}...`);
  
  try {
    // 1. DATA ACQUISITION LAYER (Simulated)
    // We look up the provider in our mock DBs to see what the agents "find".
    const npiRecord = MOCK_DATABASE.NPI_REGISTRY.find(r => r.name === provider.name);
    const boardRecord = MOCK_DATABASE.STATE_BOARDS.find(r => r.license === provider.license);
    const sanctionRecord = MOCK_DATABASE.SANCTIONS_LIST.find(r => r.name === provider.name);

    // 2. CONSTRUCT CONTEXT FOR AI
    let contextData = "";
    let expectedStatus = "VERIFIED";

    if (sanctionRecord) {
      contextData = `CRITICAL ALERT: Agent 1 found provider in OIG Sanctions List. Reason: "${sanctionRecord.reason}". Agent 2 must FAIL verification immediately.`;
      expectedStatus = "FLAGGED";
    } else if (!boardRecord) {
      contextData = `ERROR: Agent 1 could not find License "${provider.license}" in State Board Registry. Agent 2 must mark as UNVERIFIED/PENDING.`;
      expectedStatus = "PENDING";
    } else if (boardRecord.status !== 'ACTIVE') {
      contextData = `WARNING: State Board License status is "${boardRecord.status}" (Expired: ${boardRecord.expiry}). Agent 2 must FLAG this provider.`;
      expectedStatus = "FLAGGED";
    } else if (boardRecord.disciplinaryHistory) {
      contextData = `RISK: Provider has active disciplinary history. Agent 2 should flag for manual review.`;
      expectedStatus = "FLAGGED";
    } else {
      contextData = `SUCCESS: Agent 1 found valid NPI (${npiRecord?.npi}) and Active State License (${boardRecord.license}). Data matches perfectly. Agent 2 should PASS verification.`;
      expectedStatus = "VERIFIED";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as the "HealthGuard Agentic Orchestrator". Generate a JSON execution log for verifying provider: "${provider.name}".
      
      You are running a real-time simulation based on this retrieved ground-truth data:
      ${contextData}
      
      The pipeline has these components:
      1. **Agent 1 (Acquisition)**: Queries NPI Registry & State Boards.
      2. **Agent 2 (Validation)**: Validates compliance & checks Sanctions.
      3. **Data Store**: Saves the result.

      Generate a JSON response reflecting the EXACT outcome described in the data above.
      
      JSON Structure:
      {
        "verified": boolean,
        "confidenceScore": number (0-100),
        "reason": "Technical reason based on the data context",
        "pipelineTrace": [
           {
             "id": "1",
             "agentName": "Agentic AI (Orchestrator)",
             "role": "Orchestrator",
             "status": "completed",
             "logs": ["Init pipeline", "Dispatching Agent 1..."],
             "timestamp": "ISO string"
           },
           {
             "id": "2",
             "agentName": "Agent 1",
             "role": "Data Acquisition",
             "status": "completed",
             "logs": [
                "Querying NPI Registry...",
                "Scraping State Board Portal...",
                "Downloading PSV Documents...",
                "OCR processing complete."
             ],
             "timestamp": "ISO string"
           },
           {
             "id": "3",
             "agentName": "Agent 2",
             "role": "Validation",
             "status": "completed" | "failed",
             "logs": ["Checking OIG Exclusions...", "Validating License Status...", "Cross-referencing address..."],
             "timestamp": "ISO string"
           },
           // ... Data Store & API steps
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    
    return {
      verified: result.verified,
      status: result.verified ? 'VERIFIED' : 'FLAGGED',
      confidenceScore: result.confidenceScore || (expectedStatus === 'VERIFIED' ? 98 : 45),
      reason: result.reason || contextData,
      sourcesChecked: ["NPI Registry", "State Board Database", "OIG Exclusion List"],
      timestamp: new Date().toISOString(),
      pipelineTrace: result.pipelineTrace || []
    };

  } catch (error) {
    console.error("Agentic Pipeline Failed:", error);
    return {
      verified: false,
      status: 'PENDING',
      confidenceScore: 0,
      reason: "Orchestrator Error: Pipeline failed to initialize.",
      sourcesChecked: [],
      timestamp: new Date().toISOString(),
      pipelineTrace: []
    };
  }
};

export const fetchVerificationHistory = async (providerId: string): Promise<AIVerificationResult[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const now = Date.now();
  const day = 86400000;

  // Mock varied history based on ID
  // ID 1 = Sarah (Good), ID 3 = James (Bad)
  const isProblematic = providerId === '3' || providerId === 'FLG-TX-00000'; 

  const history: AIVerificationResult[] = [
    {
      verified: !isProblematic, // Most recent check
      status: isProblematic ? 'FLAGGED' : 'VERIFIED',
      confidenceScore: isProblematic ? 45 : 99,
      reason: isProblematic ? "Anomaly detected: License status SUSPENDED in State Board Registry." : "Routine automated compliance check passed. All credentials active.",
      sourcesChecked: ["Agent 1 (Scraper)", "Agent 2 (RAG)"],
      timestamp: new Date(now - day * 2).toISOString(), // 2 days ago
      pipelineTrace: [
        { id: '1', agentName: 'Orchestrator', role: 'Init', status: 'completed', logs: ['Scheduled Audit Triggered'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '2', agentName: 'Agent 1', role: 'Data Acquisition', status: 'completed', logs: ['Fetching latest NPI data', 'Scraping State Board'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '3', agentName: 'Agent 2', role: 'Validation', status: isProblematic ? 'failed' : 'completed', logs: isProblematic ? ['CRITICAL: License Suspended found'] : ['Data consistency verified'], timestamp: new Date(now - day * 2).toISOString() }
      ]
    },
    {
      verified: true,
      status: 'VERIFIED',
      confidenceScore: 96,
      reason: "Monthly verification cycle complete.",
      sourcesChecked: ["NPI Registry"],
      timestamp: new Date(now - day * 32).toISOString(), // ~1 month ago
      pipelineTrace: [
        { id: '1', agentName: 'Orchestrator', role: 'Init', status: 'completed', logs: ['Monthly Cycle'], timestamp: new Date(now - day * 32).toISOString() },
        { id: '2', agentName: 'Agent 2', role: 'Validation', status: 'completed', logs: ['No changes detected since last sync'], timestamp: new Date(now - day * 32).toISOString() }
      ]
    }
  ];

  return history;
};

// --- New Provider Functions ---

export const fetchPatients = async (): Promise<Patient[]> => {
  return [
    { id: 'P-101', name: 'James Potter', age: 45, gender: 'Male', condition: 'Hypertension', lastVisit: '2024-03-10', status: 'Outpatient', insuranceProvider: 'BlueCross' },
    { id: 'P-102', name: 'Lily Evans', age: 42, gender: 'Female', condition: 'Migraine', lastVisit: '2024-03-12', status: 'Outpatient', insuranceProvider: 'Aetna' },
    { id: 'P-103', name: 'Sirius Black', age: 46, gender: 'Male', condition: 'Post-Op Recovery', lastVisit: '2024-03-08', status: 'Admitted', insuranceProvider: 'Cigna' },
    { id: 'P-104', name: 'Remus Lupin', age: 45, gender: 'Male', condition: 'Chronic Fatigue', lastVisit: '2024-03-01', status: 'Outpatient', insuranceProvider: 'BlueCross' },
    { id: 'P-105', name: 'Nymphadora Tonks', age: 35, gender: 'Female', condition: 'Flu', lastVisit: '2024-03-14', status: 'Discharged', insuranceProvider: 'Aetna' },
  ];
};

export const fetchClaims = async (): Promise<Claim[]> => {
  return [
    { 
      id: 'CLM-8832', patientName: 'James Potter', insuranceProvider: 'BlueCross BlueShield', 
      amountClaimed: 1500.00, amountApproved: 1450.00, 
      serviceDate: '2024-03-05', submittedDate: '2024-03-06', receivedDate: '2024-03-12', 
      status: 'Approved' 
    },
    { 
      id: 'CLM-8833', patientName: 'Lily Evans', insuranceProvider: 'Aetna', 
      amountClaimed: 350.00, amountApproved: 350.00, 
      serviceDate: '2024-03-08', submittedDate: '2024-03-09', receivedDate: '2024-03-11', 
      status: 'Approved' 
    },
    { 
      id: 'CLM-8834', patientName: 'Sirius Black', insuranceProvider: 'Cigna', 
      amountClaimed: 12000.00, amountApproved: 0, 
      serviceDate: '2024-03-01', submittedDate: '2024-03-02', receivedDate: undefined, 
      status: 'Pending' 
    },
    { 
      id: 'CLM-8835', patientName: 'Remus Lupin', insuranceProvider: 'BlueCross BlueShield', 
      amountClaimed: 200.00, amountApproved: 0, 
      serviceDate: '2024-02-28', submittedDate: '2024-02-29', receivedDate: '2024-03-05', 
      status: 'Rejected' 
    },
    { 
      id: 'CLM-8836', patientName: 'Peter Pettigrew', insuranceProvider: 'Aetna', 
      amountClaimed: 850.00, amountApproved: undefined, 
      serviceDate: '2024-03-10', submittedDate: '2024-03-11', receivedDate: undefined, 
      status: 'More Info Needed' 
    },
  ];
};

export const fetchAvailableInsurers = async () => {
    return [
        { id: 'ins-1', name: 'Humana', tier: 'Standard' },
        { id: 'ins-2', name: 'Kaiser Permanente', tier: 'Preferred' },
        { id: 'ins-3', name: 'Anthem', tier: 'Standard' }
    ];
};


/**
 * OLDER FUNCTIONS KEPT FOR COMPATIBILITY / MOCKING
 */

// Legacy function mapped to new pipeline for compatibility
export const verifyProviderWithAI = runAgenticPipeline; 

export const runPeriodicComplianceCheck = async (): Promise<AIAlert[]> => {
  try {
    const prompt = `
      Act as Agent 2 (Validation & Sync). 
      Generate 2 compliance alerts based on the Mock Database state.
      1. Alert for "Dr. James Wilson" regarding "License Suspension".
      2. Alert for "Memorial Sloan" regarding "Address Mismatch".
      Return JSON: [{ "severity": "HIGH"|"MEDIUM"|"LOW", "message": "string", "providerName": "string" }]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const alerts = JSON.parse(response.text || '[]');
    return alerts.map((a: any, i: number) => ({
      id: `alert-${Date.now()}-${i}`,
      date: new Date().toISOString(),
      ...a
    }));

  } catch (e) {
    return [];
  }
};

export const verifyEntity = async (entityId: string, type: 'Doctor' | 'Hospital'): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true; 
};

export const getRiskProfile = async (entityId: string): Promise<RiskProfile> => {
  return {
    id: entityId,
    entityName: "Sample Provider",
    type: 'Doctor',
    riskLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
    lastAudit: new Date().toISOString().split('T')[0],
    flaggedIncidents: Math.floor(Math.random() * 5)
  };
};

export const sendMessage = async (recipientId: string, message: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Calculate Haversine distance
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const fetchDoctors = async (userLocation?: { lat: number, lng: number }): Promise<Doctor[]> => {
  // Base doctors list
  const doctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Jenning',
      specialization: 'Cardiologist',
      hospital: 'City General Hospital',
      location: { state: 'CA', city: 'San Francisco', town: 'Mission', address: '123 Mission St' },
      rating: 4.9,
      reviewCount: 120,
      isVerified: true,
      imageUrl: 'https://picsum.photos/200/200?random=1',
      treatments: ['Angioplasty', 'Heart Bypass', 'ECG'],
      contact: '(555) 123-4567',
      licenseNumber: 'MD-CA-49210'
    },
    {
      id: '2',
      name: 'Dr. Mark Sloan',
      specialization: 'Orthopedic',
      hospital: 'Memorial Sloan',
      location: { state: 'NY', city: 'New York', town: 'Manhattan', address: '5th Ave, Suite 10' },
      rating: 4.7,
      reviewCount: 85,
      isVerified: true,
      imageUrl: 'https://picsum.photos/200/200?random=2',
      treatments: ['Knee Replacement', 'Fracture Repair'],
      contact: '(555) 987-6543',
      licenseNumber: 'MD-NY-99212'
    },
    {
      id: '3',
      name: 'Dr. Emily Chen',
      specialization: 'Pediatrician',
      hospital: 'Sunrise Childrens',
      location: { state: 'CA', city: 'San Francisco', town: 'Sunset', address: '450 Sunset Blvd' },
      rating: 4.8,
      reviewCount: 200,
      isVerified: true,
      imageUrl: 'https://picsum.photos/200/200?random=3',
      treatments: ['Vaccination', 'General Checkup', 'Flu Treatment'],
      contact: '(555) 321-7654',
      licenseNumber: 'MD-CA-11234'
    },
     {
      id: '4',
      name: 'Dr. James Wilson',
      specialization: 'Oncologist',
      hospital: 'Hope Cancer Center',
      location: { state: 'TX', city: 'Houston', town: 'Medical Center', address: '777 Hope Ln' },
      rating: 4.5,
      reviewCount: 50,
      isVerified: false,
      imageUrl: 'https://picsum.photos/200/200?random=4',
      treatments: ['Chemotherapy', 'Radiation'],
      contact: '(555) 444-5555',
      licenseNumber: 'FLG-TX-00000'
    }
  ];

  // If user provides location, sort results by simulated distance
  if (userLocation) {
    // Map existing doctors to mock coordinates from GEO_REGISTRY
    const doctorsWithDistance = doctors.map(doc => {
      const geo = MOCK_DATABASE.GEO_REGISTRY[doc.id as keyof typeof MOCK_DATABASE.GEO_REGISTRY];
      if (geo) {
        const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, geo.lat, geo.lng);
        return { ...doc, distance: dist };
      }
      return { ...doc, distance: 99999 }; // Unknown locations go to bottom
    });

    // Sort: Nearest first
    doctorsWithDistance.sort((a, b) => a.distance - b.distance);
    return doctorsWithDistance;
  }

  return doctors;
};