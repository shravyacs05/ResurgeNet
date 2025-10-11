// components/admin/RoadsManagement.jsx
import React, { useState, useEffect } from 'react';

const RoadsManagement = ({ user, getAuthHeaders }) => {
  const [roadReports, setRoadReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  // Fetch road reports
  const fetchRoadReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/road-reports?status=active&limit=50`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch road reports');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component format
        const transformedReports = result.data.map(report => ({
          id: report._id,
          type: report.type,
          location: report.location,
          description: report.description,
          reportedBy: report.reporterName || 'Unknown User',
          time: formatTimeAgo(report.createdAt),
          verified: report.verified,
          verifications: report.verifications,
          critical: report.critical,
          status: report.status,
          severity: report.severity || 'medium',
          createdAt: report.createdAt
        }));
        
        setRoadReports(transformedReports);
      } else {
        throw new Error(result.message || 'Failed to fetch road reports');
      }
    } catch (err) {
      console.error('Error fetching road reports:', err);
      setError(err.message || 'Failed to load road reports');
      setRoadReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Verify road report
  const verifyRoadReport = async (id) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/road-reports/${id}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to verify road report');
      }

      const result = await response.json();

      if (result.success) {
        setRoadReports(roadReports.map(report => 
          report.id === id ? { ...report, verified: true } : report
        ));
      } else {
        throw new Error(result.message || 'Failed to verify road report');
      }
    } catch (err) {
      console.error('Error verifying road report:', err);
      setError('Failed to verify road report');
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - reportTime) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  useEffect(() => {
    fetchRoadReports();
  }, []);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Road Report Management</h3>
        <div className="flex space-x-2">
          <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option>All Types</option>
            <option>blocked</option>
            <option>clear</option>
          </select>
          <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option>All Status</option>
            <option>active</option>
            <option>resolved</option>
          </select>
          <button 
            onClick={fetchRoadReports}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-900 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading road reports...</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {roadReports.map((report) => (
            <li key={report.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      report.critical ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-white">
                          {report.type} - {report.location}
                        </h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.verified ? 'Verified' : 'Unverified'}
                        </span>
                        {report.critical && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Reported by {report.reportedBy} • {report.time}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      )}
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          Severity: {report.severity}
                        </span>
                        <span className="text-xs text-gray-400">
                          Verifications: {report.verifications || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!report.verified && (
                      <button
                        onClick={() => verifyRoadReport(report.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Verify
                      </button>
                    )}
                    <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoadsManagement;