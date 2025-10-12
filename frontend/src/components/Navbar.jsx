import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // If super admin, don't render this navbar - the dashboard has its own
  if (user.role === 'super_admin') {
    return null;
  }

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getRoleConfig = () => {
    const configs = {
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )},
        { path: '/sos', label: 'SOS', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )},
        { path: '/map', label: 'Map', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )},
        { path: '/roads', label: 'Roads', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )},
        { path: '/shelters', label: 'Shelters', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )},
        { path: '/news', label: 'News', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0-12a2 2 0 012-2h2a2 2 0 012 2m-6 5h6m-6 3h6m-6 3h6" />
          </svg>
        )},
         { path: '/relief-partners', label: 'Partners', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )},
        { path: '/profile', label: 'Profile', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )},
        { path: '/tasks', label: 'Tasks', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      ],
      department_admin: [
        { path: '/admin-dashboard', label: 'Admin Dashboard', icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
        <div className={`${roleConfig.bannerColor} text-white text-center py-2 sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4">
            <span className="text-sm font-semibold">{roleConfig.bannerText}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <motion.nav
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-700 shadow-xl py-2' 
            : 'bg-gray-900 border-b border-gray-800 py-4'
        }`}
        initial={false}
        animate={{
          paddingTop: isScrolled ? '0.5rem' : '1rem',
          paddingBottom: isScrolled ? '0.5rem' : '1rem',
        }}
      >
        <motion.div
          className="mx-auto px-4 sm:px-6 lg:px-8"
          animate={{
            maxWidth: isScrolled ? '95%' : '100%',
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <div className="flex justify-between items-center">
            
            {/* Logo Section */}
            <motion.div 
              className="flex items-center"
              animate={{
                scale: isScrolled ? 0.95 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Link 
                to={navigationLinks[0]?.path || '/'} 
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <motion.div 
                  className="flex flex-col"
                  animate={{
                    scale: isScrolled ? 0.9 : 1,
                  }}
                >
                  <span className={`font-bold text-white transition-all duration-300 ${
                    isScrolled ? 'text-lg' : 'text-xl'
                  }`}>
                    ResurgeNet
                  </span>
                </motion.div>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Centered */}
            {navigationLinks.length > 0 && (
              <motion.div 
                className="hidden lg:flex items-center space-x-1 mx-8 flex-1 justify-center"
                animate={{
                  scale: isScrolled ? 0.95 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {navigationLinks.map((link) => (
                  <motion.div
                    key={link.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Link
                      to={link.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[100px] justify-center ${
                        location.pathname === link.path
                          ? 'bg-gray-800 text-white shadow-lg border border-gray-600'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent'
                      }`}
                    >
                      {link.icon}
                      <span className="whitespace-nowrap">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* User Section - Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              <motion.div 
                className="flex items-center space-x-3 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700"
                animate={{
                  scale: isScrolled ? 0.95 : 1,
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {getUserInitials()}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`${roleConfig.badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                        {roleConfig.badge}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white font-medium whitespace-nowrap">
                      {getUserDisplayName()}
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <div className="border-l border-gray-700 pl-3">
                  <motion.button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md text-sm text-white font-medium transition duration-200 flex items-center space-x-2"
                    title="Logout"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="whitespace-nowrap">Sign Out</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-2 rounded-lg bg-gray-800 border border-gray-700 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-800 bg-gray-900 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2">
                
                {/* Mobile Navigation Links */}
                <div className="grid grid-cols-2 gap-2">
                  {navigationLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={link.path}
                        className={`p-3 rounded-lg text-sm font-medium flex items-center space-x-2 justify-center text-center ${
                          location.pathname === link.path
                            ? 'bg-gray-800 text-white border border-gray-700'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile User Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="border-t border-gray-800 pt-3 mt-2"
                >
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {getUserInitials()}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <div className={`${roleConfig.badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                            {roleConfig.badge}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">{getUserDisplayName()}</div>
                        <div className="text-xs text-gray-400 mt-1">{user.email}</div>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={handleLogout}
                      className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm text-white font-medium transition duration-200 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;