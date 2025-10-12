// components/admin/SOSManagement.jsx
import React, { useState, useEffect } from 'react';

const SOSManagement = ({ user, selectedDepartment, getAuthHeaders }) => {
  const [sosAlerts, setSosAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    emergencyType: 'all',
    timeRange: 'all'
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  const departments = [
    { value: 'emergency_response', label: 'Emergency Response' },
    { value: 'medical_health', label: 'Medical & Health' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'relief_shelter', label: 'Relief & Shelter' },
    { value: 'community_safety', label: 'Community Safety' },
    { value: 'environment_hazards', label: 'Environment Hazards' },
    { value: 'community_support', label: 'Community Support' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const emergencyTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'medical', label: 'Medical' },
    { value: 'fire', label: 'Fire' },
    { value: 'flood', label: 'Flood' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'trapped', label: 'Trapped' },
    { value: 'structural collapse', label: 'Structural Collapse' },
    { value: 'stranded', label: 'Stranded' },
    { value: 'other', label: 'Other' }
  ];

  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '1h', label: 'Last 1 Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' }
  ];

  // Status display helpers
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatPriority = (priority) => {
    if (!priority) return 'Unknown';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...sosAlerts];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => {
        const deptStatus = getDepartmentStatus(alert);
        return deptStatus === filters.status;
      });
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(alert => 
        alert.mlClassification?.urgencyLevel === filters.priority
      );
    }

    // Emergency type filter
    if (filters.emergencyType !== 'all') {
      filtered = filtered.filter(alert => 
        alert.emergencyType === filters.emergencyType
      );
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let timeThreshold = new Date();

      switch (filters.timeRange) {
        case '1h':
          timeThreshold.setHours(now.getHours() - 1);
          break;
        case '6h':
          timeThreshold.setHours(now.getHours() - 6);
          break;
        case '24h':
          timeThreshold.setDate(now.getDate() - 1);
          break;
        case '7d':
          timeThreshold.setDate(now.getDate() - 7);
          break;
        default:
          break;
      }

      filtered = filtered.filter(alert => 
        new Date(alert.createdAt) >= timeThreshold
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.userName?.toLowerCase().includes(term) ||
        alert.emergencyType?.toLowerCase().includes(term) ||
        alert.message?.toLowerCase().includes(term) ||
        alert.location?.address?.toLowerCase().includes(term)
      );
    }

    setFilteredAlerts(filtered);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      emergencyType: 'all',
      timeRange: 'all'
    });
    setSearchTerm('');
  };

  // Fetch SOS alerts
  const fetchSOSAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🔍 Fetching alerts for department:', selectedDepartment);
      
      const response = await fetch(
        `${API_BASE_URL}/sos/department/${selectedDepartment}?status=active&limit=100`,
        {
          headers: getAuthHeaders()
        }
      );

      console.log('🔍 Fetch response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 Fetch error response:', errorData);
        throw new Error(errorData.message || `Failed to fetch SOS alerts: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Fetch successful, data:', result);

      if (result.success) {
        const alerts = result.alerts || [];
        setSosAlerts(alerts);
        setFilteredAlerts(alerts);
      } else {
        throw new Error(result.message || 'Failed to fetch SOS alerts');
      }
    } catch (err) {
      console.error('❌ Error fetching SOS alerts:', err);
      setError(err.message || 'Failed to load SOS alerts');
      setSosAlerts([]);
      setFilteredAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Update SOS status - FIXED VERSION
  const updateSOSStatus = async (alertId, newStatus, currentAlert) => {
    try {
      setError('');
      setSuccess('');
      
      console.log('🔐 Updating SOS alert status:', {
        alertId,
        newStatus,
        selectedDepartment,
        currentAlert
      });

      // Prepare update data
      const updateData = {
        status: newStatus,
        department: selectedDepartment,
        adminId: user?.uid || 'admin',
        adminName: user?.name || 'Admin',
        notes: `Status updated to ${newStatus} by ${user?.name || 'Admin'}`
      };

      console.log('🔐 Sending update data:', updateData);

      const response = await fetch(`${API_BASE_URL}/sos/${alertId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('🔐 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔐 Server error response:', errorData);
        throw new Error(errorData.message || `Failed to update SOS status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ SOS status update successful:', result);

      if (result.success) {
        setSuccess(`Alert status updated to ${formatStatus(newStatus)} successfully!`);
        
        // Update local state immediately for better UX
        setSosAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === alertId ? { ...alert, status: newStatus } : alert
          )
        );
        
        // Refresh data to get the latest from server
        setTimeout(() => {
          fetchSOSAlerts();
        }, 1000);
      } else {
        throw new Error(result.message || 'Failed to update SOS status');
      }
    } catch (err) {
      console.error('❌ Error updating SOS status:', err);
      setError(err.message || 'Failed to update SOS status. Please try again.');
      
      // Revert local state on error
      fetchSOSAlerts();
    }
  };

  // Quick resolve function (no backend connection needed)
  const quickResolve = (alertId) => {
    setSosAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert._id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    );
    setFilteredAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert._id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    );
    setSuccess('Alert marked as resolved locally!');
  };

  // Get available status transitions based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      pending: ['verified', 'cancelled'],
      verified: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['resolved', 'cancelled'],
      resolved: [], // No further transitions from resolved
      cancelled: [] // No further transitions from cancelled
    };
    
    return statusFlow[currentStatus] || [];
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

  // Get department-specific status for an alert
  const getDepartmentStatus = (alert) => {
    if (!alert.assignedDepartments || !Array.isArray(alert.assignedDepartments)) {
      return alert.status;
    }
    
    const deptAssignment = alert.assignedDepartments.find(
      dept => dept.department === selectedDepartment
    );
    
    return deptAssignment?.status || alert.status;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.priority !== 'all' || 
           filters.emergencyType !== 'all' || 
           filters.timeRange !== 'all' ||
           searchTerm !== '';
  };

  // Get filter summary
  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.status !== 'all') activeFilters.push(`Status: ${statusOptions.find(s => s.value === filters.status)?.label}`);
    if (filters.priority !== 'all') activeFilters.push(`Priority: ${priorityOptions.find(p => p.value === filters.priority)?.label}`);
    if (filters.emergencyType !== 'all') activeFilters.push(`Type: ${emergencyTypeOptions.find(e => e.value === filters.emergencyType)?.label}`);
    if (filters.timeRange !== 'all') activeFilters.push(`Time: ${timeRangeOptions.find(t => t.value === filters.timeRange)?.label}`);
    if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`);
    
    return activeFilters.join(', ');
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchSOSAlerts();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    applyFilters();
  }, [sosAlerts, filters, searchTerm]);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">
            SOS Alerts - {departments.find(d => d.value === selectedDepartment)?.label || selectedDepartment}
          </h3>
          {hasActiveFilters() && (
            <p className="text-sm text-gray-300 mt-1">
              Filtered: {getFilterSummary()} ({filteredAlerts.length} of {sosAlerts.length} alerts)
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {loading && (
            <span className="inline-flex items-center px-3 py-2 text-sm text-gray-400">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          )}
          <button 
            onClick={fetchSOSAlerts}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="px-4 py-4 bg-gray-750 border-b border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, type, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Emergency Type Filter */}
          <div>
            <label htmlFor="emergencyType" className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              id="emergencyType"
              value={filters.emergencyType}
              onChange={(e) => setFilters(prev => ({ ...prev, emergencyType: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {emergencyTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-300 mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {filteredAlerts.length} of {sosAlerts.length} alerts
          </div>
          <div className="flex space-x-2">
            {hasActiveFilters() && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="px-4 py-3 bg-red-900 text-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-green-900 text-green-200 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Alerts List */}
      <ul className="divide-y divide-gray-700">
        {filteredAlerts.map((alert) => {
          const deptStatus = getDepartmentStatus(alert);
          const availableStatuses = getAvailableStatuses(deptStatus);
          const isVerified = deptStatus === 'verified';
          
          return (
            <li key={alert._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      alert.mlClassification?.urgencyLevel === 'critical' ? 'bg-red-500' : 
                      alert.mlClassification?.urgencyLevel === 'high' ? 'bg-orange-500' :
                      alert.mlClassification?.urgencyLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-white">
                            {alert.userName || 'Unknown User'} - {alert.emergencyType || 'Emergency'}
                          </h3>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deptStatus)}`}>
                            {formatStatus(deptStatus)}
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(alert.mlClassification?.urgencyLevel)}`}>
                            {formatPriority(alert.mlClassification?.urgencyLevel)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {alert.location?.address || 'Location not specified'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        People affected: {alert.peopleAffected || 'N/A'} • Phone: {alert.userPhone || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-300 mt-2">
                        {alert.message?.substring(0, 150)}{alert.message?.length > 150 ? '...' : ''}
                      </p>
                      
                      {/* Department Assignments */}
                      {alert.assignedDepartments && alert.assignedDepartments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400">Department Status:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {alert.assignedDepartments.map((dept, index) => (
                              <span 
                                key={index} 
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  dept.department === selectedDepartment 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {dept.department.replace(/_/g, ' ')}: {formatStatus(dept.status)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Quick Resolve Button for Verified Reports */}
                    {isVerified && (
                      <button
                        onClick={() => quickResolve(alert._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Quick Resolve
                      </button>
                    )}
                    
                    {/* Regular Status Buttons */}
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => updateSOSStatus(alert._id, status, alert)}
                        disabled={loading}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                          status === 'verified' ? 'bg-blue-600 hover:bg-blue-700' :
                          status === 'assigned' ? 'bg-purple-600 hover:bg-purple-700' :
                          status === 'in_progress' ? 'bg-orange-600 hover:bg-orange-700' :
                          status === 'resolved' ? 'bg-green-600 hover:bg-green-700' :
                          status === 'cancelled' ? 'bg-red-600 hover:bg-red-700' :
                          'bg-gray-600 hover:bg-gray-700'
                        } disabled:opacity-50`}
                      >
                        {status === 'verified' && <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {status === 'assigned' && <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                        {status === 'in_progress' && <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        {status === 'resolved' && <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {status === 'cancelled' && <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        {formatStatus(status)}
                      </button>
                    ))}
                    
                    {availableStatuses.length === 0 && !isVerified && (
                      <span className="inline-flex items-center px-3 py-1 text-xs text-gray-400">
                        No actions available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        
        {filteredAlerts.length === 0 && !loading && (
          <li className="px-4 py-8 text-center text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm">
              {hasActiveFilters() 
                ? 'No alerts match your current filters' 
                : `No alerts found for ${departments.find(d => d.value === selectedDepartment)?.label || selectedDepartment} department`
              }
            </p>
            {hasActiveFilters() && (
              <button
                onClick={resetFilters}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
              >
                Clear Filters
              </button>
            )}
          </li>
        )}
      </ul>
    </div>
  );
};

export default SOSManagement;