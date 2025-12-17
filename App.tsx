import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { PublicView } from './views/PublicView';
import { InsuranceDashboard } from './views/InsuranceDashboard';
import { DoctorDashboard } from './views/DoctorDashboard'; // Acts as the unified Provider Dashboard
import { LoginView } from './views/LoginView';
import { UserRole } from './types';
import { ShieldCheck, Stethoscope, Building } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ role: UserRole } | null>(null);
  const [currentView, setCurrentView] = useState('dashboard'); // Used for sidebar state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRoleForLogin, setSelectedRoleForLogin] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // User selects a role from the modal
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRoleForLogin(role);
    setShowAuthModal(false);
  };

  // User successfully logs in via the LoginView
  const handleLoginSuccess = () => {
    if (selectedRoleForLogin) {
      setCurrentUser({ role: selectedRoleForLogin });
      setSelectedRoleForLogin(null); // Clear login state
      // Set default view based on role
      setCurrentView(selectedRoleForLogin === UserRole.INSURANCE ? 'overview' : 'dashboard');
    }
  };

  const handleLoginBack = () => {
    setSelectedRoleForLogin(null);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setSelectedRoleForLogin(null);
    setAuthMode('login');
  };

  // Render the specific dashboard based on role
  const renderDashboard = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case UserRole.INSURANCE:
        // Now passing currentView to InsuranceDashboard
        return <InsuranceDashboard currentView={currentView} />;
      case UserRole.PROVIDER:
        return <DoctorDashboard role={UserRole.PROVIDER} currentView={currentView} />;
      default:
        return null;
    }
  };

  // If we are in the middle of a login/signup flow (role selected but not logged in), show LoginView
  if (selectedRoleForLogin) {
    return (
      <LoginView 
        role={selectedRoleForLogin} 
        isSignup={authMode === 'signup'}
        onLogin={handleLoginSuccess} 
        onBack={handleLoginBack} 
      />
    );
  }

  return (
    <>
      <Layout 
        role={currentUser?.role || UserRole.PUBLIC} 
        onLogout={handleLogout}
        onNavigate={(view) => {
            if (view === 'login') {
                setAuthMode('login');
                setShowAuthModal(true);
            } else if (view === 'signup') {
                setAuthMode('signup');
                setShowAuthModal(true);
            } else {
                setCurrentView(view);
            }
        }}
        currentView={currentView}
      >
        {currentUser ? renderDashboard() : <PublicView onLoginRequest={() => { setAuthMode('login'); setShowAuthModal(true); }} />}
      </Layout>

      {/* Role Selection Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {authMode === 'signup' ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 mt-2">
                {authMode === 'signup' ? 'Select your role to get started' : 'Select your portal to continue'}
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleRoleSelect(UserRole.INSURANCE)}
                className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold text-slate-800">Insurance Payer</p>
                  <p className="text-xs text-slate-500">Manage claims, providers & risks</p>
                </div>
              </button>

              <button 
                onClick={() => handleRoleSelect(UserRole.PROVIDER)}
                className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Stethoscope size={24} />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold text-slate-800">Healthcare Provider</p>
                  <p className="text-xs text-slate-500">Doctors, Clinics & Hospital Admins</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setShowAuthModal(false)}
              className="mt-8 w-full py-3 text-slate-500 font-medium hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}