// components/admin/VolunteerTaskAllotment.jsx
import React, { useState, useEffect, useRef } from 'react';

// Import Leaflet CSS and JS
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VolunteerTaskAllotment = () => {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingVolunteers, setMatchingVolunteers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0
  });

  const API_BASE_URL = 'http://localhost:5002/api';
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Handle success - refresh tasks, show message, etc.
          setShowCreateModal(false);
          // Refresh your tasks list here
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  // Task categories and priorities
  const categories = [
    { value: 'Emergency Department', label: 'Emergency', icon: '🚨', color: 'bg-red-500' },
    { value: 'Medical & Health', label: 'Medical', icon: '🏥', color: 'bg-green-500' },
    { value: 'Infrastructure', label: 'Infrastructure', icon: '🏗️', color: 'bg-blue-500' },
    { value: 'Relief & Shelter', label: 'Relief', icon: '🛟', color: 'bg-orange-500' },
    { value: 'Environment', label: 'Environment', icon: '🌳', color: 'bg-emerald-500' },
    { value: 'Community Support', label: 'Community', icon: '🤝', color: 'bg-purple-500' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-100' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-100' },
    { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-100' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-100' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-100' },
    { value: 'assigned', label: 'Assigned', color: 'bg-blue-500', textColor: 'text-blue-100' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-500', textColor: 'text-purple-100' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500', textColor: 'text-green-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500', textColor: 'text-gray-100' }
  ];

  const skills = [
    'medical_aid', 'first_aid', 'cpr', 'nursing', 'doctor',
    'construction', 'heavy_machinery', 'electrical', 'plumbing',
    'counseling', 'communication', 'leadership', 'logistics',
    'cooking', 'distribution', 'transportation', 'tech_support'
  ];

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Emergency Department',
    priority: 'medium',
    location: '',
    coordinates: null,
    requiredSkills: [],
    estimatedHours: 4,
    deadline: '',
    resources: ''
  });

  // Edit task form state
  const [editTask, setEditTask] = useState({
    _id: '',
    title: '',
    description: '',
    category: 'Emergency Department',
    priority: 'medium',
    location: '',
    coordinates: null,
    requiredSkills: [],
    estimatedHours: 4,
    deadline: '',
    resources: ''
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchTasks(), fetchVolunteers(), fetchStats()]);
    } catch (err) {
      setError('Failed to load data from server');
    } finally {
      setLoading(false);
    }
  };
// Initialize m

// Initialize map when component mounts and tasks are loaded
useEffect(() => {
  // Use a small timeout to ensure DOM is ready
  const timer = setTimeout(() => {
    if (tasks.length > 0 && mapRef.current) {
      const map = initMap();
      if (map) {
        addMarkersToMap(tasks);
      }
    }
  }, 100);

  return () => {
    clearTimeout(timer);
    // Cleanup map on unmount
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };
}, [tasks]);

