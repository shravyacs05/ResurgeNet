import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Menu,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define SOS_CATEGORIES constant matching backend departments
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
  infrastructure: {
    name: 'Infrastructure',
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
  community_safety: {
    name: 'Community Safety',
    description: 'Community assistance and support services',
    icon: Users,
    color: '#EC4899'
  }
};

const SuperAdminDashboard = ({ user, onLogout }) => {
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = 'http://localhost:5002/api';

  // Fetch SOS alerts from backend
  const fetchSOSAlerts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching SOS alerts from backend...');
      
      // Since we need all alerts across departments, we'll fetch from emergency_response as base
      const response = await axios.get(`${API_BASE_URL}/sos/department/emergency_response?limit=100&status=active`);
      
      console.log('📥 SOS Alerts API Response:', response.data);
      
      if (response.data.success && response.data.alerts) {
        const alerts = response.data.alerts;
        console.log('✅ SOS alerts fetched:', alerts.length);
        setSosAlerts(alerts);
        calculateStats(alerts);
      } else {
        console.error('❌ Failed to fetch SOS alerts:', response.data);
        setSosAlerts([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error fetching SOS alerts:', error);
      console.error('Error details:', error.response?.data);
      setSosAlerts([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch alerts for a specific department
  const fetchDepartmentAlerts = async (department) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sos/department/${department}?limit=50`);
      if (response.data.success) {
        return response.data.alerts || [];
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching ${department} alerts:`, error);
      return [];
    }
  };

  // Fetch all department alerts for comprehensive overview
  const fetchAllDepartmentAlerts = async () => {
    try {
      const departments = Object.keys(SOS_CATEGORIES);
      const allAlerts = [];
      
      for (const department of departments) {
        const alerts = await fetchDepartmentAlerts(department);
        allAlerts.push(...alerts);
      }
      
      // Remove duplicates based on alert ID
      const uniqueAlerts = allAlerts.filter((alert, index, self) =>
        index === self.findIndex(a => a._id === alert._id)
      );
      
      setSosAlerts(uniqueAlerts);
      calculateStats(uniqueAlerts);
    } catch (error) {
      console.error('❌ Error fetching all department alerts:', error);
    }
  };

  const calculateStats = (alerts) => {
    const stats = {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      acknowledged: alerts.filter(a => 
        ['verified', 'acknowledged', 'assigned', 'in_progress'].includes(a.status)
      ).length,
      byDepartment: {}
    };

    // Initialize department counts
    Object.keys(SOS_CATEGORIES).forEach(dept => {
      stats.byDepartment[dept] = 0;
    });

    // Count alerts by department
    alerts.forEach(alert => {
      if (alert.assignedDepartments && Array.isArray(alert.assignedDepartments)) {
        alert.assignedDepartments.forEach(dept => {
          if (dept.department && stats.byDepartment[dept.department] !== undefined) {
            stats.byDepartment[dept.department]++;
          }
        });
      }
    });

    setStats(stats);
  };

  const updateAlertStatus = async (alertId, status, department = null) => {
    try {
      console.log('🔧 Updating alert status:', { alertId, status, department });
      
      const response = await axios.patch(`${API_BASE_URL}/sos/${alertId}/status`, {
        status,
        department: department || 'emergency_response',
        adminId: user?.uid,
        adminName: user?.displayName || 'Super Admin'
      });

      if (response.data.success) {
        console.log('✅ Alert status updated successfully');
        
        // Update local state
        setSosAlerts(prev => prev.map(alert => 
          alert._id === alertId ? { ...alert, status } : alert
        ));
        
        // Recalculate stats
        calculateStats(sosAlerts.map(alert => 
          alert._id === alertId ? { ...alert, status } : alert
        ));
      }
    } catch (error) {
      console.error('❌ Error updating alert status:', error);
      alert(`Error updating alert: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSOSAlerts();
  };

  useEffect(() => {
    fetchSOSAlerts();
  }, []);

  const filteredAlerts = selectedDepartment === 'all' 
    ? sosAlerts 
    : sosAlerts.filter(alert => 
        alert.assignedDepartments?.some(dept => dept.department === selectedDepartment)
      );

  const getPriorityColor = (priority) => {
    const urgencyLevel = priority || 'medium';
    switch (urgencyLevel) {
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
      case 'verified':
      case 'acknowledged': 
      case 'assigned': 
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDepartmentIcon = (departmentKey) => {
    return SOS_CATEGORIES[departmentKey]?.icon || Building2;
  };

  const getDepartmentName = (departmentKey) => {
    return SOS_CATEGORIES[departmentKey]?.name || departmentKey;
  };

  // Generate chart data from real alerts
  const departmentPerformanceData = Object.entries(SOS_CATEGORIES).map(([key, dept]) => {
    const deptAlerts = sosAlerts.filter(alert => 
      alert.assignedDepartments?.some(d => d.department === key)
    );
    const resolved = deptAlerts.filter(alert => alert.status === 'resolved').length;
    const successRate = deptAlerts.length > 0 ? Math.round((resolved / deptAlerts.length) * 100) : 0;
    
    return {
      name: dept.name,
      alerts: deptAlerts.length,
      responseTime: Math.floor(Math.random() * 30) + 5, // Mock data for now
      successRate: successRate
    };
  });

  const statusDistributionData = [
    { 
      name: 'Resolved', 
      value: stats.resolved, 
      color: '#10B981' 
    },
    { 
      name: 'In Progress', 
      value: stats.acknowledged, 
      color: '#3B82F6' 
    },
    { 
      name: 'Pending', 
      value: stats.pending, 
      color: '#F59E0B' 
    }
  ];

  // If Partner Approvals tab is active, render only that component
  if (activeTab === 'partner_approvals') {
    return <PartnerApprovals user={user} />;
  }

  // Handle sign out
  const handleSignOut = () => {
    console.log('Sign out button clicked');
    
    if (onLogout && typeof onLogout === 'function') {
      console.log('Calling onLogout function');
      onLogout();
    } else {
      console.warn('onLogout prop is not provided or is not a function');
      alert('Logging out... Please ensure onLogout prop is passed to SuperAdminDashboard');
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
    const departmentAlerts = sosAlerts.filter(alert => 
      alert.assignedDepartments?.some(dept => dept.department === departmentKey)
    );
    const pendingAlerts = departmentAlerts.filter(alert => alert.status === 'pending');
    const resolvedAlerts = departmentAlerts.filter(alert => alert.status === 'resolved');
    const successRate = departmentAlerts.length > 0 ? 
      Math.round((resolvedAlerts.length / departmentAlerts.length) * 100) : 0;
    
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
            <span className="text-gray-400">Resolved</span>
            <span className="font-semibold text-green-400">{resolvedAlerts.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Success Rate</span>
            <span className="font-semibold" style={{ color: category.color }}>
              {successRate}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: `${(departmentAlerts.length / Math.max(1, ...Object.values(stats.byDepartment))) * 100}%`,
                backgroundColor: category.color
              }}
            ></div>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedDepartment(departmentKey);
            setActiveTab('alerts');
          }}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm transition duration-300"
        >
          View Alerts
        </button>
      </div>
    );
  };

  // Navigation items configuration
  const navItems = [
    { key: 'overview', icon: Activity, label: 'Overview' },
    { key: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { key: 'departments', icon: Building2, label: 'Departments' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
    { key: 'partner_approvals', icon: Users, label: 'Partner Approvals' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Enhanced Navigation Header */}
      <nav className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {key === 'partner_approvals' && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      New
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden md:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm text-white font-medium transition duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3 bg-blue-800 bg-opacity-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.displayName?.charAt(0) || 'SA'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.displayName || 'Super Admin'}
                  </div>
                  <div className="text-xs text-blue-200">Super Admin</div>
                </div>
              </div>

              {/* Logout Button - Desktop */}
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm text-white font-medium transition duration-200"
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
                    {key === 'partner_approvals' && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        New
                      </span>
                    )}
                  </button>
                ))}
                
                {/* Mobile Actions */}
                <div className="border-t border-blue-700 pt-3 mt-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-sm text-white font-medium transition duration-200 flex items-center justify-center space-x-2 mb-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                  </button>
                  
                  {/* Mobile User Info */}
                  <div className="bg-blue-800 bg-opacity-50 rounded-lg p-3 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user?.displayName?.charAt(0) || 'SA'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user?.displayName || 'Super Admin'}
                        </div>
                        <div className="text-xs text-blue-200">Super Admin</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Logout Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-sm text-white font-medium transition duration-200 flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-300">Loading dashboard data...</span>
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Activity}
                title="Total Alerts"
                value={stats.total}
                description="Active incidents"
                color="bg-blue-500"
              />
              <StatCard
                icon={AlertTriangle}
                title="Pending Response"
                value={stats.pending}
                description="Requiring attention"
                color="bg-yellow-500"
              />
              <StatCard
                icon={Eye}
                title="In Progress"
                value={stats.acknowledged}
                description="Under management"
                color="bg-blue-500"
              />
              <StatCard
                icon={CheckCircle}
                title="Resolved"
                value={stats.resolved}
                description="Successfully closed"
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
                    <span>High Priority Alerts</span>
                  </h2>
                  <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                    {sosAlerts.filter(a => 
                      a.mlClassification?.urgencyLevel === 'critical' || 
                      a.mlClassification?.urgencyLevel === 'high'
                    ).length} Active
                  </span>
                </div>
              </div>
              <div className="p-6">
                {sosAlerts.filter(alert => 
                  alert.mlClassification?.urgencyLevel === 'critical' || 
                  alert.mlClassification?.urgencyLevel === 'high'
                ).length > 0 ? (
                  <div className="space-y-4">
                    {sosAlerts
                      .filter(alert => 
                        alert.mlClassification?.urgencyLevel === 'critical' || 
                        alert.mlClassification?.urgencyLevel === 'high'
                      )
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((alert) => {
                        const primaryDept = alert.assignedDepartments?.[0]?.department || 'emergency_response';
                        const CategoryIcon = getDepartmentIcon(primaryDept);
                        const departmentName = getDepartmentName(primaryDept);
                        
                        return (
                          <div key={alert._id} className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="p-2 rounded-lg bg-red-500/20">
                                <CategoryIcon className="w-5 h-5 text-red-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="font-semibold text-white">{departmentName}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-300 capitalize">{alert.emergencyType}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-400 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {alert.location?.address || 'Unknown Location'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300">{alert.message}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                  <span>{getTimeAgo(alert.createdAt)}</span>
                                  <span>Reported by: {alert.userName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                              {!['resolved', 'cancelled'].includes(alert.status) && (
                                <button
                                  onClick={() => updateAlertStatus(alert._id, 'acknowledged')}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition duration-200"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-400">No high priority alerts at the moment</p>
                    <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && activeTab === 'alerts' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-white">Emergency Alert Management</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {filteredAlerts.length} active incident{filteredAlerts.length !== 1 ? 's' : ''}
                </p>
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
              {filteredAlerts.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-gray-750">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Time</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Emergency Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAlerts.map((alert) => {
                      const primaryDept = alert.assignedDepartments?.[0]?.department || 'emergency_response';
                      const CategoryIcon = getDepartmentIcon(primaryDept);
                      const departmentName = getDepartmentName(primaryDept);
                      
                      return (
                        <tr key={alert._id} className="hover:bg-gray-750 transition duration-300">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {getTimeAgo(alert.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gray-700">
                                <CategoryIcon className="w-4 h-4 text-gray-300" />
                              </div>
                              <span className="font-medium">{departmentName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                            {alert.emergencyType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {alert.location?.address || 'Unknown Location'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.mlClassification?.urgencyLevel)}`}>
                              {alert.mlClassification?.urgencyLevel || 'medium'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            {!['resolved', 'cancelled'].includes(alert.status) && (
                              <>
                                <button
                                  onClick={() => updateAlertStatus(alert._id, 'acknowledged')}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition duration-200"
                                >
                                  Acknowledge
                                </button>
                                <button
                                  onClick={() => updateAlertStatus(alert._id, 'resolved')}
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
                            {alert.status === 'cancelled' && (
                              <span className="text-gray-400 text-xs">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400">No alerts found for the selected department</p>
                  <p className="text-sm text-gray-500 mt-1">All systems are clear</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rest of the tabs (departments, analytics) remain similar but use real data */}
        {/* Departments Tab */}
        {!loading && activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SOS_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const departmentAlerts = sosAlerts.filter(alert => 
                alert.assignedDepartments?.some(dept => dept.department === key)
              );
              const pendingAlerts = departmentAlerts.filter(alert => alert.status === 'pending');
              const resolvedAlerts = departmentAlerts.filter(alert => alert.status === 'resolved');
              const successRate = departmentAlerts.length > 0 ? 
                Math.round((resolvedAlerts.length / departmentAlerts.length) * 100) : 0;
              
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
                        <span className="text-gray-400">Total Alerts</span>
                        <span className="font-semibold">{departmentAlerts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Now</span>
                        <span className="font-semibold">
                          {departmentAlerts.filter(a => !['resolved', 'cancelled'].includes(a.status)).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedDepartment(key);
                      setActiveTab('alerts');
                    }}
                    className="w-full mt-6 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm font-medium transition duration-300 flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Department Alerts</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {!loading && activeTab === 'analytics' && (
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
                    <span className="text-gray-400">Total Alerts</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pending Response</span>
                    <span className="font-semibold text-yellow-400">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Resolution Rate</span>
                    <span className="font-semibold text-green-400">
                      {stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%'}
                    </span>
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
                    <span className="text-gray-400">Resolved</span>
                    <span className="font-semibold text-green-400">{stats.resolved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">In Progress</span>
                    <span className="font-semibold">{stats.acknowledged}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Departments</span>
                    <span className="font-semibold text-green-400">
                      {Object.values(stats.byDepartment).filter(count => count > 0).length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Department Activity</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.byDepartment)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([dept, count]) => (
                    <div key={dept} className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{SOS_CATEGORIES[dept]?.name}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
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
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar 
                      dataKey="successRate" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]} 
                      name="Success Rate %"
                    />
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
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px'
                      }}
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