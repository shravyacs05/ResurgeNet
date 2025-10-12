import React, { useState, useEffect } from 'react';


// --- Helper Functions and Components ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div>
    </div>
);

const getPriorityPillColor = (priority) => {
    switch(priority?.toLowerCase()) {
        case 'critical': return 'bg-red-500/20 text-red-300 border border-red-500';
        case 'high': return 'bg-orange-500/20 text-orange-300 border border-orange-500';
        default: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500';
    }
};

// Formats department names like 'emergency_response' into 'Emergency Response'
const formatDepartmentName = (name) => {
    if (!name) return "N/A";
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const DepartmentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5 inline-block">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);


// --- Report Card Component ---
const ReportCard = ({ report }) => {
    const { image_b64, analysis } = report;
    const { final_assessment, incident_text, raw_model_output } = analysis;

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
            <img src={`data:image/jpeg;base64,${image_b64}`} alt="Incident" className="w-full h-64 object-cover" />
            <div className="p-5">
                {/* --- NEW: Assigned Department Section --- */}
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

// --- Main Dashboard Component ---
export default function AdminDashboard() {
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
            } catch (err) { setError(err.message); } 
            finally { setIsLoading(false); }
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
}