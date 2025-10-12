import React, { useState, useEffect } from 'react';

const VolunteerTaskDashboard = () => {
  const [volunteer, setVolunteer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  const [volunteerId, setVolunteerId] = useState(null);
  const API_BASE_URL = 'http://localhost:5002/api';

  // Safe render helper function
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      // Handle coordinates object
      if (value.type === 'Point' && Array.isArray(value.coordinates)) {
        return `Location: ${value.coordinates[1]?.toFixed(4)}, ${value.coordinates[0]?.toFixed(4)}`;
      }
      // For other objects, return fallback
      return fallback;
    }
    return value.toString();
  };

  // Safe location renderer
  const renderLocation = (task) => {
    if (!task) return 'Location not specified';
    
    // If location is a string, use it directly
    if (typeof task.location === 'string') {
      return task.location;
    }
    
    // If coordinates object exists, format it
    if (task.coordinates && typeof task.coordinates === 'object') {
      if (task.coordinates.type === 'Point' && Array.isArray(task.coordinates.coordinates)) {
        const [lng, lat] = task.coordinates.coordinates;
        return `Location: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
      }
    }
    
    return 'Location not specified';
  };

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

  // Fetch current user's profile to get volunteer ID
  const fetchCurrentUserProfile = async () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (storedUserId) {
        setVolunteerId(storedUserId);
        return storedUserId;
      }

      if (!token) {
        console.log('No token found, trying to get any volunteer ID...');
        const response = await fetch(`${API_BASE_URL}/volunteers`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            const firstVolunteerId = data.data[0].userId;
            setVolunteerId(firstVolunteerId);
            localStorage.setItem('userId', firstVolunteerId);
            return firstVolunteerId;
          }
        }
      }

      const authResponse = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.data.userId) {
          setVolunteerId(authData.data.userId);
          localStorage.setItem('userId', authData.data.userId);
          return authData.data.userId;
        }
      }

      throw new Error('Could not fetch user profile');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  // Fetch volunteer profile data
  const fetchVolunteerProfile = async (userId) => {
    try {
      console.log('🔍 Fetching volunteer profile for:', userId);
      
      const endpoints = [
        `${API_BASE_URL}/volunteers/${userId}`,
        `${API_BASE_URL}/profile/${userId}`,
        `${API_BASE_URL}/profile/me`
      ];

      let profileData = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Success from endpoint:', endpoint, data);
            if (data.success) {
              profileData = data.data.volunteer || data.data;
              break;
            }
          } else {
            console.log(`❌ Endpoint ${endpoint} returned:`, response.status);
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }

      if (profileData) {
        console.log('🎯 Setting volunteer data:', profileData);
        setVolunteer(profileData);
        return profileData;
      } else {
        const fallbackVolunteer = {
          userId: userId,
          name: 'Volunteer User',
          email: 'volunteer@example.com',
          isVolunteer: true,
          availability: { status: 'available' },
          volunteerSkills: ['general_help', 'communication'],
          department: 'general',
          trustScore: 75,
          rating: 4.2,
          tasksCompleted: 5,
          location: 'City Center'
        };
        setVolunteer(fallbackVolunteer);
        return fallbackVolunteer;
      }
    } catch (err) {
      console.error('Error fetching volunteer profile:', err);
      const fallbackVolunteer = {
        userId: userId,
        name: 'Volunteer User',
        email: 'user@example.com',
        isVolunteer: true,
        availability: { status: 'available' },
        volunteerSkills: ['general_help'],
        department: 'general',
        trustScore: 70,
        rating: 4.0,
        tasksCompleted: 0
      };
      setVolunteer(fallbackVolunteer);
      return fallbackVolunteer;
    }
  };

  // Fetch volunteer's tasks
 // Fetch volunteer's tasks - UPDATED WITH CORRECT ENDPOINT
const fetchVolunteerTasks = async (userId) => {
  try {
    console.log('🔍 Fetching tasks for volunteer:', userId);
    
    // Try the specific volunteer tasks endpoint first
    const endpoints = [
      `${API_BASE_URL}/tasks/volunteer/${userId}`,
      `${API_BASE_URL}/tasks?assignedTo=${userId}`,
      `${API_BASE_URL}/tasks?volunteerId=${userId}`,
    ];

    let tasksData = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying tasks endpoint: ${endpoint}`);
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Tasks data from endpoint:', endpoint, data);
          if (data.success) {
            // Clean tasks data to ensure no objects are rendered directly
            tasksData = (data.data || data.tasks || []).map(task => ({
              ...task,
              // Ensure location is always a string
              location: renderLocation(task)
            }));
            break;
          }
        } else {
          console.log(`❌ Tasks endpoint ${endpoint} returned:`, response.status);
        }
      } catch (err) {
        console.log(`Tasks endpoint ${endpoint} failed:`, err.message);
        continue;
      }
    }

    if (tasksData) {
      console.log('🎯 Setting tasks data:', tasksData);
      setTasks(tasksData);
      calculateStats(tasksData);
      return tasksData;
    } else {
      // Return empty array if no tasks found
      console.log('📭 No tasks found, setting empty array');
      setTasks([]);
      calculateStats([]);
      return [];
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
    setTasks([]);
    calculateStats([]);
    return [];
  }
};

  const fetchVolunteerData = async () => {
    try {
      setLoading(true);
      setError('');

      const vid = await fetchCurrentUserProfile();
      if (!vid) {
        console.log('🔄 Trying to get any volunteer ID as fallback...');
        const volunteersResponse = await fetch(`${API_BASE_URL}/volunteers`);
        if (volunteersResponse.ok) {
          const volunteersData = await volunteersResponse.json();
          if (volunteersData.success && volunteersData.data.length > 0) {
            const firstVolunteerId = volunteersData.data[0].userId;
            setVolunteerId(firstVolunteerId);
            await fetchVolunteerProfile(firstVolunteerId);
            await fetchVolunteerTasks(firstVolunteerId);
          } else {
            setError('No volunteers found in the system');
          }
        } else {
          setError('Unable to connect to the server. Please try again later.');
        }
        setLoading(false);
        return;
      }

      console.log('✅ Using volunteer ID:', vid);

      await Promise.all([
        fetchVolunteerProfile(vid),
        fetchVolunteerTasks(vid)
      ]);

    } catch (err) {
      console.error('Error fetching volunteer data:', err);
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    const stats = {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in_progress').length,
      pending: taskList.filter(t => t.status === 'pending' || t.status === 'assigned').length
    };
    setStats(stats);
    console.log('📊 Calculated stats:', stats);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setError('');
      console.log(`🔄 Updating task ${taskId} to status: ${newStatus}`);
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        // Clean the updated task data
        const cleanedTask = {
          ...result.data,
          location: renderLocation(result.data)
        };
        
        setTasks(prev => prev.map(task => 
          task._id === taskId ? cleanedTask : task
        ));
        setSuccess(`Task marked as ${newStatus.replace('_', ' ')}!`);
        setTimeout(() => setSuccess(''), 3000);
        
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(cleanedTask);
        }
        
        calculateStats(tasks.map(task => 
          task._id === taskId ? cleanedTask : task
        ));
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task status');
    }
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getStatusInfo = (status) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status === 'all') return true;
    return task.status === filters.status;
  });

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with Volunteer Info */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {volunteer?.name?.split(' ').map(n => n[0]).join('') || 'V'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{volunteer?.name || 'Volunteer Dashboard'}</h1>
              <p className="text-gray-400 mb-2">{volunteer?.email || 'volunteer@example.com'}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">📍 {safeRender(volunteer?.location || volunteer?.address, 'Location not specified')}</span>
                <span className="text-gray-300">📞 {safeRender(volunteer?.phone)}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.inProgress}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className={`rounded-lg p-4 text-center ${
              volunteer?.availability?.status === 'available' ? 'bg-green-900' : 
              volunteer?.availability?.status === 'busy' ? 'bg-yellow-900' : 'bg-red-900'
            }`}>
              <div className="text-2xl font-bold capitalize">
                {safeRender(volunteer?.availability?.status, 'unavailable')}
              </div>
              <div className="text-sm text-gray-300">Status</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {volunteer?.volunteerSkills && volunteer.volunteerSkills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-3">Your Skills</div>
            <div className="flex flex-wrap gap-2">
              {volunteer.volunteerSkills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                  {skill.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Department and Trust Score */}
        <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Department</div>
            <div className="text-white font-medium capitalize">{safeRender(volunteer?.department?.replace('_', ' '), 'General')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Trust Score</div>
            <div className="text-white font-medium">{safeRender(volunteer?.trustScore, '75')}/100</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Completed Tasks</div>
            <div className="text-white font-medium">{safeRender(volunteer?.tasksCompleted, stats.completed)}</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'bg-gray-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-purple-500' },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-500' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-500' }
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-lg p-4 text-white transform hover:scale-105 transition-transform duration-200`}>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">✕</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Tasks</h2>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tasks</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg">No tasks found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {filters.status === 'all' 
                    ? "You don't have any tasks assigned yet." 
                    : `No ${filters.status.replace('_', ' ')} tasks found.`
                  }
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const categoryInfo = getCategoryInfo(task.category);
                const priorityInfo = getPriorityInfo(task.priority);
                const statusInfo = getStatusInfo(task.status);

                return (
                  <div 
                    key={task._id} 
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer" 
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetail(true);
                    }}
                  >
                    <div className="flex gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-lg ${categoryInfo.color} flex items-center justify-center text-xl flex-shrink-0`}>
                        {categoryInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1">{safeRender(task.title)}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{safeRender(task.description)}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityInfo.color} ${priorityInfo.textColor}`}>
                            {priorityInfo.label}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                            {categoryInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate">{renderLocation(task)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{safeRender(task.estimatedHours)} hrs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <div className="flex gap-2 pt-4 border-t border-gray-700">
                        {task.status === 'assigned' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task._id, 'in_progress');
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-sm transition-colors"
                          >
                            Start Task
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task._id, 'completed');
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-sm transition-colors"
                          >
                            Complete Task
                          </button>
                        )}
                        {(task.status === 'assigned' || task.status === 'in_progress') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task._id, 'pending');
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500 px-3 py-2 rounded text-sm transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Task Detail Panel */}
        <div>
          {showTaskDetail && selectedTask ? (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 sticky top-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-white">Task Details</h4>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-gray-400 block mb-1">Title</span>
                  <div className="text-white font-medium">{safeRender(selectedTask.title)}</div>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">Description</span>
                  <div className="text-white text-xs leading-relaxed bg-gray-700 p-3 rounded-lg">{safeRender(selectedTask.description)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 block mb-1">Category</span>
                    <div className="text-white font-medium flex items-center gap-2">
                      <span>{getCategoryInfo(selectedTask.category).icon}</span>
                      {getCategoryInfo(selectedTask.category).label}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 block mb-1">Priority</span>
                    <div className={`${getPriorityInfo(selectedTask.priority).color} ${getPriorityInfo(selectedTask.priority).textColor} rounded px-2 py-1 text-xs font-medium text-center`}>
                      {getPriorityInfo(selectedTask.priority).label}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 block mb-1">Estimated Hours</span>
                    <div className="text-white font-medium">{safeRender(selectedTask.estimatedHours)} hrs</div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 block mb-1">Status</span>
                    <div className={`${getStatusInfo(selectedTask.status).color} ${getStatusInfo(selectedTask.status).textColor} rounded px-2 py-1 text-xs font-medium text-center`}>
                      {getStatusInfo(selectedTask.status).label}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block mb-1">Location</span>
                  <div className="text-white font-medium">{renderLocation(selectedTask)}</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3">
                  <span className="text-gray-400 block mb-1">Deadline</span>
                  <div className="text-white font-medium">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'No deadline'}</div>
                </div>

                {selectedTask.requiredSkills && selectedTask.requiredSkills.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400 mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.requiredSkills.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.resources && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 block mb-1">Resources Provided</span>
                    <p className="text-white text-xs leading-relaxed">{safeRender(selectedTask.resources)}</p>
                  </div>
                )}

                {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <div className="pt-4 border-t border-gray-600">
                    <div className="text-gray-400 mb-2">Update Status</div>
                    <div className="flex gap-2">
                      {selectedTask.status === 'assigned' && (
                        <button
                          onClick={() => updateTaskStatus(selectedTask._id, 'in_progress')}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-sm transition-colors"
                        >
                          Start Task
                        </button>
                      )}
                      {selectedTask.status === 'in_progress' && (
                        <button
                          onClick={() => updateTaskStatus(selectedTask._id, 'completed')}
                          className="flex-1 bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-sm transition-colors"
                        >
                          Complete Task
                        </button>
                      )}
                      {(selectedTask.status === 'assigned' || selectedTask.status === 'in_progress') && (
                        <button
                          onClick={() => updateTaskStatus(selectedTask._id, 'pending')}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-500 px-3 py-2 rounded text-sm transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 text-center text-gray-400 sticky top-6">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Select a task to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerTaskDashboard;