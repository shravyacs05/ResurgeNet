import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ADMIN_CREDENTIALS = {
  // Emergency Response Admin
  'emergency@response.gov': {
    password: 'Emergency123!',
    role: 'department_admin',
    department: 'emergency_response',
    name: 'Emergency Response Admin'
  },
  // Medical & Health Admin
  'medical@health.gov': {
    password: 'Medical123!',
    role: 'department_admin',
    department: 'medical_health',
    name: 'Medical Health Admin'
  },
  // Infrastructure Admin
  'infrastructure@utilities.gov': {
    password: 'Infrastructure123!',
    role: 'department_admin',
    department: 'infrastructure_utilities',
    name: 'Infrastructure Admin'
  },
  // Relief & Shelter Admin
  'relief@shelter.gov': {
    password: 'Relief123!',
    role: 'department_admin',
    department: 'relief_shelter',
    name: 'Relief Shelter Admin'
  },
  // Environment Admin
  'environment@hazards.gov': {
    password: 'Environment123!',
    role: 'department_admin',
    department: 'environment_hazards',
    name: 'Environment Hazards Admin'
  },
  // Community Support Admin
  'community@safety.gov': {
    password: 'Community123!',
    role: 'department_admin',
    department: 'community_support',
    name: 'Community Support Admin'
  }
};

const AdminLogin = ({ onLogin }) => {
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
      const admin = ADMIN_CREDENTIALS[formData.email];
      
      if (!admin) {
        throw new Error('Invalid admin credentials');
      }

      if (admin.password !== formData.password) {
        throw new Error('Invalid admin credentials');
      }

      onLogin({
        id: formData.email,
        email: formData.email,
        name: admin.name,
        role: admin.role,
        department: admin.department,
        isAdmin: true
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="inline-block mb-4 text-blue-400 hover:text-blue-300">
            ← Back to Role Selection
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Department Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Restricted Access - Authorized Personnel Only
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
              <label htmlFor="email" className="sr-only">Admin Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-t-md bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Admin Email"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-b-md bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Demo Credentials:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Emergency: emergency@response.gov / Emergency123!</div>
            <div>Medical: medical@health.gov / Medical123!</div>
            <div>Infrastructure: infrastructure@utilities.gov / Infrastructure123!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;