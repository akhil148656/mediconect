import React, { useState } from 'react';
import { UserRole } from '../types';
import { Eye, EyeOff, ArrowLeft, Lock, Mail, ShieldCheck, Stethoscope, Activity, User } from 'lucide-react';

interface LoginViewProps {
  role: UserRole;
  isSignup: boolean;
  onLogin: () => void;
  onBack: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ role, isSignup, onLogin, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  const getRoleIcon = () => {
    switch (role) {
      case UserRole.INSURANCE: return <ShieldCheck size={40} className="text-indigo-600" />;
      case UserRole.PROVIDER: return <Stethoscope size={40} className="text-emerald-600" />;
      default: return null;
    }
  };

  const getRoleBg = () => {
    switch (role) {
      case UserRole.INSURANCE: return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
      case UserRole.PROVIDER: return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
      default: return 'bg-primary-600';
    }
  };

  const getRoleTitle = () => {
     switch (role) {
      case UserRole.INSURANCE: return 'Payer Portal';
      case UserRole.PROVIDER: return 'Healthcare Provider Portal';
      default: return 'Portal';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
               <Activity className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">MediSure<span className="text-primary-600">Connect</span></span>
          </div>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100 relative overflow-hidden">
          {/* Top colored accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${role === UserRole.INSURANCE ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
          
          <div className="flex flex-col items-center mb-6">
             <div className={`p-3 rounded-full mb-4 ${role === UserRole.INSURANCE ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                {getRoleIcon()}
             </div>
             <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                {isSignup ? `Sign up for ${getRoleTitle()}` : `Log in to ${getRoleTitle()}`}
             </h2>
             <p className="mt-2 text-center text-sm text-slate-500">
                {isSignup ? 'Create your secure enterprise account' : 'Secure access for authorized personnel only'}
             </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="animate-fadeIn">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full Name / Organization Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignup}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {isSignup && (
              <div className="animate-fadeIn">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required={isSignup}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${getRoleBg()} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignup ? 'Creating Account...' : 'Verifying...'}
                  </span>
                ) : (
                  isSignup ? 'Create Account' : 'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  Secure Enterprise Gateway
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button 
             onClick={onBack}
             className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center mx-auto transition-colors"
          >
             <ArrowLeft size={16} className="mr-1" /> Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};