import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

// Component for handling map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

const API_URL = 'http://localhost:5002/api/road-reports';

const RoadReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lng: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [newReport, setNewReport] = useState({
    type: 'blocked',
    location: '',
    description: '',
    critical: false,
    coordinates: { lat: '', lng: '' }
  });

  // Default center (New York)
  const defaultCenter = [40.7128, -74.0060];

  useEffect(() => {
    fetchReports();
    getCurrentLocation();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
          
          // If map picker is open, update the map coordinates
          if (showMapPicker) {
            setMapCoordinates({ lat, lng });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please select a location on the map.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  // Open map for coordinate selection
  const openMapPicker = () => {
    setShowMapPicker(true);
    // If we already have coordinates, use them as initial position
    if (newReport.coordinates.lat && newReport.coordinates.lng) {
      setMapCoordinates({
        lat: parseFloat(newReport.coordinates.lat),
        lng: parseFloat(newReport.coordinates.lng)
      });
    } else if (currentLocation) {
      // Otherwise use current location if available
      setMapCoordinates(currentLocation);
    }
  };

  // Handle map click to select coordinates
  const handleMapClick = (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setMapCoordinates({ lat, lng });
    
    // Update the form with selected coordinates
    setNewReport(prev => ({
      ...prev,
      coordinates: { lat: lat.toString(), lng: lng.toString() }
    }));
  };

  // Close map picker and apply coordinates
  const applyMapSelection = () => {
    setShowMapPicker(false);
  };

  // Cancel map selection
  const cancelMapSelection = () => {
    setShowMapPicker(false);
  };

  const filteredReports = reports.filter((report) => {
    switch (activeTab) {
      case 'my-reports':
        return report.reportedBy === user.id || report.reportedBy === user.name;
      case 'verified':
        return report.verified;
      case 'unverified':
        return !report.verified;
      case 'critical':
        return report.critical;
      case 'safe':
        return !report.critical && report.type === 'clear';
      case 'blocked':
        return report.type === 'blocked';
      case 'resolved':
        return report.status === 'resolved';
      case 'active':
        return report.status === 'active';
      case 'admin-verified':
        return report.verified && report.verifiedBy?.some(v => 
          v.user === 'admin' || v.user.includes('admin')
        );
      default:
        return true;
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewReport({
      ...newReport,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      // Validate coordinates
      if (!newReport.coordinates.lat || !newReport.coordinates.lng) {
        alert('Please select a location on the map');
        return;
      }

      const reportData = {
        ...newReport,
        reportedBy: user.id,
        reporterName: user.name,
        coordinates: {
          lat: parseFloat(newReport.coordinates.lat),
          lng: parseFloat(newReport.coordinates.lng)
        }
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      
      if (!res.ok) throw new Error('Failed to submit report');
      
      const data = await res.json();
      setReports([data.data, ...reports]);
      setNewReport({ 
        type: 'blocked', 
        location: '', 
        description: '', 
        critical: false,
        coordinates: { lat: '', lng: '' }
      });
      setShowReportForm(false);
      setActiveTab('my-reports');
    } catch (err) {
      alert(err.message);
    }
  };

  const verifyReport = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error('Failed to verify report');
      const data = await res.json();
      setReports(reports.map(r => (r._id === id ? data.data : r)));
    } catch (err) {
      alert(err.message);
    }
  };

  const markAsCritical = async (id, isCritical) => {
    try {
      const res = await fetch(`${API_URL}/${id}/critical`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          critical: !isCritical,
          markedCriticalBy: user.id 
        }),
      });
      if (!res.ok) throw new Error('Failed to update critical status');
      const data = await res.json();
      setReports(reports.map(r => (r._id === id ? data.data : r)));
    } catch (err) {
      alert(err.message);
    }
  };

  const resolveReport = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolutionNotes: 'Resolved by user',
          resolvedBy: user.id
        }),
      });
      if (!res.ok) throw new Error('Failed to resolve report');
      const data = await res.json();
      setReports(reports.map(r => (r._id === id ? data.data : r)));
    } catch (err) {
      alert(err.message);
    }
  };

  const reportCounts = {
    all: reports.length,
    'my-reports': reports.filter(r => r.reportedBy === user.id || r.reportedBy === user.name).length,
    verified: reports.filter(r => r.verified).length,
    unverified: reports.filter(r => !r.verified).length,
    critical: reports.filter(r => r.critical).length,
    safe: reports.filter(r => !r.critical && r.type === 'clear').length,
    blocked: reports.filter(r => r.type === 'blocked').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    active: reports.filter(r => r.status === 'active').length,
    'admin-verified': reports.filter(r => 
      r.verified && r.verifiedBy?.some(v => v.user === 'admin' || v.user.includes('admin'))
    ).length,
  };

  // Check if user has verified a specific report
  const getUserVerificationStatus = (report) => {
    if (!report.verifiedBy || report.verifiedBy.length === 0) {
      return { hasVerified: false, isAdminVerified: false };
    }
    
    const userHasVerified = report.verifiedBy.some(v => v.user === user.id);
    const adminHasVerified = report.verifiedBy.some(v => 
      v.user === 'admin' || v.user.includes('admin') || v.user === 'department_admin'
    );
    
    return { hasVerified: userHasVerified, isAdminVerified: adminHasVerified };
  };

  // Get appropriate icon for a report
  const getReportIcon = (report) => {
    if (report.critical) return criticalIcon;
    return report.type === 'blocked' ? blockedIcon : clearIcon;
  };

  // Navigate to report location
  const navigateToLocation = (report) => {
    if (report.coordinates && report.coordinates.lat && report.coordinates.lng) {
      const { lat, lng } = report.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      alert('No coordinates available for navigation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        
        {/* Map Picker Modal */}
        {showMapPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Select Road Location</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={getCurrentLocation}
                    className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-md text-white text-sm transition-colors"
                  >
                    Use My Location
                  </button>
                  <button
                    onClick={cancelMapSelection}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-md text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyMapSelection}
                    className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-md text-white text-sm transition-colors"
                    disabled={!mapCoordinates.lat}
                  >
                    Apply Location
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="bg-gray-700 rounded-lg h-full overflow-hidden">
                  <MapContainer
                    center={mapCoordinates.lat ? [mapCoordinates.lat, mapCoordinates.lng] : defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {mapCoordinates.lat && (
                      <Marker 
                        position={[mapCoordinates.lat, mapCoordinates.lng]} 
                        icon={newReport.type === 'blocked' ? blockedIcon : clearIcon}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="text-sm text-gray-300">
                  <p className="mb-2">Click on the map to select the road location. A marker will appear at your selected position.</p>
                  {mapCoordinates.lat ? (
                    <p className="text-green-400">
                      Selected Location: {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-yellow-400">No location selected yet. Click on the map to choose a location.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Road Condition Reports</h2>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {showReportForm ? 'Cancel' : 'Report Road Condition'}
          </button>
        </div>

        {showReportForm && (
          <div className="bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Report Road Condition</h3>
            <form onSubmit={handleSubmitReport}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Road Status</label>
                  <select
                    name="type"
                    value={newReport.type}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-700 bg-gray-700 text-white"
                  >
                    <option value="blocked">Blocked/Damaged</option>
                    <option value="clear">Clear/Safe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Location Description</label>
                  <input
                    type="text"
                    name="location"
                    value={newReport.location}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border-gray-700 bg-gray-700 text-white"
                    placeholder="Enter road name, landmark, or area description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Location Coordinates *</label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newReport.coordinates.lat || ''}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400"
                        placeholder="Latitude (select from map)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newReport.coordinates.lng || ''}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400"
                        placeholder="Longitude (select from map)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openMapPicker}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors whitespace-nowrap"
                    >
                      Select from Map
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Select from Map" to choose the exact road location on an interactive map
                  </p>
                  {newReport.coordinates.lat && (
                    <p className="text-sm text-green-400 mt-1">
                      Location selected: {parseFloat(newReport.coordinates.lat).toFixed(6)}, {parseFloat(newReport.coordinates.lng).toFixed(6)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    name="description"
                    value={newReport.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="block w-full rounded-md border-gray-700 bg-gray-700 text-white"
                    placeholder="Provide details about the road condition, obstacles, damage, etc."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="critical"
                    name="critical"
                    checked={newReport.critical}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-600 rounded"
                  />
                  <label htmlFor="critical" className="ml-2 block text-sm text-gray-300">
                    Mark as critical (emergency situation requiring immediate attention)
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!newReport.coordinates.lat || !newReport.coordinates.lng}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {[
              { id: 'all', name: 'All Reports' },
              { id: 'my-reports', name: 'My Reports' },
              { id: 'verified', name: 'Verified' },
              { id: 'admin-verified', name: 'Admin Verified' },
              { id: 'unverified', name: 'Unverified' },
              { id: 'critical', name: 'Critical' },
              { id: 'safe', name: 'Safe Roads' },
              { id: 'blocked', name: 'Blocked' },
              { id: 'active', name: 'Active' },
              { id: 'resolved', name: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-400'
                }`}
              >
                {tab.name} ({reportCounts[tab.id] || 0})
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <p className="text-white">Loading reports...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredReports.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
            <h3 className="mt-2 text-sm font-medium text-white">No reports found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {activeTab === 'my-reports'
                ? "You haven't submitted any road reports yet."
                : `There are no ${activeTab} road reports at the moment.`}
            </p>
            {activeTab === 'my-reports' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Submit Your First Report
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-700">
              {filteredReports.map((report) => {
                const { hasVerified, isAdminVerified } = getUserVerificationStatus(report);
                const isMyReport = report.reportedBy === user.id || report.reportedBy === user.name;
                
                return (
                  <li key={report._id} className={report.critical ? 'bg-red-900 bg-opacity-20' : ''}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              report.type === 'blocked' ? 'bg-red-500' : 'bg-green-500'
                            }`}
                          >
                            {report.type === 'blocked' ? (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="text-sm font-medium text-white">{report.location}</h3>
                              {report.coordinates && (
                                <button
                                  onClick={() => navigateToLocation(report)}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                                  title="Navigate to location"
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Navigate
                                </button>
                              )}
                              {report.critical && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Critical
                                </span>
                              )}
                              {report.verified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Verified
                                </span>
                              )}
                              {isAdminVerified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin Verified
                                </span>
                              )}
                              {report.status === 'resolved' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Resolved
                                </span>
                              )}
                              {isMyReport && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  My Report
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                            
                            {/* Show coordinates if available */}
                            {report.coordinates && (
                              <p className="text-xs text-gray-500 mt-1">
                                Coordinates: {report.coordinates.lat?.toFixed(4)}, {report.coordinates.lng?.toFixed(4)}
                              </p>
                            )}
                            
                            {/* Show resolution details if resolved */}
                            {report.status === 'resolved' && report.resolutionNotes && (
                              <div className="mt-2 p-2 bg-blue-900 bg-opacity-20 rounded">
                                <p className="text-xs text-blue-300">
                                  <strong>Resolution:</strong> {report.resolutionNotes}
                                </p>
                                {report.resolvedAt && (
                                  <p className="text-xs text-blue-400 mt-1">
                                    Resolved on: {new Date(report.resolvedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm text-gray-400">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Just now'}
                          </p>
                          <p className="text-xs text-gray-500">by {report.reporterName}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400">
                            {report.verifications} verification{report.verifications !== 1 ? 's' : ''}
                          </span>
                          
                          {/* Show who verified this report */}
                          {report.verifiedBy && report.verifiedBy.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Verified by:</span>
                              <div className="flex space-x-1">
                                {report.verifiedBy.slice(0, 3).map((verification, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                      verification.user === 'admin' || verification.user.includes('admin')
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-600 text-white'
                                    }`}
                                  >
                                    {verification.user === 'admin' || verification.user.includes('admin') 
                                      ? 'Admin' 
                                      : 'User'}
                                  </span>
                                ))}
                                {report.verifiedBy.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-600 text-white">
                                    +{report.verifiedBy.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {/* User verification button */}
                          {!hasVerified && report.status === 'active' && (
                            <button
                              onClick={() => verifyReport(report._id)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Verify This Report
                            </button>
                          )}
                          
                          {/* Admin actions */}
                          {user.role === 'admin' && (
                            <>
                              <button
                                onClick={() => markAsCritical(report._id, report.critical)}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                  report.critical ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'
                                }`}
                              >
                                {report.critical ? 'Mark Normal' : 'Mark Critical'}
                              </button>
                              
                              {report.status === 'active' && (
                                <button
                                  onClick={() => resolveReport(report._id)}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Report owner can mark as resolved */}
                          {isMyReport && report.status === 'active' && (
                            <button
                              onClick={() => resolveReport(report._id)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadReports;