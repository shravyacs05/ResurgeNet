import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from "react-router-dom"; // add this import at top
import Navbar from './components/Navbar';
import RoleSelection from './components/RoleSelection';
import UserLogin from './components/UserLogin';
import UserSignup from './components/UserSignup';
import AdminLogin from './components/AdminLogin';
import SuperAdminLogin from './components/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import SOSPage from './pages/SOSPage';
import MapView from './pages/MapView';
import RoadReports from './pages/RoadReports';
import Shelters from './pages/Shelters';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import ChatBot from './pages/Chatbot'; 
import Profile from './pages/Profile';
import News from './pages/News';
import VolunteerTaskDashboard from './pages/VolunteerTaskDashboard';
import PledgeSupport from './pages/PledgeSupport';


import ReliefPartners from './pages/ReliefPartners';
function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
 useEffect(() => {
    // 🧹 Clean old instances (avoid duplicates)
    const oldScript = document.querySelector('script[src*="gtranslate"]');
    if (oldScript) oldScript.remove();
    const oldIframe = document.querySelector('iframe[src*="gtranslate"]');
    if (oldIframe) oldIframe.remove();

    // ✅ Define settings BEFORE loading script
    window.gtranslateSettings = {
      default_language: "en",
      languages: ["en", "hi", "mr"],
      wrapper_selector: ".gtranslate_wrapper",
      float_switcher_open_direction: "top",
    };

    // ✅ Add the script after a small delay (so DOM is ready)
    const timeout = setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://cdn.gtranslate.net/widgets/latest/float.js";
      script.defer = true;
      document.body.appendChild(script);
    }, 700);

    // 🧹 Cleanup on route change
    return () => {
      clearTimeout(timeout);
      const widgets = document.querySelectorAll("iframe[src*='gtranslate']");
      widgets.forEach(el => el.remove());
    };
  }, [location.pathname]); // re-run on every page change

  // Clear cache and localStorage on component mount
  useEffect(() => {
    const clearCache = () => {
      // Clear all localStorage items except for development
      const keysToKeep = []; // Keep this empty to clear everything
      const keysToRemove = Object.keys(localStorage).filter(key => 
        !keysToKeep.includes(key)
      );
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Force clear browser cache (aggressive approach)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      console.log('🔄 Cache and localStorage cleared');
    };

    // Clear cache immediately
    clearCache();

    // Set up beforeunload to clear on page refresh
    const handleBeforeUnload = () => {
      clearCache();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check for valid user session
    const checkUserSession = () => {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Validate user data structure
          if (userData && userData.id && userData.role) {
            console.log('✅ Valid user session found:', userData.email);
            setUser(userData);
          } else {
            console.log('❌ Invalid user data structure, clearing...');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          localStorage.removeItem('user');
        }
      } else {
        console.log('🔍 No user session found');
      }
      
      setIsLoading(false);
    };

    // Small delay to ensure cache is cleared before checking session
    setTimeout(checkUserSession, 100);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLogin = (userData) => {
    console.log('👤 User logging in:', userData.email);
    
    // Validate user data before saving
    if (!userData || !userData.id || !userData.role) {
      console.error('❌ Invalid user data provided for login');
      return;
    }

    setUser(userData);
    
    // Store with timestamp for session management
    const userWithTimestamp = {
      ...userData,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(userWithTimestamp));
    console.log('💾 User data saved to localStorage');
  };

  const handleLogout = () => {
    console.log('👋 User logging out');
    
    // Clear all user-related data
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Clear any Firebase auth state if needed
    if (window.firebase && window.firebase.auth) {
      window.firebase.auth().signOut();
    }

    // Force hard redirect to ensure clean state
    window.location.href = '/';
  };

  // Add session expiration check
  useEffect(() => {
    const checkSessionExpiry = () => {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.loginTime) {
            const loginTime = new Date(userData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // Auto-logout after 24 hours for security
            if (hoursDiff > 24) {
              console.log('⏰ Session expired, auto-logout');
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Error checking session expiry:', error);
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Clearing cache and checking session</p>
        </div>
      </div>
    );
  }

  // Helper function to determine redirect path
  const getRedirectPath = (user) => {
    switch (user.role) {
      case 'user':
        return '/dashboard';
      case 'department_admin':
        return '/admin-dashboard';
      case 'super_admin':
        return '/superadmin-dashboard';
      default:
        return '/';
    }
  };

  return (
    <Router>
      <div className="App bg-gray-900 min-h-screen text-gray-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={!user ? <RoleSelection /> : <Navigate to={getRedirectPath(user)} replace />} 
          />
          
          <Route 
            path="/user-login" 
            element={!user ? <UserLogin onLogin={handleLogin} /> : <Navigate to={getRedirectPath(user)} replace />} 
          />
          
          <Route 
            path="/user-signup" 
            element={!user ? <UserSignup onLogin={handleLogin} /> : <Navigate to={getRedirectPath(user)} replace />} 
          />
          
          <Route 
            path="/admin-login" 
            element={!user ? <AdminLogin onLogin={handleLogin} /> : <Navigate to={getRedirectPath(user)} replace />} 
          />
          
          <Route 
            path="/superadmin-login" 
            element={!user ? <SuperAdminLogin onLogin={handleLogin} /> : <Navigate to={getRedirectPath(user)} replace />} 
          />

          {/* Protected User Routes */}
          <Route 
            path="/dashboard" 
            element={user?.role === 'user' ? <Dashboard user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/profile" 
            element={user?.role === 'user' ? <Profile user={user} setUser={setUser} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/tasks" 
            element={user?.role === 'user' ? <VolunteerTaskDashboard user={user} setUser={setUser} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/sos" 
            element={user?.role === 'user' ? <SOSPage user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/map" 
            element={user?.role === 'user' ? <MapView user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/roads" 
            element={user?.role === 'user' ? <RoadReports user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/shelters" 
            element={user?.role === 'user' ? <Shelters user={user} /> : <Navigate to="/" replace />} 
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin-dashboard" 
            element={user?.role === 'department_admin' ? <AdminDashboard user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/superadmin-dashboard" 
            element={user?.role === 'super_admin' ? <SuperAdminDashboard user={user} /> : <Navigate to="/" replace />} 
          />

          <Route 
            path="/news" 
            element={user?.role === 'user' ? <News user={user} /> : <Navigate to="/" replace />} 
          />
          
          <Route path="/relief-partners" 
  element={<ReliefPartners />} 
/>

<Route 
  path="/pledge-support" 
  element={<PledgeSupport />} 
/>
          {/* Fallback - 404 handling */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
{/* 🌍 Translation Button */}
<div className="gtranslate_wrapper"></div>

        {/* ChatBot only for regular users */}
        {user?.role === 'user' && <ChatBot />}

        
      </div>
    </Router>
  );
}

// Add a function to clear cache manually (can be called from console)
window.clearAppCache = function() {
  localStorage.clear();
  sessionStorage.clear();
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  console.log('🧹 App cache cleared manually');
  window.location.reload();
};

export default App;