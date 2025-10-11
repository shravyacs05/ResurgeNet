import React from 'react';
import { Link } from 'react-router-dom';

const RoleSelection = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Emergency Response System
          </h1>
          <p className="text-xl text-gray-300">
            Choose your role to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Citizen/User Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 hover:bg-gray-750 transition duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Citizen/User</h3>
              <p className="text-gray-300 mb-6">
                Report emergencies, find shelters, view maps, and get assistance
              </p>
              <div className="space-y-3">
                <Link
                  to="/user-login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/user-signup"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition duration-300"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

          {/* Department Admin Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 hover:bg-gray-750 transition duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Department Admin</h3>
              <p className="text-gray-300 mb-6">
                Manage emergency responses for your department
              </p>
              <Link
                to="/admin-login"
                className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-300"
              >
                Admin Login
              </Link>
              <div className="mt-3 text-xs text-gray-400">
                Restricted access - authorized personnel only
              </div>
            </div>
          </div>

          {/* Super Admin Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 hover:bg-gray-750 transition duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Super Administrator</h3>
              <p className="text-gray-300 mb-6">
                Full system access and department management
              </p>
              <Link
                to="/superadmin-login" 
                className="block w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-300"
              >
                Super Admin Login
              </Link>
              <div className="mt-3 text-xs text-gray-400">
                Highest security clearance required
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>Emergency Hotline: 112 | Police: 100 | Fire: 101 | Ambulance: 102</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;