// Also add a resize observer to handle map container resizing
useEffect(() => {
  if (!mapRef.current || !mapInstanceRef.current) return;

  const resizeObserver = new ResizeObserver(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  });

  resizeObserver.observe(mapRef.current);

  return () => {
    resizeObserver.disconnect();
  };
}, []);
// Create new task
// Create new task - UPDATED VERSION
const createTask = async (taskData) => {
  try {
    setError('');
    setLoading(true);

    // Prepare the task data for submission
    const finalTaskData = {
      ...taskData,
      status: 'pending', // New tasks should start as pending
      createdBy: 'admin' // You might want to get this from auth context
    };

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalTaskData)
    });

    if (!response.ok) throw new Error('Failed to create task');

    const result = await response.json();
    
    if (result.success) {
      // Add the new task to the state
      setTasks(prev => [...prev, result.data]);
      
      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        category: 'Emergency Department',
        priority: 'medium',
        location: '',
        coordinates: null,
        requiredSkills: [],
        estimatedHours: 4,
        deadline: '',
        resources: ''
      });
      
      setShowCreateModal(false);
      setSuccess('Task created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh stats
      fetchStats();
    }
  } catch (err) {
    console.error('Error creating task:', err);
    setError(err.message || 'Failed to create task');
  } finally {
    setLoading(false);
  }
};
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks from server');
    }
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/volunteers`);
      
      if (!response.ok) throw new Error('Failed to fetch volunteers');
      
      const result = await response.json();
      if (result.success) {
        setVolunteers(result.data);
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      setError('Failed to fetch volunteers from server');
    }
  };
// Location Selection Component for Create Task
const LocationPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add click event to map
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        
        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng])
          .addTo(map)
          .bindPopup('Selected Location')
          .openPopup();

        // Call callback with coordinates
        if (onLocationSelect) {
          onLocationSelect({ lat, lng });
        }
      });

      mapInstanceRef.current = map;

      // Add initial marker if location exists
      if (initialLocation) {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng])
          .addTo(map)
          .bindPopup('Selected Location');
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onLocationSelect, initialLocation]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Location on Map *
      </label>
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border border-gray-600 bg-gray-700"
      />
      {selectedLocation && (
        <div className="text-sm text-gray-300 p-3 bg-gray-700 rounded-lg">
          <span className="font-medium">Selected Coordinates:</span>{' '}
          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}
      <p className="text-xs text-gray-400">
        Click on the map to select the task location. The marker will show your selected position.
      </p>
    </div>
  );
};
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats/overview`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data.overview);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Calculate stats from fetched data
      const total = tasks.length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const assigned = tasks.filter(t => t.status === 'assigned').length;
      const in_progress = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      
      setStats({ total, pending, assigned, in_progress, completed });
    }
  };

  // Create new task
