import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getRoleConfig = () => {
    const configs = {
      'super_admin': { 
        badge: 'Super Admin', 
        badgeColor: 'bg-red-500',
        bannerColor: 'bg-gradient-to-r from-red-600 to-red-700',
        bannerText: '⚡ SUPER ADMINISTRATOR MODE'
      },
      'department_admin': { 
        badge: 'Admin', 
        badgeColor: 'bg-green-500',
        bannerColor: 'bg-gradient-to-r from-green-600 to-green-700', 
        bannerText: `🛡️ ${user.department?.replace(/_/g, ' ').toUpperCase()} ADMIN`
      },
      'user': { 
        badge: 'User', 
        badgeColor: 'bg-blue-500',
        bannerColor: null,
        bannerText: null
      }
    };
    
    return configs[user.role] || configs.user;
  };

  const getUserDisplayName = () => {
    return user.name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getNavigationLinks = () => {
    const links = {
      user: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/sos', label: 'SOS', icon: '🚨' },
        { path: '/map', label: 'Map', icon: '🗺️' },
        { path: '/roads', label: 'Roads', icon: '🛣️' },
        { path: '/shelters', label: 'Shelters', icon: '🏠' },
        { path: '/profile', label: 'Profile', icon: '👤' }
      ],
      department_admin: [
        { path: '/admin-dashboard', label: 'Admin Dashboard', icon: '⚙️' }
      ],
      super_admin: [
        { path: '/superadmin-dashboard', label: 'Super Admin', icon: '👑' }
      ]
    };

    return links[user.role] || [];
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const roleConfig = getRoleConfig();
  const navigationLinks = getNavigationLinks();

  return (
    <>
      {/* Role Banner - Only for admins */}
      {roleConfig.bannerColor && (
        <div className={`${roleConfig.bannerColor} text-white text-center py-2`}>
          <div className="max-w-7xl mx-auto px-4">
            <span className="text-sm font-medium">{roleConfig.bannerText}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20"> {/* Increased height */}
            
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                to={navigationLinks[0]?.path || '/'} 
                className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🚨</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-lg font-bold leading-tight">Emergency</span>
                  <span className="text-red-400 text-lg font-bold leading-tight">Response</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            {navigationLinks.length > 0 && (
              <div className="hidden lg:flex items-center space-x-1 mx-8 flex-1 justify-center">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[100px] justify-center ${
                      location.pathname === link.path
                        ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span className="whitespace-nowrap">{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* User Section - Desktop */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-4 bg-gray-700 rounded-xl px-4 py-3 border border-gray-600">
                {/* User Avatar and Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {getUserInitials()}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white font-medium whitespace-nowrap">
                      {getUserDisplayName()}
                    </div>
                    <div className={`${roleConfig.badgeColor} text-white px-2 py-1 rounded text-xs font-medium mt-1 inline-block`}>
                      {roleConfig.badge}
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <div className="border-l border-gray-600 pl-4">
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm text-white font-medium transition duration-200 flex items-center space-x-2 shadow-md"
                    title="Logout"
                  >
                    <span className="text-base">🚪</span>
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-3 rounded-xl bg-gray-700 border border-gray-600 transition-all duration-200"
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 bg-gray-800">
            <div className="px-4 py-4 space-y-3">
              
              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-2 gap-3">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`p-4 rounded-xl text-base font-medium flex items-center space-x-3 justify-center text-center ${
                      location.pathname === link.path
                        ? 'bg-gray-700 text-white border border-gray-600'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile User Info */}
              <div className="border-t border-gray-700 pt-4 mt-2">
                <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1">
                      <div className="text-base text-white font-medium">{getUserDisplayName()}</div>
                      <div className="text-sm text-gray-400 mt-1">{user.email}</div>
                      <div className={`${roleConfig.badgeColor} text-white px-3 py-1 rounded text-sm font-medium mt-2 inline-block`}>
                        {roleConfig.badge}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-base text-white font-medium transition duration-200 flex items-center justify-center space-x-3 shadow-md"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;