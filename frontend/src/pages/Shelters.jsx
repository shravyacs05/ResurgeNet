// components/Shelters.js
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

// Custom marker icons
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const editIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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

// Occupancy Modal Component
const OccupancyModal = ({ shelter, onClose, onUpdate }) => {
  const [newOccupancy, setNewOccupancy] = useState(shelter?.occupied || 0);

  const handleSetOccupancy = () => {
    if (newOccupancy < 0 || newOccupancy > shelter.capacity) {
      setError('Occupancy must be between 0 and capacity');
      return;
    }
    onUpdate(shelter._id, newOccupancy);
    onClose();
  };

  if (!shelter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Set Occupancy for {shelter.name}
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Occupancy: {shelter.occupied}/{shelter.capacity}
          </label>
          <input
            type="number"
            min="0"
            max={shelter.capacity}
            value={newOccupancy}
            onChange={(e) => setNewOccupancy(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new occupancy"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter a number between 0 and {shelter.capacity}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setNewOccupancy(0)}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-sm transition-colors"
          >
            Empty
          </button>
          <button
            onClick={() => setNewOccupancy(Math.floor(shelter.capacity / 2))}
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm transition-colors"
          >
            Half
          </button>
          <button
            onClick={() => setNewOccupancy(shelter.capacity)}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm transition-colors"
          >
            Full
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSetOccupancy}
            disabled={newOccupancy < 0 || newOccupancy > shelter.capacity}
            className="flex-1 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Occupancy
          </button>
        </div>
      </div>
    </div>
  );
};

const Shelters = ({ user }) => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMyShelters, setShowMyShelters] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);
  const [newShelter, setNewShelter] = useState({
    name: '',
    location: '',
    capacity: '',
    facilities: [],
    contact: '',
    coordinates: { lat: '', lng: '' }
  });
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [filterFacilities, setFilterFacilities] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lng: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);

  const API_BASE_URL = 'http://localhost:5002/api';

  const facilityOptions = ['Food', 'Water', 'Medical', 'Beds', 'Sanitation', 'Electricity', 'WiFi', 'Childcare', 'Accessibility'];

  // Default center (New York)
  const defaultCenter = [40.7128, -74.0060];

  // Fetch shelters from backend
  const fetchShelters = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterVerified !== 'all') params.append('verified', filterVerified);
      if (filterFacilities.length > 0) {
        filterFacilities.forEach(facility => params.append('facilities', facility));
      }
      params.append('sortBy', sortBy);
      params.append('limit', 50);

      const response = await fetch(`${API_BASE_URL}/shelters?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shelters');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShelters(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch shelters');
      }
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setError(err.message || 'Failed to load shelters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's shelters
  const fetchMyShelters = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching my shelters for user:', user);

      const response = await fetch(`${API_BASE_URL}/shelters/my-shelters`, {
        headers: {
          'user-id': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
        throw new Error('Failed to fetch your shelters');
      }

      const result = await response.json();
      console.log('🔍 Backend response:', result);

      if (result.success) {
        console.log('✅ Shelters found:', result.data.length);
        setShelters(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch your shelters');
      }
    } catch (err) {
      console.error('❌ Error fetching user shelters:', err);
      setError(err.message || 'Failed to load your shelters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update shelter occupancy (for shelter creators)
  // Add these functions to your Shelters component

// Update creator occupancy with change value
const updateCreatorOccupancy = async (id, change) => {
  try {
    setError('');
    
    const response = await fetch(`${API_BASE_URL}/shelters/${id}/creator-occupancy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user.id
      },
      body: JSON.stringify({ change })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update occupancy');
    }

    // Update local state with the updated shelter
    setShelters(prevShelters => 
      prevShelters.map(shelter => 
        shelter._id === id ? result.data : shelter
      )
    );
    
  } catch (err) {
    console.error('Error updating creator occupancy:', err);
    setError(err.message || 'Failed to update occupancy. Please try again.');
  }
};

