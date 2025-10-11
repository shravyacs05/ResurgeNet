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
        badgeColor: 'bg-gradient-to-r from-red-500 to-red-600',
        bannerColor: 'bg-gradient-to-r from-red-600 to-red-700',
        bannerText: 'SUPER ADMINISTRATOR MODE'
      },
      'department_admin': { 
        badge: 'Admin', 
        badgeColor: 'bg-gradient-to-r from-green-500 to-green-600',
        bannerColor: 'bg-gradient-to-r from-green-600 to-green-700', 
        bannerText: `${user.department?.replace(/_/g, ' ').toUpperCase()} ADMIN`
      },
      'user': { 
        badge: 'User', 
        badgeColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
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
        { path: '/dashboard', label: 'Dashboard', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )},
        { path: '/sos', label: 'SOS', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )},
        { path: '/map', label: 'Map', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )},
        { path: '/roads', label: 'Roads', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )},
        { path: '/shelters', label: 'Shelters', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )},
        { path: '/news', label: 'News', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0-12a2 2 0 012-2h2a2 2 0 012 2m-6 5h6m-6 3h6m-6 3h6" />
          </svg>
        )},
        { path: '/profile', label: 'Profile', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      ],
      department_admin: [
        { path: '/admin-dashboard', label: 'Admin Dashboard', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      ],
      super_admin: [
        { path: '/superadmin-dashboard', label: 'Super Admin', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
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
        <div className={`${roleConfig.bannerColor} text-white text-center py-2 shadow-sm`}>
          <div className="max-w-6xl mx-auto px-4">
            <span className="text-sm font-semibold tracking-wider">{roleConfig.bannerText}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                to={navigationLinks[0]?.path || '/'} 
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-red-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-lg font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Emergency
                  </span>
                  <span className="text-transparent bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-lg font-bold tracking-tight">
                    Response
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            {navigationLinks.length > 0 && (
              <div className="hidden lg:flex items-center space-x-1 mx-6 flex-1 justify-center">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 min-w-[90px] justify-center relative group ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg border border-gray-600'
                        : 'text-gray-300 hover:bg-gradient-to-br hover:from-gray-700/80 hover:to-gray-800/80 hover:text-white border border-transparent hover:border-gray-600'
                    }`}
                  >
                    {link.icon}
                    <span className="whitespace-nowrap font-medium">{link.label}</span>
                    {location.pathname === link.path && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-red-400 rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* User Section - Desktop */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl px-4 py-2 border border-gray-600 shadow-lg">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {getUserInitials()}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`${roleConfig.badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium shadow-md`}>
                        {roleConfig.badge}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white font-semibold whitespace-nowrap">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <div className="border-l border-gray-600 pl-4">
                  <button
                    onClick={handleLogout}
                    className="group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm text-white font-semibold transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105"
                    title="Logout"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="whitespace-nowrap">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-2 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 transition-all duration-300 hover:shadow-lg"
              >
                {isMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl">
            <div className="px-4 py-4 space-y-3">
              
              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-2 gap-3">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`p-4 rounded-xl text-sm font-medium flex items-center space-x-2 justify-center text-center transition-all duration-300 ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg border border-gray-600'
                        : 'text-gray-300 hover:bg-gradient-to-br hover:from-gray-700/80 hover:to-gray-800/80 hover:text-white border border-transparent hover:border-gray-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile User Info */}
              <div className="border-t border-gray-700 pt-4 mt-2">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-md">
                        {getUserInitials()}
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <div className={`${roleConfig.badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium shadow-md`}>
                          {roleConfig.badge}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-base text-white font-semibold">{getUserDisplayName()}</div>
                      <div className="text-sm text-gray-400 mt-1 font-medium">{user.email}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-3 rounded-xl text-sm text-white font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
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