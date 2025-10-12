import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReliefPartners = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch partners from backend
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5002/api/partners');
      
      if (response.data.success) {
        setPartners(response.data.data);
      } else {
        setError('Failed to fetch partners');
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError('Error connecting to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleContactClick = async (partnerId) => {
    try {
      await axios.post(`http://localhost:5002/api/partners/${partnerId}/contact`);
      console.log('Contact click tracked');
    } catch (err) {
      console.error('Error tracking contact:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading relief partners...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={fetchPartners}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Relief Partners</h2>
          <p className="text-gray-400">
            Connect with verified relief organizations ready to provide support and assistance during emergencies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Total Partners</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">{partners.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Verified Partners</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {partners.filter(p => p.status === 'approved').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Pending Review</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {partners.filter(p => p.status === 'pending').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partners Grid */}
        {partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {partners.map(partner => (
              <div 
                key={partner._id} 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      partner.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      partner.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {partner.status.toUpperCase()}
                    </span>
                    {partner.organizationType && (
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                        {partner.organizationType}
                      </span>
                    )}
                  </div>

                  {/* Organization Name */}
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {partner.organizationName}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-400 mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {partner.city}, {partner.state}
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {partner.description}
                  </p>

                  {/* Support Types */}
                  {partner.supportType && partner.supportType.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {partner.supportType.slice(0, 3).map((type, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                          >
                            {type}
                          </span>
                        ))}
                        {partner.supportType.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
                            +{partner.supportType.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Monetary Pledge */}
                  {partner.monetaryPledge > 0 && (
                    <div className="mb-4 p-3 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-xs text-gray-400 mb-1">Pledged Support</p>
                      <p className="text-lg font-bold text-green-400">
                        ₹{partner.monetaryPledge.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-500">Contact:</span>
                        <span className="text-gray-300 ml-2">{partner.contactPerson}</span>
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Email:</span>
                        <a href={`mailto:${partner.email}`} className="text-blue-400 hover:text-blue-300 ml-2 break-all">
                          {partner.email}
                        </a>
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Phone:</span>
                        <a href={`tel:${partner.phone}`} className="text-blue-400 hover:text-blue-300 ml-2">
                          {partner.phone}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Contact Button */}
                  
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-400 text-lg">No partners available at the moment.</p>
          </div>
        )}

        {/* Register Button */}
        <div className="flex justify-center pt-6 border-t border-gray-700">
          <button
            onClick={() => navigate('/pledge-support')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
          >
            Register Your Organization
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReliefPartners;