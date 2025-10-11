import React, { useState, useEffect } from 'react';

const Profile = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bloodGroup: '',
    medicalConditions: '',
    emergencyContacts: [
      { name: '', relationship: '', phone: '' },
      { name: '', relationship: '', phone: '' }
    ],
    isVolunteer: false,
    volunteerSkills: [],
    availability: {
      status: 'available',
      schedule: {}
    },
    certifications: [],
    experience: '',
    preferredTasks: []
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Get API URL from environment or use default
  
const API_BASE_URL = 'http://localhost:5002/api';
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationships = ['Parent', 'Sibling', 'Spouse', 'Child', 'Friend', 'Relative', 'Colleague', 'Other'];
  
  const volunteerSkillsOptions = [
    'First Aid/CPR',
    'Medical Training',
    'Construction',
    'Cooking',
    'Driving',
    'Logistics',
    'Counseling',
    'Search & Rescue',
    'Communication',
    'Technical Support',
    'Language Translation',
    'Child Care',
    'Elderly Care',
    'Animal Rescue',
    'Heavy Equipment',
    'Electrical Work',
    'Plumbing',
    'Carpentry'
  ];

  const preferredTasksOptions = [
    'Emergency Department',
    'Medical & Health',
    'Infrastructure',
    'Relief & Shelter',
    'Environment',
    'Community Support'
  ];

  const availabilityStatusOptions = [
    { value: 'available', label: 'Available', color: 'bg-green-500' },
    { value: 'busy', label: 'Busy', color: 'bg-yellow-500' },
    { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500' }
  ];

  const checkBackendAvailability = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.log('Backend health check failed:', error);
      return false;
    }
  };

  const fetchProfile = async (userId) => {
    try {
      setLoading(true);
      const isBackendUp = await checkBackendAvailability();
      setBackendAvailable(isBackendUp);

      if (!isBackendUp) {
        console.log('Backend not available, using local data');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
      
      if (response.status === 404) {
        console.log('Profile not found in backend (new user)');
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Profile loaded from backend:', data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setBackendAvailable(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (userId, profileData) => {
    try {
      setSaveLoading(true);
      const isBackendUp = await checkBackendAvailability();
      setBackendAvailable(isBackendUp);

      if (!isBackendUp) {
        return { 
          success: true,
          message: 'Profile saved locally (backend unavailable)' 
        };
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          userId: userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving profile:', error);
      setBackendAvailable(false);
      return { 
        success: true,
        message: 'Profile saved locally (server error)' 
      };
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        console.log('Loading profile for user:', user.id);
        const profileData = await fetchProfile(user.id);
        
        if (profileData) {
          setFormData({
            name: profileData.name || user.name || '',
            email: profileData.email || user.email || '',
            phone: profileData.phone || user.phone || '',
            address: profileData.address || '',
            bloodGroup: profileData.bloodGroup || '',
            medicalConditions: profileData.medicalConditions || '',
            emergencyContacts: profileData.emergencyContacts?.length > 0 
              ? profileData.emergencyContacts 
              : [
                  { name: '', relationship: '', phone: '' },
                  { name: '', relationship: '', phone: '' }
                ],
            isVolunteer: profileData.isVolunteer || false,
            volunteerSkills: profileData.volunteerSkills || [],
            availability: profileData.availability || {
              status: 'available',
              schedule: {}
            },
            certifications: profileData.certifications || [],
            experience: profileData.experience || '',
            preferredTasks: profileData.preferredTasks || []
          });
        } else {
          console.log('Using Firebase user data as fallback');
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            bloodGroup: user.bloodGroup || '',
            medicalConditions: user.medicalConditions || '',
            emergencyContacts: user.emergencyContacts || [
              { name: '', relationship: '', phone: '' },
              { name: '', relationship: '', phone: '' }
            ],
            isVolunteer: user.isVolunteer || false,
            volunteerSkills: user.volunteerSkills || [],
            availability: user.availability || {
              status: 'available',
              schedule: {}
            },
            certifications: user.certifications || [],
            experience: user.experience || '',
            preferredTasks: user.preferredTasks || []
          });
        }
      }
    };
    
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleVolunteerToggle = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({ 
      ...prev, 
      isVolunteer: isChecked,
      ...(isChecked ? {} : {
        volunteerSkills: [],
        availability: { status: 'available', schedule: {} },
        certifications: [],
        experience: '',
        preferredTasks: []
      })
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      volunteerSkills: prev.volunteerSkills.includes(skill)
        ? prev.volunteerSkills.filter(s => s !== skill)
        : [...prev.volunteerSkills, skill]
    }));
  };

  const handleTaskToggle = (task) => {
    setFormData(prev => ({
      ...prev,
      preferredTasks: prev.preferredTasks.includes(task)
        ? prev.preferredTasks.filter(t => t !== task)
        : [...prev.preferredTasks, task]
    }));
  };

  const handleAvailabilityChange = (status) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        status
      }
    }));
  };

  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index][field] = value;
    setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', relationship: '', phone: '' }]
    }));
  };

  const removeEmergencyContact = (index) => {
    if (formData.emergencyContacts.length > 1) {
      const updatedContacts = [...formData.emergencyContacts];
      updatedContacts.splice(index, 1);
      setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    console.log('Saving profile data:', formData);
    
    const saveResult = await saveProfile(user.id, formData);
    
    if (saveResult.success) {
      if (typeof setUser === 'function') {
        setUser({ ...user, ...formData });
      }
      setIsEditing(false);
      alert(`Profile updated successfully! ${saveResult.message || ''}`);
    } else {
      alert(`Failed to update profile: ${saveResult.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    if (user?.id) {
      fetchProfile(user.id).then(profileData => {
        if (profileData) {
          setFormData({
            name: profileData.name || user.name || '',
            email: profileData.email || user.email || '',
            phone: profileData.phone || user.phone || '',
            address: profileData.address || '',
            bloodGroup: profileData.bloodGroup || '',
            medicalConditions: profileData.medicalConditions || '',
            emergencyContacts: profileData.emergencyContacts || [
              { name: '', relationship: '', phone: '' },
              { name: '', relationship: '', phone: '' }
            ],
            isVolunteer: profileData.isVolunteer || false,
            volunteerSkills: profileData.volunteerSkills || [],
            availability: profileData.availability || {
              status: 'available',
              schedule: {}
            },
            certifications: profileData.certifications || [],
            experience: profileData.experience || '',
            preferredTasks: profileData.preferredTasks || []
          });
        } else {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            bloodGroup: user.bloodGroup || '',
            medicalConditions: user.medicalConditions || '',
            emergencyContacts: user.emergencyContacts || [
              { name: '', relationship: '', phone: '' },
              { name: '', relationship: '', phone: '' }
            ],
            isVolunteer: user.isVolunteer || false,
            volunteerSkills: user.volunteerSkills || [],
            availability: user.availability || {
              status: 'available',
              schedule: {}
            },
            certifications: user.certifications || [],
            experience: user.experience || '',
            preferredTasks: user.preferredTasks || []
          });
        }
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {!backendAvailable && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-400">Backend server unavailable. Using local data.</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white transition-colors flex items-center disabled:opacity-50"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md text-white transition-colors flex items-center disabled:opacity-50"
              disabled={saveLoading}
            >
              {saveLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Full Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saveLoading}
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[42px] flex items-center">
                      {formData.name || 'Not provided'}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Email Address *</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saveLoading}
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[42px] flex items-center">
                      {formData.email || 'Not provided'}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saveLoading}
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[42px] flex items-center">
                      {formData.phone || 'Not provided'}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Blood Group</label>
                  {isEditing ? (
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saveLoading}
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[42px] flex items-center">
                      {formData.bloodGroup || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saveLoading}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[60px] flex items-center whitespace-pre-line">
                    {formData.address || 'Not provided'}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Medical Conditions</label>
                {isEditing ? (
                  <textarea
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List any medical conditions, allergies, or special needs"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saveLoading}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[60px] flex items-center whitespace-pre-line">
                    {formData.medicalConditions || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Volunteer Registration</h2>
              
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="isVolunteer"
                      checked={formData.isVolunteer}
                      onChange={handleVolunteerToggle}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      disabled={saveLoading}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={formData.isVolunteer}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      disabled
                    />
                  )}
                  <div>
                    <span className="text-lg font-medium text-white">Register as Volunteer</span>
                    <p className="text-sm text-gray-400 mt-1">
                      Join our disaster response team and help your community
                    </p>
                  </div>
                </label>
              </div>

              {formData.isVolunteer && (
                <div className="space-y-4 mt-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div>
                    <label className="block text-gray-300 mb-2">Current Availability</label>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        {availabilityStatusOptions.map(status => (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => handleAvailabilityChange(status.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              formData.availability.status === status.value
                                ? `${status.color} text-white`
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        {availabilityStatusOptions.map(status => (
                          <span
                            key={status.value}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-center ${
                              formData.availability.status === status.value
                                ? `${status.color} text-white`
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {status.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-gray-300 mb-2">Skills & Expertise</label>
                      <div className="max-h-48 overflow-y-auto bg-gray-700 rounded-md p-3">
                        <div className="grid grid-cols-1 gap-2">
                          {volunteerSkillsOptions.map(skill => (
                            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.volunteerSkills.includes(skill)}
                                onChange={() => handleSkillToggle(skill)}
                                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-300">{skill}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div>
                      <label className="block text-gray-300 mb-2">Preferred Tasks</label>
                      <div className="max-h-32 overflow-y-auto bg-gray-700 rounded-md p-3">
                        <div className="grid grid-cols-1 gap-2">
                          {preferredTasksOptions.map(task => (
                            <label key={task} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.preferredTasks.includes(task)}
                                onChange={() => handleTaskToggle(task)}
                                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-300">{task}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-300 mb-2">Experience & Certifications</label>
                    {isEditing ? (
                      <textarea
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe your relevant experience, training, or certifications..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={saveLoading}
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[60px] text-sm whitespace-pre-line">
                        {formData.experience || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <>
                      {formData.volunteerSkills.length > 0 && (
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm">Skills</label>
                          <div className="flex flex-wrap gap-1">
                            {formData.volunteerSkills.map(skill => (
                              <span key={skill} className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.preferredTasks.length > 0 && (
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm">Preferred Tasks</label>
                          <div className="flex flex-wrap gap-1">
                            {formData.preferredTasks.map(task => (
                              <span key={task} className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                {task}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Emergency Contacts</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={addEmergencyContact}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md text-white text-sm transition-colors flex items-center disabled:opacity-50"
                  disabled={saveLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Contact
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg relative">
                  {isEditing && formData.emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmergencyContact(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 disabled:opacity-50"
                      disabled={saveLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saveLoading}
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-600 rounded-md min-h-[42px] flex items-center">
                          {contact.name || 'Not provided'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-2">Relationship</label>
                      {isEditing ? (
                        <select
                          value={contact.relationship}
                          onChange={(e) => handleEmergencyContactChange(index, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saveLoading}
                        >
                          <option value="">Select Relationship</option>
                          {relationships.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-gray-600 rounded-md min-h-[42px] flex items-center">
                          {contact.relationship || 'Not provided'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-2">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => handleEmergencyContactChange(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saveLoading}
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-600 rounded-md min-h-[42px] flex items-center">
                          {contact.phone || 'Not provided'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md text-white transition-colors flex items-center disabled:opacity-50"
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mt-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">User ID</label>
            <div className="px-3 py-2 bg-gray-700 rounded-md text-sm font-mono min-h-[42px] flex items-center">
              {user?.id || 'Not available'}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Account Type</label>
            <div className="px-3 py-2 bg-gray-700 rounded-md capitalize min-h-[42px] flex items-center">
              {user?.role || 'user'}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Volunteer Status</label>
            <div className="px-3 py-2 bg-gray-700 rounded-md min-h-[42px] flex items-center">
              {formData.isVolunteer ? (
                <span className="flex items-center text-green-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Registered Volunteer
                </span>
              ) : (
                <span className="text-gray-400">Not Registered</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Trust Score</label>
            <div className="px-3 py-2 bg-gray-700 rounded-md flex items-center min-h-[42px]">
              <div className="w-full bg-gray-600 rounded-full h-2 mr-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${user?.trustScore || 80}%` }}
                ></div>
              </div>
              <span>{user?.trustScore || 80}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
        <h4 className="text-sm font-medium text-blue-300 mb-1">Profile Storage:</h4>
        <p className="text-xs text-blue-400">
          
        </p>
      </div>
    </div>
  );
};

Profile.defaultProps = {
  user: {},
  setUser: () => console.warn('setUser function not provided - profile will be saved locally only')
};

export default Profile;