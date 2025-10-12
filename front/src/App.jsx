import React, { useState, useRef, useEffect } from 'react';

// Simple Router Implementation (no external dependencies needed)
const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

const RouterContext = React.createContext();

const Route = ({ path, component: Component }) => {
  const { currentPath } = React.useContext(RouterContext);
  return currentPath === path ? <Component /> : null;
};

const Link = ({ to, children, className }) => {
  const { navigate } = React.useContext(RouterContext);
  
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

// --- Helper Components & Icons ---
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div>
  </div>
);

const DepartmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5 inline-block">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const getPriorityPillColor = (priority) => {
  switch(priority?.toLowerCase()) {
    case 'critical': return 'bg-red-500/20 text-red-300 border border-red-500';
    case 'high': return 'bg-orange-500/20 text-orange-300 border border-orange-500';
    default: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500';
  }
};

const formatDepartmentName = (name) => {
  if (!name) return "N/A";
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// --- Citizen Portal Component ---
const CitizenPortal = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File is too large. Please upload an image under 5MB.');
        return;
      }
      setError('');
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setError('Please upload an image before submitting.');
      return;
    }
    setError('');
    setIsLoading(true);
    setIsSubmitted(false);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('text', description);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server returned an error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Analysis result from backend:', result);
      setIsSubmitted(true);
      handleRemoveImage();
      setDescription('');

    } catch (err) {
      console.error('Submission error:', err);
      setError(`Submission failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Disaster Response Portal
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Submit a real-time report from the ground.
          </p>
          <Link to="/admin" className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline">
            Admin Dashboard →
          </Link>
        </header>

        <main className="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border border-gray-700">
          <div className="space-y-4">
            <label className="text-lg font-semibold text-gray-200">1. Upload an Image</label>
            <div 
              className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-700/50 transition-all duration-300"
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              {!imagePreview ? (
                <div className="flex flex-col items-center text-gray-400">
                  <CameraIcon />
                  <p className="mt-2 font-medium">Capture or Upload a Photo</p>
                  <p className="text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
              ) : (
                <div className="relative group">
                  <img src={imagePreview} alt="Incident Preview" className="mx-auto max-h-60 rounded-lg shadow-lg"/>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    &#x2715;
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="description" className="text-lg font-semibold text-gray-200">2. Add a Description (Optional)</label>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: A building has collapsed on MG Road..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 shadow-lg"
            >
              <SendIcon />
              {isLoading ? 'Analyzing...' : 'Submit Report'}
            </button>
          </div>

          {error && <p className="text-red-400 text-center">{error}</p>}
          
          {isSubmitted && (
            <div className="mt-4 bg-green-900/50 border border-green-700 text-green-300 rounded-lg p-4 flex flex-col items-center text-center animate-fade-in">
              <CheckCircleIcon />
              <h3 className="text-xl font-bold mt-2">Submission Successful!</h3>
              <p className="mt-1">Thank you for being a responsible citizen and helping the community.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- Report Card Component ---
const ReportCard = ({ report }) => {
  const { image_b64, analysis } = report;
  const { final_assessment, incident_text, raw_model_output } = analysis;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
      <img src={`data:image/jpeg;base64,${image_b64}`} alt="Incident" className="w-full h-64 object-cover" />
      <div className="p-5">
        <div className="bg-blue-900/50 border border-blue-700 text-blue-200 text-center rounded-lg p-3 -mt-16 mb-4 mx-4 relative z-10 shadow-xl">
          <h3 className="text-xs uppercase font-semibold tracking-wider">Assigned To</h3>
          <p className="font-bold text-lg flex items-center justify-center">
            <DepartmentIcon />
            {formatDepartmentName(final_assessment.assigned_department)}
          </p>
        </div>

        <p className="text-sm text-gray-400 mb-2">User Description:</p>
        <p className="text-gray-200 italic bg-gray-700/50 p-3 rounded-lg mb-4">
          {incident_text || "No description provided."}
        </p>
        
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-bold text-gray-300 mb-4 text-center">AI Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-400">Category</p>
              <p className="font-bold text-xl">{final_assessment.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Priority</p>
              <span className={`px-3 py-1 text-lg font-bold rounded-full ${getPriorityPillColor(final_assessment.priority)}`}>
                {final_assessment.priority}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 text-center">Credibility Score</p>
            <div className="w-full bg-gray-700 rounded-full h-5 mt-1">
              <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ width: `${final_assessment.credibility_score * 100}%` }}>
                {Math.round(final_assessment.credibility_score * 100)}%
              </div>
            </div>
          </div>
        </div>

        {raw_model_output && raw_model_output.length > 0 && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-base font-semibold text-gray-300 mb-2 text-center">Raw Vision Data</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              {raw_model_output.map(([name, score], index) => (
                <li key={index} className="flex justify-between items-center bg-gray-700/40 px-2 py-1 rounded">
                  <span className="capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-xs bg-gray-900/50 px-2 py-0.5 rounded-full">{Math.round(score * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:8000/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchReports();
    const intervalId = setInterval(fetchReports, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white p-4 sm:p-6 md:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2 text-lg">Live Incident Reports</p>
        <Link to="/" className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline">
          ← Back to Citizen Portal
        </Link>
      </header>
      <main>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-red-400 text-xl">Error: {error}</p>}
        {!isLoading && !error && reports.length === 0 && (
          <p className="text-center text-gray-500 text-xl">No reports submitted yet. They will appear here live.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Main App with Router ---
export default function App() {
  return (
    <Router>
      <Route path="/" component={CitizenPortal} />
      <Route path="/admin" component={AdminDashboard} />
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </Router>
  );
}