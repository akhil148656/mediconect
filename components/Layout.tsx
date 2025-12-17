import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppNotification } from '../types';
import { fetchAppNotifications } from '../services/apiService';
import { 
  Menu, Bell, LogOut, User, Activity, 
  ShieldAlert, MessageSquare, LayoutDashboard, 
  Stethoscope, Users, Building, ChevronDown, Flag, CheckCircle2, Info, AlertTriangle, XCircle 
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [flags, setFlags] = useState<AppNotification[]>([]);
  
  const [activePanel, setActivePanel] = useState<'notifications' | 'flags' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role !== UserRole.PUBLIC) {
      fetchAppNotifications(role).then(data => {
        setNotifications(data.filter(n => n.category === 'notification'));
        setFlags(data.filter(n => n.category === 'flag'));
      });
    }
  }, [role]);

  // Click outside to close panels
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadFlags = flags.filter(n => !n.read).length;

  const markAllAsRead = (category: 'notification' | 'flag') => {
    if (category === 'notification') {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else {
        setFlags(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

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
          
          <div className="flex items-center space-x-4 md:space-x-6" ref={panelRef}>
            {/* Flags / Critical Alerts */}
            <div className="relative">
              <button 
                onClick={() => setActivePanel(activePanel === 'flags' ? null : 'flags')}
                className={`p-2 rounded-full transition-colors relative ${activePanel === 'flags' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
              >
                <Flag size={20} />
                {unreadFlags > 0 && (
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {activePanel === 'flags' && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-red-100 z-50 animate-fadeIn origin-top-right">
                   <div className="p-4 border-b border-red-50 bg-red-50/30 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-bold text-red-900 flex items-center gap-2">
                         <AlertTriangle size={16} /> Critical Alerts
                      </h3>
                      <button onClick={() => markAllAsRead('flag')} className="text-xs text-red-600 hover:underline">Mark all read</button>
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                      {flags.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">No active alerts</div>
                      ) : (
                         flags.map(flag => (
                            <div key={flag.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!flag.read ? 'bg-red-50/10' : ''}`}>
                               <div className="flex gap-3">
                                  <div className={`mt-1 ${flag.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                                    {flag.type === 'error' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
                                  </div>
                                  <div>
                                     <p className={`text-sm font-semibold ${flag.read ? 'text-slate-700' : 'text-slate-900'}`}>{flag.title}</p>
                                     <p className="text-xs text-slate-500 mt-0.5">{flag.message}</p>
                                     <p className="text-[10px] text-slate-400 mt-2">{flag.timestamp}</p>
                                  </div>
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setActivePanel(activePanel === 'notifications' ? null : 'notifications')}
                className={`p-2 rounded-full transition-colors relative ${activePanel === 'notifications' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-indigo-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {activePanel === 'notifications' && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fadeIn origin-top-right">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-bold text-slate-800">Notifications</h3>
                      <button onClick={() => markAllAsRead('notification')} className="text-xs text-primary-600 hover:underline">Mark all read</button>
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                         notifications.map(notif => (
                            <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-indigo-50/10' : ''}`}>
                               <div className="flex gap-3">
                                  <div className="mt-1">
                                    {getIconForType(notif.type)}
                                  </div>
                                  <div>
                                     <p className={`text-sm font-semibold ${notif.read ? 'text-slate-600' : 'text-slate-900'}`}>{notif.title}</p>
                                     <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                                     <p className="text-[10px] text-slate-400 mt-2">{notif.timestamp}</p>
                                  </div>
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* User Profile */}
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