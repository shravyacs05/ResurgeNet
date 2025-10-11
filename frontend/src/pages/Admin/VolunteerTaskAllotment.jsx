// components/admin/VolunteerTaskAllotment.jsx
import React, { useState, useEffect } from 'react';

const VolunteerTaskAllotment = ({ user, getAuthHeaders }) => {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const API_BASE_URL = 'http://localhost:5001/api';

  // Fetch tasks and volunteers
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchVolunteers()]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // Mock data
      setTasks([
        {
          _id: 1,
          title: 'Road Clearing - Mumbai Highway',
          description: 'Clear debris and fallen trees from Mumbai-Pune highway',
          type: 'rebuilding',
          priority: 'high',
          status: 'pending',
          location: 'Mumbai-Pune Highway',
          requiredSkills: ['heavy_machinery', 'debris_removal'],
          assignedTo: null,
          estimatedHours: 8,
          deadline: '2024-01-15'
        },
        {
          _id: 2,
          title: 'Medical Camp Setup',
          description: 'Set up temporary medical camp',
          type: 'relief',
          priority: 'high',
          status: 'pending',
          location: 'Chennai Relief Camp',
          requiredSkills: ['medical_aid', 'first_aid'],
          assignedTo: null,
          estimatedHours: 6,
          deadline: '2024-01-12'
        }
      ]);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/volunteers`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch volunteers');
      
      const result = await response.json();
      if (result.success) {
        setVolunteers(result.data);
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      // Mock data
      setVolunteers([
        {
          _id: 'user123',
          name: 'Dr. Rajesh Sharma',
          skills: ['medical_aid', 'first_aid'],
          availability: 'available',
          tasksCompleted: 12,
          rating: 4.8
        },
        {
          _id: 'user456',
          name: 'Amit Kumar',
          skills: ['construction', 'heavy_machinery'],
          availability: 'available',
          tasksCompleted: 8,
          rating: 4.5
        }
      ]);
    }
  };

  // Open assignment modal
  const openAssignmentModal = (task) => {
    setSelectedTask(task);
    setShowAssignmentModal(true);
  };

  // Assign task to volunteer
  const assignTask = async (volunteerId) => {
    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/tasks/${selectedTask._id}/assign`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          volunteerId: volunteerId,
          assignedBy: user.uid
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
      }
    } catch (err) {
      console.error('Error assigning task:', err);
      setError(err.message || 'Failed to assign task');
    }
  };

  // Get matching volunteers for a task
  const getMatchingVolunteers = () => {
    if (!selectedTask) return [];
    
    return volunteers.filter(volunteer => 
      volunteer.availability === 'available' &&
      selectedTask.requiredSkills.some(skill => 
        volunteer.skills.includes(skill)
      )
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
      {/* Assignment Modal */}
      {showAssignmentModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  Assign Task: {selectedTask.title}
                </h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Task Details</h4>
                <p className="text-white mb-2">{selectedTask.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{selectedTask.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Required Skills:</span>
                    <span className="text-white ml-2">{selectedTask.requiredSkills.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-4">
                  Available Volunteers ({getMatchingVolunteers().length})
                </h4>
                {getMatchingVolunteers().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No available volunteers match the required skills.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getMatchingVolunteers().map(volunteer => (
                      <div key={volunteer._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {volunteer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <h5 className="text-sm font-medium text-white">{volunteer.name}</h5>
                            <p className="text-sm text-gray-400">{volunteer.skills.join(', ')}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">
                                Rating: {volunteer.rating} • Tasks: {volunteer.tasksCompleted}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => assignTask(volunteer._id)}
                          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white text-sm transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Volunteer Task Allotment</h3>
        <button 
          onClick={fetchData}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900 text-red-200">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-700">
        {tasks.filter(task => !task.assignedTo).map((task) => (
          <li key={task._id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-white">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {task.location} • {task.estimatedHours} hours
                    </p>
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">Skills: </span>
                      {task.requiredSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300 mr-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openAssignmentModal(task)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Assign Volunteer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VolunteerTaskAllotment;