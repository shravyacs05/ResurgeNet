// components/admin/SheltersManagement.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component for map click handling in edit modal
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const SheltersManagement = ({ user }) => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingShelter, setEditingShelter] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [mapPosition, setMapPosition] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (user && user.uid) {
      headers['user-id'] = user.uid;
    } else {
      headers['user-id'] = 'admin_superadmin_emergency_gov';
    }
    
    if (user && user.accessToken) {
      headers['Authorization'] = `Bearer ${user.accessToken}`;
    }
    
    console.log('🔐 Sending auth headers for admin:', headers);
    return headers;
  };

  const API_BASE_URL = 'http://localhost:5002/api';

  // Fetch shelters
  const fetchShelters = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/admin/shelters`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error('Failed to fetch shelters');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShelters(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch shelters');
      }
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setError(err.message || 'Failed to load shelters');
    } finally {
      setLoading(false);
    }
  };

  // Update shelter occupancy
  const updateShelterOccupancy = async (shelterId, change) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/admin/${shelterId}/creator-occupancy`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ change: parseInt(change) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update occupancy');
      }

      const result = await response.json();

      if (result.success) {
        setShelters(prevShelters => 
          prevShelters.map(shelter => 
            shelter._id === shelterId ? result.data : shelter
          )
        );
      } else {
        throw new Error(result.message || 'Failed to update occupancy');
      }
      
    } catch (err) {
      console.error('Error updating shelter occupancy:', err);
      setError(err.message || 'Failed to update occupancy. Please try again.');
    }
  };

  // Toggle shelter verification
  const toggleShelterVerification = async (shelterId) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/shelters/admin/${shelterId}/verification`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shelter verification');
      }

      const result = await response.json();

      if (result.success) {
        setShelters(prevShelters => 
          prevShelters.map(shelter => 
            shelter._id === shelterId ? result.data : shelter
          )
        );
      } else {
        throw new Error(result.message || 'Failed to update shelter verification');
      }
      
    } catch (err) {
      console.error('Error updating shelter verification:', err);
      setError(err.message || 'Failed to update shelter verification');
    }
  };

  // Delete shelter
  const deleteShelter = async (shelterId) => {
    if (!window.confirm('Are you sure you want to delete this shelter?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/shelters/admin/${shelterId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete shelter');
      }

      const result = await response.json();

      if (result.success) {
        setShelters(prevShelters => 
          prevShelters.filter(shelter => shelter._id !== shelterId)
        );
      } else {
        throw new Error(result.message || 'Failed to delete shelter');
      }
      
    } catch (err) {
      console.error('Error deleting shelter:', err);
      setError(err.message || 'Failed to delete shelter');
    }
  };

  // Start editing shelter
  const startEditing = (shelter) => {
    setEditingShelter(shelter);
    const coordinates = shelter.coordinates ? { ...shelter.coordinates } : { lat: 0, lng: 0 };
    setEditForm({
      name: shelter.name || '',
      location: shelter.location || '',
      capacity: shelter.capacity || 0,
      contact: shelter.contact || '',
      facilities: Array.isArray(shelter.facilities) ? shelter.facilities.join(', ') : '',
      coordinates: coordinates
    });
    // Set initial map position
    if (coordinates.lat && coordinates.lng) {
      setMapPosition([coordinates.lat, coordinates.lng]);
    } else {
      setMapPosition([20.5937, 78.9629]); // Default to India center
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingShelter(null);
    setEditForm({});
    setMapPosition(null);
    setShowMapPicker(false);
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle coordinate selection from map
  const handleMapCoordinateSelect = (latlng) => {
    setEditForm(prev => ({
      ...prev,
      coordinates: {
        lat: latlng.lat,
        lng: latlng.lng
      }
    }));
  };

  // Open map picker
  const openMapPicker = () => {
    setShowMapPicker(true);
  };

  // Close map picker
  const closeMapPicker = () => {
    setShowMapPicker(false);
  };

  // Save shelter edits
  const saveShelterEdit = async () => {
    try {
      setError('');
      
      // Prepare the data for update
      const updatedData = {
        name: editForm.name,
        location: editForm.location,
        capacity: parseInt(editForm.capacity),
        contact: editForm.contact,
        facilities: editForm.facilities.split(',').map(f => f.trim()).filter(f => f),
        coordinates: {
          lat: parseFloat(editForm.coordinates.lat) || 0,
          lng: parseFloat(editForm.coordinates.lng) || 0
        }
      };

      // Remove undefined fields
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined || updatedData[key] === null) {
          delete updatedData[key];
        }
      });

      const response = await fetch(`${API_BASE_URL}/shelters/admin/${editingShelter._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setShelters(prevShelters => 
          prevShelters.map(shelter => 
            shelter._id === editingShelter._id ? result.data : shelter
          )
        );
        
        setEditingShelter(null);
        setEditForm({});
        setMapPosition(null);
        setShowMapPicker(false);
      } else {
        throw new Error(result.message || 'Failed to update shelter');
      }
      
    } catch (err) {
      console.error('Error saving shelter edit:', err);
      setError(err.message || 'Failed to save shelter changes');
    }
  };

  // Set exact occupancy
  const setExactOccupancy = async (shelterId, occupancy) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/admin/${shelterId}/set-occupancy`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ occupancy: parseInt(occupancy) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set occupancy');
      }

      const result = await response.json();

      if (result.success) {
        setShelters(prevShelters => 
          prevShelters.map(shelter => 
            shelter._id === shelterId ? result.data : shelter
          )
        );
      } else {
        throw new Error(result.message || 'Failed to set occupancy');
      }
      
    } catch (err) {
      console.error('Error setting exact occupancy:', err);
      setError(err.message || 'Failed to set occupancy. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get creator name - Now properly using populated creator data
  const getCreatorName = (shelter) => {
    if (shelter.creatorName && shelter.creatorName !== 'Unknown User') {
      return shelter.creatorName;
    }
    // Fallback to createdBy field or unknown
    return shelter.createdBy ? `User ${shelter.createdBy.substring(0, 8)}` : 'Unknown User';
  };

  // Get creator role
  const getCreatorRole = (shelter) => {
    if (shelter.creatorRole && shelter.creatorRole !== 'user') {
      return shelter.creatorRole;
    }
    return 'User';
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
      {/* Edit Modal */}
      {editingShelter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Edit Shelter: {editingShelter.name}</h3>
                <button
                  onClick={cancelEditing}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Shelter Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Location *</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleEditChange('location', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Capacity *</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.capacity}
                        onChange={(e) => handleEditChange('capacity', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Contact</label>
                      <input
                        type="text"
                        value={editForm.contact}
                        onChange={(e) => handleEditChange('contact', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Facilities (comma separated)</label>
                    <input
                      type="text"
                      value={editForm.facilities}
                      onChange={(e) => handleEditChange('facilities', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Food, Water, Medical, Beds"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Latitude *</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="any"
                          value={editForm.coordinates.lat}
                          onChange={(e) => handleEditChange('coordinates', { 
                            ...editForm.coordinates, 
                            lat: e.target.value 
                          })}
                          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Longitude *</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="any"
                          value={editForm.coordinates.lng}
                          onChange={(e) => handleEditChange('coordinates', { 
                            ...editForm.coordinates, 
                            lng: e.target.value 
                          })}
                          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={openMapPicker}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Select Location from Map
                    </button>
                  </div>

                  {/* Creator Information */}
                  <div className="bg-gray-700 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Creator Information</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p><span className="font-medium">Name:</span> {getCreatorName(editingShelter)}</p>
                      <p><span className="font-medium">Role:</span> {getCreatorRole(editingShelter)}</p>
                      {editingShelter.creatorEmail && editingShelter.creatorEmail !== 'Unknown' && (
                        <p><span className="font-medium">Email:</span> {editingShelter.creatorEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Map Preview */}
                <div className="space-y-4">
                  <div className="h-64 rounded-md overflow-hidden">
                    <MapContainer
                      center={mapPosition || [20.5937, 78.9629]}
                      zoom={editForm.coordinates.lat && editForm.coordinates.lng ? 15 : 5}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {editForm.coordinates.lat && editForm.coordinates.lng && (
                        <Marker position={[editForm.coordinates.lat, editForm.coordinates.lng]} />
                      )}
                    </MapContainer>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>Current coordinates:</p>
                    <p className="font-mono">Lat: {editForm.coordinates.lat || 'Not set'}, Lng: {editForm.coordinates.lng || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveShelterEdit}
                  className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Select Shelter Location</h3>
              <button
                onClick={closeMapPicker}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="h-96 w-full rounded-md overflow-hidden">
                <MapContainer
                  center={mapPosition || [20.5937, 78.9629]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker 
                    position={editForm.coordinates.lat && editForm.coordinates.lng ? 
                      [editForm.coordinates.lat, editForm.coordinates.lng] : null} 
                    setPosition={handleMapCoordinateSelect} 
                  />
                </MapContainer>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p>Click on the map to set the shelter location. Current coordinates:</p>
                <p className="font-mono">Lat: {editForm.coordinates.lat || 'Not set'}, Lng: {editForm.coordinates.lng || 'Not set'}</p>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={closeMapPicker}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={closeMapPicker}
                  className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  Use Selected Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the component remains the same */}
      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Shelter Management</h3>
        <div className="flex space-x-2">
          <button 
            onClick={fetchShelters}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-900 text-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
            ×
          </button>
        </div>
      )}

      {loading && shelters.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading shelters...</p>
        </div>
      ) : shelters.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No shelters found</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by creating a new shelter.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {shelters.map((shelter) => (
            <li key={shelter._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-white">
                        {shelter.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {shelter.location} • Capacity: {shelter.occupied}/{shelter.capacity}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shelter.facilities?.slice(0, 3).map((facility, index) => (
                          <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                            {facility}
                          </span>
                        ))}
                        {shelter.facilities?.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                            +{shelter.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        <span>Created by: <strong>{getCreatorName(shelter)}</strong> ({getCreatorRole(shelter)})</span>
                        {shelter.contact && <span className="ml-3">Contact: {shelter.contact}</span>}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        <span>Last updated: {formatDate(shelter.lastUpdated)}</span>
                        {shelter.createdAt && <span className="ml-3">Created: {formatDate(shelter.createdAt)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shelter.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shelter.verified ? 'Verified' : 'Pending'}
                    </span>
                    <button
                      onClick={() => startEditing(shelter)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleShelterVerification(shelter._id)}
                      className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                        shelter.verified ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
                    >
                      {shelter.verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button
                      onClick={() => deleteShelter(shelter._id)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Occupancy Management */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Occupancy</span>
                      <span>{Math.round((shelter.occupied / shelter.capacity) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          shelter.occupied / shelter.capacity > 0.8 ? 'bg-red-600' : 
                          shelter.occupied / shelter.capacity > 0.5 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${(shelter.occupied / shelter.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateShelterOccupancy(shelter._id, 1)}
                        className="flex-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        +1 Occupant
                      </button>
                      <button
                        onClick={() => updateShelterOccupancy(shelter._id, -1)}
                        className="flex-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                      >
                        -1 Occupant
                      </button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={shelter.capacity}
                        placeholder="Set exact"
                        className="flex-1 px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded-md focus:border-blue-500 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.target.value;
                            if (value && !isNaN(value)) {
                              setExactOccupancy(shelter._id, value);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          if (input && input.value && !isNaN(input.value)) {
                            setExactOccupancy(shelter._id, input.value);
                            input.value = '';
                          }
                        }}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Set
                      </button>
                    </div>
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

export default SheltersManagement;