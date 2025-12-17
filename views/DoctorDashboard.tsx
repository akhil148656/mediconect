import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, CheckSquare, Clock, Plus, Building, UserPlus, 
  BedDouble, Stethoscope, ShieldCheck, DollarSign, Calendar, Search, 
  ChevronRight, AlertCircle, FileText, Send, X, Phone, MapPin,
  Filter, Download, Settings, ChevronDown
} from 'lucide-react';
import { UserRole, Patient, Claim } from '../types';
import { fetchPatients, fetchClaims, sendMessage, fetchAvailableInsurers } from '../services/apiService';

interface DoctorDashboardProps {
  role: UserRole;
  currentView: string;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ role, currentView }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  // Modals State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [selectedInsurer, setSelectedInsurer] = useState<any | null>(null);
  const [availableInsurers, setAvailableInsurers] = useState<any[]>([]);

  
  const [connectedInsurers, setConnectedInsurers] = useState([
    { name: 'BlueCross BlueShield', status: 'Active', tier: 'Gold', patients: 124 },
    { name: 'Aetna', status: 'Active', tier: 'Silver', patients: 85 },
    { name: 'Cigna', status: 'Pending Review', tier: '-', patients: 0 },
    { name: 'UnitedHealthcare', status: 'Active', tier: 'Gold', patients: 200 },
  ]);

  useEffect(() => {
    // Load mock data
    fetchPatients().then(setPatients);
    fetchClaims().then(setClaims);
    fetchAvailableInsurers().then(setAvailableInsurers);
  }, []);

  // Combined stats for unified provider portal
  const dashboardStats = [
     { label: 'Total Patients', value: '1,248', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
     { label: 'Active Admissions', value: '42', icon: BedDouble, color: 'text-purple-600', bg: 'bg-purple-50' },
     { label: 'Surgeries/Procedures', value: '18', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
     { label: 'Claims Pending', value: '14', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' }
  ];

  const handleSendMessage = async () => {
    if(!messageInput) return;
    await sendMessage('admin', messageInput);
    setMessageInput('');
    alert("Message sent to Insurance Payer (Simulated)");
  };

  const handleRequestPartnership = (insurerName: string) => {
    alert(`Partnership request sent to ${insurerName}`);
    setShowPartnershipModal(false);
  };

  // --- MODAL COMPONENTS ---

  const PatientDetailsModal = () => {
    if (!selectedPatient) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Patient Profile</h3>
            <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <div className="p-6">
             <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
                   {selectedPatient.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h2>
                   <p className="text-slate-500">{selectedPatient.age} years • {selectedPatient.gender}</p>
                   <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-100">{selectedPatient.insuranceProvider}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold border border-slate-200">ID: {selectedPatient.id}</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Current Condition</p>
                   <p className="font-medium text-slate-900">{selectedPatient.condition}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Last Visit</p>
                   <p className="font-medium text-slate-900">{selectedPatient.lastVisit}</p>
                </div>
             </div>
             
             <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Recent Medical Notes</h4>
             <ul className="space-y-3 text-sm text-slate-600 mb-6">
                <li className="flex gap-2"><span className="text-slate-400">•</span> Patient reported mild symptoms improvement.</li>
                <li className="flex gap-2"><span className="text-slate-400">•</span> Prescribed medication adjusted for better tolerance.</li>
                <li className="flex gap-2"><span className="text-slate-400">•</span> Follow-up scheduled in 2 weeks.</li>
             </ul>

             <div className="flex justify-end gap-3">
                <button className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">History</button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">Update Record</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const FinancialReportModal = () => (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                 <h3 className="font-bold text-slate-800 text-lg">Detailed Financial Report</h3>
                 <p className="text-xs text-slate-500">Claims Settlement & Reconciliation</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
           </div>
           
           <div className="p-4 bg-white border-b border-slate-100 flex gap-4 items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                 <Calendar size={16} />
                 <span>Last 30 Days</span>
                 <ChevronDown size={14} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                 <Filter size={16} />
                 <span>All Payers</span>
              </div>
              <div className="flex-grow"></div>
              <button className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">
                 <Download size={16} /> Export CSV
              </button>
           </div>

           <div className="flex-grow overflow-auto p-0">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm">
                    <tr>
                       <th className="px-6 py-3 font-semibold">Claim ID</th>
                       <th className="px-6 py-3 font-semibold">Patient</th>
                       <th className="px-6 py-3 font-semibold">Submitted</th>
                       <th className="px-6 py-3 font-semibold">Settled/Received</th>
                       <th className="px-6 py-3 font-semibold text-right">Claimed</th>
                       <th className="px-6 py-3 font-semibold text-right">Settled</th>
                       <th className="px-6 py-3 font-semibold text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {claims.map((claim) => (
                       <tr key={claim.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-mono text-slate-500">{claim.id}</td>
                          <td className="px-6 py-3 font-medium text-slate-900">{claim.patientName}</td>
                          <td className="px-6 py-3 text-slate-600">{claim.submittedDate}</td>
                          <td className="px-6 py-3 text-slate-600">{claim.receivedDate || '-'}</td>
                          <td className="px-6 py-3 text-right text-slate-900">${claim.amountClaimed.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-emerald-600 font-medium">
                             {claim.amountApproved ? `$${claim.amountApproved.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-3 text-center">
                             <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                claim.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                             }`}>{claim.status}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm text-slate-600">
              <p>Showing {claims.length} records</p>
              <div className="flex gap-4">
                 <p>Total Claimed: <span className="font-bold text-slate-900">$14,900</span></p>
                 <p>Total Settled: <span className="font-bold text-emerald-600">$1,800</span></p>
              </div>
           </div>
        </div>
     </div>
  );

  const NewPartnershipModal = () => (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Request Partnership</h3>
              <button onClick={() => setShowPartnershipModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
           </div>
           <div className="p-6 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Select Insurance Payer</label>
                 <select className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                    <option>-- Select Payer --</option>
                    {availableInsurers.map(ins => <option key={ins.id}>{ins.name} ({ins.tier})</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
                 <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                    placeholder="We are interested in joining your provider network..."
                 ></textarea>
              </div>
              <button 
                 onClick={() => handleRequestPartnership("Selected Payer")}
                 className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-md"
              >
                 Send Request
              </button>
           </div>
        </div>
     </div>
  );

  const ManageInsurerModal = () => {
    if(!selectedInsurer) return null;
    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><Building size={16}/></div>
                   <h3 className="font-bold text-slate-800">{selectedInsurer.name}</h3>
                </div>
                <button onClick={() => setSelectedInsurer(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className="text-sm font-semibold text-emerald-600">{selectedInsurer.status}</span>
                   </div>
                   <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-500">Tier Level</span>
                      <span className="text-sm font-semibold text-slate-800">{selectedInsurer.tier}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Patients Linked</span>
                      <span className="text-sm font-semibold text-slate-800">{selectedInsurer.patients}</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <button className="flex items-center justify-center gap-2 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium">
                      <FileText size={16} /> View Contract
                   </button>
                   <button className="flex items-center justify-center gap-2 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium">
                      <Settings size={16} /> Settings
                   </button>
                </div>
                
                <button className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-100">
                   Terminate Partnership
                </button>
             </div>
          </div>
       </div>
    );
  };

  // --- RENDER VIEWS ---

  const renderDashboardOverview = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* AI Compliance Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-full shadow-sm">
               <ShieldCheck className="text-emerald-600" size={24} />
            </div>
            <div>
               <h3 className="font-bold text-emerald-900">Compliance Status: Verified by AI</h3>
               <p className="text-sm text-emerald-700">Last audit: Today. Your practice data matches State Medical Board records.</p>
            </div>
         </div>
         <span className="px-3 py-1 bg-white text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 shadow-sm uppercase">
            Active
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
              <div>
                 <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                 <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Detailed Claims History Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <Calendar className="text-slate-500" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Claims History & Financial Timeline</h3>
                 </div>
                 <button 
                    onClick={() => setShowReportModal(true)}
                    className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
                 >
                    View Full Report <ChevronRight size={14} />
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                       <tr>
                          <th className="px-6 py-3">Claim ID / Patient</th>
                          <th className="px-6 py-3">Dates (Req / Rec)</th>
                          <th className="px-6 py-3">Insurer</th>
                          <th className="px-6 py-3 text-right">Amount Claimed</th>
                          <th className="px-6 py-3 text-right">Approved</th>
                          <th className="px-6 py-3 text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                       {claims.slice(0, 5).map((claim) => (
                          <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                                <p className="font-mono text-xs text-slate-400 mb-0.5">{claim.id}</p>
                                <p className="font-medium text-slate-900">{claim.patientName}</p>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                   <span className="flex items-center gap-1 text-slate-600" title="Submitted Date">
                                      <Send size={12} /> {claim.submittedDate}
                                   </span>
                                   {claim.receivedDate ? (
                                      <span className="flex items-center gap-1 text-emerald-600" title="Received/Settled Date">
                                         <CheckSquare size={12} /> {claim.receivedDate}
                                      </span>
                                   ) : (
                                      <span className="flex items-center gap-1 text-amber-500 italic" title="Pending">
                                         <Clock size={12} /> Pending
                                      </span>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-slate-600">{claim.insuranceProvider}</td>
                             <td className="px-6 py-4 text-right font-medium text-slate-900">${claim.amountClaimed.toLocaleString()}</td>
                             <td className="px-6 py-4 text-right">
                                {claim.amountApproved !== undefined ? (
                                   <span className="font-bold text-emerald-600">${claim.amountApproved.toLocaleString()}</span>
                                ) : (
                                   <span className="text-slate-400">-</span>
                                )}
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                   claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                   claim.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                   claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                   'bg-blue-100 text-blue-800'
                                }`}>
                                   {claim.status}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Recent Admissions (Existing) */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4">
                Recent Patient Activity
             </h3>
             <div className="space-y-4">
                {patients.slice(0, 3).map((p) => (
                   <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPatient(p)}>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                            {p.name.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900">{p.name}</p>
                           <p className="text-xs text-slate-500">{p.status} - {p.condition}</p>
                         </div>
                      </div>
                      <span className="text-sm font-medium text-secondary-600">Last visit: {p.lastVisit}</span>
                   </div>
                ))}
             </div>
           </div>
        </div>

        {/* Quick Actions / Partners */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setShowReportModal(true)}>
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-indigo-600 font-medium">Claims Value</span>
                       <DollarSign className="text-indigo-600" size={18} />
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">$14,500</p>
                    <p className="text-xs text-indigo-700 mt-1">Pending this month</p>
                 </div>
                 <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-purple-600 font-medium">Approval Rate</span>
                       <Activity className="text-purple-600" size={18} />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">92%</p>
                    <p className="text-xs text-purple-700 mt-1">Top 5% in region</p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Top Insurance Partners</h3>
              <div className="space-y-3">
                {connectedInsurers.slice(0, 3).map(ins => (
                  <div 
                    key={ins.name} 
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
                    onClick={() => setSelectedInsurer(ins)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 p-2 rounded text-primary-600">
                        <Building size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{ins.name}</p>
                        <p className="text-xs text-slate-500">{ins.tier} Tier</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ins.status === 'Active' ? 'bg-secondary-50 text-secondary-600' : 'bg-amber-50 text-amber-600'}`}>
                      {ins.status}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPatientsView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 animate-fadeIn">
       <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">My Patients</h2>
          <div className="relative">
             <input type="text" placeholder="Search patients..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                   <th className="px-6 py-4">Name / ID</th>
                   <th className="px-6 py-4">Demographics</th>
                   <th className="px-6 py-4">Condition</th>
                   <th className="px-6 py-4">Insurance</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map(patient => (
                   <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="font-semibold text-slate-900">{patient.name}</p>
                         <p className="text-xs text-slate-500">{patient.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                         {patient.age} yrs • {patient.gender}
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {patient.condition}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{patient.insuranceProvider}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            patient.status === 'Admitted' ? 'bg-red-100 text-red-700' :
                            patient.status === 'Discharged' ? 'bg-slate-100 text-slate-700' :
                            'bg-green-100 text-green-700'
                         }`}>
                            {patient.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setSelectedPatient(patient)}
                            className="text-primary-600 hover:text-primary-800 font-medium text-sm border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded transition-all"
                         >
                            View Details
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderInsuranceView = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Connected Insurance Providers</h2>
          <button 
             onClick={() => setShowPartnershipModal(true)}
             className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
             <Plus size={18} /> New Partnership
          </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedInsurers.map((ins, idx) => (
             <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                   <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                      <Building size={24} />
                   </div>
                   <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                      ins.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                   }`}>
                      {ins.status}
                   </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{ins.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{ins.tier} Tier Partner</p>
                
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm">
                   <span className="text-slate-500">{ins.patients} Patients Linked</span>
                   <button 
                      onClick={() => setSelectedInsurer(ins)}
                      className="text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                   >
                      Manage <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderMessagesView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[600px] flex flex-col animate-fadeIn">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
         <div>
            <h3 className="font-bold text-slate-800">Payer Communication</h3>
            <p className="text-xs text-slate-500">Secure Direct Line</p>
         </div>
         <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
         </div>
      </div>
      <div className="flex-grow p-6 overflow-y-auto bg-slate-50 space-y-4">
        {/* Mock Chat History */}
        <div className="flex justify-start">
           <div className="bg-white border border-slate-200 text-slate-800 p-3 rounded-r-lg rounded-tl-lg max-w-md shadow-sm">
              <p className="text-sm">Dr. Jenning, we require the X-Ray reports for Claim #CLM-8836 (Peter Pettigrew) to proceed with approval.</p>
              <span className="text-xs text-slate-400 mt-1 block">BlueCross Admin • 10:30 AM</span>
           </div>
        </div>
        <div className="flex justify-end">
           <div className="bg-primary-600 text-white p-3 rounded-l-lg rounded-tr-lg max-w-xs shadow-sm">
              <p className="text-sm">Understood. I will upload the supplementary documents shortly.</p>
              <span className="text-xs text-primary-200 mt-1 block">You • 10:35 AM</span>
           </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2">
         <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Plus size={20} />
         </button>
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="flex-grow border border-slate-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
        <button onClick={handleSendMessage} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
           <Send size={18} /> Send
        </button>
      </div>
    </div>
  );

  return (
    <div>
       {currentView === 'dashboard' && renderDashboardOverview()}
       {currentView === 'patients' && renderPatientsView()}
       {currentView === 'insurance' && renderInsuranceView()}
       {currentView === 'messages' && renderMessagesView()}

       {/* Render Active Modals */}
       {selectedPatient && <PatientDetailsModal />}
       {showReportModal && <FinancialReportModal />}
       {showPartnershipModal && <NewPartnershipModal />}
       {selectedInsurer && <ManageInsurerModal />}
    </div>
  );
};