// Set exact occupancy value
const setExactOccupancy = async (id, occupancy) => {
  try {
    setError('');
    
    const response = await fetch(`${API_BASE_URL}/shelters/${id}/set-occupancy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user.id
      },
      body: JSON.stringify({ occupancy })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to set occupancy');
    }

    // Update local state with the updated shelter
    setShelters(prevShelters => 
      prevShelters.map(shelter => 
        shelter._id === id ? result.data : shelter
      )
    );
    
  } catch (err) {
    console.error('Error setting exact occupancy:', err);
    setError(err.message || 'Failed to set occupancy. Please try again.');
  }
};

// Bulk occupancy operations
const bulkOccupancyOperation = async (id, operation, value) => {
  try {
    setError('');
    
    const response = await fetch(`${API_BASE_URL}/shelters/${id}/bulk-occupancy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'user-id': user.id
      },
      body: JSON.stringify({ operation, value })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update occupancy');
    }

    // Update local state with the updated shelter
    setShelters(prevShelters => 
      prevShelters.map(shelter => 
        shelter._id === id ? result.data : shelter
      )
    );
    
  } catch (err) {
    console.error('Error in bulk occupancy operation:', err);
    setError(err.message || 'Failed to update occupancy. Please try again.');
  }
};

  // Update shelter occupancy (admin only)
  const updateOccupancy = async (id, change) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/${id}/occupancy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ change })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update occupancy');
      }

      // Update local state with the updated shelter
      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === id ? result.data : shelter
        )
      );
      
    } catch (err) {
      console.error('Error updating occupancy:', err);
      setError(err.message || 'Failed to update occupancy. Please try again.');
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    if (showMyShelters && user) {
      fetchMyShelters();
    } else {
      fetchShelters();
    }
  }, [searchTerm, filterVerified, filterFacilities, sortBy, showMyShelters, user]);

  // Get user's current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditing && editingShelter) {
      setEditingShelter({
        ...editingShelter,
        [name]: value
      });
    } else {
      setNewShelter({
        ...newShelter,
        [name]: value
      });
    }
  };

  const handleFacilityToggle = (facility) => {
    if (isEditing && editingShelter) {
      const currentFacilities = editingShelter.facilities || [];
      const updatedFacilities = currentFacilities.includes(facility)
        ? currentFacilities.filter(f => f !== facility)
        : [...currentFacilities, facility];
      
      setEditingShelter({
        ...editingShelter,
        facilities: updatedFacilities
      });
    } else {
      if (selectedFacilities.includes(facility)) {
        setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
      } else {
        setSelectedFacilities([...selectedFacilities, facility]);
      }
    }
  };

  const handleFilterFacilityToggle = (facility) => {
    if (filterFacilities.includes(facility)) {
      setFilterFacilities(filterFacilities.filter(f => f !== facility));
    } else {
      setFilterFacilities([...filterFacilities, facility]);
    }
  };

  // Open map for coordinate selection
  const openMapPicker = () => {
    setShowMapPicker(true);
    // If we already have coordinates, use them as initial position
    const currentCoords = isEditing && editingShelter ? editingShelter.coordinates : newShelter.coordinates;
    if (currentCoords.lat && currentCoords.lng) {
      setMapCoordinates({
        lat: parseFloat(currentCoords.lat),
        lng: parseFloat(currentCoords.lng)
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
    
    // Update the appropriate form with selected coordinates
    if (isEditing && editingShelter) {
      setEditingShelter(prev => ({
        ...prev,
        coordinates: { lat: lat.toString(), lng: lng.toString() }
      }));
    } else {
      setNewShelter(prev => ({
        ...prev,
        coordinates: { lat: lat.toString(), lng: lng.toString() }
      }));
    }
  };

  // Close map picker and apply coordinates
  const applyMapSelection = () => {
    setShowMapPicker(false);
  };

  // Cancel map selection
  const cancelMapSelection = () => {
    setShowMapPicker(false);
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
          
          // If we're adding/editing a shelter and no coordinates are set, use current location
          if ((showAddForm || isEditing) && !newShelter.coordinates.lat && !editingShelter?.coordinates.lat) {
            if (isEditing && editingShelter) {
              setEditingShelter(prev => ({
                ...prev,
                coordinates: {
                  lat: lat.toString(),
                  lng: lng.toString()
                }
              }));
            } else {
              setNewShelter(prev => ({
                ...prev,
                coordinates: {
                  lat: lat.toString(),
                  lng: lng.toString()
                }
              }));
            }
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

  const handleSubmitShelter = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validate coordinates
      const coordinates = isEditing && editingShelter ? editingShelter.coordinates : newShelter.coordinates;
      if (!coordinates.lat || !coordinates.lng) {
        throw new Error('Please select a location on the map');
      }

      const shelterData = {
        name: isEditing ? editingShelter.name : newShelter.name,
        location: isEditing ? editingShelter.location : newShelter.location,
        capacity: parseInt(isEditing ? editingShelter.capacity : newShelter.capacity),
        facilities: isEditing ? editingShelter.facilities : selectedFacilities,
        contact: isEditing ? editingShelter.contact : newShelter.contact,
        coordinates: {
          lat: parseFloat(coordinates.lat),
          lng: parseFloat(coordinates.lng)
        }
      };

      const url = isEditing ? `${API_BASE_URL}/shelters/${editingShelter._id}` : `${API_BASE_URL}/shelters`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(shelterData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} shelter`);
      }

      // Refresh shelters list
      if (showMyShelters) {
        await fetchMyShelters();
      } else {
        await fetchShelters();
      }
      
      // Reset form
      setNewShelter({ name: '', location: '', capacity: '', facilities: [], contact: '', coordinates: { lat: '', lng: '' } });
      setSelectedFacilities([]);
      setShowAddForm(false);
      setEditingShelter(null);
      setIsEditing(false);
      setMapCoordinates({ lat: null, lng: null });
      
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} shelter:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} shelter. Please try again.`);
    }
  };

  // Navigate to shelter location
  const navigateToShelter = (shelter) => {
    if (shelter.coordinates && shelter.coordinates.lat && shelter.coordinates.lng) {
      const { lat, lng } = shelter.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      setError('No coordinates available for navigation');
    }
  };

  // Edit shelter
  const handleEditShelter = (shelter) => {
    setEditingShelter({
      ...shelter,
      capacity: shelter.capacity.toString(),
      coordinates: {
        lat: shelter.coordinates?.lat?.toString() || '',
        lng: shelter.coordinates?.lng?.toString() || ''
      }
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingShelter(null);
    setIsEditing(false);
    setShowAddForm(false);
    setNewShelter({ name: '', location: '', capacity: '', facilities: [], contact: '', coordinates: { lat: '', lng: '' } });
    setSelectedFacilities([]);
  };

  // Delete shelter
  const handleDeleteShelter = async (shelterId) => {
    if (!window.confirm('Are you sure you want to delete this shelter? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete shelter');
      }

      // Refresh shelters list
      if (showMyShelters) {
        await fetchMyShelters();
      } else {
        await fetchShelters();
      }
      
    } catch (err) {
      console.error('Error deleting shelter:', err);
      setError(err.message || 'Failed to delete shelter. Please try again.');
    }
  };

  const toggleVerification = async (id) => {
    if (user?.role !== 'admin') return;
    
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/${id}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update verification');
      }

      // Update local state with the updated shelter
      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === id ? result.data : shelter
        )
      );
      
    } catch (err) {
      console.error('Error updating verification:', err);
      setError(err.message || 'Failed to update verification. Please try again.');
    }
  };

  const getAvailabilityStatus = (occupied, capacity) => {
    const percentage = (occupied / capacity) * 100;
    if (percentage >= 90) return { text: 'Almost Full', color: 'bg-red-500', textColor: 'text-red-400' };
    if (percentage >= 70) return { text: 'Limited Space', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    if (percentage >= 50) return { text: 'Moderate', color: 'bg-orange-500', textColor: 'text-orange-400' };
    return { text: 'Available', color: 'bg-green-500', textColor: 'text-green-400' };
  };

  // Get current form data based on mode
  const getCurrentFormData = () => {
    return isEditing && editingShelter ? editingShelter : newShelter;
  };

  // Get current facilities based on mode
  const getCurrentFacilities = () => {
    return isEditing && editingShelter ? editingShelter.facilities : selectedFacilities;
  };

  // Filter shelters client-side for complex filters that aren't handled by backend
  const filteredShelters = shelters.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         shelter.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerified = filterVerified === 'all' || 
                           (filterVerified === 'verified' && shelter.verified) ||
                           (filterVerified === 'unverified' && !shelter.verified);
    const matchesFacilities = filterFacilities.length === 0 || 
                             filterFacilities.every(facility => shelter.facilities.includes(facility));
    
    return matchesSearch && matchesVerified && matchesFacilities;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Shelter Location</h3>
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
                      icon={isEditing ? editIcon : customIcon}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <div className="text-sm text-gray-300">
                <p className="mb-2">Click on the map to select the shelter location. A marker will appear at your selected position.</p>
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

      {/* Occupancy Modal */}
      {showOccupancyModal && (
        <OccupancyModal
          shelter={selectedShelter}
          onClose={() => {
            setShowOccupancyModal(false);
            setSelectedShelter(null);
          }}
          onUpdate={updateCreatorOccupancy}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {showMyShelters ? 'My Shelters' : 'Emergency Shelters'}
          </h1>
          <p className="text-gray-400 mt-1">
            {showMyShelters ? 'Manage your uploaded shelters' : 'Find safe places with available resources'}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          {user && (
            <button
              onClick={() => setShowMyShelters(!showMyShelters)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                showMyShelters 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {showMyShelters ? 'All Shelters' : 'My Shelters'}
            </button>
          )}
          <button
            onClick={() => {
              if (isEditing) {
                cancelEdit();
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {isEditing ? 'Cancel Edit' : showAddForm ? 'Cancel' : 'Add New Shelter'}
          </button>
        </div>
      </div>
      
      {/* Filters and Search - Only show when not viewing My Shelters */}
      {!showMyShelters && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Search Shelters</label>
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Verification Status</label>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Shelters</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="capacity">Capacity</option>
                <option value="availability">Availability</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Filter by Facilities</label>
            <div className="flex flex-wrap gap-2">
              {facilityOptions.map(facility => (
                <button
                  key={facility}
                  type="button"
                  onClick={() => handleFilterFacilityToggle(facility)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterFacilities.includes(facility)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {facility}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Shelter Form */}
      {(showAddForm || isEditing) && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Edit Shelter' : 'Add New Shelter'}
          </h3>
          <form onSubmit={handleSubmitShelter}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Shelter Name</label>
                <input
                  type="text"
                  name="name"
                  value={getCurrentFormData().name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter shelter name"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={getCurrentFormData().location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location address"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={getCurrentFormData().capacity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter capacity"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Contact Information</label>
                <input
                  type="text"
                  name="contact"
                  value={getCurrentFormData().contact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact information"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Location Coordinates</label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={getCurrentFormData().coordinates.lat || ''}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400"
                      placeholder="Latitude (select from map)"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={getCurrentFormData().coordinates.lng || ''}
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
                  Click "Select from Map" to choose the shelter location on an interactive map
                </p>
                {getCurrentFormData().coordinates.lat && (
                  <p className="text-sm text-green-400 mt-1">
                    Location selected: {parseFloat(getCurrentFormData().coordinates.lat).toFixed(6)}, {parseFloat(getCurrentFormData().coordinates.lng).toFixed(6)}
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Facilities</label>
                <div className="flex flex-wrap gap-2">
                  {facilityOptions.map(facility => (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => handleFacilityToggle(facility)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getCurrentFacilities().includes(facility)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {facility}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors"
                disabled={!getCurrentFormData().coordinates.lat || !getCurrentFormData().coordinates.lng}
              >
                {isEditing ? 'Update Shelter' : 'Add Shelter'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-white transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      
      {/* Shelters Grid */}
      {filteredShelters.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {showMyShelters ? 'No shelters found' : 'No shelters found'}
          </h3>
          <p className="text-gray-500">
            {showMyShelters ? "You haven't uploaded any shelters yet." : 'Try adjusting your search or filters'}
          </p>
          {showMyShelters && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors"
            >
              Add Your First Shelter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShelters.map((shelter) => {
            const availability = getAvailabilityStatus(shelter.occupied, shelter.capacity);
            const isOwner = user && shelter.createdBy === user.id;
            
            return (
              <div key={shelter._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 transition-transform hover:translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{shelter.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{shelter.location}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {shelter.verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
                          Pending
                        </span>
                      )}
                      {isOwner && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                          Your Shelter
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced Capacity Section with Creator Controls */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Capacity</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">{shelter.occupied}/{shelter.capacity}</span>
                        {isOwner && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateCreatorOccupancy(shelter._id, -1)}
                              disabled={shelter.occupied <= 0}
                              className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Decrease occupancy"
                            >
                              -
                            </button>
                            <button
                              onClick={() => updateCreatorOccupancy(shelter._id, 1)}
                              disabled={shelter.occupied >= shelter.capacity}
                              className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-500 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Increase occupancy"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${availability.color}`}
                        style={{ width: `${(shelter.occupied / shelter.capacity) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {shelter.capacity - shelter.occupied} spots available
                      </span>
                      <span className={`text-xs font-medium ${availability.textColor}`}>
                        {availability.text}
                      </span>
                    </div>

                    {/* Quick Actions for Creators */}
                    {isOwner && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="flex justify-between space-x-2">
                          <button
                            onClick={() => updateCreatorOccupancy(shelter._id, -5)}
                            disabled={shelter.occupied < 5}
                            className="flex-1 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => updateCreatorOccupancy(shelter._id, -1)}
                            disabled={shelter.occupied <= 0}
                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShelter(shelter);
                              setShowOccupancyModal(true);
                            }}
                            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs transition-colors"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => updateCreatorOccupancy(shelter._id, 1)}
                            disabled={shelter.occupied >= shelter.capacity}
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => updateCreatorOccupancy(shelter._id, 5)}
                            disabled={shelter.occupied + 5 > shelter.capacity}
                            className="flex-1 px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-white text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {shelter.facilities.map(facility => (
                        <span key={facility} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {shelter.contact && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300">Contact</h4>
                      <p className="text-sm text-gray-400">{shelter.contact}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Updated {new Date(shelter.lastUpdated).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-700 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => updateOccupancy(shelter._id, 1)}
                            disabled={shelter.occupied >= shelter.capacity}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded-md text-white text-xs transition-colors disabled:opacity-50"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => updateOccupancy(shelter._id, -1)}
                            disabled={shelter.occupied <= 0}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-md text-white text-xs transition-colors disabled:opacity-50"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => toggleVerification(shelter._id)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-white text-xs transition-colors"
                          >
                            {shelter.verified ? 'Unverify' : 'Verify'}
                          </button>
                        </>
                      )}
                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleEditShelter(shelter)}
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded-md text-white text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteShelter(shelter._id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-md text-white text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => navigateToShelter(shelter)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-md text-white text-sm transition-colors flex items-center"
                      disabled={!shelter.coordinates || !shelter.coordinates.lat}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Navigate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shelters;