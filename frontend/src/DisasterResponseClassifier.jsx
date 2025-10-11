import React, { useState, useEffect } from 'react';

const DisasterResponseClassifier = () => {
    const [message, setMessage] = useState('');
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);

    const API_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

    useEffect(() => {
        // Fetch available categories on component mount
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/disaster/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleSubmit = async () => {
        if (!message.trim()) return;

        setLoading(true);
        setError('');
        setPredictions(null);

        try {
            const response = await fetch(`${API_URL}/api/disaster/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Failed to get predictions');
            }

            const data = await response.json();
            setPredictions(data);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (value) => {
        return value === 1 ? 'bg-red-500' : 'bg-gray-200';
    };

    const formatCategoryName = (category) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🚨 Disaster Response Classifier
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Analyze disaster messages to identify relevant response categories
                    </p>

                    <div className="space-y-4">
                        <div>
                            <div className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Disaster Message
                            </div>
                            <textarea
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Example: We need food and water supplies urgently. The earthquake has destroyed our homes."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !message.trim()}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                  
                                    Classify Message
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {predictions && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            ✅ Classification Results
                        </h2>

                        <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600 font-medium">Analyzed Message:</p>
                            <p className="text-gray-800 mt-1">{predictions.message}</p>
                        </div>

                        {/* Departments Section */}
                        {predictions.departments && Object.keys(predictions.departments).length > 0 && (
                            <div className="mb-6 bg-blue-50 p-4 rounded-md">
                                <h4 className="text-md font-semibold text-blue-800 mb-3">
                                    Departments to Handle This Message:
                                </h4>
                                <div className="space-y-2">
                                    {Object.entries(predictions.departments).map(([category, department]) => (
                                        <div key={category} className="bg-white p-3 rounded border border-blue-200">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-gray-700 capitalize">
                                                    {formatCategoryName(category)}:
                                                </span>
                                                <span className="text-blue-700 text-sm ml-2">
                                                    {department}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">📊 Category Analysis:</h3>
                        </div>

                        {/* Active Categories */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-600 mb-3">
                                Detected Categories ({Object.values(predictions.predictions).filter(v => v === 1).length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(predictions.predictions)
                                    .filter(([_, value]) => value === 1)
                                    .map(([category, value]) => (
                                        <div
                                            key={category}
                                            className="bg-red-50 border border-red-200 rounded-md p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-700">
                                                    {formatCategoryName(category)}
                                                </span>
                                                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            {Object.values(predictions.predictions).every(v => v === 0) && (
                                <p className="text-gray-500 italic">No disaster categories detected in this message.</p>
                            )}
                        </div>

                        {/* All Categories Status */}
                        <details className="cursor-pointer">
                            <summary className="text-md font-medium text-gray-600 mb-3 hover:text-gray-800">
                                View All Categories ({Object.keys(predictions.predictions).length})
                            </summary>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                {Object.entries(predictions.predictions).map(([category, value]) => (
                                    <div
                                        key={category}
                                        className={`text-sm px-3 py-2 rounded ${
                                            value === 1 
                                                ? 'bg-red-100 text-red-800 font-medium' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {formatCategoryName(category)}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisasterResponseClassifier;