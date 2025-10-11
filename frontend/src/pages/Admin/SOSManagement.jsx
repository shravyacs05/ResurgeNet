// components/admin/SOSManagement.jsx
import React, { useState, useEffect } from 'react';

const SOSManagement = ({ user, selectedDepartment, getAuthHeaders }) => {
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  const departments = [
    { value: 'emergency_response', label: 'Emergency Response' },
    { value: 'medical_health', label: 'Medical & Health' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'relief_shelter', label: 'Relief & Shelter' },
    { value: 'community_safety', label: 'Community Safety' }
  ];

  // Fetch SOS alerts
  const fetchSOSAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching alerts for department:', selectedDepartment);
      
      const response = await fetch(
        `${API_BASE_URL}/sos/department/${selectedDepartment}?status=active&limit=50`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch SOS alerts');
      }

      const result = await response.json();

      if (result.success) {
        setSosAlerts(result.alerts || []);
      } else {
        throw new Error(result.message || 'Failed to fetch SOS alerts');
      }
    } catch (err) {
      console.error('Error fetching SOS alerts:', err);
      setError(err.message || 'Failed to load SOS alerts');
      setSosAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Update SOS status
  const updateSOSStatus = async (alertId, newStatus) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/sos/${alertId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          department: selectedDepartment,
          adminId: user?.uid,
          adminName: user?.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update SOS status');
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSosAlerts(sosAlerts.map(alert => 
          alert._id === alertId ? { ...alert, status: newStatus } : alert
        ));
        
        // Refresh the list
        fetchSOSAlerts();
      } else {
        throw new Error(result.message || 'Failed to update SOS status');
      }
    } catch (err) {
      console.error('Error updating SOS status:', err);
      setError('Failed to update SOS status. Please try again.');
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - alertTime) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchSOSAlerts();
  }, [selectedDepartment]);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">
          SOS Alerts - {departments.find(d => d.value === selectedDepartment)?.label}
        </h3>
        <div className="flex space-x-2">
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option>All Types</option>
            <option>Critical</option>
            <option>High Priority</option>
            <option>Medium Priority</option>
          </select>
          <button 
            onClick={fetchSOSAlerts}
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

      <ul className="divide-y divide-gray-700">
        {sosAlerts.map((alert) => (
          <li key={alert._id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    alert.mlClassification?.urgencyLevel === 'critical' || alert.mlClassification?.urgencyLevel === 'high' ? 'bg-red-500' : 
                    alert.mlClassification?.urgencyLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-white">
                        {alert.userName} - {alert.emergencyType}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {alert.location?.address}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(alert.createdAt)} • Priority: {alert.mlClassification?.urgencyLevel || 'medium'} • People: {alert.peopleAffected || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      {alert.message?.substring(0, 150)}{alert.message?.length > 150 ? '...' : ''}
                    </p>
                    {alert.mlClassification?.primaryDepartments && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400">Assigned to:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {alert.mlClassification.primaryDepartments.map(dept => (
                            <span key={dept} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                              {dept.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  {alert.status === 'pending' && (
                    <button
                      onClick={() => updateSOSStatus(alert._id, 'verified')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  )}
                  {alert.status === 'verified' && (
                    <button
                      onClick={() => updateSOSStatus(alert._id, 'in_progress')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Start Response
                    </button>
                  )}
                  {alert.status === 'in_progress' && (
                    <button
                      onClick={() => updateSOSStatus(alert._id, 'resolved')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
        {sosAlerts.length === 0 && !loading && (
          <li className="px-4 py-8 text-center text-gray-400">
            No alerts found for {departments.find(d => d.value === selectedDepartment)?.label} department
          </li>
        )}
      </ul>
    </div>
  );
};

export default SOSManagement;