// components/MapView.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const icons = {
  sos: createCustomIcon('#ef4444'), // red-500
  shelter: createCustomIcon('#10b981'), // green-500
  road: createCustomIcon('#f59e0b'), // yellow-500
  user: createCustomIcon('#3b82f6'), // blue-500
};

// Component to handle map view changes
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapView = ({ user }) => {
  const [userLocation, setUserLocation] = useState([19.0760, 72.8777]); // Default to Mumbai
  const [sosMarkers, setSosMarkers] = useState([]);
  const [shelterMarkers, setShelterMarkers] = useState([]);
  const [roadMarkers, setRoadMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  // Get auth headers
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (user && user.uid) {
      headers['user-id'] = user.uid;
    }
    
    if (user && user.accessToken) {
      headers['Authorization'] = `Bearer ${user.accessToken}`;
    }
    
    return headers;
  };

  // Fetch real data from backend
  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch shelters with location data
      const sheltersResponse = await fetch(`${API_BASE_URL}/shelters?limit=100`, {
        headers: getAuthHeaders()
      });

      if (sheltersResponse.ok) {
        const sheltersResult = await sheltersResponse.json();
        if (sheltersResult.success) {
          const sheltersWithLocation = sheltersResult.data.filter(shelter => 
            shelter.coordinates && shelter.coordinates.lat && shelter.coordinates.lng
          ).map(shelter => ({
            id: shelter._id,
            type: 'shelter',
            position: [shelter.coordinates.lat, shelter.coordinates.lng],
            name: shelter.name,
            location: shelter.location,
            capacity: `${shelter.occupied}/${shelter.capacity}`,
            facilities: Array.isArray(shelter.facilities) ? shelter.facilities.join(', ') : 'Basic amenities',
            contact: shelter.contact,
            verified: shelter.verified
          }));
          setShelterMarkers(sheltersWithLocation);
        }
      }

      // Fetch SOS alerts from backend
      const sosResponse = await fetch(`${API_BASE_URL}/sos/department/emergency_response?status=active&limit=50`, {
        headers: getAuthHeaders()
      });

      if (sosResponse.ok) {
        const sosResult = await sosResponse.json();
        if (sosResult.success) {
          const sosWithLocation = sosResult.alerts.filter(alert => 
            alert.location && alert.location.lat && alert.location.lng
          ).map(alert => ({
            id: alert._id,
            type: 'sos',
            position: [alert.location.lat, alert.location.lng],
            emergencyType: alert.emergencyType,
            message: alert.message,
            userName: alert.userName,
            userPhone: alert.userPhone,
            severity: alert.mlClassification?.urgencyLevel || alert.severity,
            status: alert.status,
            location: alert.location,
            peopleAffected: alert.peopleAffected,
            description: alert.description,
            createdAt: alert.createdAt,
            verified: alert.verified
          }));
          setSosMarkers(sosWithLocation);
        }
      } else {
        console.error('Failed to fetch SOS alerts:', sosResponse.status);
      }

      // Fetch road reports from backend
      const roadReportsResponse = await fetch(`${API_BASE_URL}/road-reports?limit=100&status=active`, {
        headers: getAuthHeaders()
      });

      if (roadReportsResponse.ok) {
        const roadReportsResult = await roadReportsResponse.json();
        if (roadReportsResult.success) {
          const roadReportsWithLocation = roadReportsResult.data.filter(report => 
            report.coordinates && report.coordinates.lat && report.coordinates.lng
          ).map(report => ({
            id: report._id,
            type: 'road',
            position: [report.coordinates.lat, report.coordinates.lng],
            status: report.type === 'blocked' ? 'blocked' : 'clear',
            reportedBy: report.reporterName,
            description: report.description,
            severity: report.critical ? 'high' : 'medium',
            critical: report.critical,
            verified: report.verified,
            verifications: report.verifications,
            location: report.location,
            createdAt: report.createdAt,
            views: report.views
          }));
          setRoadMarkers(roadReportsWithLocation);
        }
      } else {
        console.error('Failed to fetch road reports:', roadReportsResponse.status);
      }

    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  // Get user's actual location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Keep default Mumbai location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  };

  // Handle SOS alert actions
  const handleSOSAction = async (alertId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sos/${alertId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: action,
          adminId: user?.uid,
          adminName: user?.displayName || 'Admin'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`SOS alert ${action} successfully`);
          fetchMapData(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Error updating SOS alert:', error);
      alert('Failed to update SOS alert');
    }
  };

  // Handle road report actions
  const handleRoadReportAction = async (reportId, action) => {
    try {
      let url = `${API_BASE_URL}/road-reports/${reportId}`;
      let method = 'PATCH';
      let body = {};

      if (action === 'verify') {
        url = `${API_BASE_URL}/road-reports/${reportId}/verify`;
        method = 'POST';
        body = { userId: user?.uid };
      } else if (action === 'critical') {
        url = `${API_BASE_URL}/road-reports/${reportId}/critical`;
        body = { markedCriticalBy: user?.uid };
      } else if (action === 'resolve') {
        url = `${API_BASE_URL}/road-reports/${reportId}/resolve`;
        body = { resolvedBy: user?.uid, resolutionNotes: 'Marked as resolved via map' };
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Road report ${action} successfully`);
          fetchMapData(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Error updating road report:', error);
      alert('Failed to update road report');
    }
  };

  useEffect(() => {
    fetchMapData();
    getUserLocation();
  }, []);

  // Render marker based on type
  const renderMarker = (marker) => {
    let icon;
    let popupContent;

    switch (marker.type) {
      case 'sos':
        icon = icons.sos;
        popupContent = (
          <div className="p-2 max-w-xs">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <h3 className="font-bold text-red-700">SOS Alert</h3>
              {marker.verified && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm font-medium">{marker.userName}</p>
            <p className="text-sm text-gray-600 capitalize">{marker.emergencyType}</p>
            <p className="text-sm mt-1">{marker.message}</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Phone: {marker.userPhone}</p>
              <p>Status: <span className="capitalize">{marker.status}</span></p>
              <p>Severity: <span className="capitalize">{marker.severity}</span></p>
              <p>People Affected: {marker.peopleAffected}</p>
              {marker.location && <p>Location: {marker.location.address}</p>}
            </div>
            <div className="mt-2 space-y-1">
              <button 
                onClick={() => handleSOSAction(marker.id, 'verified')}
                className="w-full bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Verify Alert
              </button>
              <button 
                onClick={() => handleSOSAction(marker.id, 'in_progress')}
                className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
              >
                Mark In Progress
              </button>
              <button 
                onClick={() => handleSOSAction(marker.id, 'resolved')}
                className="w-full bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        );
        break;

      case 'shelter':
        icon = icons.shelter;
        popupContent = (
          <div className="p-2 max-w-xs">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-bold text-green-700">Shelter</h3>
              {marker.verified && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm font-medium">{marker.name}</p>
            <p className="text-sm text-gray-600">{marker.location}</p>
            <div className="mt-2 text-xs">
              <p className="text-gray-700">Capacity: {marker.capacity}</p>
              <p className="text-gray-600">Facilities: {marker.facilities}</p>
              {marker.contact && <p className="text-gray-600">Contact: {marker.contact}</p>}
            </div>
            <button className="mt-2 w-full bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600">
              View Details
            </button>
          </div>
        );
        break;

      case 'road':
        icon = icons.road;
        const isBlocked = marker.status === 'blocked';
        popupContent = (
          <div className="p-2 max-w-xs">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <h3 className="font-bold text-yellow-700">
                {isBlocked ? 'Road Blocked' : 'Road Clear'}
              </h3>
              {marker.verified && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Verified
                </span>
              )}
              {marker.critical && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  Critical
                </span>
              )}
            </div>
            <p className="text-sm">{marker.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Reported by: {marker.reportedBy}</p>
              <p>Severity: {marker.severity}</p>
              <p>Verifications: {marker.verifications}</p>
              <p>Views: {marker.views}</p>
            </div>
            <div className="mt-2 space-y-1">
              <button 
                onClick={() => handleRoadReportAction(marker.id, 'verify')}
                className="w-full bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Verify Report
              </button>
              <button 
                onClick={() => handleRoadReportAction(marker.id, 'critical')}
                className="w-full bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
              >
                {marker.critical ? 'Unmark Critical' : 'Mark Critical'}
              </button>
              <button 
                onClick={() => handleRoadReportAction(marker.id, 'resolve')}
                className="w-full bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <Marker
        key={marker.id}
        position={marker.position}
        icon={icon}
        eventHandlers={{
          click: () => setSelectedMarker(marker),
        }}
      >
        <Popup>{popupContent}</Popup>
      </Marker>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-white mb-6">Live Map View</h2>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    SOS Alerts ({sosMarkers.length})
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Shelters ({shelterMarkers.length})
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                    Road Reports ({roadMarkers.length})
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    Your Location
                  </span>
                </div>
              </div>
              
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={userLocation}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapController center={userLocation} />
                  
                  {/* User location marker */}
                  <Marker position={userLocation} icon={icons.user}>
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <h3 className="font-bold text-blue-700">Your Location</h3>
                        </div>
                        <p className="text-sm">You are here</p>
                        <p className="text-xs text-gray-500">
                          {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* User location accuracy circle */}
                  <Circle
                    center={userLocation}
                    radius={100} // 100 meters radius for location accuracy
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                  />

                  {/* Render all markers */}
                  {sosMarkers.map(renderMarker)}
                  {shelterMarkers.map(renderMarker)}
                  {roadMarkers.map(renderMarker)}
                </MapContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-500 rounded-md p-2">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{sosMarkers.length}</p>
                      <p className="text-sm text-gray-400">Active SOS</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{shelterMarkers.length}</p>
                      <p className="text-sm text-gray-400">Shelters</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{roadMarkers.length}</p>
                      <p className="text-sm text-gray-400">Road Reports</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {selectedMarker ? (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Marker Details</h3>
                
                {selectedMarker.type === 'sos' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-red-500 rounded-md p-2">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">SOS Alert</p>
                        <p className="text-sm text-gray-400">Priority: {selectedMarker.severity}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Reported by:</span> {selectedMarker.userName}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Emergency:</span> {selectedMarker.emergencyType}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Phone:</span> {selectedMarker.userPhone}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Status:</span> {selectedMarker.status}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">People Affected:</span> {selectedMarker.peopleAffected}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Location:</span> {selectedMarker.position[0].toFixed(4)}, {selectedMarker.position[1].toFixed(4)}</p>
                      <p className="text-sm text-gray-400 mt-2">{selectedMarker.message}</p>
                      {selectedMarker.description && (
                        <p className="text-sm text-gray-400 mt-2">{selectedMarker.description}</p>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button 
                        onClick={() => handleSOSAction(selectedMarker.id, 'verified')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Verify Alert
                      </button>
                      <button 
                        onClick={() => handleSOSAction(selectedMarker.id, 'in_progress')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Mark In Progress
                      </button>
                      <button 
                        onClick={() => handleSOSAction(selectedMarker.id, 'resolved')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedMarker.type === 'shelter' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">Shelter</p>
                        <p className="text-sm text-gray-400">Capacity: {selectedMarker.capacity}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">{selectedMarker.name}</p>
                      <p className="text-sm text-gray-400">{selectedMarker.location}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Facilities:</span> {selectedMarker.facilities}</p>
                      {selectedMarker.contact && <p className="text-sm text-gray-400"><span className="font-medium text-white">Contact:</span> {selectedMarker.contact}</p>}
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Location:</span> {selectedMarker.position[0].toFixed(4)}, {selectedMarker.position[1].toFixed(4)}</p>
                      {selectedMarker.verified && (
                        <p className="text-sm text-green-400 font-medium">✓ Verified Shelter</p>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Navigate to Shelter
                      </button>
                      <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Share Location
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedMarker.type === 'road' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">
                          {selectedMarker.status === 'blocked' ? 'Road Blocked' : 'Road Clear'}
                        </p>
                        <p className="text-sm text-gray-400">Severity: {selectedMarker.severity}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Reported by:</span> {selectedMarker.reportedBy}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Status:</span> {selectedMarker.status}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Location:</span> {selectedMarker.position[0].toFixed(4)}, {selectedMarker.position[1].toFixed(4)}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Verifications:</span> {selectedMarker.verifications}</p>
                      <p className="text-sm text-gray-400"><span className="font-medium text-white">Views:</span> {selectedMarker.views}</p>
                      <p className="text-sm text-gray-400 mt-2">{selectedMarker.description}</p>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button 
                        onClick={() => handleRoadReportAction(selectedMarker.id, 'verify')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Verify Report
                      </button>
                      <button 
                        onClick={() => handleRoadReportAction(selectedMarker.id, 'critical')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {selectedMarker.critical ? 'Unmark Critical' : 'Mark Critical'}
                      </button>
                      <button 
                        onClick={() => handleRoadReportAction(selectedMarker.id, 'resolve')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <button 
                    onClick={() => setSelectedMarker(null)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Map Legend</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">SOS Alerts</p>
                      <p className="text-sm text-gray-400">Emergency requests for help</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">Shelters</p>
                      <p className="text-sm text-gray-400">Safe locations with resources</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">Road Reports</p>
                      <p className="text-sm text-gray-400">Road condition information</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">Your Location</p>
                      <p className="text-sm text-gray-400">Where you are currently</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-white mb-2">Map Instructions</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Click on any marker to see details and take action. Use the map controls to zoom and pan.
                  </p>
                  <p className="text-sm text-gray-400">
                    Real-time data from shelters, SOS alerts, and road reports is displayed with live updates.
                  </p>
                </div>

                <div className="mt-4">
                  <button 
                    onClick={fetchMapData}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;