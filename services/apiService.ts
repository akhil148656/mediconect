import { Doctor, RiskProfile, AIVerificationResult, AIAlert, PipelineStep, Patient, Claim } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * ORCHESTRATOR: Agentic Pipeline Runner
 * Coordinates Agent 1 (Acquisition) -> Agent 2 (Validation) -> Data Store -> API
 */
export const runAgenticPipeline = async (provider: { name: string; license: string; type: string; address: string }): Promise<AIVerificationResult> => {
  console.log(`[ORCHESTRATOR] Starting pipeline for: ${provider.name}...`);
  
  try {
    const model = 'gemini-2.5-flash';
    // We ask Gemini to generate the execution log of the pipeline steps defined in the architecture
    const prompt = `
      Simulate a complex "Agentic AI Healthcare Verification Pipeline" execution for provider: "${provider.name}" (License: ${provider.license}).
      
      The pipeline has these specific components:
      1. Agentic AI (Orchestrator): Coordinates tasks.
      2. Agent 1 (Data Acquisition): Uses "Web Scraper" and "OCR Engine" to find raw data. It queries the NPI Registry (NPPES), scrapes the specific State Medical Board portal based on the address "${provider.address}", and downloads verification documents.
      3. Agent 2 (Validation & Sync): Uses "RAG Retriever", "Validator", and "Diff Engine".
      4. Data Store: Writes versioned records (Audit/Rollback).
      5. Update API: Syncs to Payer Systems.
      6. Error Sentinel: Logs exceptions.

      Generate a JSON response representing the step-by-step execution logs.
      
      If License starts with "FLG", simulate a failure/anomaly in Agent 2 (Validation).
      Otherwise, simulate a success.

      JSON Structure:
      {
        "verified": boolean,
        "confidenceScore": number (0-100),
        "reason": "Summary string",
        "pipelineTrace": [
           {
             "id": "1",
             "agentName": "Agentic AI (Orchestrator)",
             "role": "Orchestrator",
             "status": "completed",
             "logs": ["Init pipeline", "Routing to Agent 1 for data gathering..."],
             "timestamp": "ISO string"
           },
           {
             "id": "2",
             "agentName": "Agent 1",
             "role": "Data Acquisition (Scraper + OCR)",
             "status": "completed",
             "logs": [
                "Initializing secure scraper instance...",
                "Querying National Plan and Provider Enumeration System (NPPES)...",
                "Connected to State Medical Board Portal...",
                "Fetching provider profile for license ${provider.license}...",
                "Downloading Primary Source Verification (PSV) document...",
                "OCR Engine: Extracting text from license image...",
                "Data Acquired: Matches found in 2 external registries."
             ],
             "timestamp": "ISO string"
           },
           {
             "id": "3",
             "agentName": "Agent 2",
             "role": "Validation & Sync (RAG + Diff)",
             "status": "completed" | "failed",
             "logs": ["RAG Retrieving context...", "Validating against NPI registry...", "Diff Engine: No changes detected."],
             "timestamp": "ISO string"
           },
           {
             "id": "4",
             "agentName": "Data Store",
             "role": "Persistence",
             "status": "completed",
             "logs": ["Creating immutable record v1.0.4", "Audit trail updated."],
             "timestamp": "ISO string"
           },
           {
             "id": "5",
             "agentName": "Update API",
             "role": "Payer System Sync",
             "status": "completed",
             "logs": ["Pushing update to Legacy Payer DB...", "Sync acknowledged (200 OK)."],
             "timestamp": "ISO string"
           }
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
      verified: result.verified ?? true,
      status: result.verified ? 'VERIFIED' : 'FLAGGED',
      confidenceScore: result.confidenceScore || 92,
      reason: result.reason || "Pipeline execution successful.",
      sourcesChecked: ["State Board OCR", "NPI Registry (RAG)", "Payer DB"],
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

  // Mock varied history based on ID odd/even to make it look realistic
  const isProblematic = parseInt(providerId) % 2 !== 0; 

  const history: AIVerificationResult[] = [
    {
      verified: !isProblematic, // Most recent check
      status: isProblematic ? 'FLAGGED' : 'VERIFIED',
      confidenceScore: isProblematic ? 45 : 98,
      reason: isProblematic ? "Anomaly detected: Address mismatch with State Board records." : "Routine automated compliance check passed.",
      sourcesChecked: ["Agent 1 (Scraper)", "Agent 2 (RAG)"],
      timestamp: new Date(now - day * 2).toISOString(), // 2 days ago
      pipelineTrace: [
        { id: '1', agentName: 'Orchestrator', role: 'Init', status: 'completed', logs: ['Scheduled Audit Triggered'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '2', agentName: 'Agent 1', role: 'Data Acquisition', status: 'completed', logs: ['Fetching latest NPI data', 'Scraping State Board'], timestamp: new Date(now - day * 2).toISOString() },
        { id: '3', agentName: 'Agent 2', role: 'Validation', status: isProblematic ? 'failed' : 'completed', logs: isProblematic ? ['Mismatch found in Address field'] : ['Data consistency verified'], timestamp: new Date(now - day * 2).toISOString() }
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
    },
    {
      verified: true,
      status: 'VERIFIED',
      confidenceScore: 99,
      reason: "Initial Onboarding Verification.",
      sourcesChecked: ["OCR", "Manual Review", "NPI Registry"],
      timestamp: new Date(now - day * 180).toISOString(), // ~6 months ago
      pipelineTrace: []
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
      Generate 2 compliance alerts.
      1. Address Mismatch (Confidence: Low).
      2. License Expiry (Confidence: High).
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

export const fetchDoctors = async (): Promise<Doctor[]> => {
  return [
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
      licenseNumber: 'FLG-TX-00000' // Flagged for demo
    }
  ];
};