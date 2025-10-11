import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND || "http://localhost:5001";

const SOSReporting = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergencyType: "",
    message: "",
    peopleAffected: 1,
    description: "",
    severity: "high",
    location: {
      lat: null,
      lng: null,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Current GPS location",
            },
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter it manually.");
        }
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create the message for ML analysis
      const mlMessage = `${formData.emergencyType}: ${formData.message}. ${formData.description}. 
        Location: ${formData.location.address}. People affected: ${formData.peopleAffected}`;

      // Send SOS alert
      const response = await axios.post(
        `${API_URL}/api/sos/create`,
        {
          ...formData,
          message: mlMessage,
          userId: user.id,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.data.success) {
        alert(`SOS Alert sent successfully! 
          Alert ID: ${response.data.alertId}
          Assigned Departments: ${response.data.assignedDepartments.join(
            ", "
          )}`);

        // Reset form and navigate
        setFormData({
          emergencyType: "",
          message: "",
          peopleAffected: 1,
          description: "",
          severity: "high",
          location: { lat: null, lng: null, address: "" },
        });
        setStep(1);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting SOS:", error);
      alert("Failed to send SOS alert. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                Select Emergency Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe your emergency *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your emergency situation in detail. Include what help you need."
                rows="4"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white 
                         focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Be specific - this helps our AI route your alert to the right
                department
              </p>
            </div>

            <button
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
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.location.address && !formData.location.lat}
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
                  {formData.location.address || "GPS coordinates provided"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                disabled={loading}
              >
                Back
              </button>
              <button
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
