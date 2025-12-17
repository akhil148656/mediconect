import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShieldCheck, AlertTriangle, Eye, EyeOff, MessageSquare, Search, 
  RefreshCw, Bot, CheckCircle2, XCircle, Network, Database, 
  Server, Globe, FileDiff, History, X, ChevronRight, ChevronDown, Clock,
  FileCheck, FileX, Paperclip, Building, User, Send
} from 'lucide-react';
import { 
  getRiskProfile, sendMessage, runAgenticPipeline, runPeriodicComplianceCheck, fetchVerificationHistory,
  fetchProviders, updateProvider, fetchEmpanelmentRequests, updateEmpanelmentRequest
} from '../services/apiService';
import { AIVerificationResult, AIAlert, PipelineStep, Provider, EmpanelmentRequest } from '../types';

// Mock Data for charts
const PREMIUM_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

const CLAIM_STATUS_DATA = [
  { name: 'Approved', value: 400, color: '#10b981' },
  { name: 'Pending', value: 300, color: '#f59e0b' },
  { name: 'Rejected', value: 100, color: '#ef4444' },
];

interface InsuranceDashboardProps {
  currentView: string;
}

export const InsuranceDashboard: React.FC<InsuranceDashboardProps> = ({ currentView }) => {
  // Connected State (Fetched from Backend)
  const [providers, setProviders] = useState<Provider[]>([]);
  const [empanelmentRequests, setEmpanelmentRequests] = useState<EmpanelmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiAlerts, setAiAlerts] = useState<AIAlert[]>([]);
  
  // Verification / Pipeline State
  const [verificationResult, setVerificationResult] = useState<AIVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedProviderForVerify, setSelectedProviderForVerify] = useState<string>('');
  const [visibleSteps, setVisibleSteps] = useState<PipelineStep[]>([]);
  const [showPipelinePanel, setShowPipelinePanel] = useState(false); 

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<AIVerificationResult[]>([]);
  const [selectedProviderName, setSelectedProviderName] = useState('');
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<number | null>(null);

  const [messageInput, setMessageInput] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [provs, reqs] = await Promise.all([
          fetchProviders(),
          fetchEmpanelmentRequests()
        ]);
        setProviders(provs);
        setEmpanelmentRequests(reqs);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- ACTIONS ---

  const toggleSurveillance = async (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    // Optimistic Update
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, underSurveillance: !p.underSurveillance } : p
    ));

    // Call Backend
    await updateProvider(id, { underSurveillance: !provider.underSurveillance });
  };

  const handleSendMessage = async () => {
    if(!messageInput) return;
    await sendMessage('provider_id', messageInput);
    setMessageInput('');
    alert("Message sent to provider (Simulated)");
  };

  const handlePeriodicScan = async () => {
    const alerts = await runPeriodicComplianceCheck();
    setAiAlerts(alerts);
  };

  const handleVerifyProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if(!provider) return;

    setSelectedProviderForVerify(providerId);
    setShowPipelinePanel(true);
    setIsVerifying(true);
    setVerificationResult(null);
    setVisibleSteps([]);

    const result = await runAgenticPipeline({
      name: provider.name,
      license: provider.license,
      type: provider.type,
      address: provider.address
    });
    
    setVerificationResult(result);
    setIsVerifying(false);

    if (result.pipelineTrace) {
      result.pipelineTrace.forEach((step, index) => {
        setTimeout(() => {
          setVisibleSteps(prev => [...prev, step]);
        }, index * 800);
      });
    }
  };

  const handleViewHistory = async (provider: any) => {
    setSelectedProviderName(provider.name);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryData([]);
    setExpandedHistoryItem(null);
    try {
        const data = await fetchVerificationHistory(provider.id);
        setHistoryData(data);
    } catch (error) {
        console.error("Failed to fetch history", error);
    } finally {
        setHistoryLoading(false);
    }
  };

  const handleEmpanelmentAction = async (id: string, action: 'Approved' | 'Rejected') => {
      // Optimistic Update
      setEmpanelmentRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: action } : req
      ));

      // Call Backend
      await updateEmpanelmentRequest(id, { status: action });
  };

  // --- SUB-COMPONENT RENDERS ---

  const renderOverview = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Program Overview</h2>
        <div className="text-sm text-slate-500 flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
           {loading ? 'Syncing...' : 'Connected to Cloud DB'}
        </div>
      </div>

      {/* Agent 2 Alert Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <Bot className="text-indigo-600" size={24} />
                <h3 className="font-bold text-slate-800">Agentic Monitor</h3>
             </div>
             <button 
                onClick={handlePeriodicScan}
                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium transition-colors"
             >
                Run Scan
             </button>
        </div>
        
        {aiAlerts.length > 0 ? (
          <div className="space-y-3">
            {aiAlerts.map(alert => (
              <div key={alert.id} className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-3">
                 <AlertTriangle className={`flex-shrink-0 ${alert.severity === 'HIGH' ? 'text-red-600' : 'text-amber-500'}`} size={20} />
                 <div>
                    <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">Target: {alert.providerName} • Severity: {alert.severity}</p>
                 </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <CheckCircle2 className="mx-auto mb-2 opacity-50" size={32} />
                <p>System Healthy. No active compliance alerts.</p>
            </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Total Premium Collected</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">$24.5M</p>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded mt-2 inline-block">+12% from last month</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Claims Paid</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">$18.2M</p>
          <span className="text-xs text-slate-500 mt-2 inline-block">74% settlement ratio</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Active Patients</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">14,203</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">High Risk Providers</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{providers.filter(p => p.risk === 'HIGH').length}</p>
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-2 inline-block">Attention Needed</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Premium Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PREMIUM_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Claims Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CLAIM_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CLAIM_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {CLAIM_STATUS_DATA.map(d => (
              <div key={d.name} className="flex items-center text-xs">
                <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: d.color}}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProvidersView = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
       <div className={`xl:col-span-${showPipelinePanel ? '1' : '3'} space-y-6 transition-all duration-300`}>
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800">Network Providers</h2>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder="Search providers..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             {loading ? (
                <div className="p-12 text-center text-slate-400">Loading provider network...</div>
             ) : (
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                         <th className="px-6 py-4">Provider</th>
                         <th className="px-6 py-4">License</th>
                         <th className="px-6 py-4">Risk Profile</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {providers.map(provider => (
                         <tr key={provider.id} className={`hover:bg-slate-50 transition-colors ${selectedProviderForVerify === provider.id ? 'bg-indigo-50/50' : ''}`}>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${provider.type === 'Doctor' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                     {provider.type === 'Doctor' ? <User size={18} /> : <Building size={18} />}
                                  </div>
                                  <div>
                                     <p className="font-medium text-slate-900">{provider.name}</p>
                                     <p className="text-xs text-slate-500">{provider.address}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm font-mono">{provider.license}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  provider.risk === 'HIGH' ? 'bg-red-100 text-red-700' :
                                  provider.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                               }`}>
                                  {provider.risk}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                               <button 
                                  onClick={() => handleViewHistory(provider)}
                                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="History"
                               >
                                  <History size={16} />
                               </button>
                               <button 
                                  onClick={() => handleVerifyProvider(provider.id)}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                  title="Verify with AI"
                               >
                                  <Network size={16} />
                               </button>
                               <button 
                                  onClick={() => toggleSurveillance(provider.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                     provider.underSurveillance ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                                  }`}
                                  title="Toggle Surveillance"
                               >
                                  {provider.underSurveillance ? <Eye size={16} /> : <EyeOff size={16} />}
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
       </div>

       {/* AI Pipeline Visualizer Panel */}
       {showPipelinePanel && (
          <div className="xl:col-span-2 bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col h-[800px] animate-slideInRight">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                <div>
                   <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Network className="text-indigo-600" size={20} /> Agentic Verification Lab
                   </h3>
                   <p className="text-xs text-slate-500">Target: {providers.find(p=>p.id===selectedProviderForVerify)?.name}</p>
                </div>
                <button onClick={() => setShowPipelinePanel(false)} className="text-slate-400 hover:text-slate-600">
                   <X size={20} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
                {visibleSteps.length > 0 ? (
                   <div className="space-y-6 max-w-3xl mx-auto">
                      {visibleSteps.map((step, idx) => (
                         <div key={idx} className="relative pl-8 animate-fadeIn">
                            {idx !== visibleSteps.length - 1 && (
                               <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-indigo-200"></div>
                            )}
                            <div className="absolute left-0 top-1 p-1.5 bg-white border border-indigo-200 rounded-full shadow-sm z-10 text-indigo-600">
                               {getStepIcon(step.agentName)}
                            </div>
                            <div className={`bg-white rounded-lg border p-4 shadow-sm ${
                               step.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-slate-200'
                            }`}>
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <h4 className="font-bold text-slate-800">{step.agentName}</h4>
                                     <p className="text-xs text-slate-500 font-medium">{step.role}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full capitalize flex items-center gap-1 ${
                                     step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                     step.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                     {step.status === 'completed' && <CheckCircle2 size={12} />}
                                     {step.status === 'failed' && <XCircle size={12} />}
                                     {step.status}
                                  </span>
                               </div>
                               <div className="space-y-1">
                                  {step.logs.map((log, lIdx) => (
                                     <div key={lIdx} className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100/50">
                                        &gt; {log}
                                     </div>
                                  ))}
                               </div>
                               {step.status === 'failed' && (
                                  <div className="mt-3 pt-3 border-t border-red-100">
                                     <button 
                                        onClick={() => alert("Retrying Agent Step... (Simulation)")}
                                        className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                     >
                                        <RefreshCw size={12} /> Retry Step
                                     </button>
                                  </div>
                               )}
                            </div>
                         </div>
                      ))}
                      
                      {visibleSteps.length === (verificationResult?.pipelineTrace?.length || 0) && (
                         <div className={`mt-8 p-4 rounded-lg text-white text-center animate-fadeIn ${
                            verificationResult?.verified ? 'bg-emerald-600' : 'bg-red-600'
                         }`}>
                            {verificationResult?.verified ? (
                               <div className="flex flex-col items-center gap-2">
                                  <CheckCircle2 size={32} />
                                  <p className="font-bold">Verification Successful. Compliance Met.</p>
                                  <p className="text-sm opacity-90">Confidence Score: {verificationResult.confidenceScore}%</p>
                               </div>
                            ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <XCircle size={32} />
                                  <p className="font-bold">Verification Failed. Review Required.</p>
                               </div>
                            )}
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <RefreshCw className="animate-spin mb-4 text-indigo-300" size={48} />
                      <p>Initializing Agents...</p>
                   </div>
                )}
             </div>
          </div>
       )}
    </div>
  );

  const renderEmpanelment = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Empanelment Requests</h2>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">Export List</button>
             <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Invite Provider</button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
             <div className="p-12 text-center text-slate-400">Loading requests...</div>
          ) : (
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                   <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Provider Details</th>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {empanelmentRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 text-sm font-mono text-slate-500">{req.id}</td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                  {req.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-medium text-slate-900">{req.name}</p>
                                  <p className="text-xs text-slate-500">{req.type} • {req.specialization}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-600">{req.date}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                               req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                               req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                               'bg-amber-100 text-amber-700'
                            }`}>
                               {req.status}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            {req.status === 'Pending' || req.status === 'Reviewing' ? (
                               <div className="flex justify-end gap-2">
                                  <button 
                                     onClick={() => handleEmpanelmentAction(req.id, 'Approved')}
                                     className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve"
                                  >
                                     <FileCheck size={18} />
                                  </button>
                                  <button 
                                     onClick={() => handleEmpanelmentAction(req.id, 'Rejected')}
                                     className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"
                                  >
                                     <FileX size={18} />
                                  </button>
                                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="View Docs">
                                     <Paperclip size={18} />
                                  </button>
                               </div>
                            ) : (
                               <span className="text-xs text-slate-400 italic">No actions available</span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
       </div>
    </div>
  );

  const renderMessages = () => (
    <div className="h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col animate-fadeIn">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
         <div>
            <h3 className="font-bold text-slate-800">Secure Messaging</h3>
            <p className="text-xs text-slate-500">Encrypted Payer-Provider Channel</p>
         </div>
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
               <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                  U{i}
               </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">+5</div>
         </div>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto bg-slate-50 space-y-6">
        <div className="flex flex-col items-center">
           <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">Today</span>
        </div>
        
        <div className="flex justify-start">
           <div className="bg-white border border-slate-200 text-slate-800 p-4 rounded-2xl rounded-tl-none max-w-md shadow-sm">
              <p className="text-sm">Hello, this is Dr. Jenning's office. We have uploaded the requested documents for Claim #9982. Please confirm receipt.</p>
              <span className="text-xs text-slate-400 mt-2 block">Dr. Sarah Jenning • 09:15 AM</span>
           </div>
        </div>

        <div className="flex justify-end">
           <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none max-w-md shadow-md">
              <p className="text-sm">Receipt confirmed. Our AI verification system is currently processing the files. We will update the claim status within 24 hours.</p>
              <span className="text-xs text-indigo-200 mt-2 block">You • 09:20 AM</span>
           </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex gap-3">
        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
           <Paperclip size={20} />
        </button>
        <input 
          type="text" 
          placeholder="Type a secure message..." 
          className="flex-grow border border-slate-200 bg-slate-50 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
           onClick={handleSendMessage} 
           className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
           <Send size={18} /> Send
        </button>
      </div>
    </div>
  );

  const getStepIcon = (agentName: string) => {
    if (agentName.includes("Orchestrator")) return <Network size={20} />;
    if (agentName.includes("Agent 1")) return <Globe size={20} />;
    if (agentName.includes("Agent 2")) return <FileDiff size={20} />;
    if (agentName.includes("Data Store")) return <Database size={20} />;
    if (agentName.includes("Update API")) return <Server size={20} />;
    return <Bot size={20} />;
  }

  // --- MAIN RENDER ---

  const renderContent = () => {
     switch(currentView) {
        case 'overview': return renderOverview();
        case 'providers': return renderProvidersView();
        case 'empanelment': return renderEmpanelment();
        case 'messages': return renderMessages();
        default: return renderOverview();
     }
  };

  return (
    <div className="h-full">
      {renderContent()}

      {/* Verification History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">Verification History</h3>
                    <p className="text-sm text-slate-500">{selectedProviderName}</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                       <RefreshCw className="animate-spin mb-2" size={32} />
                       <p>Loading records...</p>
                    </div>
                 ) : historyData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No history found.</div>
                 ) : (
                    <div className="space-y-4">
                       {historyData.map((record, index) => (
                          <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                             <div 
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedHistoryItem(expandedHistoryItem === index ? null : index)}
                             >
                                <div className="flex items-center gap-3">
                                   {record.verified ? (
                                      <CheckCircle2 className="text-emerald-500" size={20} />
                                   ) : (
                                      <AlertTriangle className="text-amber-500" size={20} />
                                   )}
                                   <div>
                                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                                         {record.status}
                                         <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                                            {record.confidenceScore}% Confidence
                                         </span>
                                      </p>
                                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                         <Clock size={12} className="mr-1" />
                                         {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                                      </p>
                                   </div>
                                </div>
                                <div className="text-slate-400">
                                   {expandedHistoryItem === index ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                             </div>
                             
                             {/* Expanded Details */}
                             {expandedHistoryItem === index && (
                                <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm">
                                   <div className="mb-3">
                                      <span className="font-semibold text-slate-700 block mb-1">Reason:</span>
                                      <p className="text-slate-600">{record.reason}</p>
                                   </div>
                                   
                                   {record.pipelineTrace && record.pipelineTrace.length > 0 && (
                                      <div>
                                         <span className="font-semibold text-slate-700 block mb-2">Pipeline Trace:</span>
                                         <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                                            {record.pipelineTrace.map((step, sIdx) => (
                                               <div key={sIdx} className="relative pl-4">
                                                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                                  <p className="font-medium text-slate-800 text-xs">{step.agentName}</p>
                                                  <p className="text-slate-500 text-xs">{step.logs[0]}</p>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};