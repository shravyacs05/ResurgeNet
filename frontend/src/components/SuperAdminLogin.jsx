import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SUPER_ADMIN_CREDENTIALS = {
  'superadmin@emergency.gov': {
    password: 'SuperAdmin123!',
    role: 'super_admin',
    department: 'all',
    name: 'Super Administrator'
  },
  // Demo super admin for testing
  'demo@superadmin.com': {
    password: 'Demo123!',
    role: 'super_admin', 
    department: 'all',
    name: 'Demo Super Admin'
  }
};

const SuperAdminLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const admin = SUPER_ADMIN_CREDENTIALS[formData.email];
      
      if (!admin) {
        throw new Error('Invalid super admin credentials');
      }

      if (admin.password !== formData.password) {
        throw new Error('Invalid super admin credentials');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onLogin({
        id: formData.email,
        email: formData.email,
        name: admin.name,
        role: admin.role,
        department: admin.department,
        isSuperAdmin: true,
        trustScore: 100
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@superadmin.com',
      password: 'Demo123!'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="inline-block mb-4 text-blue-400 hover:text-blue-300">
            ← Back to Role Selection
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Super Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-red-400">
            Highest Security Clearance Required
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Super Admin Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-t-md bg-gray-800 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Super Admin Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-b-md bg-gray-800 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Super Admin Login'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Use Demo Credentials
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-red-500">
          <h3 className="text-sm font-medium text-red-300 mb-2">Super Admin Access Only:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div><strong>Primary:</strong> superadmin@emergency.gov / SuperAdmin123!</div>
            <div><strong>Demo:</strong> demo@superadmin.com / Demo123!</div>
            <div className="mt-2 text-red-300">⚠️ Unauthorized access is strictly prohibited</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;