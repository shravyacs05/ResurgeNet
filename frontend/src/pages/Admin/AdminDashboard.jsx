// components/AdminDashboard.js
import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sosAlerts, setSosAlerts] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [roadReports, setRoadReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeSOS: 0,
    roadReports: 0,
    shelters: 0,
    verifiedReports: 0,
    responseTime: '15min'
  });

  // Check if user is admin, if not redirect (this is a fallback)
  if (user.role !== 'department_admin') {
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

  // Mock data initialization
  useEffect(() => {
    // Simulate API call to fetch data
    setTimeout(() => {
      setSosAlerts([
        { id: 1, user: 'User123', location: 'Mumbai', time: '10 minutes ago', status: 'pending', priority: 'high', type: 'medical' },
        { id: 2, user: 'User456', location: 'Delhi', time: '25 minutes ago', status: 'verified', priority: 'medium', type: 'evacuation' },
        { id: 3, user: 'User789', location: 'Chennai', time: '1 hour ago', status: 'resolved', priority: 'low', type: 'food' },
        { id: 4, user: 'User101', location: 'Bangalore', time: '5 minutes ago', status: 'pending', priority: 'high', type: 'rescue' },
      ]);

      setUserReports([
        { id: 1, user: 'User123', trustScore: 85, reports: 12, verified: 10, joined: '2 days ago' },
        { id: 2, user: 'User456', trustScore: 92, reports: 8, verified: 8, joined: '5 days ago' },
        { id: 3, user: 'User789', trustScore: 65, reports: 5, verified: 2, joined: '1 day ago' },
        { id: 4, user: 'User101', trustScore: 78, reports: 15, verified: 12, joined: '3 days ago' },
      ]);

      setRoadReports([
        { id: 1, type: 'blocked', location: 'Mumbai - Andheri East', reportedBy: 'User123', time: '2 hours ago', verified: true, critical: true },
        { id: 2, type: 'clear', location: 'Delhi - Connaught Place', reportedBy: 'User456', time: '45 minutes ago', verified: true, critical: false },
        { id: 3, type: 'blocked', location: 'Chennai - Anna Salai', reportedBy: 'User789', time: '30 minutes ago', verified: false, critical: true },
      ]);

      setShelters([
        { id: 1, name: 'Mumbai Central Shelter', location: 'Mumbai', capacity: 200, occupied: 120, status: 'active' },
        { id: 2, name: 'Delhi Relief Camp', location: 'Delhi', capacity: 150, occupied: 80, status: 'active' },
        { id: 3, name: 'Chennai Safe Zone', location: 'Chennai', capacity: 100, occupied: 40, status: 'active' },
      ]);

      setSystemStats({
        totalUsers: 1245,
        activeSOS: 24,
        roadReports: 142,
        shelters: 35,
        verifiedReports: 89,
        responseTime: '15min'
      });
    }, 500);
  }, []);

  const updateSOSStatus = (id, status) => {
    setSosAlerts(sosAlerts.map(alert => 
      alert.id === id ? { ...alert, status } : alert
    ));
  };

  const updateUserTrustScore = (id, change) => {
    setUserReports(userReports.map(user => 
      user.id === id ? { ...user, trustScore: Math.min(100, Math.max(0, user.trustScore + change)) } : user
    ));
  };

  const verifyRoadReport = (id) => {
    setRoadReports(roadReports.map(report => 
      report.id === id ? { ...report, verified: true } : report
    ));
  };

  const updateShelterStatus = (id, status) => {
    setShelters(shelters.map(shelter => 
      shelter.id === id ? { ...shelter, status } : shelter
    ));
  };

  const deleteUser = (id) => {
    setUserReports(userReports.filter(user => user.id !== id));
    setSystemStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-gray-400">Welcome, Administrator. Manage system operations and monitor disaster response.</p>
          </div>
          <div className="flex items-center space-x-2">
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
            value={systemStats.totalUsers}
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
            value={systemStats.roadReports}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            color="bg-yellow-500"
            change={8}
          />

          <StatCard
            title="Verified Reports"
            value={systemStats.verifiedReports}
            icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            color="bg-green-500"
            change={15}
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
                <h3 className="text-lg font-medium text-white mb-4">Recent SOS Alerts</h3>
                <div className="space-y-4">
                  {sosAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          alert.priority === 'high' ? 'bg-red-500' : 
                          alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{alert.user}</p>
                          <p className="text-xs text-gray-400">{alert.location} • {alert.time}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        alert.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm">
                  View All Alerts →
                </button>
              </div>

              {/* System Health */}
              <div className="bg-gray-800 rounded-lg shadow p-6">
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

          {activeTab === 'sos' && (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">SOS Alert Management</h3>
                <div className="flex space-x-2">
                  <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>All Types</option>
                    <option>Medical</option>
                    <option>Rescue</option>
                    <option>Evacuation</option>
                    <option>Food/Water</option>
                  </select>
                  <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>All Priorities</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <ul className="divide-y divide-gray-700">
                {sosAlerts.map((alert) => (
                  <li key={alert.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            alert.priority === 'high' ? 'bg-red-500' : 
                            alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-white">
                                {alert.user} - {alert.type}
                              </h3>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                alert.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Location: {alert.location} • {alert.time} • Priority: {alert.priority}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {alert.status !== 'verified' && (
                            <button
                              onClick={() => updateSOSStatus(alert.id, 'verified')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Verify
                            </button>
                          )}
                          {alert.status !== 'resolved' && (
                            <button
                              onClick={() => updateSOSStatus(alert.id, 'resolved')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Resolve
                            </button>
                          )}
                          <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">User Management</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                              {user.reports} reports • {user.verified} verified • Joined {user.joined}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateUserTrustScore(user.id, 5)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            +5 Trust
                          </button>
                          <button
                            onClick={() => updateUserTrustScore(user.id, -5)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            -5 Trust
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

          {activeTab === 'roads' && (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Road Reports Management</h3>
                <div className="flex space-x-2">
                  <select className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>All Reports</option>
                    <option>Verified Only</option>
                    <option>Unverified Only</option>
                    <option>Critical Only</option>
                  </select>
                </div>
              </div>
              <ul className="divide-y divide-gray-700">
                {roadReports.map((report) => (
                  <li key={report.id} className={report.critical ? 'bg-red-900 bg-opacity-20' : ''}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            report.type === 'blocked' ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {report.type === 'blocked' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              )}
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-white">
                                {report.location}
                                {report.critical && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Critical
                                  </span>
                                )}
                              </h3>
                              {report.verified && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Reported by {report.reportedBy} • {report.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!report.verified && (
                            <button
                              onClick={() => verifyRoadReport(report.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Verify
                            </button>
                          )}
                          <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            View on Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'shelters' && (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-4 bg-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Shelter Management</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Add New Shelter
                </button>
              </div>
              <ul className="divide-y divide-gray-700">
                {shelters.map((shelter) => (
                  <li key={shelter.id}>
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
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shelter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {shelter.status}
                          </span>
                          <select
                            value={shelter.status}
                            onChange={(e) => updateShelterStatus(shelter.id, e.target.value)}
                            className="rounded-md border-gray-600 bg-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="full">Full</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Edit
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
                    { label: 'SOS Reports', value: 24, max: 50, color: 'bg-red-600' },
                    { label: 'Road Reports', value: 142, max: 200, color: 'bg-yellow-600' },
                    { label: 'Shelter Updates', value: 35, max: 100, color: 'bg-green-600' },
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
                <h3 className="text-lg font-medium text-white mb-4">Response Times</h3>
                <div className="space-y-4">
                  {[
                    { region: 'Mumbai', time: '12min', efficiency: 85 },
                    { region: 'Delhi', time: '18min', efficiency: 72 },
                    { region: 'Chennai', time: '22min', efficiency: 65 },
                    { region: 'Bangalore', time: '15min', efficiency: 80 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.region}</p>
                        <p className="text-xs text-gray-400">Avg. response: {item.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{item.efficiency}%</p>
                        <p className="text-xs text-gray-400">Efficiency</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-white mb-4">Activity Heatmap</h3>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">
                    <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-2">Heatmap visualization would appear here</p>
                    <p className="text-xs">Showing regional activity distribution</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-white mb-4">System Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300">AI Verification Threshold</label>
                  <div className="mt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="75"
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
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
                      rows={3}
                      className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter emergency message for all users"
                    ></textarea>
                  </div>
                  <button className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Send Emergency Alert
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">System Maintenance</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                      Backup Database
                    </button>
                    <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                      Clear Cache
                    </button>
                    <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Generate Reports
                    </button>
                    <button className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
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