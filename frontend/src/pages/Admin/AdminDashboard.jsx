// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import SOSManagement from './SOSManagement';
import RoadsManagement from './RoadsManagement';
import SheltersManagement from './SheltersManagement';
import VolunteerTaskAllotment from './VolunteerTaskAllotment';
import MapView from '../MapView';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sosAlerts, setSosAlerts] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [roadReports, setRoadReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || 'emergency_response');

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeSOS: 0,
    roadReports: 0,
    shelters: 0,
    verifiedReports: 0,
    responseTime: '15min'
  });

  const API_BASE_URL = 'http://localhost:5002/api';

  // Department options
  const departments = [
    { value: 'emergency_response', label: 'Emergency Response' },
    { value: 'medical_health', label: 'Medical & Health' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'relief_shelter', label: 'Relief & Shelter' },
    { value: 'community_safety', label: 'Community Safety' }
  ];

  // Authentication helper function
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add user ID for authentication - use Firebase UID
    if (user && user.uid) {
      headers['user-id'] = user.uid;
    }
    
    // If using Firebase Auth token
    if (user && user.accessToken) {
      headers['Authorization'] = `Bearer ${user.accessToken}`;
    }
    
    console.log('🔐 Sending auth headers for admin:', headers);
    return headers;
  };

  // Enhanced shelter management functions
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

  const setShelterExactOccupancy = async (shelterId, occupancy) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/shelters/${shelterId}/set-occupancy`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ occupancy })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to set occupancy');
      }

      // Update local state with the updated shelter
      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === shelterId ? result.data : shelter
        )
      );
      
    } catch (err) {
      console.error('Error setting exact occupancy:', err);
      setError(err.message || 'Failed to set occupancy. Please try again.');
    }
  };

  // Check if user is admin, if not redirect
  if (user?.role !== 'department_admin') {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-900 text-red-200 p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">Access Denied</h2>
            <p>You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch shelters from backend
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
        setSystemStats(prev => ({
          ...prev,
          shelters: result.data.length
        }));
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

  // Fetch SOS alerts from backend
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
        
        // Update system stats with active SOS count
        setSystemStats(prev => ({
          ...prev,
          activeSOS: (result.alerts || []).filter(alert => 
            ['pending', 'verified', 'assigned', 'in_progress'].includes(alert.status)
          ).length
        }));
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

  // Fetch road reports from backend
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
        
        // Update system stats with real data
        setSystemStats(prev => ({
          ...prev,
          roadReports: result.total || transformedReports.length,
          verifiedReports: transformedReports.filter(r => r.verified).length
        }));
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

  // Fetch user reports (mock - replace with actual API)
  const fetchUserReports = async () => {
    try {
      // This would be replaced with actual API call
      setUserReports([
        { id: 1, user: 'User123', email: 'user123@example.com', trustScore: 85, reports: 12, verified: 10, joined: '2 days ago', phone: '9876543210', location: 'Mumbai' },
        { id: 2, user: 'User456', email: 'user456@example.com', trustScore: 92, reports: 8, verified: 8, joined: '5 days ago', phone: '9876543211', location: 'Delhi' },
        { id: 3, user: 'User789', email: 'user789@example.com', trustScore: 65, reports: 5, verified: 2, joined: '1 day ago', phone: '9876543212', location: 'Chennai' },
      ]);
      setSystemStats(prev => ({ ...prev, totalUsers: 1245 }));
    } catch (err) {
      console.error('Error fetching user reports:', err);
    }
  };

  // Fetch department statistics
  const fetchDepartmentStats = async () => {
    try {
      console.log('Fetching stats for department:', selectedDepartment);
      
      const response = await fetch(
        `${API_BASE_URL}/sos/department/${selectedDepartment}/stats`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const stats = result.statistics;
          
          // Update system stats with real data
          setSystemStats(prev => ({
            ...prev,
            activeSOS: stats.totalAlerts || 0,
            verifiedReports: stats.byStatus?.find(s => s._id === 'verified')?.count || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  // Helper function to format time ago
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

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await fetchShelters();
      await fetchSOSAlerts();
      await fetchRoadReports();
      await fetchUserReports();
      await fetchDepartmentStats();
      setLoading(false);
    };

    fetchAllData();
  }, [selectedDepartment]);

  // Refresh data when department changes
  useEffect(() => {
    fetchSOSAlerts();
    fetchDepartmentStats();
  }, [selectedDepartment]);

  // Edit Functions
  const startEditing = (item, type) => {
    setEditingItem({ ...item, type });
    setEditForm({ ...item });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // User Management Functions
  const updateUserTrustScore = async (id, change) => {
    try {
      // This would be replaced with actual API call
      setUserReports(userReports.map(user => 
        user.id === id ? { ...user, trustScore: Math.min(100, Math.max(0, user.trustScore + change)) } : user
      ));
    } catch (err) {
      console.error('Error updating trust score:', err);
      setError('Failed to update trust score');
    }
  };

  const saveUserEdit = async () => {
    try {
      // This would be replaced with actual API call
      setUserReports(userReports.map(user => 
        user.id === editingItem.id ? { ...user, ...editForm } : user
      ));
      setEditingItem(null);
      setEditForm({});
    } catch (err) {
      console.error('Error saving user edit:', err);
      setError('Failed to save user changes');
    }
  };

  const deleteUser = async (id) => {
    try {
      // This would be replaced with actual API call
      setUserReports(userReports.filter(user => user.id !== id));
      setSystemStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  // Shelter Management Functions
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

  const saveShelterEdit = async () => {
    try {
      setError('');
      
      console.log('🔐 Current user:', {
        id: user?.uid,
        role: user?.role,
        editingItem: editingItem
      });

      const response = await fetch(`${API_BASE_URL}/shelters/${editingItem._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error response:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Permission denied. You need to be the shelter creator or an admin to edit this shelter.');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update shelter');
      }

      // Update local state with the updated shelter
      setShelters(prevShelters => 
        prevShelters.map(shelter => 
          shelter._id === editingItem._id ? result.data : shelter
        )
      );
      
      setEditingItem(null);
      setEditForm({});
      
      console.log('✅ Shelter updated successfully');
      
    } catch (err) {
      console.error('Error saving shelter edit:', err);
      setError(err.message || 'Failed to save shelter changes');
    }
  };

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
      
      setSystemStats(prev => ({
        ...prev,
        shelters: prev.shelters - 1
      }));
      
    } catch (err) {
      console.error('Error deleting shelter:', err);
      setError(err.message || 'Failed to delete shelter');
    }
  };

  // System Settings Functions
  const sendEmergencyAlert = async () => {
    try {
      const message = document.getElementById('emergency-message')?.value;
      if (!message?.trim()) {
        setError('Please enter an emergency message');
        return;
      }
      alert(`Emergency alert sent: ${message}`);
      document.getElementById('emergency-message').value = '';
      setError('');
    } catch (err) {
      console.error('Error sending emergency alert:', err);
      setError('Failed to send emergency alert');
    }
  };

  const performSystemAction = async (action) => {
    try {
      switch (action) {
        case 'backup':
          alert('Database backup initiated');
          break;
        case 'cache':
          alert('Cache cleared successfully');
          break;
        case 'reports':
          alert('Reports generation started');
          break;
        case 'health':
          alert('System health check completed');
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error performing system action:', err);
      setError(`Failed to perform ${action}`);
    }
  };

  // Stats cards component
  const StatCard = ({ title, value, icon, color, change }) => (
    <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-300 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-white">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  // Edit Modal Component
  const EditModal = () => {
    if (!editingItem) return null;

    const renderEditForm = () => {
      switch (editingItem.type) {
        case 'sos':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">User</label>
                <input
                  type="text"
                  value={editForm.userName || ''}
                  onChange={(e) => handleEditChange('userName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Location</label>
                <input
                  type="text"
                  value={editForm.location?.address || ''}
                  onChange={(e) => handleEditChange('location', { ...editForm.location, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Emergency Type</label>
                <input
                  type="text"
                  value={editForm.emergencyType || ''}
                  onChange={(e) => handleEditChange('emergencyType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Message</label>
                <textarea
                  value={editForm.message || ''}
                  onChange={(e) => handleEditChange('message', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          );

        case 'user':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  value={editForm.user || ''}
                  onChange={(e) => handleEditChange('user', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Trust Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.trustScore || ''}
                  onChange={(e) => handleEditChange('trustScore', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Phone</label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Location</label>
                <input
                  type="text"
                  value={editForm.location || ''}
                  onChange={(e) => handleEditChange('location', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          );

        case 'shelter':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Shelter Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Location</label>
                <input
                  type="text"
                  value={editForm.location || ''}
                  onChange={(e) => handleEditChange('location', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Capacity</label>
                <input
                  type="number"
                  value={editForm.capacity || ''}
                  onChange={(e) => handleEditChange('capacity', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Occupied</label>
                <input
                  type="number"
                  value={editForm.occupied || ''}
                  onChange={(e) => handleEditChange('occupied', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Contact</label>
                <input
                  type="text"
                  value={editForm.contact || ''}
                  onChange={(e) => handleEditChange('contact', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Facilities (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editForm.facilities) ? editForm.facilities.join(', ') : ''}
                  onChange={(e) => handleEditChange('facilities', e.target.value.split(',').map(f => f.trim()))}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Food, Water, Medical, Beds"
                />
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    const handleSave = () => {
      switch (editingItem.type) {
        case 'sos':
          // saveSOSEdit(); // Removed as it's now handled in SOSManagement
          break;
        case 'user':
          saveUserEdit();
          break;
        case 'shelter':
          saveShelterEdit();
          break;
        default:
          break;
      }
    };

    const getTitle = () => {
      switch (editingItem.type) {
        case 'sos': return 'Edit SOS Alert';
        case 'user': return 'Edit User';
        case 'shelter': return 'Edit Shelter';
        default: return 'Edit Item';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">{getTitle()}</h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderEditForm()}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <EditModal />
      
      <div className="px-4 py-6 sm:px-0">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-gray-400">Welcome, Administrator. Manage system operations and monitor disaster response.</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-md border-gray-600 bg-gray-700 text-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              System Online
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Response Time: {systemStats.responseTime}
            </span>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers.toLocaleString()}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>}
            color="bg-blue-500"
            change={12}
          />

          <StatCard
            title="Active SOS"
            value={systemStats.activeSOS}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>}
            color="bg-red-500"
            change={-5}
          />

          <StatCard
            title="Road Reports"
            value={systemStats.roadReports.toLocaleString()}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            color="bg-yellow-500"
            change={8}
          />

          <StatCard
            title="Shelters"
            value={systemStats.shelters}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>}
            color="bg-green-500"
            change={5}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'sos', name: 'SOS Alerts' },
              { id: 'users', name: 'User Management' },
              { id: 'roads', name: 'Road Reports' },
              { id: 'shelters', name: 'Shelters' },
              { id: 'volunteer_tasks', name: 'Volunteer Tasks' },
              { id: 'map', name: 'Map' },
              { id: 'analytics', name: 'Analytics' },
              { id: 'system', name: 'System Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-400'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent SOS Alerts */}
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Recent SOS Alerts - {departments.find(d => d.value === selectedDepartment)?.label}</h3>
                  {loading && <span className="text-xs text-gray-400">Loading...</span>}
                </div>
                <div className="space-y-4">
                  {sosAlerts.slice(0, 3).map((alert) => (
                    <div key={alert._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          alert.mlClassification?.urgencyLevel === 'critical' || alert.mlClassification?.urgencyLevel === 'high' ? 'bg-red-500' : 
                          alert.mlClassification?.urgencyLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{alert.userName}</p>
                          <p className="text-xs text-gray-400">
                            {alert.emergencyType} • {formatTimeAgo(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        alert.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        alert.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
                  {sosAlerts.length === 0 && !loading && (
                    <p className="text-center text-gray-400 py-4">No alerts for {departments.find(d => d.value === selectedDepartment)?.label}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => setActiveTab('sos')}
                  className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                >
                  View All Alerts →
                </button>
              </div>

              {/* Recent Shelters */}
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Recent Shelters</h3>
                <div className="space-y-4">
                  {shelters.slice(0, 3).map((shelter) => (
                    <div key={shelter._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{shelter.name}</p>
                          <p className="text-xs text-gray-400">{shelter.location} • {shelter.occupied}/{shelter.capacity}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shelter.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {shelter.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {shelters.length === 0 && !loading && (
                    <p className="text-center text-gray-400 py-4">No shelters available</p>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('shelters')}
                  className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                >
                  View All Shelters →
                </button>
              </div>

              {/* System Health */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">System Health</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Server Uptime</span>
                      <span>99.9%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>API Response Time</span>
                      <span>128ms</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Database Load</span>
                      <span>42%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'User123 submitted a road report', time: '2 min ago', type: 'road' },
                    { action: 'SOS alert verified by Admin', time: '5 min ago', type: 'sos' },
                    { action: 'New shelter added in Mumbai', time: '10 min ago', type: 'shelter' },
                    { action: 'System backup completed', time: '15 min ago', type: 'system' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                          activity.type === 'road' ? 'bg-yellow-500' : 
                          activity.type === 'sos' ? 'bg-red-500' :
                          activity.type === 'shelter' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-white">{activity.action}</p>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Use Separated Components */}
          {activeTab === 'sos' && (
            <SOSManagement 
              user={user}
              selectedDepartment={selectedDepartment}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'roads' && (
            <RoadsManagement 
              user={user}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'shelters' && (
            <SheltersManagement 
              user={user}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'volunteer_tasks' && (
            <VolunteerTaskAllotment 
              user={user}
              getAuthHeaders={getAuthHeaders}
            />
          )}
          {activeTab === 'map' && (
            <MapView
              user={user}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {/* Keep existing tabs for User Management, Analytics, and System Settings */}
          {activeTab === 'users' && (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">User Management</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                  />
                  <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>All Users</option>
                    <option>High Trust</option>
                    <option>Low Trust</option>
                    <option>New Users</option>
                  </select>
                </div>
              </div>
              <ul className="divide-y divide-gray-700">
                {userReports.map((user) => (
                  <li key={user.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <svg className="h-12 w-12" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#333"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#3B82F6"
                                  strokeWidth="3"
                                  strokeDasharray={`${user.trustScore}, 100`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                {user.trustScore}%
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-white">
                              {user.user}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {user.email} • {user.phone}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {user.reports} reports • {user.verified} verified • Joined {user.joined}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(user, 'user')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => updateUserTrustScore(user.id, 5)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            +5 Trust
                          </button>
                          <button
                            onClick={() => updateUserTrustScore(user.id, -5)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            -5 Trust
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Report Statistics</h3>
                <div className="space-y-4">
                  {[
                    { label: 'SOS Reports', value: systemStats.activeSOS, max: 50, color: 'bg-red-600' },
                    { label: 'Road Reports', value: systemStats.roadReports, max: 200, color: 'bg-yellow-600' },
                    { label: 'Shelter Updates', value: systemStats.shelters, max: 100, color: 'bg-green-600' },
                    { label: 'User Registrations', value: 45, max: 100, color: 'bg-blue-600' },
                  ].map((stat, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>{stat.label}</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${stat.color}`}
                          style={{ width: `${(stat.value / stat.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">User Activity</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="space-y-4">
                    {[
                      { label: 'New Users', value: 45, color: 'bg-green-500' },
                      { label: 'Active Reports', value: 28, color: 'bg-blue-500' },
                      { label: 'SOS Alerts', value: 12, color: 'bg-red-500' },
                      { label: 'Verified Content', value: 38, color: 'bg-yellow-500' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white w-8">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-white mb-6">System Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-white">Notification Settings</h4>
                  {[
                    { label: 'Email Notifications', enabled: true },
                    { label: 'SMS Alerts', enabled: false },
                    { label: 'Push Notifications', enabled: true },
                    { label: 'Critical Alerts Only', enabled: true },
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{setting.label}</span>
                      <button className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        setting.enabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          setting.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Automatic Alert Priority</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="priority-high"
                        name="priority-level"
                        type="radio"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <label htmlFor="priority-high" className="ml-3 block text-sm font-medium text-gray-300">
                        High (More alerts)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="priority-medium"
                        name="priority-level"
                        type="radio"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <label htmlFor="priority-medium" className="ml-3 block text-sm font-medium text-gray-300">
                        Medium (Balanced)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="priority-low"
                        name="priority-level"
                        type="radio"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <label htmlFor="priority-low" className="ml-3 block text-sm font-medium text-gray-300">
                        Low (Fewer alerts)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Data Retention Period</label>
                  <div className="mt-1">
                    <select className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                      <option>Indefinitely</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Emergency Broadcast</label>
                  <div className="mt-1">
                    <textarea
                      id="emergency-message"
                      rows={3}
                      className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter emergency message for all users"
                    ></textarea>
                  </div>
                  <button 
                    onClick={sendEmergencyAlert}
                    className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Send Emergency Alert
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">System Maintenance</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => performSystemAction('backup')}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Backup Database
                    </button>
                    <button 
                      onClick={() => performSystemAction('cache')}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Clear Cache
                    </button>
                    <button 
                      onClick={() => performSystemAction('reports')}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Generate Reports
                    </button>
                    <button 
                      onClick={() => performSystemAction('health')}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Check System Health
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Save All Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;