// Create new task
const CreateTaskModal = ({ show, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Emergency Department',
    priority: 'medium',
    location: '',
    coordinates: null,
    requiredSkills: [],
    estimatedHours: 4,
    deadline: '',
    resources: ''
  });

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [locationName, setLocationName] = useState('');

  const handleLocationSelect = (coords) => {
    setSelectedCoords(coords);
    setFormData(prev => ({
      ...prev,
      coordinates: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat] // GeoJSON format: [longitude, latitude]
      }
    }));

    // Reverse geocode to get location name (optional - you can remove this if you don't want it)
    // For now, we'll set a placeholder and let the user see the coordinates
    setLocationName(`Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    setFormData(prev => ({
      ...prev,
      location: `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    }));
  };

  const handleLocationNameChange = (e) => {
    const name = e.target.value;
    setLocationName(name);
    setFormData(prev => ({
      ...prev,
      location: name
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedCoords) {
      alert('Please select a location on the map');
      return;
    }

    if (!locationName.trim()) {
      alert('Please enter a location name');
      return;
    }

    onCreate(formData);
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Create New Task</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the task details..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Emergency Department">🚨 Emergency</option>
                      <option value="Medical & Health">🏥 Medical</option>
                      <option value="Infrastructure">🏗️ Infrastructure</option>
                      <option value="Relief & Shelter">🛟 Relief</option>
                      <option value="Environment">🌳 Environment</option>
                      <option value="Community Support">🤝 Community</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location Name *</label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={handleLocationNameChange}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mumbai Central, Disaster Zone A, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Hours *</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      required
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Column - Map and Skills */}
              <div className="space-y-6">
                {/* Location Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Location on Map *
                  </label>
                  <LocationPicker 
                    onLocationSelect={handleLocationSelect}
                    initialLocation={selectedCoords}
                  />
                  {selectedCoords && (
                    <div className="mt-2 text-sm text-green-400 bg-green-900/20 p-2 rounded-lg">
                      <span className="font-medium">📍 Location Selected:</span>{' '}
                      {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                    </div>
                  )}
                  {!selectedCoords && (
                    <div className="mt-2 text-sm text-yellow-400 bg-yellow-900/20 p-2 rounded-lg">
                      <span className="font-medium">⚠️ Click on the map to select a location</span>
                    </div>
                  )}
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Required Skills *</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-700 rounded-lg border border-gray-600">
                    {[
                      'medical_aid', 'first_aid', 'cpr', 'nursing', 'doctor',
                      'construction', 'heavy_machinery', 'electrical', 'plumbing',
                      'counseling', 'communication', 'leadership', 'logistics',
                      'cooking', 'distribution', 'transportation', 'tech_support'
                    ].map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          formData.requiredSkills.includes(skill)
                            ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                        }`}
                      >
                        {skill.replace('_', ' ')}
                        {formData.requiredSkills.includes(skill) && (
                          <span className="ml-2">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Selected: {formData.requiredSkills.length} skills
                    {formData.requiredSkills.length === 0 && ' (select at least one)'}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Resources Needed</label>
                  <input
                    type="text"
                    value={formData.resources}
                    onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Equipment, materials, tools, etc..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formData.requiredSkills.length === 0 || !selectedCoords || !locationName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg text-white font-medium transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


  // Update task
  const updateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/tasks/${editTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editTask)
      });

      if (!response.ok) throw new Error('Failed to update task');

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task._id === editTask._id ? result.data : task
        ));
        setShowEditModal(false);
        setSuccess('Task updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  // Assign task to volunteer
  const assignTask = async (volunteerId) => {
    try {
    setError('');
    
    const response = await fetch(`${API_BASE_URL}/tasks/${selectedTask._id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        volunteerId,
        assignedBy: 'admin' // Add this line - use actual admin ID if you have auth
      })
    });

      if (!response.ok) throw new Error('Failed to assign task');

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task._id === selectedTask._id ? result.data : task
        ));
        
        setShowAssignmentModal(false);
        setSelectedTask(null);
        setSuccess('Task assigned successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh volunteers to update availability
        fetchVolunteers();
        fetchStats();
      }
    } catch (err) {
      console.error('Error assigning task:', err);
      setError(err.message || 'Failed to assign task');
    }
  };

  // Unassign task
  const unassignTask = async (taskId) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/unassign`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Failed to unassign task');

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task._id === taskId ? result.data : task
        ));
        setSuccess('Task unassigned successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh volunteers to update availability
        fetchVolunteers();
        fetchStats();
      }
    } catch (err) {
      console.error('Error unassigning task:', err);
      setError(err.message || 'Failed to unassign task');
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update task status');

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task._id === taskId ? result.data : task
        ));
        setSuccess(`Task marked as ${status.replace('_', ' ')}!`);
        setTimeout(() => setSuccess(''), 3000);
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task status');
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
        setSuccess('Task deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

// Get matching volunteers for a task - FIXED FRONTEND VERSION
const getMatchingVolunteers = async () => {
  if (!selectedTask) return [];
  
  try {
    const response = await fetch(`${API_BASE_URL}/volunteers/match/${selectedTask._id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch matching volunteers: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return [];
  } catch (err) {
    console.error('Error fetching matching volunteers:', err);
    // Fallback to client-side matching with fetched volunteers
    return volunteers
      .filter(volunteer => {
        // Safe check for availability status
        const availabilityStatus = volunteer.availability?.status;
        return availabilityStatus === 'available' || availabilityStatus === 'active';
      })
      .map(volunteer => {
        const taskSkills = Array.isArray(selectedTask.requiredSkills) 
          ? selectedTask.requiredSkills 
          : [];
        
        const volunteerSkills = Array.isArray(volunteer.volunteerSkills) 
          ? volunteer.volunteerSkills 
          : (typeof volunteer.volunteerSkills === 'string' ? [volunteer.volunteerSkills] : []);
        
        const skillMatch = taskSkills.filter(skill => 
          volunteerSkills.includes(skill)
        ).length;
        
        const matchScore = taskSkills.length > 0 
          ? (skillMatch / taskSkills.length) * 100 
          : 0;
        
        const locationBonus = volunteer.location && selectedTask.location && 
          volunteer.location.includes(selectedTask.location.split(',')[0]) ? 20 : 0;
        
        const trustBonus = (volunteer.trustScore || 50) * 0.1;
        const totalScore = Math.min(matchScore + locationBonus + trustBonus, 100);
        
        return {
          ...volunteer,
          matchScore: totalScore,
          skillMatchCount: skillMatch,
          finalMatchScore: totalScore // Add this for consistency
        };
      })
      .sort((a, b) => b.finalMatchScore - a.finalMatchScore);
  }
};

  // Initialize map
  // Initialize map - KEEP ONLY THIS VERSION
const initMap = (coordinates = [20.5937, 78.9629]) => {
  // Check if map container exists and Leaflet is available
  if (!mapRef.current || !L) {
    console.error('Map container not found or Leaflet not loaded');
    return null;
  }

  // Clear existing map instance
  if (mapInstanceRef.current) {
    mapInstanceRef.current.remove();
    mapInstanceRef.current = null;
  }

  try {
    const map = L.map(mapRef.current).setView(coordinates, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    return map;
  } catch (error) {
    console.error('Error initializing map:', error);
    return null;
  }
};

  // Add markers to map
  const addMarkersToMap = (tasks) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    tasks.forEach(task => {
      if (task.coordinates && task.coordinates.coordinates) {
        const [lng, lat] = task.coordinates.coordinates;
        const categoryInfo = getCategoryInfo(task.category);
        const priorityInfo = getPriorityInfo(task.priority);

        const customIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="w-8 h-8 rounded-full ${priorityInfo.color} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                ${categoryInfo.icon}
              </div>
              <div class="absolute -top-1 -right-1 w-4 h-4 ${priorityInfo.color} rounded-full border-2 border-white"></div>
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2 min-w-48">
              <h3 class="font-bold text-gray-800">${task.title}</h3>
              <p class="text-sm text-gray-600">${task.category}</p>
              <p class="text-xs text-gray-500">${task.location}</p>
              <div class="mt-2 flex gap-1">
                <span class="px-2 py-1 text-xs rounded ${priorityInfo.color} ${priorityInfo.textColor}">
                  ${priorityInfo.label}
                </span>
                <span class="px-2 py-1 text-xs rounded ${getStatusInfo(task.status).color} ${getStatusInfo(task.status).textColor}">
                  ${task.status}
                </span>
              </div>
            </div>
          `);

        markersRef.current.push(marker);
      }
    });
  };

  // Load matching volunteers when assignment modal opens
  useEffect(() => {
    if (showAssignmentModal && selectedTask) {
      getMatchingVolunteers().then(setMatchingVolunteers);
    }
  }, [showAssignmentModal, selectedTask]);

  // Initialize map when component mounts
  useEffect(() => {
    if (tasks.length > 0) {
      const map = initMap();
      addMarkersToMap(tasks);
    }
  }, [tasks]);

  // Filter tasks based on filters and search
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || task.category === filters.category;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Handle skill selection for new task
  const toggleSkill = (skill, formType = 'create') => {
    if (formType === 'create') {
      setNewTask(prev => ({
        ...prev,
        requiredSkills: prev.requiredSkills.includes(skill)
          ? prev.requiredSkills.filter(s => s !== skill)
          : [...prev.requiredSkills, skill]
      }));
    } else {
      setEditTask(prev => ({
        ...prev,
        requiredSkills: prev.requiredSkills.includes(skill)
          ? prev.requiredSkills.filter(s => s !== skill)
          : [...prev.requiredSkills, skill]
      }));
    }
  };

  // Open edit modal
  const openEditModal = (task) => {
    setEditTask({
      _id: task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      location: task.location,
      coordinates: task.coordinates,
      requiredSkills: task.requiredSkills || [],
      estimatedHours: task.estimatedHours,
      deadline: task.deadline.split('T')[0],
      resources: task.resources || ''
    });
    setShowEditModal(true);
  };

  // Open location modal
  const openLocationModal = (task) => {
    setSelectedLocation(task);
    setShowLocationModal(true);
  };

  // Get category info
  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  // Get priority info
  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  // Get status info
  const getStatusInfo = (status) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-white mb-2">Volunteer Task Management</h1>
            <p className="text-gray-300">Assign and manage disaster relief tasks efficiently</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={fetchData}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Task
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'bg-gray-600' },
            { label: 'Pending', value: stats.pending, color: 'bg-yellow-500' },
            { label: 'Assigned', value: stats.assigned, color: 'bg-blue-500' },
            { label: 'In Progress', value: stats.in_progress, color: 'bg-purple-500' },
            { label: 'Completed', value: stats.completed, color: 'bg-green-500' }
          ].map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-lg p-4 text-white transform hover:scale-105 transition-transform duration-200`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

     

      {/* Rest of the component remains the same as previous version */}
      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks by title, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const categoryInfo = getCategoryInfo(task.category);
          const priorityInfo = getPriorityInfo(task.priority);
          const statusInfo = getStatusInfo(task.status);
          const assignedVolunteer = volunteers.find(v => v.userId === task.assignedTo);
          
          return (
            <div key={task._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className={`w-4 h-4 rounded-full mt-2 ${priorityInfo.color}`} />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color} ${priorityInfo.textColor}`}>
                            {priorityInfo.label}
                          </span>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-gray-300">
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4 leading-relaxed">{task.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📍</span>
                          <span className="text-white font-medium">{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">⏱️</span>
                          <span className="text-white font-medium">{task.estimatedHours} hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📅</span>
                          <span className="text-white font-medium">{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🛠️</span>
                          <span className="text-white font-medium">{task.requiredSkills?.length || 0} skills required</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {task.requiredSkills?.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                            {skill.replace('_', ' ')}
                          </span>
                        ))}
                      </div>

                      {task.resources && (
                        <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Resources Needed:</span>
                          </div>
                          <p className="text-gray-300 text-sm">{task.resources}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[280px]">
                  {!task.assignedTo ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowAssignmentModal(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Assign Volunteer
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(task)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-white text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="flex-1 bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-white text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Assigned to:</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {assignedVolunteer?.name?.split(' ').map(n => n[0]).join('') || '??'}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{assignedVolunteer?.name || 'Unknown Volunteer'}</div>
                            <div className="text-gray-400 text-sm">{assignedVolunteer?.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => unassignTask(task._id)}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-white text-sm transition-colors"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => openEditModal(task)}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-white text-sm transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {task.status === 'assigned' && (
                            <button
                              onClick={() => updateTaskStatus(task._id, 'in_progress')}
                              className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-white text-sm transition-colors"
                            >
                              Start Task
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => updateTaskStatus(task._id, 'completed')}
                              className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-white text-sm transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {(task.status === 'assigned' || task.status === 'in_progress') && (
                            <button
                              onClick={() => updateTaskStatus(task._id, 'pending')}
                              className="bg-yellow-600 hover:bg-yellow-500 px-3 py-2 rounded text-white text-sm transition-colors"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xl mb-2">No tasks found</p>
            <p className="text-gray-500">Try adjusting your filters or create a new task to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-white font-medium transition-colors"
            >
              Create Your First Task
            </button>
          </div>
        )}
      </div>

     {/* Create Task Modal */}
{showCreateModal && (
  <CreateTaskModal 
    show={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    onCreate={createTask}
  />
)}

      {/* Edit Task Modal - Similar structure to Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Edit Task</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={updateTask} className="space-y-6">
                {/* Similar form structure as create modal but with editTask state */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={editTask.title}
                    onChange={(e) => setEditTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    required
                    value={editTask.description}
                    onChange={(e) => setEditTask(prev => ({ ...prev, description: e.target.value }))}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                    <select
                      value={editTask.category}
                      onChange={(e) => setEditTask(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority *</label>
                    <select
                      value={editTask.priority}
                      onChange={(e) => setEditTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      value={editTask.location}
                      onChange={(e) => setEditTask(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Hours *</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      required
                      value={editTask.estimatedHours}
                      onChange={(e) => setEditTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={editTask.deadline}
                    onChange={(e) => setEditTask(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Required Skills *</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-gray-700 rounded-lg border border-gray-600">
                    {skills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill, 'edit')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          editTask.requiredSkills.includes(skill)
                            ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                        }`}
                      >
                        {skill.replace('_', ' ')}
                        {editTask.requiredSkills.includes(skill) && (
                          <span className="ml-2">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Selected: {editTask.requiredSkills.length} skills
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Resources Needed</label>
                  <input
                    type="text"
                    value={editTask.resources}
                    onChange={(e) => setEditTask(prev => ({ ...prev, resources: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg text-white font-medium transition-colors"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal - Similar structure as before */}
      {showAssignmentModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Assign Task: {selectedTask.title}
                </h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Task Details */}
              <div className="bg-gray-700 rounded-xl p-6 mb-6 border border-gray-600">
                <h4 className="text-lg font-semibold text-gray-300 mb-4">Task Details</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Description</div>
                    <p className="text-white leading-relaxed">{selectedTask.description}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Location</div>
                      <div className="text-white font-medium">{selectedTask.location}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Priority</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityInfo(selectedTask.priority).color} ${getPriorityInfo(selectedTask.priority).textColor}`}>
                          {getPriorityInfo(selectedTask.priority).label}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Category</div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-gray-300">
                          {getCategoryInfo(selectedTask.category).label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Required Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.requiredSkills?.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                            {skill.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Volunteers */}
             {/* Available Volunteers */}
<div>
  <div className="flex items-center justify-between mb-6">
    <h4 className="text-lg font-semibold text-gray-300">
      Available Volunteers ({matchingVolunteers.length})
    </h4>
    <div className="text-sm text-gray-400">
      Sorted by match score
    </div>
  </div>
  
  {matchingVolunteers.length === 0 ? (
    <div className="text-center py-12 text-gray-400">
      {/* No volunteers message */}
    </div>
  ) : (
    <div className="space-y-4">
      {matchingVolunteers.map((volunteer, index) => (
        <div key={volunteer.userId || volunteer._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {volunteer.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div>
                    <h5 className="text-lg font-semibold text-white mb-1">{volunteer.name}</h5>
                    <p className="text-gray-400">{volunteer.email}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Match Score</div>
                      <div className={`text-xl font-bold ${
                        volunteer.matchScore >= 80 ? 'text-green-400' :
                        volunteer.matchScore >= 60 ? 'text-yellow-400' : 'text-orange-400'
                      }`}>
                        {/* Ensure matchScore is a number, not an object */}
                        {typeof volunteer.matchScore === 'number' ? volunteer.matchScore.toFixed(0) : '0'}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📍</span>
                    <span className="text-white">
                      {/* Make sure location is a string */}
                      {typeof volunteer.location === 'string' ? volunteer.location : 'Location not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⭐</span>
                    <span className="text-white">
                      {/* Ensure rating is a number */}
                      {typeof volunteer.rating === 'number' ? volunteer.rating : '0'} rating
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">✅</span>
                    <span className="text-white">
                      {/* Ensure tasksCompleted is a number */}
                      {typeof volunteer.tasksCompleted === 'number' ? volunteer.tasksCompleted : '0'} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🔒</span>
                    <span className="text-white">
                      {/* Ensure trustScore is a number */}
                      {typeof volunteer.trustScore === 'number' ? volunteer.trustScore : '50'} trust
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Make sure volunteerSkills is an array before mapping */}
                  {Array.isArray(volunteer.volunteerSkills) ? volunteer.volunteerSkills.map(skill => (
                    <span
                      key={skill}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTask.requiredSkills?.includes(skill)
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-gray-600 text-gray-300 border border-gray-500/30'
                      }`}
                    >
                      {skill.replace('_', ' ')}
                      {selectedTask.requiredSkills?.includes(skill) && (
                        <span className="ml-1">✓</span>
                      )}
                    </span>
                  )) : (
                    <span className="text-gray-400 text-sm">No skills listed</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => assignTask(volunteer.userId || volunteer._id)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center transition-colors whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Assign Task
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerTaskAllotment;
