import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RoleSelection = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'ResurgeNet';

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => {
      clearInterval(typingInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-x-48 translate-y-48" />
      
      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-6">
            <span className="bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent">
              {displayText}
            </span>
          </h1>
          
          <div className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed font-light mb-8">
            Emergency Response & Disaster Management Platform
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {/* Citizen Card */}
          <div className="group">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/80 p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden group-hover:scale-105">
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
              
              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-blue-500/30 group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">Citizen Access</h3>
                <p className="text-gray-300 leading-relaxed text-base font-light">
                  Report emergencies, find shelters, view real-time alerts and get immediate assistance
                </p>
              </div>
              
              <div className="space-y-4 mt-auto relative z-10">
                <Link
                  to="/user-login"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 text-center shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 hover:scale-105"
                >
                  <span>Login to Portal</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <Link
                  to="/user-signup"
                  className="block w-full bg-gray-700/50 border border-gray-600 hover:border-gray-500 text-gray-200 py-4 px-6 rounded-2xl font-medium transition-all duration-200 text-center shadow-sm flex items-center justify-center gap-3 hover:scale-105"
                >
                  <span>Create Account</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Department Admin Card */}
          <div className="group">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/80 p-8 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden group-hover:scale-105">
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16" />
              
              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-green-500/30 group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">Department Admin</h3>
                <p className="text-gray-300 leading-relaxed text-base font-light">
                  Manage emergency responses, coordinate resources, and monitor department operations
                </p>
              </div>
              
              <div className="space-y-4 mt-auto relative z-10">
                <Link
                  to="/admin-login"
                  className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 text-center shadow-lg shadow-green-500/25 flex items-center justify-center gap-3 hover:scale-105"
                >
                  <span>Admin Portal Login</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <div className="text-sm text-gray-400 bg-gray-700/50 py-3 px-4 rounded-xl text-center border border-gray-600 backdrop-blur-sm">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Authorized personnel only
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Card */}
          <div className="group">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/80 p-8 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden group-hover:scale-105">
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-16 translate-x-16" />
              
              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/30 group-hover:bg-red-500/30 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">System Administrator</h3>
                <p className="text-gray-300 leading-relaxed text-base font-light">
                  Full system oversight, department management, and platform configuration
                </p>
              </div>
              
              <div className="space-y-4 mt-auto relative z-10">
                <Link
                  to="/superadmin-login" 
                  className="block w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 text-center shadow-lg shadow-red-500/25 flex items-center justify-center gap-3 hover:scale-105"
                >
                  <span>System Admin Login</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <div className="text-sm text-gray-400 bg-gray-700/50 py-3 px-4 rounded-xl text-center border border-gray-600 backdrop-blur-sm">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Highest security clearance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Hotline */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 bg-gray-800/60 backdrop-blur-sm border border-gray-700/80 rounded-2xl px-8 py-5 shadow-lg shadow-gray-500/10 hover:shadow-xl hover:shadow-gray-500/20 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-semibold text-white">Emergency Hotline</span>
            </div>
            
            <div className="flex items-center gap-6 text-base">
              {[
                { label: "National", number: "112" },
                { label: "Police", number: "100" },
                { label: "Fire", number: "101" },
                { label: "Ambulance", number: "102" }
              ].map((service, index) => (
                <div key={service.label} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">{service.label}:</span>
                  <span className="font-bold text-white">{service.number}</span>
                  {index < 3 && <div className="w-px h-4 bg-gray-600 ml-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;