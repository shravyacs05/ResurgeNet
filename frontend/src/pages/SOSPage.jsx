import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND || "http://localhost:5002";

const SOSReporting = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  
  const recognitionRef = useRef(null);

  const [formData, setFormData] = useState({
    emergencyType: "",
    message: "",
    peopleAffected: 1,
    description: "",
    severity: "high",
    location: {
      latitude: null,
      longitude: null,
      address: "",
    },
  });

  console.log("User info in SOSReporting:", user);

  const emergencyTypes = [
    { value: "medical", label: "Medical Emergency", icon: "🏥" },
    { value: "fire", label: "Fire", icon: "🔥" },
    { value: "flood", label: "Flood", icon: "🌊" },
    { value: "earthquake", label: "Earthquake", icon: "🏚️" },
    { value: "trapped", label: "Trapped/Stuck", icon: "🆘" },
    { value: "structural collapse", label: "Building Collapse", icon: "🏗️" },
    { value: "stranded", label: "Stranded", icon: "🚶" },
    { value: "other", label: "Other Emergency", icon: "⚠️" },
  ];

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log("🎤 Voice recognition started");
        setIsListening(true);
        setSpeechError('');
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        console.log("🎤 Voice input:", transcript);
        
        setFormData(prev => ({
          ...prev,
          message: transcript
        }));
      };
      
      recognition.onerror = (event) => {
        console.error("🎤 Speech recognition error:", event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'no-speech':
            setSpeechError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setSpeechError('No microphone found. Please check your microphone.');
            break;
          case 'not-allowed':
            setSpeechError('Microphone permission denied. Please allow microphone access.');
            break;
          default:
            setSpeechError('Error with voice recognition. Please try typing instead.');
        }
      };
      
      recognition.onend = () => {
        console.log("🎤 Voice recognition ended");
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.log("🎤 Speech recognition not supported");
      setIsSpeechSupported(false);
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("🎤 Error starting speech recognition:", error);
        setSpeechError('Failed to start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Location obtained:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          setFormData((prev) => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            },
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Please enter it manually.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Get authentication headers
  const getAuthHeaders = async () => {
    try {
      if (user) {
        // Check if using Firebase (has getIdToken method)
        if (typeof user.getIdToken === 'function') {
          const token = await user.getIdToken();
          return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
        }
        // Custom auth - user object might have token or id
        else if (user.token) {
          return {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          };
        }
        // Fallback - just send content type
        else {
          return {
            'Content-Type': 'application/json',
            'X-User-Id': user.id || user.uid
          };
        }
      }
      return {
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Get userId - could be uid (Firebase) or id (custom auth)
      const userId = user?.uid || user?.id;
      
      // Validate user
      if (!user || !userId) {
        setError('You must be logged in to submit an SOS alert');
        setLoading(false);
        return;
      }

      // Log the form data before sending
      console.log('📤 Submitting SOS with data:', {
        emergencyType: formData.emergencyType,
        message: formData.message,
        peopleAffected: formData.peopleAffected,
        description: formData.description,
        severity: formData.severity,
        location: formData.location,
        userId: userId,
        user: user
      });

      // Validate required fields
      if (!formData.message || !formData.emergencyType) {
        setError('Please fill in emergency type and message');
        setLoading(false);
        return;
      }

      if (!formData.location?.address || (!formData.location?.latitude && !formData.location?.longitude)) {
        setError('Please provide your location');
        setLoading(false);
        return;
      }

      // Get auth headers
      const headers = await getAuthHeaders();

      const response = await axios.post(
        `${API_URL}/api/sos/create`,
        {
          emergencyType: formData.emergencyType,
          message: formData.message,
          peopleAffected: formData.peopleAffected || 1,
          description: formData.description,
          severity: formData.severity || 'high',
          location: {
            latitude: formData.location.latitude,
            longitude: formData.location.longitude,
            address: formData.location.address
          },
          userId: userId // Use the userId we extracted above
        },
        {
          headers,
          timeout: 15000
        }
      );

      console.log('✅ SOS submitted successfully:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        
        // Show success message and redirect after 3 seconds
        setTimeout(() => {
          navigate('/alerts');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to submit SOS alert');
      }

    } catch (err) {
      console.error('❌ Error submitting SOS:', err);
      
      // Log detailed error information
      if (err.response) {
        console.log('🔍 Error response data:', err.response.data);
        console.log('🔍 Error response status:', err.response.status);
        setError(err.response.data?.error || err.response.data?.message || 'Failed to submit SOS alert');
      } else if (err.request) {
        console.log('🔍 No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.log('🔍 Error:', err.message);
        setError(err.message || 'Failed to submit SOS alert');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">SOS Alert Sent!</h2>
          <p className="text-gray-400 mb-4">
            Your emergency alert has been sent to the relevant departments. 
            Help is on the way!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to alerts page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Emergency SOS Alert</h1>
          <p className="text-gray-400">
            Get help from the appropriate department quickly
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              ✕
            </button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex-1 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNum
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-400"
                } mb-2 z-10`}
              >
                {stepNum}
              </div>
              <span className="text-xs text-center">
                {stepNum === 1
                  ? "Type & Message"
                  : stepNum === 2
                  ? "Details"
                  : "Confirm"}
              </span>
            </div>
          ))}
          <div
            className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700"
            style={{ zIndex: 0 }}
          >
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Emergency Type & Message */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              What's your emergency?
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Emergency Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyType: type.value,
                      }))
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.emergencyType === type.value
                        ? "border-red-500 bg-red-500/20"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Describe your emergency *
                </label>
                
                {/* Voice Recognition Button */}
                {isSpeechSupported && (
                  <div className="flex items-center gap-2">
                    {isListening && (
                      <div className="flex items-center gap-1 text-red-400">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-xs">Listening...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={loading}
                      className={`p-2 rounded-full transition-all ${
                        isListening 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start voice recording'}
                    >
                      {isListening ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your emergency situation in detail. Include what help you need. You can also use the microphone button to speak."
                rows="4"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white 
                         focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              
              {/* Speech Recognition Status */}
              {speechError && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300">
                  🎤 {speechError}
                  <button 
                    onClick={() => setSpeechError('')}
                    className="ml-2 text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {!isSpeechSupported && (
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <span>🎤 Voice input not supported in your browser</span>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-1">
                Be specific - this helps our AI route your alert to the right department
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.emergencyType || !formData.message.trim()}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 
                       disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Additional Details */}
        {step === 2 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of people affected
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        peopleAffected: Math.max(1, prev.peopleAffected - 1),
                      }))
                    }
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    name="peopleAffected"
                    value={formData.peopleAffected}
                    onChange={handleChange}
                    min="1"
                    className="w-20 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        peopleAffected: prev.peopleAffected + 1,
                      }))
                    }
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Severity level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, severity: level }))
                      }
                      className={`py-2 rounded capitalize ${
                        formData.severity === level
                          ? level === "high"
                            ? "bg-red-600"
                            : level === "medium"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Any other information that could help responders..."
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2"
                  >
                    📍 Use My Current Location
                  </button>
                  <input
                    type="text"
                    placeholder="Or enter address manually"
                    value={formData.location.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: { ...prev.location, address: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  />
                  {formData.location.latitude && formData.location.longitude && (
                    <p className="text-xs text-green-400">
                      ✓ GPS coordinates obtained
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.location.address || (!formData.location.latitude && !formData.location.longitude)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Confirm Your Emergency Alert
            </h2>

            <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg mb-6">
              <p className="text-red-300 font-medium">
                ⚠️ This is a real emergency alert
              </p>
              <p className="text-red-200 text-sm mt-1">
                This will be sent to emergency responders and relevant
                departments based on AI analysis.
              </p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="capitalize">{formData.emergencyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Severity:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    formData.severity === "high"
                      ? "bg-red-600"
                      : formData.severity === "medium"
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                >
                  {formData.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">People Affected:</span>
                <span>{formData.peopleAffected}</span>
              </div>
              <div>
                <span className="text-gray-400">Message:</span>
                <p className="mt-1">{formData.message}</p>
              </div>
              <div>
                <span className="text-gray-400">Location:</span>
                <p className="mt-1">
                  {formData.location.address}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg 
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending Alert...
                  </>
                ) : (
                  <>🚨 Send Emergency Alert</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSReporting;