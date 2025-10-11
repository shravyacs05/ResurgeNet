// components/admin/RoadsManagement.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different report types
const blockedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const clearIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const criticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const verifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RoadsManagement = ({ user, getAuthHeaders }) => {
  const [roadReports, setRoadReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'active',
    verified: 'all',
    critical: 'all'
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    critical: 0,
    verified: 0,
    blocked: 0,
    clear: 0
  });

  const API_BASE_URL = 'http://localhost:5002/api';

  // Fetch road reports
  const fetchRoadReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);
      params.append('limit', '100');

      const response = await fetch(`${API_BASE_URL}/road-reports?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch road reports');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const reports = result.data;
        setRoadReports(reports);
        
        // Calculate statistics
        setStats({
          total: reports.length,
          active: reports.filter(r => r.status === 'active').length,
          critical: reports.filter(r => r.critical).length,
          verified: reports.filter(r => r.verified).length,
          blocked: reports.filter(r => r.type === 'blocked').length,
          clear: reports.filter(r => r.type === 'clear').length
        });
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
// In your RoadsManagement component
// Replace the verifyRoadReport function with this toggle function:
const toggleVerification = async (report) => {
  try {
    setError('');
    
    const reportId = report._id;
    const currentVerified = report.verified;
    
    console.log(`🔄 Toggling verification for report ${reportId}, currently: ${currentVerified}`);

    const response = await fetch(`${API_BASE_URL}/road-reports/${reportId}/admin/verification`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        adminId: user.id
      })
    });

    console.log('🔐 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔐 Server error response:', errorData);
      throw new Error(errorData.message || `Failed to toggle verification: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Verification toggled successfully: ${result.data.verified}`);

    if (result.success) {
      setRoadReports(roadReports.map(r => 
        r._id === reportId ? result.data : r
      ));
      fetchRoadReports(); // Refresh stats
    } else {
      throw new Error(result.message || 'Failed to toggle verification');
    }
  } catch (err) {
    console.error('❌ Error toggling verification:', err);
    setError(err.message || 'Failed to toggle verification');
  }
};

  // Toggle critical status
  const toggleCritical = async (id, currentCritical) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/road-reports/${id}/critical`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          critical: !currentCritical,
          markedCriticalBy: user.id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update critical status');
      }

      const result = await response.json();

      if (result.success) {
        setRoadReports(roadReports.map(report => 
          report._id === id ? result.data : report
        ));
        fetchRoadReports(); // Refresh stats
      } else {
        throw new Error(result.message || 'Failed to update critical status');
      }
    } catch (err) {
      console.error('Error updating critical status:', err);
      setError('Failed to update critical status');
    }
  };

  // Resolve report
  const resolveReport = async (id) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/road-reports/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolutionNotes: 'Resolved by administrator',
          resolvedBy: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve report');
      }

      const result = await response.json();

      if (result.success) {
        setRoadReports(roadReports.map(report => 
          report._id === id ? result.data : report
        ));
        fetchRoadReports(); // Refresh stats
      } else {
        throw new Error(result.message || 'Failed to resolve report');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      setError('Failed to resolve report');
    }
  };

  // Delete report
  const deleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this road report?')) {
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/road-reports/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete road report');
      }

      const result = await response.json();

      if (result.success) {
        setRoadReports(roadReports.filter(report => report._id !== id));
        fetchRoadReports(); // Refresh stats
      } else {
        throw new Error(result.message || 'Failed to delete road report');
      }
    } catch (err) {
      console.error('Error deleting road report:', err);
      setError('Failed to delete road report');
    }
  };

  // Get appropriate icon for a report
  const getReportIcon = (report) => {
    if (report.critical) return criticalIcon;
    if (report.verified) return verifiedIcon;
    return report.type === 'blocked' ? blockedIcon : clearIcon;
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

  // Filter reports based on current filters
  const filteredReports = roadReports.filter(report => {
    if (filters.type !== 'all' && report.type !== filters.type) return false;
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.verified !== 'all') {
      if (filters.verified === 'verified' && !report.verified) return false;
      if (filters.verified === 'unverified' && report.verified) return false;
    }
    if (filters.critical !== 'all') {
      if (filters.critical === 'critical' && !report.critical) return false;
      if (filters.critical === 'normal' && report.critical) return false;
    }
    return true;
  });

  // Get reports with coordinates for map
  const reportsWithCoordinates = roadReports.filter(report => 
    report.coordinates && report.coordinates.lat && report.coordinates.lng
  );

  // Default center for map
  const defaultCenter = reportsWithCoordinates.length > 0 
    ? [reportsWithCoordinates[0].coordinates.lat, reportsWithCoordinates[0].coordinates.lng]
    : [40.7128, -74.0060];

  useEffect(() => {
    fetchRoadReports();
  }, [filters.status, filters.type]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Reports</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          <div className="text-sm text-gray-400">Critical</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.verified}</div>
          <div className="text-sm text-gray-400">Verified</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{stats.blocked}</div>
          <div className="text-sm text-gray-400">Blocked</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.clear}</div>
          <div className="text-sm text-gray-400">Clear</div>
        </div>
      </div>

      {/* Map View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Road Reports Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showMap 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {showMap ? 'List View' : 'Map View'}
          </button>
          <button 
            onClick={fetchRoadReports}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="blocked">Blocked</option>
              <option value="clear">Clear</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Verification</label>
            <select 
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Critical Status</label>
            <select 
              value={filters.critical}
              onChange={(e) => handleFilterChange('critical', e.target.value)}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : showMap ? (
        /* Map View */
        <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {reportsWithCoordinates.map((report) => (
              <Marker 
                key={report._id}
                position={[report.coordinates.lat, report.coordinates.lng]}
                icon={getReportIcon(report)}
                eventHandlers={{
                  click: () => setSelectedReport(report)
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-semibold">{report.location}</h3>
                    <p className="text-gray-600">{report.description}</p>
                    <div className="mt-2 space-y-1">
                      <p><strong>Type:</strong> {report.type}</p>
                      <p><strong>Status:</strong> {report.status}</p>
                      <p><strong>Critical:</strong> {report.critical ? 'Yes' : 'No'}</p>
                      <p><strong>Verified:</strong> {report.verified ? 'Yes' : 'No'}</p>
                      <p><strong>Reported by:</strong> {report.reporterName}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        /* List View */
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-700">
            {filteredReports.map((report) => (
              <li key={report._id} className={report.critical ? 'bg-red-900 bg-opacity-20' : ''}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        report.critical ? 'bg-red-500' : report.verified ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-sm font-medium text-white">
                            {report.type === 'blocked' ? '🚧 ' : '✅ '}{report.location}
                          </h3>
                          {report.verified && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {report.critical && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Critical
                            </span>
                          )}
                          {report.status === 'resolved' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Reported by {report.reporterName} • {formatTimeAgo(report.createdAt)}
                        </p>
                        {report.description && (
                          <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                        )}
                        {report.coordinates && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {report.coordinates.lat?.toFixed(4)}, {report.coordinates.lng?.toFixed(4)}
                          </p>
                        )}
                        <div className="mt-1 flex items-center space-x-4">
                          <span className="text-xs text-gray-400">
                            Verifications: {report.verifications || 0}
                          </span>
                          {report.verifiedBy && report.verifiedBy.length > 0 && (
                            <span className="text-xs text-gray-400">
                              Verified by: {report.verifiedBy.length} user(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {!report.verified && (
                        <button
                          onClick={() => toggleVerification(report)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => toggleCritical(report._id, report.critical)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                          report.critical 
                            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                            : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {report.critical ? 'Normal' : 'Critical'}
                      </button>
                      {report.status === 'active' && (
                        <button
                          onClick={() => resolveReport(report._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => deleteReport(report._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {filteredReports.length === 0 && (
            <div className="px-4 py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No road reports found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {Object.values(filters).some(f => f !== 'all') 
                  ? 'Try changing your filters to see more results.'
                  : 'No road reports have been submitted yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300">Location</h4>
                <p className="text-white">{selectedReport.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300">Description</h4>
                <p className="text-white">{selectedReport.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Type</h4>
                  <p className="text-white capitalize">{selectedReport.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Status</h4>
                  <p className="text-white capitalize">{selectedReport.status}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Critical</h4>
                  <p className={selectedReport.critical ? 'text-red-500' : 'text-green-500'}>
                    {selectedReport.critical ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Verified</h4>
                  <p className={selectedReport.verified ? 'text-green-500' : 'text-yellow-500'}>
                    {selectedReport.verified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              {selectedReport.coordinates && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Coordinates</h4>
                  <p className="text-white">
                    {selectedReport.coordinates.lat?.toFixed(6)}, {selectedReport.coordinates.lng?.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadsManagement;