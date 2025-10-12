import React, { useState, useEffect } from 'react';
import PartnerApprovals from './PartnerApprovals';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  BarChart3,
  Building2,
  Activity,
  Users,
  Shield,
  Ambulance,
  Home,
  Wrench,
  CloudRain,
  MapPin,
  Filter,
  TrendingUp,
  Target,
  LogOut,
  Settings,
  UserCog,
  Menu
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define SOS_CATEGORIES constant
const SOS_CATEGORIES = {
  emergency_response: {
    name: 'Emergency Response',
    description: 'Fire, police, and immediate emergency services',
    icon: Shield,
    color: '#EF4444'
  },
  medical_health: {
    name: 'Medical & Health',
    description: 'Medical emergencies, injuries, health crises',
    icon: Ambulance,
    color: '#3B82F6'
  },
  infrastructure_utilities: {
    name: 'Infrastructure & Utilities',
    description: 'Power outages, water issues, structural damage',
    icon: Wrench,
    color: '#F59E0B'
  },
  relief_shelter: {
    name: 'Relief & Shelter',
    description: 'Shelter, food, and basic necessities',
    icon: Home,
    color: '#10B981'
  },
  environment_hazards: {
    name: 'Environment & Hazards',
    description: 'Floods, earthquakes, environmental disasters',
    icon: CloudRain,
    color: '#8B5CF6'
  },
  community_support: {
    name: 'Community Support',
    description: 'Community assistance and support services',
    icon: Users,
    color: '#EC4899'
  }
};

