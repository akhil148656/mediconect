import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Menu, Bell, LogOut, User, Activity, 
  ShieldAlert, MessageSquare, LayoutDashboard, 
  Stethoscope, Users, Building, ChevronDown 
} from 'lucide-react';

interface LayoutProps {
  role: UserRole;
  children: React.ReactNode;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors ${
      active 
        ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ role, children, onLogout, onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If PUBLIC, render a simple top-nav layout
  if (role === UserRole.PUBLIC) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Activity className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">MediSure<span className="text-primary-600">Connect</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('login')}
                className="text-slate-600 hover:text-primary-600 font-medium px-3 py-2"
              >
                Log In
              </button>
              <button 
                onClick={() => onNavigate('signup')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg"
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; 2024 MediSure Connect. Enterprise Healthcare Portal.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Dashboard Layout (Insurance & Provider)
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
           <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${role === UserRole.INSURANCE ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                {role === UserRole.INSURANCE ? <ShieldAlert className="text-white h-5 w-5" /> : <Stethoscope className="text-white h-5 w-5" />}
              </div>
              <span className="text-lg font-bold text-slate-800">
                {role === UserRole.INSURANCE ? 'Payer Portal' : 'Provider Portal'}
              </span>
            </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          {role === UserRole.INSURANCE ? (
            <>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Overview" 
                active={currentView === 'overview'} 
                onClick={() => onNavigate('overview')} 
              />
              <SidebarItem 
                icon={Stethoscope} 
                label="Doctors & Hospitals" 
                active={currentView === 'providers'} 
                onClick={() => onNavigate('providers')} 
              />
              <SidebarItem 
                icon={Users} 
                label="Empanelment" 
                active={currentView === 'empanelment'} 
                onClick={() => onNavigate('empanelment')} 
              />
              <SidebarItem 
                icon={MessageSquare} 
                label="Messages" 
                active={currentView === 'messages'} 
                onClick={() => onNavigate('messages')} 
              />
            </>
          ) : (
            <>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                onClick={() => onNavigate('dashboard')} 
              />
              <SidebarItem 
                icon={Users} 
                label="My Patients" 
                active={currentView === 'patients'} 
                onClick={() => onNavigate('patients')} 
              />
              <SidebarItem 
                icon={Building} 
                label="Insurance Providers" 
                active={currentView === 'insurance'} 
                onClick={() => onNavigate('insurance')} 
              />
              <SidebarItem 
                icon={MessageSquare} 
                label="Messages" 
                active={currentView === 'messages'} 
                onClick={() => onNavigate('messages')} 
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-slate-500 hover:text-red-600 transition-colors w-full px-4 py-2"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentView.replace('-', ' ')}
          </h1>
          
          <div className="flex items-center space-x-6">
            <div className="relative cursor-pointer">
              <Bell className="text-slate-500 hover:text-primary-600 transition-colors" size={20} />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/100/100?random=user" alt="User" className="h-full w-full object-cover"/>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-800">
                  {role === UserRole.INSURANCE ? 'Admin User' : 'Dr. Sarah Jenning'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{role === UserRole.INSURANCE ? 'Insurance Admin' : 'Healthcare Provider'}</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};