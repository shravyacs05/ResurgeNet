// components/admin/SheltersManagement.jsx
import React, { useState, useEffect } from 'react';

const SheltersManagement = ({ user, getAuthHeaders }) => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  // Fetch shelters
  const fetchShelters = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters?limit=100`, {
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
        setShelters(result.data);
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
      
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}/creator-occupancy`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ change })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update occupancy');
      }

      // Update local state with the updated shelter
      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === shelterId ? result.data : shelter
        )
      );
      
    } catch (err) {
      console.error('Error updating shelter occupancy:', err);
      setError(err.message || 'Failed to update occupancy. Please try again.');
    }
  };

  // Update shelter status
  const updateShelterStatus = async (shelterId, status) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error('Failed to update shelter status');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update shelter status');
      }

      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === shelterId ? result.data : shelter
        )
      );
      
    } catch (err) {
      console.error('Error updating shelter status:', err);
      setError(err.message || 'Failed to update shelter status');
    }
  };

  // Toggle shelter verification
  const toggleShelterVerification = async (shelterId) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}/verification`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error('Failed to update shelter verification');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update shelter verification');
      }

      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === shelterId ? result.data : shelter
        )
      );
      
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
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error('Failed to delete shelter');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete shelter');
      }

      setShelters(prevShelters => 
        prevShelters.filter(shelter => shelter._id !== shelterId)
      );
      
    } catch (err) {
      console.error('Error deleting shelter:', err);
      setError(err.message || 'Failed to delete shelter');
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Shelter Management</h3>
        <div className="flex space-x-2">
          <button 
            onClick={fetchShelters}
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

      {shelters.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No shelters</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by adding a new shelter.</p>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shelter.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shelter.verified ? 'Verified' : 'Pending'}
                    </span>
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
                <div className="mt-2">
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
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => updateShelterOccupancy(shelter._id, 1)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    +1 Occupant
                  </button>
                  <button
                    onClick={() => updateShelterOccupancy(shelter._id, -1)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                  >
                    -1 Occupant
                  </button>
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