const SuperAdminDashboard = ({ user, onLogout }) => {
  const [sosAlerts, setSosAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    acknowledged: 0,
    byDepartment: {}
  });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enhanced dummy data
  const dummyAlerts = [
    {
      id: '1',
      department: 'emergency_response',
      category: 'Building Fire',
      location: 'Downtown Commercial District',
      description: 'Major commercial building fire with multiple floors affected',
      status: 'pending',
      createdAt: new Date(Date.now() - 30 * 60000),
      priority: 'high'
      createdAt: new Date(Date.now() - 30 * 60000),
      priority: 'critical',
      responseTime: 8
    },
    {
      id: '2',
      department: 'medical_health',
      category: 'Mass Casualty',
      location: 'Central Park Area',
      description: 'Multiple injuries from vehicular accident, urgent medical attention required',
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 15 * 60000),
      priority: 'high'
      createdAt: new Date(Date.now() - 15 * 60000),
      priority: 'high',
      responseTime: 12
    },
    {
      id: '3',
      department: 'infrastructure_utilities',
      category: 'Power Grid Failure',
      location: 'North District',
      description: 'Large scale power outage affecting 5000+ residents',
      status: 'resolved',
      createdAt: new Date(Date.now() - 120 * 60000),
      priority: 'medium'
      createdAt: new Date(Date.now() - 120 * 60000),
      priority: 'high',
      responseTime: 45
    },
    {
      id: '4',
      department: 'environment_hazards',
      category: 'Flash Floods',
      location: 'Riverside Residential Area',
      description: 'Rapidly rising water levels, evacuation in progress',
      status: 'pending',
      createdAt: new Date(Date.now() - 45 * 60000),
      priority: 'critical'
      createdAt: new Date(Date.now() - 45 * 60000),
      priority: 'critical',
      responseTime: 6
    },
    {
      id: '5',
      department: 'relief_shelter',
      category: 'Emergency Shelter',
      location: 'Westside Community Center',
      description: 'Temporary shelter setup for displaced families',
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 20 * 60000),
      priority: 'high'
      createdAt: new Date(Date.now() - 20 * 60000),
      priority: 'medium',
      responseTime: 25
    },
    {
      id: '6',
      department: 'community_support',
      category: 'Resource Coordination',
      location: 'City Distribution Center',
      description: 'Volunteer coordination for relief distribution efforts',
      status: 'pending',
      createdAt: new Date(Date.now() - 10 * 60000),
      priority: 'medium'
    }
      createdAt: new Date(Date.now() - 10 * 60000),
      priority: 'medium',
      responseTime: 18
    }
  ];

  // Chart data for analytics
  const departmentPerformanceData = Object.entries(SOS_CATEGORIES).map(([key, dept]) => ({
    name: dept.name,
    alerts: Math.floor(Math.random() * 50) + 10,
    responseTime: Math.floor(Math.random() * 30) + 5,
    successRate: Math.floor(Math.random() * 30) + 70
  }));

  const statusDistributionData = [
    { name: 'Resolved', value: 45, color: '#10B981' },
    { name: 'Acknowledged', value: 30, color: '#3B82F6' },
    { name: 'Pending', value: 25, color: '#F59E0B' }
  ];

  useEffect(() => {
    setSosAlerts(dummyAlerts);
    calculateStats(dummyAlerts);
  }, []);

  const calculateStats = (alerts) => {
    const stats = {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      byDepartment: {}
    };

    Object.keys(SOS_CATEGORIES).forEach(dept => {
      stats.byDepartment[dept] = alerts.filter(a => a.department === dept).length;
    });

    setStats(stats);
  };

  const updateAlertStatus = async (alertId, status) => {
    try {
      setSosAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      ));
      
      calculateStats(sosAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      ));
    } catch (error) {
      console.error('Error updating alert:', error);
    }
    setSosAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status } : alert
    ));
    
    calculateStats(sosAlerts.map(alert => 
      alert.id === alertId ? { ...alert, status } : alert
    ));
  };

  const filteredAlerts = selectedDepartment === 'all' 
    ? sosAlerts 
    : sosAlerts.filter(alert => alert.department === selectedDepartment);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-gray-900';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'acknowledged': return 'bg-blue-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // If Partner Approvals tab is active, render only that component
  if (activeTab === 'partner_approvals') {
    return <PartnerApprovals user={user} />;
  }

  // Handle sign out
  const handleSignOut = () => {
    console.log('Sign out button clicked');
    
    // Call the onLogout prop if it exists
    if (onLogout && typeof onLogout === 'function') {
      console.log('Calling onLogout function');
      onLogout();
    } else {
      console.warn('onLogout prop is not provided or is not a function');
      // Fallback logout logic
      alert('Logging out... Please ensure onLogout prop is passed to SuperAdminDashboard');
      // You can add your own logout logic here:
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
  };

  const StatCard = ({ icon: Icon, title, value, description, trend, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-3 text-xs">
          <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
          <span className="text-green-400">{trend}</span>
          <span className="text-gray-500 ml-1">from yesterday</span>
        </div>
      )}
    </div>
  );

  const DepartmentCard = ({ departmentKey, category }) => {
    const Icon = category.icon;
    const departmentAlerts = sosAlerts.filter(alert => alert.department === departmentKey);
    const pendingAlerts = departmentAlerts.filter(alert => alert.status === 'pending');
    
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
              <Icon className="w-5 h-5" style={{ color: category.color }} />
            </div>
            <h3 className="font-semibold text-white">{category.name}</h3>
          </div>
          <span className="text-2xl font-bold text-white">{departmentAlerts.length}</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">{category.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pending Alerts</span>
            <span className="font-semibold text-yellow-400">{pendingAlerts.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg Response</span>
            <span className="font-semibold text-green-400">12min</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: `${(departmentAlerts.length / Math.max(...Object.values(stats.byDepartment))) * 100}%`,
                backgroundColor: category.color
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Navigation items configuration
  const navItems = [
    { key: 'overview', icon: Activity, label: 'Overview' },
    { key: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { key: 'departments', icon: Building2, label: 'Departments' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
      {/* Super Admin Navbar */}
      <nav className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['overview', 'alerts', 'departments', 'analytics', 'partner_approvals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition duration-300 relative ${
                  activeTab === tab
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'partner_approvals' ? (
                  <span className="flex items-center space-x-2">
                    <span>Partner Approvals</span>
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      New
                    </span>
                  </span>
                ) : (
                  tab
               )}
              </button>
            ))}
          </nav>
        </div>
      </div>
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Activity className="h-8 w-8 text-blue-400 mr-3" />
                <span className="text-xl font-bold text-white">
                  Resurge<span className="text-blue-400">Net</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-300 flex items-center space-x-2 ${
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-blue-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3 bg-blue-800 bg-opacity-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  DS
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">Demo Super Admin</div>
                  <div className="text-xs text-blue-200">Super Admin</div>
                </div>
              </div>

              {/* Logout Button - Desktop */}
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm text-white font-medium transition duration-200 shadow-lg cursor-pointer"
                type="button"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-blue-800 transition duration-300"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-blue-700">
              <div className="flex flex-col space-y-2">
                {navItems.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition duration-300 flex items-center space-x-3 ${
                      activeTab === key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-blue-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
                
                {/* Mobile User Info */}
                <div className="border-t border-blue-700 pt-3 mt-2">
                  <div className="bg-blue-800 bg-opacity-50 rounded-lg p-3 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        DS
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Demo Super Admin</div>
                        <div className="text-xs text-blue-200">Super Admin</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Logout Button */}
                  <button
                    onClick={handleSignOut}
                    type="button"
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-sm text-white font-medium transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            

            {/* Department Statistics */}
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Activity}
                title="Total Alerts"
                value={stats.total}
                description="Active incidents"
                trend="+12%"
                color="bg-blue-500"
              />
              <StatCard
                icon={AlertTriangle}
                title="Pending Response"
                value={stats.pending}
                description="Requiring attention"
                trend="+5%"
                color="bg-yellow-500"
              />
              <StatCard
                icon={Eye}
                title="Acknowledged"
                value={stats.acknowledged}
                description="Under management"
                trend="+8%"
                color="bg-blue-500"
              />
              <StatCard
                icon={CheckCircle}
                title="Resolved"
                value={stats.resolved}
                description="Successfully closed"
                trend="+15%"
                color="bg-green-500"
              />
            </div>

            {/* Department Overview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Department Overview</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>Real-time monitoring</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(SOS_CATEGORIES).map(([key, category]) => (
                  <DepartmentCard key={key} departmentKey={key} category={category} />
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>Critical Priority Alerts</span>
                  </h2>
                  <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                    {sosAlerts.filter(a => a.priority === 'critical').length} Active
                  </span>
                </div>
              </div>
              <div className="p-6">
                {sosAlerts.filter(alert => alert.priority === 'critical').length > 0 ? (
                  <div className="space-y-4">
                    {sosAlerts
                      .filter(alert => alert.priority === 'critical')
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((alert) => {
                        const CategoryIcon = SOS_CATEGORIES[alert.department]?.icon || Building2;
                        return (
                        <div key={alert.id} className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="p-2 rounded-lg bg-red-500/20">
                              <CategoryIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-white">{SOS_CATEGORIES[alert.department]?.name}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-300">{alert.category}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-400 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {alert.location}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">{alert.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span>{getTimeAgo(alert.createdAt)}</span>
                                <span>Response: {alert.responseTime}min</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                            {alert.status !== 'resolved' && (
                              <button
                                onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition duration-200"
                              >
                                Acknowledge
                              </button>
                            )}
                          </div>
                        </div>
                      )})}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-400">No critical alerts at the moment</p>
                    <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-white">Emergency Alert Management</h2>
                <p className="text-sm text-gray-400 mt-1">{filteredAlerts.length} active incidents</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Filter className="w-4 h-4" />
                  <span>Filter by:</span>
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {Object.entries(SOS_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => {
                      const CategoryIcon = SOS_CATEGORIES[alert.department]?.icon || Building2;
                      return (
                      <tr key={alert.id} className="hover:bg-gray-750 transition duration-300">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {getTimeAgo(alert.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gray-700">
                              <CategoryIcon className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="font-medium">{SOS_CATEGORIES[alert.department]?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          {alert.status !== 'resolved' && (
                            <>
                              <button
                                onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition duration-200"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition duration-200"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          {alert.status === 'resolved' && (
                            <span className="text-green-400 text-xs flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No alerts found for the selected department</p>
                          <p className="text-sm text-gray-500 mt-1">All systems are clear</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SOS_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const departmentAlerts = sosAlerts.filter(alert => alert.department === key);
              const pendingAlerts = departmentAlerts.filter(alert => alert.status === 'pending');
              const resolvedAlerts = departmentAlerts.filter(alert => alert.status === 'resolved');
              const successRate = departmentAlerts.length > 0 ? Math.round((resolvedAlerts.length / departmentAlerts.length) * 100) : 0;
              
              return (
                <div key={key} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                    </div>
                    <span className="text-2xl font-bold text-white">{departmentAlerts.length}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">{category.description}</p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Success Rate</span>
                      <span className="text-lg font-bold" style={{ color: category.color }}>
                        {successRate}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-750 rounded-lg">
                        <div className="text-yellow-400 font-semibold">{pendingAlerts.length}</div>
                        <div className="text-gray-400 text-xs">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-gray-750 rounded-lg">
                        <div className="text-green-400 font-semibold">{resolvedAlerts.length}</div>
                        <div className="text-gray-400 text-xs">Resolved</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Response</span>
                        <span className="font-semibold">12min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Team Size</span>
                        <span className="font-semibold">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Availability</span>
                        <span className="font-semibold text-green-400">98.7%</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full mt-6 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm font-medium transition duration-300 flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View Department</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Response Metrics</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Response</span>
                    <span className="font-semibold text-green-400">8.2min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Critical Incidents</span>
                    <span className="font-semibold">12min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">SLA Compliance</span>
                    <span className="font-semibold text-green-400">96.7%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span>Success Metrics</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Resolution Rate</span>
                    <span className="font-semibold text-green-400">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">First Contact</span>
                    <span className="font-semibold">98.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Satisfaction</span>
                    <span className="font-semibold text-green-400">4.8/5</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Volume Trends</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Today</span>
                    <span className="font-semibold">12 alerts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">This Week</span>
                    <span className="font-semibold">84 alerts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">This Month</span>
                    <span className="font-semibold">312 alerts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-6">Department Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Bar dataKey="successRate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-6">Alert Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;