// components/Header.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = ({ user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gray-900 bg-opacity-90 backdrop-blur-sm py-3 sticky top-0 z-50 border-b border-gray-800 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-red-600 text-white p-2 rounded-md mr-3 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
            DisasterRelief
          </span>
        </div>
        
        <div className="hidden md:flex space-x-4 items-center">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md ${isActive('/') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/sos" 
            className={`px-3 py-2 rounded-md ${isActive('/sos') ? 'bg-red-800 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            SOS Alert
          </Link>
          <Link 
            to="/map" 
            className={`px-3 py-2 rounded-md ${isActive('/map') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Live Map
          </Link>
          <Link 
            to="/shelters" 
            className={`px-3 py-2 rounded-md ${isActive('/shelters') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Shelters
          </Link>
          <Link 
            to="/chatbot" 
            className={`px-3 py-2 rounded-md ${isActive('/chatbot') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            AI Assistant
          </Link>
          
{(user.role === 'admin' || user.role === 'volunteer') && (
  <>
    <Link 
      to={user.role === 'admin' ? "/admin" : "/volunteer"} 
      className={`px-3 py-2 rounded-md ${(isActive('/admin') || isActive('/volunteer')) ? 'bg-blue-800 text-white' : 'text-gray-300 hover:text-white'}`}
    >
      {user.role === 'admin' ? 'Admin' : 'Volunteer'} Dashboard
    </Link>
    
    <Link 
      to="/news" 
      className={`px-3 py-2 rounded-md ${isActive('/news') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white'}`}
    >
      📰 News
    </Link>
  </>
)}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-gray-400 capitalize">{user.role}</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          
          <button 
            onClick={handleLogout} 
            className="hidden md:block bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-white text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {showMenu && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md ${isActive('/') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              onClick={() => setShowMenu(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/sos" 
              className={`px-3 py-2 rounded-md ${isActive('/sos') ? 'bg-red-700 text-white' : 'text-gray-300'}`}
              onClick={() => setShowMenu(false)}
            >
              SOS Alert
            </Link>
            <Link 
              to="/map" 
              className={`px-3 py-2 rounded-md ${isActive('/map') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              onClick={() => setShowMenu(false)}
            >
              Live Map
            </Link>
            <Link 
              to="/shelters" 
              className={`px-3 py-2 rounded-md ${isActive('/shelters') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              onClick={() => setShowMenu(false)}
            >
              Shelters
            </Link>
            <Link 
              to="/chatbot" 
              className={`px-3 py-2 rounded-md ${isActive('/chatbot') ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              onClick={() => setShowMenu(false)}
            >
              AI Assistant
            </Link>
            
            {(user.role === 'admin' || user.role === 'volunteer') && (
              <Link 
                to={user.role === 'admin' ? "/admin" : "/volunteer"} 
                className={`px-3 py-2 rounded-md ${(isActive('/admin') || isActive('/volunteer')) ? 'bg-blue-700 text-white' : 'text-gray-300'}`}
                onClick={() => setShowMenu(false)}
              >
                {user.role === 'admin' ? 'Admin' : 'Volunteer'} Dashboard
              </Link>
            )}
            
            <div className="pt-2 border-t border-gray-700">
              <button 
                onClick={handleLogout} 
                className="w-full bg-red-600 hover:bg-red-500 px-3 py-2 rounded-md text-white text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;